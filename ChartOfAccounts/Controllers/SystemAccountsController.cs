
using Microsoft.AspNetCore.Mvc;


namespace ChartOfAccounts;

/// <summary>
/// واجهات إدارة وتعيين أدوار الحسابات النظامية للشركات (System Account Mappings API).
/// تستخدمها الوحدات الآلية (المبيعات، المخازن، المشتريات، الخزينة، إقفال الفترات) لمعرفة الحسابات المالية آلياً.
/// </summary>
[ApiController]
[Route("api/system-accounts")]
[Route("api/[controller]")]
[Produces("application/json")]
public class SystemAccountsController : ControllerBase
{
    private readonly SystemAccountMappingService _systemAccountService;

    public SystemAccountsController(SystemAccountMappingService systemAccountService)
    {
        _systemAccountService = systemAccountService;
    }

    /// <summary>
    /// جلب قائمة بكافة الأدوار النظامية المعينة لشركة محددة.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<SystemAccountMappingDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMappings([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest(new { message = "معرف الشركة إلزامي." });

        var mappings = await _systemAccountService.GetMappingsAsync(companyId, cancellationToken);
        return Ok(mappings);
    }

    /// <summary>
    /// استرجاع الحساب المالي الفعلي المرتبط بدور نظامي محدد لشركة معينة (مثل CashOnHand, AccountsReceivable).
    /// </summary>
    [HttpGet("{role}")]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAccountByRole(SystemAccountRole role, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest(new { message = "معرف الشركة إلزامي." });

        var account = await _systemAccountService.GetAccountByRoleAsync(companyId, role, cancellationToken);
        if (account == null)
            return NotFound(new { message = $"الدور النظامي '{role}' غير مرتبط بأي حساب مالي في هذه الشركة بعد." });

        return Ok(account);
    }

    /// <summary>
    /// تعيين أو تحديث الحساب المالي المرتبط بدور نظامي معين.
    /// يتحقق من قابلية الترحيل وتطابق نوع الحساب المحاسبي.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(SystemAccountMappingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SetRoleMapping(
        [FromQuery] Guid companyId,
        [FromBody] UpdateSystemAccountMappingRequest request,
        CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest(new { message = "معرف الشركة إلزامي." });

        var result = await _systemAccountService.SetRoleMappingAsync(companyId, request, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// التحقق مما إذا كانت الأدوار النظامية الحرجة مكتملة التعيين للشركة.
    /// </summary>
    [HttpGet("validate-critical")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<IActionResult> ValidateCriticalRoles([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest(new { message = "معرف الشركة إلزامي." });

        var isComplete = await _systemAccountService.ValidateCriticalRolesMappedAsync(companyId, cancellationToken);
        return Ok(new
        {
            companyId,
            allCriticalRolesMapped = isComplete,
            message = isComplete
                ? "كافة الأدوار النظامية الحرجة مكتملة التعيين."
                : "تنبيه: بعض الأدوار النظامية الأساسية غير معينة بعد (مثل الصندوق، العملاء، الموردين، أو الأرباح المبقاة)."
        });
    }
}
