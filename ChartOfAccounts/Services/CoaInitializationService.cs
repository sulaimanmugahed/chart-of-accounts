using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;


namespace ChartOfAccounts;
/// <summary>
/// محرك تهيئة شجرة الحسابات الاحترافي (Professional Chart of Accounts Initialization Engine).
/// ينفذ عمليات إنشاء شجرة الحسابات انطلاقاً من القوالب المعيارية للشركات المختلفة،
/// مع ضمان كامل لمبادئ السلامة، الذرية التبادلية (Transactions)، التكرارية الآمنة (Idempotency)،
/// وإنفاذ ضوابط عمق المستويات وتعيين الأدوار النظامية التلقائية.
/// </summary>
public class CoaInitializationService
{
    private readonly AppDbContext _context;
    private readonly ILogger<CoaInitializationService> _logger;

    public CoaInitializationService(AppDbContext context, ILogger<CoaInitializationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// التحقق المسبق من المتطلبات والقواعد المحاسبية قبل الشروع في التهيئة.
    /// </summary>
    public async Task<ValidationResultDto> ValidateInitializationPrerequisitesAsync(
        Guid companyId,
        Guid templateId,
        CancellationToken cancellationToken = default)
    {
        var result = new ValidationResultDto();

        var company = await _context.Companies
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken);

        if (company == null)
        {
            result.CanInitialize = false;
            result.ValidationErrors.Add($"الشركة برقم ({companyId}) غير موجودة في النظام.");
            return result;
        }

        var template = await _context.CoaTemplates
            .Include(t => t.Nodes)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == templateId, cancellationToken);

        if (template == null)
        {
            result.CanInitialize = false;
            result.ValidationErrors.Add($"قالب شجرة الحسابات برقم ({templateId}) غير موجود.");
            return result;
        }

        var existingAccountsCount = await _context.Accounts
            .CountAsync(a => a.CompanyId == companyId, cancellationToken);

        result.IsCompanyAlreadyInitialized = company.IsCoaInitialized || existingAccountsCount > 0;
        result.ExistingAccountsCount = existingAccountsCount;
        result.CompanyMaxDepth = company.MaxAccountDepth;

        var templateMaxDepth = template.Nodes.Any() ? template.Nodes.Max(n => n.Level) : 0;
        result.TemplateMaxDepth = templateMaxDepth;
        result.DepthCompatible = templateMaxDepth <= company.MaxAccountDepth;

        if (!result.DepthCompatible)
        {
            result.ValidationErrors.Add(
                $"عمق شجرة القالب ({templateMaxDepth} مستويات) يتجاوز الحد الأقصى المسموح به للشركة ({company.MaxAccountDepth} مستويات). يرجى زيادة حد العمق المسموح للشركة أو اختيار قالب ملائم.");
        }

        if (result.IsCompanyAlreadyInitialized)
        {
            result.ValidationWarnings.Add(
                $"الشركة تحتوي بالفعل على {existingAccountsCount} حساب. يجب استخدام وضع الدمج الآمن (Idempotent Merge) لتجنب أخطاء تكرار البيانات.");
        }

        result.CanInitialize = result.ValidationErrors.Count == 0;
        return result;
    }

    /// <summary>
    /// تنفيذ عملية تهيئة دليل الحسابات للشركة بشكل ذري ومعاملاتي آمن (Transactional & Idempotent).
    /// </summary>
    public async Task<InitializeCoaResultDto> InitializeCompanyCoaAsync(
        InitializeCoaRequest request,
        CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation(
            "بدء تهيئة شجرة الحسابات للشركة {CompanyId} باستخدام القالب {TemplateId} بالوضع {Mode}.",
            request.CompanyId, request.TemplateId, request.Mode);

        // 1. التحقق من وجود الشركة
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.CompanyId, cancellationToken);

        if (company == null)
            throw new AccountingDomainException($"الشركة المطلوبة ({request.CompanyId}) غير موجودة.", "COMPANY_NOT_FOUND");

        // 2. التحقق من وجود القالب وبنوده
        var template = await _context.CoaTemplates
            .Include(t => t.Nodes)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId, cancellationToken);

        if (template == null)
            throw new AccountingDomainException($"قالب دليل الحسابات ({request.TemplateId}) غير موجود.", "TEMPLATE_NOT_FOUND");

        if (!template.Nodes.Any())
            throw new AccountingDomainException($"القالب '{template.NameArabic}' لا يحتوي على أي بنود حسابات هيكلية.", "EMPTY_TEMPLATE");

        // 3. التحقق الصارم من عمق مستويات القالب مقابل حد الشركة
        var templateMaxDepth = template.Nodes.Max(n => n.Level);
        if (templateMaxDepth > company.MaxAccountDepth)
        {
            throw new AccountDepthExceededException(company.Id, templateMaxDepth, company.MaxAccountDepth);
        }

        // 4. التحقق من الحسابات القائمة للشركة والوضع المحدد
        var existingAccounts = await _context.Accounts
            .Where(a => a.CompanyId == company.Id)
            .ToListAsync(cancellationToken);

        if (existingAccounts.Any() && request.Mode == InitializationMode.Strict)
        {
            throw new CompanyAlreadyInitializedException(company.Id);
        }

        // 5. إذا كان وضع المحاكاة الجافة (Dry Run)
        if (request.Mode == InitializationMode.DryRun)
        {
            stopwatch.Stop();
            return SimulateInitialization(company, template, existingAccounts, stopwatch.ElapsedMilliseconds);
        }

        // 6. التنفيذ الفعلي داخل معاملة قاعدة بيانات ذرية (Database Transaction)
        // في حال استخدام SQLite في بيئة الاختبارات أو SQL Server في الإنتاج
        var executionStrategy = _context.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            try
            {
                var createdAccountsCount = 0;
                var mappedRolesCount = 0;
                var mappedRolesDtos = new List<SystemAccountMappingDto>();
                var warnings = new List<string>();

                // قواميس للبحث السريع وتتبع الحسابات المنشأة والقائمة
                var existingAccountsByCode = existingAccounts.ToDictionary(a => a.Code, a => a);
                var accountsMapByTemplateCode = new Dictionary<string, Account>();

                // جلب الأدوار النظامية المعينة مسبقاً للشركة
                var existingSystemAccounts = await _context.CompanySystemAccounts
                    .Where(sa => sa.CompanyId == company.Id)
                    .ToDictionaryAsync(sa => sa.Role, sa => sa, cancellationToken);

                // ترتيب بنود القالب تصاعدياً حسب المستوى لضمان إنشاء الآباء قبل الأبناء
                var orderedNodes = template.Nodes.OrderBy(n => n.Level).ToList();

                foreach (var node in orderedNodes)
                {
                    var targetAccountCode = string.IsNullOrWhiteSpace(request.AccountCodePrefix)
                        ? node.Code
                        : $"{request.AccountCodePrefix.Trim()}{node.Code}";

                    // التحقق مما إذا كان الحساب موجوداً مسبقاً في وضع الدمج
                    if (existingAccountsByCode.TryGetValue(targetAccountCode, out var existingAcc))
                    {
                        accountsMapByTemplateCode[node.Code] = existingAcc;
                        continue; // الحساب موجود مسبقاً، لا يتم تكراره
                    }

                    // تحديد الحساب الأب
                    Guid? parentAccountId = null;
                    string? parentLineage = null;

                    if (!string.IsNullOrWhiteSpace(node.ParentNodeCode))
                    {
                        if (accountsMapByTemplateCode.TryGetValue(node.ParentNodeCode, out var parentAccount))
                        {
                            parentAccountId = parentAccount.Id;
                            parentLineage = parentAccount.LineagePath;

                            // تحويل الحساب الأب تلقائياً إلى حساب تجميعي (Header)
                            // ومنع الترحيل عليه عملاً بالقاعدة المحاسبية الأصولية
                            if (!parentAccount.IsHeader)
                            {
                                parentAccount.ConvertToHeader();
                            }
                        }
                        else
                        {
                            throw new InvalidAccountHierarchyException(
                                $"تعذر العثور على الحساب الأب ذي الرمز '{node.ParentNodeCode}' للحساب '{node.Code}' أثناء التهيئة.");
                        }
                    }

                    // إنشاء كيان الحساب الجديد
                    var newAccount = new Account(
                        companyId: company.Id,
                        code: targetAccountCode,
                        nameArabic: node.NameArabic,
                        nameEnglish: node.NameEnglish,
                        accountType: node.AccountType,
                        normalBalance: node.NormalBalance,
                        classification: node.Classification,
                        level: node.Level,
                        parentAccountId: parentAccountId,
                        isHeader: node.IsHeader,
                        isPostable: node.IsPostable,
                        systemRole: node.DefaultSystemRole,
                        description: node.Description,
                        currencyCode: company.BaseCurrency,
                        parentLineage: parentLineage);

                    await _context.Accounts.AddAsync(newAccount, cancellationToken);
                    accountsMapByTemplateCode[node.Code] = newAccount;
                    createdAccountsCount++;

                    // ربط الدور النظامي التلقائي إن وجد وكان مفعلاً
                    if (request.AutoMapSystemRoles && node.DefaultSystemRole.HasValue)
                    {
                        var role = node.DefaultSystemRole.Value;

                        // التحقق من توافق الحساب مع متطلبات الدور المحاسبي
                        CompanySystemAccount.ValidateRoleAccountCompatibility(role, newAccount);

                        if (!existingSystemAccounts.TryGetValue(role, out var existingMapping))
                        {
                            var systemAccountMapping = new CompanySystemAccount(
                                companyId: company.Id,
                                role: role,
                                accountId: newAccount.Id,
                                isLocked: false,
                                notes: $"تم الربط تلقائياً من قالب '{template.NameArabic}'");

                            await _context.CompanySystemAccounts.AddAsync(systemAccountMapping, cancellationToken);
                            existingSystemAccounts[role] = systemAccountMapping;
                            mappedRolesCount++;

                            mappedRolesDtos.Add(new SystemAccountMappingDto
                            {
                                Id = systemAccountMapping.Id,
                                CompanyId = company.Id,
                                Role = role,
                                AccountId = newAccount.Id,
                                AccountCode = newAccount.Code,
                                AccountNameArabic = newAccount.NameArabic,
                                AccountNameEnglish = newAccount.NameEnglish,
                                AccountType = newAccount.AccountType,
                                IsLocked = false,
                                AssignedAtUtc = systemAccountMapping.AssignedAtUtc,
                                Notes = systemAccountMapping.Notes
                            });
                        }
                        else
                        {
                            warnings.Add($"الدور النظامي '{role}' مرتبط مسبقاً ولم يتم استبداله.");
                        }
                    }
                }

                // حفظ كافة الحسابات والروابط في قاعدة البيانات
                await _context.SaveChangesAsync(cancellationToken);

                // تحديث حالة الشركة
                company.MarkCoaAsInitialized(template.Id);

                // تسجيل سجل التدقيق الناجح
                stopwatch.Stop();
                var auditLog = new CoaInitializationAuditLog(
                    companyId: company.Id,
                    templateId: template.Id,
                    status: createdAccountsCount > 0 ? InitializationStatus.Success : InitializationStatus.Reconciled,
                    accountsCreatedCount: createdAccountsCount,
                    systemRolesMappedCount: mappedRolesCount,
                    executionDurationMs: stopwatch.ElapsedMilliseconds,
                    errorMessage: null,
                    detailsJson: JsonSerializer.Serialize(new
                    {
                        TemplateCode = template.Code,
                        Mode = request.Mode.ToString(),
                        CreatedCount = createdAccountsCount,
                        MappedRolesCount = mappedRolesCount,
                        EnforcedMaxDepth = company.MaxAccountDepth
                    }));

                await _context.CoaInitializationAuditLogs.AddAsync(auditLog, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // اعتماد المعاملة المصرفية/المحاسبية بنجاح
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation(
                    "اكتملت تهيئة شجرة الحسابات للشركة {CompanyId} بنجاح. تم إنشاء {AccountsCount} حساب وربط {RolesCount} دور نظامي خلال {Duration} مللي ثانية.",
                    company.Id, createdAccountsCount, mappedRolesCount, stopwatch.ElapsedMilliseconds);

                return new InitializeCoaResultDto
                {
                    IsSuccess = true,
                    CompanyId = company.Id,
                    CompanyName = company.NameArabic,
                    TemplateId = template.Id,
                    TemplateName = template.NameArabic,
                    Status = createdAccountsCount > 0 ? InitializationStatus.Success : InitializationStatus.Reconciled,
                    AccountsCreatedCount = createdAccountsCount,
                    SystemRolesMappedCount = mappedRolesCount,
                    MaxDepthEnforced = company.MaxAccountDepth,
                    DurationMs = stopwatch.ElapsedMilliseconds,
                    Message = createdAccountsCount > 0
                        ? $"تمت تهيئة دليل الحسابات بنجاح. تم إنشاء {createdAccountsCount} حساب وتعيين {mappedRolesCount} دور نظامي."
                        : "تمت مطابقة دليل الحسابات، جميع الحسابات موجودة مسبقاً.",
                    Warnings = warnings,
                    MappedRoles = mappedRolesDtos
                };
            }
            catch (Exception ex)
            {
                // التراجع الفوري عن المعاملة لحماية سلامة وتناسق البيانات المالية
                await transaction.RollbackAsync(cancellationToken);

                // تفريغ كافة الكيانات العالقة في متعقب التغييرات (ChangeTracker)
                // لمنع حفظ أي حسابات غير مكتملة عند تسجيل سجل الفشل
                _context.ChangeTracker.Clear();

                stopwatch.Stop();

                _logger.LogError(ex, "فشلت عملية تهيئة شجرة الحسابات للشركة {CompanyId}. تم التراجع عن المعاملة.", company.Id);

                // تسجيل الفشل في سجل تدقيق منفصل لتوثيق الحادثة
                await RecordFailedAuditLogAsync(company.Id, template.Id, ex.Message, stopwatch.ElapsedMilliseconds, cancellationToken);

                throw;
            }
        });
    }

    /// <summary>
    /// محاكاة عملية التهيئة دون كتابة أي تغيير في قاعدة البيانات (Dry Run Mode).
    /// </summary>
    private static InitializeCoaResultDto SimulateInitialization(
        Company company,
        CoaTemplate template,
        List<Account> existingAccounts,
        long durationMs)
    {
        var existingCodes = existingAccounts.Select(a => a.Code).ToHashSet();
        var accountsToCreate = template.Nodes.Count(n => !existingCodes.Contains(n.Code));
        var rolesToMap = template.Nodes.Count(n => n.DefaultSystemRole.HasValue);

        return new InitializeCoaResultDto
        {
            IsSuccess = true,
            CompanyId = company.Id,
            CompanyName = company.NameArabic,
            TemplateId = template.Id,
            TemplateName = template.NameArabic,
            Status = InitializationStatus.Success,
            AccountsCreatedCount = accountsToCreate,
            SystemRolesMappedCount = rolesToMap,
            MaxDepthEnforced = company.MaxAccountDepth,
            DurationMs = durationMs,
            Message = $"[محاكاة جافة Dry-Run] سيتم إنشاء {accountsToCreate} حساب، وتعيين {rolesToMap} دور نظامي دون تعديل قاعدة البيانات.",
            Warnings = new List<string> { "تم التشغيل بوضع المحاكاة الجافة، لم يتم حفظ أي تغييرات." }
        };
    }

    /// <summary>
    /// تسجيل سجل تدقيق لعملية فاشلة بصورة مستقلة.
    /// </summary>
    private async Task RecordFailedAuditLogAsync(
        Guid companyId,
        Guid templateId,
        string errorMessage,
        long durationMs,
        CancellationToken cancellationToken)
    {
        try
        {
            var auditLog = new CoaInitializationAuditLog(
                companyId: companyId,
                templateId: templateId,
                status: InitializationStatus.Failed,
                accountsCreatedCount: 0,
                systemRolesMappedCount: 0,
                executionDurationMs: durationMs,
                errorMessage: errorMessage);

            await _context.CoaInitializationAuditLogs.AddAsync(auditLog, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception logEx)
        {
            _logger.LogWarning(logEx, "تعذر حفظ سجل تدقيق الفشل لتهيئة الشركة {CompanyId}.", companyId);
        }
    }
}
