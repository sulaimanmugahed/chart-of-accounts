
using Microsoft.AspNetCore.Mvc;


namespace ChartOfAccounts;

///
/// 
/// <summary>
/// واجهات إدارة الشركات والمستأجرين وضبط إعدادات شجرة الحسابات (Multi-Tenancy).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class CompaniesController : ControllerBase
{
    private readonly CompanyService _companyService;

    public CompaniesController(CompanyService companyService)
    {
        _companyService = companyService;
    }

    /// <summary>
    /// جلب قائمة بكافة الشركات المسجلة في النظام.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CompanyDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCompanies(CancellationToken cancellationToken)
    {
        var companies = await _companyService.GetAllCompaniesAsync(cancellationToken);
        return Ok(companies);
    }

    /// <summary>
    /// جلب تفاصيل شركة محددة بواسطة المعرف.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCompanyById(Guid id, CancellationToken cancellationToken)
    {
        var company = await _companyService.GetCompanyByIdAsync(id, cancellationToken);
        if (company == null) return NotFound(new { message = $"الشركة برقم ({id}) غير موجودة." });
        return Ok(company);
    }

    /// <summary>
    /// إنشاء شركة / مستأجر جديد مع تحديد أقصى عمق مسموح لشجرة حساباتها (MaxAccountDepth).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest request, CancellationToken cancellationToken)
    {
        var company = await _companyService.CreateCompanyAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetCompanyById), new { id = company.Id }, company);
    }

    /// <summary>
    /// تعديل بيانات الشركة الأساسية (الاسم، الرقم الضريبي، العملة).
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCompany(Guid id, [FromBody] UpdateCompanyRequest request, CancellationToken cancellationToken)
    {
        var company = await _companyService.UpdateCompanyAsync(id, request, cancellationToken);
        return Ok(company);
    }

    /// <summary>
    /// ضبط وتعديل الحد الأقصى لعمق شجرة الحسابات للشركة (MaxAccountDepth).
    /// يسمح بتخصيص عمق الشجرة (مثال: 3 مستويات للشركات الصغيرة، 5 إلى 8 للمؤسسات الكبرى).
    /// </summary>
    [HttpPut("{id:guid}/depth")]
    [ProducesResponseType(typeof(CompanyDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateCompanyDepth(Guid id, [FromBody] int maxDepth, CancellationToken cancellationToken)
    {
        var company = await _companyService.UpdateCompanyDepthAsync(id, maxDepth, cancellationToken);
        return Ok(company);
    }
}

