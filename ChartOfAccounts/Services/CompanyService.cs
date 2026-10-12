
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
