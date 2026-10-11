

namespace ChartOfAccounts;

/// <summary>
/// يمثل بنداً محاسبياً ضمن قالب شجرة الحسابات (COA Template Node).
/// يحتوي على خصائص الحساب وموقعه الهيكلي والدور النظامي التلقائي المقترح له.
/// </summary>
public class CoaTemplateNode
{
    /// <summary>
    /// المعرف الفريد لبند القالب
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// معرف القالب التابع له هذا البند
    /// </summary>
    public Guid TemplateId { get; private set; }

    /// <summary>
    /// الرمز المحاسبي للبند (مثال: "1101", "110101")
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم باللغة العربية
    /// </summary>
    public string NameArabic { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم باللغة الإنجليزية
    /// </summary>
    public string NameEnglish { get; private set; } = string.Empty;

    /// <summary>
    /// نوع الحساب المحاسبي (أصول، خصوم، إلخ)
    /// </summary>
    public AccountType AccountType { get; private set; }

    /// <summary>
    /// طبيعة الرصيد (مدين / دائن)
    /// </summary>
    public NormalBalance NormalBalance { get; private set; }

    /// <summary>
    /// التصنيف المالي (قائمة المركز المالي أو قائمة الدخل)
    /// </summary>
    public AccountClassification Classification { get; private set; }

    /// <summary>
    /// المستوى الهيكلي في الشجرة (1، 2، 3، ...)
    /// </summary>
    public int Level { get; private set; }

    /// <summary>
    /// رمز الحساب الأب ضمن القالب
    /// </summary>
    public string? ParentNodeCode { get; private set; }

    /// <summary>
    /// هل الحساب تجميعي في القالب؟
    /// </summary>
    public bool IsHeader { get; private set; }

    /// <summary>
    /// هل الحساب تحليلي يقبل الترحيل في القالب؟
    /// </summary>
    public bool IsPostable { get; private set; }

    /// <summary>
    /// الدور النظامي التلقائي المقترح لهذا الحساب عند توليد شجرة الشركة
    /// (مثال: CashOnHand, AccountsReceivable, SalesRevenue, VatInputTax)
    /// </summary>
    public SystemAccountRole? DefaultSystemRole { get; private set; }

    /// <summary>
    /// وصف اختياري للبند
    /// </summary>
    public string? Description { get; private set; }

    // العلاقات الملاحية
    public virtual CoaTemplate Template { get; private set; } = null!;

    private CoaTemplateNode() { }

    public CoaTemplateNode(
        Guid templateId,
        string code,
        string nameArabic,
        string nameEnglish,
        AccountType accountType,
        NormalBalance? normalBalance = null,
        AccountClassification? classification = null,
        int level = 1,
        string? parentNodeCode = null,
        bool isHeader = false,
        bool isPostable = true,
        SystemAccountRole? defaultSystemRole = null,
        string? description = null)
    {
        if (templateId == Guid.Empty)
            throw new AccountingDomainException("معرف القالب غير صالح.", "INVALID_TEMPLATE_ID");

        if (string.IsNullOrWhiteSpace(code))
            throw new AccountingDomainException("رمز بند القالب إلزامي.", "INVALID_NODE_CODE");

        if (string.IsNullOrWhiteSpace(nameArabic))
            throw new AccountingDomainException("اسم بند القالب باللغة العربية إلزامي.", "INVALID_NODE_NAME");

        if (level < 1)
            throw new AccountingDomainException("مستوى الحساب يجب أن يكون 1 على الأقل.", "INVALID_NODE_LEVEL");

        var determinedBalance = normalBalance ?? Account.DetermineDefaultNormalBalance(accountType);
        var determinedClassification = classification ?? Account.DetermineDefaultClassification(accountType);

        if (isHeader)
        {
            isPostable = false;
        }

        Id = Guid.NewGuid();
        TemplateId = templateId;
        Code = code.Trim();
        NameArabic = nameArabic.Trim();
        NameEnglish = string.IsNullOrWhiteSpace(nameEnglish) ? nameArabic.Trim() : nameEnglish.Trim();
        AccountType = accountType;
        NormalBalance = determinedBalance;
        Classification = determinedClassification;
        Level = level;
        ParentNodeCode = string.IsNullOrWhiteSpace(parentNodeCode) ? null : parentNodeCode.Trim();
        IsHeader = isHeader;
        IsPostable = isPostable;
        DefaultSystemRole = defaultSystemRole;
        Description = description?.Trim();
    }
}
