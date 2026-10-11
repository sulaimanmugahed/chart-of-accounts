
using Microsoft.AspNetCore.Mvc;


namespace ChartOfAccounts;

/// <summary>
/// واجهات إدارة واستعراض حسابات شجرة الحسابات للشركات.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AccountsController : ControllerBase
{
    private readonly AccountService _accountService;

    public AccountsController(AccountService accountService)
    {
        _accountService = accountService;
    }

    /// <summary>
    /// جلب كامل شجرة الحسابات لشركة محددة على هيئة هيكل شجري تفاعلي متداخل (Nested Tree).
    /// </summary>
    [HttpGet("tree")]
    [ProducesResponseType(typeof(IReadOnlyList<AccountTreeNodeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAccountsTree([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest(new { message = "معرف الشركة إلزامي." });

        var tree = await _accountService.GetAccountsTreeAsync(companyId, cancellationToken);
        return Ok(tree);
    }

    /// <summary>
    /// جلب قائمة مسطحة بالحسابات لشركة محددة مع إمكانية الفلترة بحسب المستوى أو الحسابات القابلة للترحيل فقط.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AccountDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFlatAccounts(
        [FromQuery] Guid companyId,
        [FromQuery] int? maxLevel,
        [FromQuery] bool? postableOnly,
        CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest(new { message = "معرف الشركة إلزامي." });

        var accounts = await _accountService.GetFlatAccountsAsync(companyId, maxLevel, postableOnly, cancellationToken);
        return Ok(accounts);
    }

    /// <summary>
    /// جلب تفاصيل حساب محدد بالمعرف.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAccountById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        if (companyId == Guid.Empty)
            return BadRequest(new { message = "معرف الشركة إلزامي." });

        var account = await _accountService.GetAccountByIdAsync(companyId, id, cancellationToken);
        if (account == null) return NotFound(new { message = $"الحساب برقم ({id}) غير موجود في الشركة." });
        return Ok(account);
    }

    /// <summary>
    /// إضافة حساب مخصص جديد لشجرة الشركة مع التحقق التلقائي من عدم تجاوز أقصى عمق مسموح به (MaxAccountDepth)
    /// وتحويل الحساب الأب تلقائياً إلى حساب رئيسي وتجميد ترحيله.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest request, CancellationToken cancellationToken)
    {
        var account = await _accountService.CreateCustomAccountAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetAccountById), new { id = account.Id, companyId = account.CompanyId }, account);
    }

    /// <summary>
    /// تعديل بيانات حساب محاسبي قائم.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AccountDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAccount(Guid id, [FromQuery] Guid companyId, [FromBody] UpdateAccountRequest request, CancellationToken cancellationToken)
    {
        var account = await _accountService.UpdateAccountAsync(companyId, id, request, cancellationToken);
        return Ok(account);
    }

    /// <summary>
    /// حذف حساب محاسبي مع التحقق من عدم وجود حسابات فرعية أو ربط بأدوار نظامية.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteAccount(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var deleted = await _accountService.DeleteAccountAsync(companyId, id, cancellationToken);
        if (!deleted) return NotFound(new { message = $"الحساب برقم ({id}) غير موجود." });
        return NoContent();
    }
}

