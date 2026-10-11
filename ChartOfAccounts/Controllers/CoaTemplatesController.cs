
using Microsoft.AspNetCore.Mvc;


namespace ChartOfAccounts;

//


/// <summary>
/// واجهات إدارة واستعراض قوالب دليل الحسابات المعيارية (COA Templates).
/// </summary>
[ApiController]
[Route("api/templates")]
[Route("api/[controller]")]
[Produces("application/json")]
public class CoaTemplatesController : ControllerBase
{
    private readonly CoaTemplateService _templateService;

    public CoaTemplatesController(CoaTemplateService templateService)
    {
        _templateService = templateService;
    }

    /// <summary>
    /// جلب قائمة بكافة قوالب شجرة الحسابات المتاحة مع ملخص البنود والأدوار النظامية.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CoaTemplateDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllTemplates(CancellationToken cancellationToken)
    {
        var templates = await _templateService.GetAllTemplatesAsync(cancellationToken);
        return Ok(templates);
    }

    /// <summary>
    /// جلب تفاصيل قالب محدد مع كامل بنوده الهيكلية وأدواره النظامية.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CoaTemplateDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTemplateById(Guid id, CancellationToken cancellationToken)
    {
        var template = await _templateService.GetTemplateByIdAsync(id, cancellationToken);
        if (template == null) return NotFound(new { message = $"القالب برقم ({id}) غير موجود." });
        return Ok(template);
    }

    /// <summary>
    /// جلب تفاصيل قالب بواسطة رمزه المرجعي (مثل COMMERCIAL_IFRS أو SERVICES_PROFESSIONAL أو SME_SIMPLIFIED).
    /// </summary>
    [HttpGet("code/{code}")]
    [ProducesResponseType(typeof(CoaTemplateDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTemplateByCode(string code, CancellationToken cancellationToken)
    {
        var template = await _templateService.GetTemplateByCodeAsync(code, cancellationToken);
        if (template == null) return NotFound(new { message = $"القالب برمز '{code}' غير موجود." });
        return Ok(template);
    }

    /// <summary>
    /// إنشاء قالب دليل حسابات مخصص جديد.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CoaTemplateDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest request, CancellationToken cancellationToken)
    {
        var template = await _templateService.CreateTemplateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetTemplateById), new { id = template.Id }, template);
    }
}
