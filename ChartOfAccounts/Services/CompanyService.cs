
using Microsoft.EntityFrameworkCore;


namespace ChartOfAccounts;

/// <summary>
/// خدمة إدارة الشركات والمستأجرين (Tenants / Companies Service).
/// تدير إعدادات المنشآت المتعددة وضبط أقصى عمق مسموح لشجرة الحسابات لكل شركة.
/// </summary>
public class CompanyService
{
    private readonly AppDbContext _context;
    private readonly ILogger<CompanyService> _logger;

    public CompanyService(AppDbContext context, ILogger<CompanyService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CompanyDto>> GetAllCompaniesAsync(CancellationToken cancellationToken = default)
    {
        var companies = await _context.Companies
            .AsNoTracking()
            .Include(c => c.Accounts)
            .OrderBy(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return companies.Select(MapToDto).ToList();
    }

    public async Task<CompanyDto?> GetCompanyByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var company = await _context.Companies
            .AsNoTracking()
            .Include(c => c.Accounts)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return company == null ? null : MapToDto(company);
    }

    public async Task<CompanyDto> CreateCompanyAsync(CreateCompanyRequest request, CancellationToken cancellationToken = default)
    {
        var cleanCode = request.Code.Trim().ToUpperInvariant();

        if (await _context.Companies.AnyAsync(c => c.Code == cleanCode, cancellationToken))
            throw new AccountingDomainException($"رمز الشركة '{request.Code}' مستخدم بالفعل.", "DUPLICATE_COMPANY_CODE");

        var company = new Company(
            code: cleanCode,
            nameArabic: request.NameArabic,
            nameEnglish: request.NameEnglish,
            baseCurrency: request.BaseCurrency,
            maxAccountDepth: request.MaxAccountDepth,
            taxNumber: request.TaxNumber,
            fiscalYearStartMonth: request.FiscalYearStartMonth);

        await _context.Companies.AddAsync(company, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("تم إنشاء شركة جديدة بنجاح: {Code} - {Name} بحد أقصى للعمق {Depth}.",
            company.Code, company.NameArabic, company.MaxAccountDepth);

        return MapToDto(company);
    }

    public async Task<CompanyDto> UpdateCompanyAsync(Guid id, UpdateCompanyRequest request, CancellationToken cancellationToken = default)
    {
        var company = await _context.Companies
            .Include(c => c.Accounts)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (company == null)
            throw new AccountingDomainException($"الشركة ({id}) غير موجودة.", "COMPANY_NOT_FOUND");

        company.UpdateProfile(request.NameArabic, request.NameEnglish, request.TaxNumber, request.BaseCurrency);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDto(company);
    }

    public async Task<CompanyDto> UpdateCompanyDepthAsync(Guid id, int maxDepth, CancellationToken cancellationToken = default)
    {
        var company = await _context.Companies
            .Include(c => c.Accounts)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (company == null)
            throw new AccountingDomainException($"الشركة ({id}) غير موجودة.", "COMPANY_NOT_FOUND");

        // التحقق من الحسابات القائمة: لا يمكن تخفيض العمق لأقل من أعمق حساب قائم بالفعل
        var currentMaxLevel = company.Accounts.Any() ? company.Accounts.Max(a => a.Level) : 0;
        if (maxDepth < currentMaxLevel)
        {
            throw new AccountingDomainException(
                $"لا يمكن تخفيض أقصى عمق للشركة إلى ({maxDepth}) مستويات لأن الشركة تحتوي بالفعل على حسابات قائمة بالمستوى ({currentMaxLevel}).",
                "CANNOT_REDUCE_DEPTH_BELOW_EXISTING");
        }

        company.SetMaxAccountDepth(maxDepth);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("تم تعديل حد العمق الأقصى لشجرة حسابات الشركة {CompanyId} إلى {Depth}.", id, maxDepth);
        return MapToDto(company);
    }

    private static CompanyDto MapToDto(Company c)
    {
        return new CompanyDto
        {
            Id = c.Id,
            Code = c.Code,
            NameArabic = c.NameArabic,
            NameEnglish = c.NameEnglish,
            TaxNumber = c.TaxNumber,
            BaseCurrency = c.BaseCurrency,
            FiscalYearStartMonth = c.FiscalYearStartMonth,
            MaxAccountDepth = c.MaxAccountDepth,
            IsCoaInitialized = c.IsCoaInitialized,
            InitializedFromTemplateId = c.InitializedFromTemplateId,
            InitializedAtUtc = c.InitializedAtUtc,
            TotalAccountsCount = c.Accounts.Count,
            IsActive = c.IsActive
        };
    }
}



/// <summary>
/// خدمة إدارة وتعيين أدوار الحسابات النظامية (System Account Mapping Service).
/// تضمن ربط العمليات المؤتمتة بالحسابات المالية الصحيحة، والتحقق الصارم من التوافق المحاسبي.
/// </summary>
public class SystemAccountMappingService
{
    private readonly AppDbContext _context;
    private readonly ILogger<SystemAccountMappingService> _logger;

    public SystemAccountMappingService(AppDbContext context, ILogger<SystemAccountMappingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<SystemAccountMappingDto>> GetMappingsAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var mappings = await _context.CompanySystemAccounts
            .AsNoTracking()
            .Include(sa => sa.Account)
            .Where(sa => sa.CompanyId == companyId)
            .OrderBy(sa => sa.Role)
            .ToListAsync(cancellationToken);

        return mappings.Select(sa => new SystemAccountMappingDto
        {
            Id = sa.Id,
            CompanyId = sa.CompanyId,
            Role = sa.Role,
            AccountId = sa.AccountId,
            AccountCode = sa.Account.Code,
            AccountNameArabic = sa.Account.NameArabic,
            AccountNameEnglish = sa.Account.NameEnglish,
            AccountType = sa.Account.AccountType,
            IsLocked = sa.IsLocked,
            AssignedAtUtc = sa.AssignedAtUtc,
            Notes = sa.Notes
        }).ToList();
    }

    public async Task<AccountDto?> GetAccountByRoleAsync(Guid companyId, SystemAccountRole role, CancellationToken cancellationToken = default)
    {
        var mapping = await _context.CompanySystemAccounts
            .AsNoTracking()
            .Include(sa => sa.Account)
            .ThenInclude(a => a.ParentAccount)
            .Include(sa => sa.Account.ChildAccounts)
            .FirstOrDefaultAsync(sa => sa.CompanyId == companyId && sa.Role == role, cancellationToken);

        if (mapping?.Account == null) return null;

        var a = mapping.Account;
        return new AccountDto
        {
            Id = a.Id,
            CompanyId = a.CompanyId,
            Code = a.Code,
            NameArabic = a.NameArabic,
            NameEnglish = a.NameEnglish,
            AccountType = a.AccountType,
            NormalBalance = a.NormalBalance,
            Classification = a.Classification,
            Level = a.Level,
            ParentAccountId = a.ParentAccountId,
            ParentAccountCode = a.ParentAccount?.Code,
            IsHeader = a.IsHeader,
            IsPostable = a.IsPostable,
            IsActive = a.IsActive,
            SystemRole = a.SystemRole,
            LineagePath = a.LineagePath,
            Description = a.Description,
            CurrencyCode = a.CurrencyCode,
            ChildrenCount = a.ChildAccounts.Count
        };
    }

    public async Task<SystemAccountMappingDto> SetRoleMappingAsync(
        Guid companyId,
        UpdateSystemAccountMappingRequest request,
        CancellationToken cancellationToken = default)
    {
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Id == request.AccountId, cancellationToken);

        if (account == null)
            throw new AccountingDomainException($"الحساب المحاسبي ({request.AccountId}) غير موجود في الشركة ({companyId}).", "ACCOUNT_NOT_FOUND");

        // التحقق من توافق الحساب مع الدور النظامي (قابل للترحيل + النوع المحاسبي الصحيح)
        CompanySystemAccount.ValidateRoleAccountCompatibility(request.Role, account);

        var existingMapping = await _context.CompanySystemAccounts
            .FirstOrDefaultAsync(sa => sa.CompanyId == companyId && sa.Role == request.Role, cancellationToken);

        if (existingMapping == null)
        {
            existingMapping = new CompanySystemAccount(
                companyId: companyId,
                role: request.Role,
                accountId: account.Id,
                isLocked: request.IsLocked,
                notes: request.Notes);

            await _context.CompanySystemAccounts.AddAsync(existingMapping, cancellationToken);
        }
        else
        {
            existingMapping.UpdateMappedAccount(account.Id, request.Notes, request.ForceIfLocked);
            existingMapping.SetLockStatus(request.IsLocked);
        }

        // تحديث الحساب ليحمل الدور أيضاً في خصائصه المباشرة
        account.AssignSystemRole(request.Role);

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("تم تعيين الدور النظامي {Role} للحساب {AccountCode} في الشركة {CompanyId}.",
            request.Role, account.Code, companyId);

        return new SystemAccountMappingDto
        {
            Id = existingMapping.Id,
            CompanyId = companyId,
            Role = existingMapping.Role,
            AccountId = account.Id,
            AccountCode = account.Code,
            AccountNameArabic = account.NameArabic,
            AccountNameEnglish = account.NameEnglish,
            AccountType = account.AccountType,
            IsLocked = existingMapping.IsLocked,
            AssignedAtUtc = existingMapping.AssignedAtUtc,
            Notes = existingMapping.Notes
        };
    }

    public async Task<bool> ValidateCriticalRolesMappedAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        // قائمة الأدوار النظامية الحرجة التي لا يمكن تشغيل نظام تخطيط الموارد بدونها
        var criticalRoles = new[]
        {
            SystemAccountRole.CashOnHand,
            SystemAccountRole.AccountsReceivable,
            SystemAccountRole.AccountsPayable,
            SystemAccountRole.SalesRevenue,
            SystemAccountRole.CostOfGoodsSold,
            SystemAccountRole.RetainedEarnings
        };

        var mappedRoles = await _context.CompanySystemAccounts
            .Where(sa => sa.CompanyId == companyId)
            .Select(sa => sa.Role)
            .ToListAsync(cancellationToken);

        return criticalRoles.All(r => mappedRoles.Contains(r));
    }
}