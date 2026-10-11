
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace ChartOfAccounts;

//

/// <summary>
/// واجهات محرك تهيئة شجرة الحسابات (COA Initialization Engine API).
/// تتيح التحقق المسبق والتطبيق التبادلي الآمن مع دعم التكرارية (Idempotency) وسجلات التدقيق.
/// </summary>
[ApiController]
[Route("api/initialization")]
[Route("api/[controller]")]
[Produces("application/json")]
public class CoaInitializationController : ControllerBase
{
    private readonly CoaInitializationService _initializationService;
    private readonly AppDbContext _context;

    public CoaInitializationController(
        CoaInitializationService initializationService,
        AppDbContext context)
    {
        _initializationService = initializationService;
        _context = context;
    }

    /// <summary>
    /// التحقق المسبق من توافق الشركة مع القالب المحاسبي قبل بدء الإنشاء الفعلي.
    /// يفحص قيود العمق ووجود حسابات سابقة.
    /// </summary>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(ValidationResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidatePrerequisites([FromBody] ValidatePrerequisitesRequest request, CancellationToken cancellationToken)
    {
        var result = await _initializationService.ValidateInitializationPrerequisitesAsync(
            request.CompanyId, request.TemplateId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// تنفيذ عملية تهيئة دليل الحسابات للشركة بشكل ذري ومعاملاتي آمن (Transactional & Idempotent).
    /// يدعم أوضاع التشغيل: الصارم (Strict)، الدمج الآمن (IdempotentMerge)، والمحاكاة الجافة (DryRun).
    /// </summary>
    [HttpPost("initialize")]
    [ProducesResponseType(typeof(InitializeCoaResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> InitializeCompanyCoa([FromBody] InitializeCoaRequest request, CancellationToken cancellationToken)
    {
        var result = await _initializationService.InitializeCompanyCoaAsync(request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// استرجاع سجلات تدقيق عمليات التهيئة لشركة محددة لتتبع الحوكمة وتاريخ إنشاء الشجرة.
    /// </summary>
    [HttpGet("audit-logs/{companyId:guid}")]
    public async Task<IActionResult> GetAuditLogs(Guid companyId, CancellationToken cancellationToken)
    {
        var logs = await _context.CoaInitializationAuditLogs
            .AsNoTracking()
            .Include(l => l.Template)
            .Where(l => l.CompanyId == companyId)
            .OrderByDescending(l => l.TimestampUtc)
            .Select(l => new
            {
                l.Id,
                l.CompanyId,
                l.TemplateId,
                TemplateName = l.Template.NameArabic,
                Status = l.Status.ToString(),
                l.AccountsCreatedCount,
                l.SystemRolesMappedCount,
                l.ExecutionDurationMs,
                l.ErrorMessage,
                l.TimestampUtc,
                l.DetailsJson
            })
            .ToListAsync(cancellationToken);

        return Ok(logs);
    }
}
public class ValidatePrerequisitesRequest
{
    public Guid CompanyId { get; set; }
    public Guid TemplateId { get; set; }
}
