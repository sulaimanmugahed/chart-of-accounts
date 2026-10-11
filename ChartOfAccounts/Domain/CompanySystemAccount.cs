

namespace ChartOfAccounts;

/// <summary>
/// يمثل جدول ربط الأدوار النظامية (System Account Role Mappings) بحسابات الشركة الفعلية.
/// هذا الكيان هو الجسر الذي تستخدمه وحدات النظام الأخرى (المبيعات، المشتريات، المخازن، الرواتب، الإقفال السنوي)
/// للوصول للحساب المالي المعني تلقائياً ومستقلاً عن هيكل الترقيم.
/// </summary>
public class CompanySystemAccount
{
    /// <summary>
    /// المعرف الفريد لسجل الربط
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// معرف الشركة التابع لها الربط
    /// </summary>
    public Guid CompanyId { get; private set; }

    /// <summary>
    /// دور الحساب النظامي (مثل: النقدية، العملاء، الموردون، الأرباح المبقاة)
    /// </summary>
    public SystemAccountRole Role { get; private set; }

    /// <summary>
    /// معرف الحساب الفعلي المرتبط من شجرة حسابات الشركة
    /// </summary>
    public Guid AccountId { get; private set; }

    /// <summary>
    /// هل الربط مقفل ومحمي من التعديل غير المقصود؟
    /// الحسابات الحساسة مثل الأرباح المبقاة وحسابات فروق التسوية يفضل قفلها بعد بدء العمليات.
    /// </summary>
    public bool IsLocked { get; private set; }

    /// <summary>
    /// تاريخ ووقت تعيين الربط
    /// </summary>
    public DateTime AssignedAtUtc { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// ملاحظات أو سبب التعيين
    /// </summary>
    public string? Notes { get; private set; }

    // العلاقات الملاحية
    public virtual Company Company { get; private set; } = null!;
    public virtual Account Account { get; private set; } = null!;

    private CompanySystemAccount() { }

    public CompanySystemAccount(
        Guid companyId,
        SystemAccountRole role,
        Guid accountId,
        bool isLocked = false,
        string? notes = null)
    {
        if (companyId == Guid.Empty)
            throw new AccountingDomainException("معرف الشركة غير صالح لتعيين الحساب النظامي.", "INVALID_COMPANY_ID");

        if (accountId == Guid.Empty)
            throw new AccountingDomainException("معرف الحساب المحاسبي غير صالح لتعيين الحساب النظامي.", "INVALID_ACCOUNT_ID");

        Id = Guid.NewGuid();
        CompanyId = companyId;
        Role = role;
        AccountId = accountId;
        IsLocked = isLocked;
        AssignedAtUtc = DateTime.UtcNow;
        Notes = notes?.Trim();
    }

    /// <summary>
    /// تحديث وتغيير الحساب المرتبط بهذا الدور النظامي مع التحقق من عدم قفله.
    /// </summary>
    public void UpdateMappedAccount(Guid newAccountId, string? notes = null, bool forceIfLocked = false)
    {
        if (IsLocked && !forceIfLocked)
            throw new SystemAccountMappingException(Role, $"الدور النظامي '{Role}' مقفل ولا يمكن تغييره إلا بصلاحية كسر القفل الاستثنائية.");

        if (newAccountId == Guid.Empty)
            throw new SystemAccountMappingException(Role, "معرف الحساب الجديد غير صالح.");

        AccountId = newAccountId;
        Notes = notes?.Trim() ?? Notes;
        AssignedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// قفل أو فتح قفل الربط النظامي
    /// </summary>
    public void SetLockStatus(bool isLocked)
    {
        IsLocked = isLocked;
    }

    /// <summary>
    /// التحقق من توافق الحساب مع الدور المحاسبي النظامي المطلوب.
    /// مثال: حساب النقدية يجب أن يكون من نوع أصول، حساب المبيعات يجب أن يكون من نوع إيرادات.
    /// </summary>
    public static void ValidateRoleAccountCompatibility(SystemAccountRole role, Account account)
    {
        if (!account.IsPostable || account.IsHeader)
            throw new SystemAccountMappingException(role, $"الحساب '{account.Code} - {account.NameArabic}' هو حساب رئيسي/تجميعي، والأدوار النظامية تتطلب حسابات تحليلية تقبل الترحيل فقط.");

        var expectedType = GetExpectedAccountType(role);
        if (expectedType.HasValue && account.AccountType != expectedType.Value)
        {
            throw new SystemAccountMappingException(role, $"نوع الحساب '{account.AccountType}' غير متوافق مع الدور النظامي '{role}'. النوع المحاسبي المتوقع هو '{expectedType.Value}'.");
        }
    }

    /// <summary>
    /// إرجاع النوع المحاسبي المتوقع لكل دور نظامي لضمان الاتساق المحاسبي الصارم.
    /// </summary>
    public static AccountType? GetExpectedAccountType(SystemAccountRole role) => role switch
    {
        SystemAccountRole.CashOnHand => AccountType.Asset,
        SystemAccountRole.BankDefault => AccountType.Asset,
        SystemAccountRole.AccountsReceivable => AccountType.Asset,
        SystemAccountRole.Inventory => AccountType.Asset,
        SystemAccountRole.PrepaidExpenses => AccountType.Asset,
        SystemAccountRole.VatInputTax => AccountType.Asset, // ضريبة المدخلات هي أصل متداول مسترد

        SystemAccountRole.AccountsPayable => AccountType.Liability,
        SystemAccountRole.VatOutputTax => AccountType.Liability, // ضريبة المخرجات هي التزام مستحق للدولة
        SystemAccountRole.UnearnedRevenue => AccountType.Liability,

        SystemAccountRole.RetainedEarnings => AccountType.Equity,
        SystemAccountRole.CurrentYearProfitLoss => AccountType.Equity,
        SystemAccountRole.OpeningBalanceEquity => AccountType.Equity,

        SystemAccountRole.SalesRevenue => AccountType.Revenue,
        SystemAccountRole.ForeignExchangeGain => AccountType.Revenue,

        SystemAccountRole.CostOfGoodsSold => AccountType.Expense,
        SystemAccountRole.GeneralAndAdminExpense => AccountType.Expense,
        SystemAccountRole.PayrollExpense => AccountType.Expense,
        SystemAccountRole.DepreciationExpense => AccountType.Expense,
        SystemAccountRole.ForeignExchangeLoss => AccountType.Expense,

        // مجمع الإهلاك ومردودات المبيعات قد تصنف كحسابات مقابلة (Contra Accounts)
        SystemAccountRole.AccumulatedDepreciation => AccountType.Asset,
        SystemAccountRole.SalesReturns => AccountType.Revenue,

        _ => null
    };
}