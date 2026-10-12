
using Microsoft.EntityFrameworkCore;


namespace ChartOfAccounts;

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