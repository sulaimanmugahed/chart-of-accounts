
using Microsoft.EntityFrameworkCore;


namespace ChartOfAccounts;

/// <summary>
/// خدمة إدارة حسابات الشركات الفعلية (Company Accounts Service).
/// تضمن سلامة العمليات على شجرة الحسابات، تحويل الحسابات الأب إلى تجميعية تلقائياً،
/// وإنفاذ الحدود القصوى للعمق المسموح به لكل شركة.
/// </summary>
public class AccountService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AccountService> _logger;

    public AccountService(AppDbContext context, ILogger<AccountService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<AccountTreeNodeDto>> GetAccountsTreeAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var accounts = await _context.Accounts
            .AsNoTracking()
            .Where(a => a.CompanyId == companyId)
            .OrderBy(a => a.Level)
            .ThenBy(a => a.Code)
            .ToListAsync(cancellationToken);

        if (!accounts.Any())
            return Array.Empty<AccountTreeNodeDto>();

        // بناء الشجرة الهيكلية المتداخلة من القائمة المسطحة
        var nodeMap = accounts.ToDictionary(a => a.Id, a => new AccountTreeNodeDto
        {
            Id = a.Id,
            Code = a.Code,
            NameArabic = a.NameArabic,
            NameEnglish = a.NameEnglish,
            AccountType = a.AccountType,
            NormalBalance = a.NormalBalance,
            Classification = a.Classification,
            Level = a.Level,
            ParentAccountId = a.ParentAccountId,
            IsHeader = a.IsHeader,
            IsPostable = a.IsPostable,
            IsActive = a.IsActive,
            SystemRole = a.SystemRole,
            LineagePath = a.LineagePath,
            Children = new List<AccountTreeNodeDto>()
        });

        var rootNodes = new List<AccountTreeNodeDto>();

        foreach (var account in accounts)
        {
            var nodeDto = nodeMap[account.Id];

            if (account.ParentAccountId.HasValue && nodeMap.TryGetValue(account.ParentAccountId.Value, out var parentNode))
            {
                parentNode.Children.Add(nodeDto);
            }
            else
            {
                rootNodes.Add(nodeDto);
            }
        }

        return rootNodes;
    }

    public async Task<IReadOnlyList<AccountDto>> GetFlatAccountsAsync(
        Guid companyId,
        int? maxLevel = null,
        bool? postableOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Accounts
            .AsNoTracking()
            .Include(a => a.ParentAccount)
            .Include(a => a.ChildAccounts)
            .Where(a => a.CompanyId == companyId);

        if (maxLevel.HasValue)
        {
            query = query.Where(a => a.Level <= maxLevel.Value);
        }

        if (postableOnly.HasValue && postableOnly.Value)
        {
            query = query.Where(a => a.IsPostable);
        }

        var list = await query
            .OrderBy(a => a.Code)
            .ToListAsync(cancellationToken);

        return list.Select(MapToDto).ToList();
    }

    public async Task<AccountDto?> GetAccountByIdAsync(Guid companyId, Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await _context.Accounts
            .AsNoTracking()
            .Include(a => a.ParentAccount)
            .Include(a => a.ChildAccounts)
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Id == accountId, cancellationToken);

        return account == null ? null : MapToDto(account);
    }

    public async Task<AccountDto?> GetAccountByCodeAsync(Guid companyId, string code, CancellationToken cancellationToken = default)
    {
        var account = await _context.Accounts
            .AsNoTracking()
            .Include(a => a.ParentAccount)
            .Include(a => a.ChildAccounts)
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Code == code.Trim(), cancellationToken);

        return account == null ? null : MapToDto(account);
    }

    public async Task<AccountDto> CreateCustomAccountAsync(CreateAccountRequest request, CancellationToken cancellationToken = default)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == request.CompanyId, cancellationToken);

        if (company == null)
            throw new AccountingDomainException($"الشركة برقم ({request.CompanyId}) غير موجودة.", "COMPANY_NOT_FOUND");

        var cleanCode = request.Code.Trim();

        if (await _context.Accounts.AnyAsync(a => a.CompanyId == request.CompanyId && a.Code == cleanCode, cancellationToken))
            throw new DuplicateAccountCodeException(request.CompanyId, cleanCode);

        int level = 1;
        string? parentLineage = null;
        Account? parentAccount = null;

        if (request.ParentAccountId.HasValue)
        {
            parentAccount = await _context.Accounts
                .FirstOrDefaultAsync(a => a.CompanyId == request.CompanyId && a.Id == request.ParentAccountId.Value, cancellationToken);

            if (parentAccount == null)
                throw new InvalidAccountHierarchyException($"الحساب الأب المحدد ({request.ParentAccountId}) غير موجود في شجرة حسابات الشركة.");

            level = parentAccount.Level + 1;

            // التحقق الصارم من عدم تجاوز أقصى عمق مسموح به لشجرة حسابات الشركة
            if (level > company.MaxAccountDepth)
            {
                throw new AccountDepthExceededException(company.Id, level, company.MaxAccountDepth);
            }

            // التأكد من تطابق النوع المحاسبي مع الحساب الأب
            if (request.AccountType != parentAccount.AccountType)
            {
                throw new InvalidAccountHierarchyException(
                    $"نوع الحساب الجديد ({request.AccountType}) يجب أن يطابق نوع الحساب الأب ({parentAccount.AccountType}).");
            }

            parentLineage = parentAccount.LineagePath;

            // تحويل الحساب الأب تلقائياً إلى حساب رئيسي وتجميد قابليته للترحيل
            if (!parentAccount.IsHeader)
            {
                parentAccount.ConvertToHeader();
            }
        }

        var account = new Account(
            companyId: company.Id,
            code: cleanCode,
            nameArabic: request.NameArabic,
            nameEnglish: request.NameEnglish,
            accountType: request.AccountType,
            normalBalance: request.NormalBalance,
            classification: request.Classification,
            level: level,
            parentAccountId: request.ParentAccountId,
            isHeader: request.IsHeader,
            isPostable: request.IsPostable,
            systemRole: request.SystemRole,
            description: request.Description,
            currencyCode: request.CurrencyCode ?? company.BaseCurrency,
            parentLineage: parentLineage);

        await _context.Accounts.AddAsync(account, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("تم إنشاء الحساب {Code} - {Name} بنجاح للشركة {CompanyId} في المستوى {Level}.",
            account.Code, account.NameArabic, company.Id, account.Level);

        return MapToDto(account);
    }

    public async Task<AccountDto> UpdateAccountAsync(Guid companyId, Guid accountId, UpdateAccountRequest request, CancellationToken cancellationToken = default)
    {
        var account = await _context.Accounts
            .Include(a => a.ParentAccount)
            .Include(a => a.ChildAccounts)
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Id == accountId, cancellationToken);

        if (account == null)
            throw new AccountingDomainException($"الحساب ({accountId}) غير موجود في الشركة ({companyId}).", "ACCOUNT_NOT_FOUND");

        account.UpdateInformation(request.NameArabic, request.NameEnglish, request.Description, request.CurrencyCode);
        account.SetActiveStatus(request.IsActive);

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(account);
    }

    public async Task<bool> DeleteAccountAsync(Guid companyId, Guid accountId, CancellationToken cancellationToken = default)
    {
        var account = await _context.Accounts
            .Include(a => a.ChildAccounts)
            .FirstOrDefaultAsync(a => a.CompanyId == companyId && a.Id == accountId, cancellationToken);

        if (account == null) return false;

        if (account.ChildAccounts.Any())
            throw new InvalidAccountHierarchyException($"لا يمكن حذف الحساب '{account.Code}' لوجود {account.ChildAccounts.Count} حسابات فرعية تابعة له.");

        var isMappedToSystemRole = await _context.CompanySystemAccounts
            .AnyAsync(sa => sa.CompanyId == companyId && sa.AccountId == accountId, cancellationToken);

        if (isMappedToSystemRole)
            throw new AccountingDomainException($"لا يمكن حذف الحساب '{account.Code}' لأنه مربوط كدور نظامي أساسي للشركة.", "ACCOUNT_MAPPED_TO_ROLE");

        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static AccountDto MapToDto(Account a)
    {
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
}
