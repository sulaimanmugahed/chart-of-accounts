
using Microsoft.EntityFrameworkCore;


namespace ChartOfAccounts;

/// <summary>
/// خدمة إدارة قوالب شجرة الحسابات المعيارية (Chart of Accounts Templates Service).
/// تتيح استعراض، إنشاء، والتحقق من سلامة القوالب المحاسبية المعيارية والمخصصة لكل قطاع تجاري.
/// </summary>
public class CoaTemplateService
{
    private readonly AppDbContext _context;
    private readonly ILogger<CoaTemplateService> _logger;

    public CoaTemplateService(AppDbContext context, ILogger<CoaTemplateService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CoaTemplateDto>> GetAllTemplatesAsync(CancellationToken cancellationToken = default)
    {
        var templates = await _context.CoaTemplates
            .Include(t => t.Nodes)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return templates.Select(t => new CoaTemplateDto
        {
            Id = t.Id,
            Code = t.Code,
            NameArabic = t.NameArabic,
            NameEnglish = t.NameEnglish,
            IndustryType = t.IndustryType,
            RecommendedMaxDepth = t.RecommendedMaxDepth,
            Description = t.Description,
            IsActive = t.IsActive,
            IsSystemTemplate = t.IsSystemTemplate,
            Version = t.Version,
            TotalNodesCount = t.Nodes.Count,
            SystemRolesDefinedCount = t.Nodes.Count(n => n.DefaultSystemRole.HasValue)
        }).ToList();
    }

    public async Task<CoaTemplateDetailDto?> GetTemplateByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var template = await _context.CoaTemplates
            .Include(t => t.Nodes)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (template == null) return null;

        return MapToDetailDto(template);
    }

    public async Task<CoaTemplateDetailDto?> GetTemplateByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var template = await _context.CoaTemplates
            .Include(t => t.Nodes)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Code == code.Trim().ToUpperInvariant(), cancellationToken);

        if (template == null) return null;

        return MapToDetailDto(template);
    }

    public async Task<CoaTemplateDto> CreateTemplateAsync(CreateTemplateRequest request, CancellationToken cancellationToken = default)
    {
        if (await _context.CoaTemplates.AnyAsync(t => t.Code == request.Code.Trim().ToUpperInvariant(), cancellationToken))
            throw new AccountingDomainException($"رمز القالب '{request.Code}' مستخدم مسبقاً في النظام.", "DUPLICATE_TEMPLATE_CODE");

        var template = new CoaTemplate(
            code: request.Code,
            nameArabic: request.NameArabic,
            nameEnglish: request.NameEnglish,
            industryType: request.IndustryType,
            recommendedMaxDepth: request.RecommendedMaxDepth,
            description: request.Description,
            isSystemTemplate: false,
            version: 1);

        foreach (var nodeReq in request.Nodes)
        {
            template.AddNode(
                code: nodeReq.Code,
                nameArabic: nodeReq.NameArabic,
                nameEnglish: nodeReq.NameEnglish,
                accountType: nodeReq.AccountType,
                normalBalance: nodeReq.NormalBalance,
                classification: nodeReq.Classification,
                level: nodeReq.Level,
                parentCode: nodeReq.ParentNodeCode,
                isHeader: nodeReq.IsHeader,
                isPostable: nodeReq.IsPostable,
                defaultSystemRole: nodeReq.DefaultSystemRole,
                description: nodeReq.Description);
        }

        // التحقق الصارم من سلامة القالب وشجرته الهيكلية
        template.ValidateIntegrity();

        await _context.CoaTemplates.AddAsync(template, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("تم إنشاء قالب شجرة حسابات جديد: {TemplateCode} بعدد {Count} بند.", template.Code, template.Nodes.Count);

        return new CoaTemplateDto
        {
            Id = template.Id,
            Code = template.Code,
            NameArabic = template.NameArabic,
            NameEnglish = template.NameEnglish,
            IndustryType = template.IndustryType,
            RecommendedMaxDepth = template.RecommendedMaxDepth,
            Description = template.Description,
            IsActive = template.IsActive,
            IsSystemTemplate = template.IsSystemTemplate,
            Version = template.Version,
            TotalNodesCount = template.Nodes.Count,
            SystemRolesDefinedCount = template.Nodes.Count(n => n.DefaultSystemRole.HasValue)
        };
    }

    private static CoaTemplateDetailDto MapToDetailDto(CoaTemplate template)
    {
        return new CoaTemplateDetailDto
        {
            Id = template.Id,
            Code = template.Code,
            NameArabic = template.NameArabic,
            NameEnglish = template.NameEnglish,
            IndustryType = template.IndustryType,
            RecommendedMaxDepth = template.RecommendedMaxDepth,
            Description = template.Description,
            IsActive = template.IsActive,
            IsSystemTemplate = template.IsSystemTemplate,
            Version = template.Version,
            TotalNodesCount = template.Nodes.Count,
            SystemRolesDefinedCount = template.Nodes.Count(n => n.DefaultSystemRole.HasValue),
            Nodes = template.Nodes
                .OrderBy(n => n.Level)
                .ThenBy(n => n.Code)
                .Select(n => new CoaTemplateNodeDto
                {
                    Id = n.Id,
                    Code = n.Code,
                    NameArabic = n.NameArabic,
                    NameEnglish = n.NameEnglish,
                    AccountType = n.AccountType,
                    NormalBalance = n.NormalBalance,
                    Classification = n.Classification,
                    Level = n.Level,
                    ParentNodeCode = n.ParentNodeCode,
                    IsHeader = n.IsHeader,
                    IsPostable = n.IsPostable,
                    DefaultSystemRole = n.DefaultSystemRole,
                    Description = n.Description
                }).ToList()
        };
    }
}
