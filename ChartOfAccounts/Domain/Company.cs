

namespace ChartOfAccounts;

/// <summary>
/// يمثل كيان الشركة أو المستأجر (Tenant / Company) في النظام المحاسبي متعدد الشركات.
/// يحتوي على الإعدادات المالية الخاصة بالشركة بما في ذلك الحد الأقصى لعمق دليل الحسابات.
/// </summary>
public class Company
{
    /// <summary>
    /// المعرف الفريد للشركة
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// الرمز المرجعي الفريد للشركة (مثال: COMP-001)
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم الرسمي للشركة باللغة العربية
    /// </summary>
    public string NameArabic { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم الرسمي للشركة باللغة الإنجليزية
    /// </summary>
    public string NameEnglish { get; private set; } = string.Empty;

    /// <summary>
    /// الرقم الضريبي للمنشأة (VAT Number)
    /// </summary>
    public string? TaxNumber { get; private set; }

    /// <summary>
    /// عملة الأساس المحاسبية للشركة (مثال: SAR, AED, USD, EGP)
    /// </summary>
    public string BaseCurrency { get; private set; } = "SAR";

    /// <summary>
    /// شهر بداية السنة المالية (1 إلى 12 - افتراضياً 1 يناير)
    /// </summary>
    public int FiscalYearStartMonth { get; private set; } = 1;

    /// <summary>
    /// الحد الأقصى المسموح به لعمق مستويات شجرة الحسابات لهذه الشركة.
    /// يدعم التخصيص لكل شركة (مثلاً: 4 مستويات للشركات الصغيرة، 6 إلى 8 مستويات للشركات القابضة الكبرى).
    /// </summary>
    public int MaxAccountDepth { get; private set; } = 5;

    /// <summary>
    /// يشير إلى ما إذا كان قد تم تهيئة دليل الحسابات للشركة مسبقاً
    /// </summary>
    public bool IsCoaInitialized { get; private set; } = false;

    /// <summary>
    /// معرف القالب الذي تم استخدامه لتهيئة دليل الحسابات (إن وجد)
    /// </summary>
    public Guid? InitializedFromTemplateId { get; private set; }

    /// <summary>
    /// تاريخ ووقت إتمام عملية التهيئة بالصيغة العالمية (UTC)
    /// </summary>
    public DateTime? InitializedAtUtc { get; private set; }

    /// <summary>
    /// تاريخ إنشاء سجل الشركة
    /// </summary>
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// تاريخ آخر تعديل على بيانات الشركة
    /// </summary>
    public DateTime? UpdatedAtUtc { get; private set; }

    /// <summary>
    /// حالة الشركة (نشطة / معطلة)
    /// </summary>
    public bool IsActive { get; private set; } = true;

    // مجموعات الملاحة (Navigation Collections)
    public virtual ICollection<Account> Accounts { get; private set; } = new List<Account>();
    public virtual ICollection<CompanySystemAccount> SystemAccountMappings { get; private set; } = new List<CompanySystemAccount>();
    public virtual ICollection<CoaInitializationAuditLog> InitializationAuditLogs { get; private set; } = new List<CoaInitializationAuditLog>();

    // مُنشئ فارغ لـ Entity Framework Core
    private Company() { }

    /// <summary>
    /// مُنشئ لإنشاء شركة جديدة مع ضبط الضوابط والتحقق من صحة المدخلات.
    /// </summary>
    public Company(
        string code,
        string nameArabic,
        string nameEnglish,
        string baseCurrency = "SAR",
        int maxAccountDepth = 5,
        string? taxNumber = null,
        int fiscalYearStartMonth = 1)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new AccountingDomainException("رمز الشركة إلزامي ولا يمكن أن يكون فارغاً.", "INVALID_COMPANY_CODE");

        if (string.IsNullOrWhiteSpace(nameArabic))
            throw new AccountingDomainException("اسم الشركة باللغة العربية إلزامي.", "INVALID_COMPANY_NAME");

        SetMaxAccountDepth(maxAccountDepth);

        Id = Guid.NewGuid();
        Code = code.Trim().ToUpperInvariant();
        NameArabic = nameArabic.Trim();
        NameEnglish = string.IsNullOrWhiteSpace(nameEnglish) ? nameArabic.Trim() : nameEnglish.Trim();
        BaseCurrency = string.IsNullOrWhiteSpace(baseCurrency) ? "SAR" : baseCurrency.Trim().ToUpperInvariant();
        TaxNumber = taxNumber?.Trim();
        FiscalYearStartMonth = fiscalYearStartMonth is >= 1 and <= 12 ? fiscalYearStartMonth : 1;
        CreatedAtUtc = DateTime.UtcNow;
        IsActive = true;
    }

    /// <summary>
    /// تعديل الحد الأقصى لعمق شجرة الحسابات مع التحقق من المعايير المحاسبية (بين 3 و 10 مستويات).
    /// </summary>
    public void SetMaxAccountDepth(int depth)
    {
        if (depth < 3 || depth > 10)
            throw new AccountingDomainException("عمق شجرة الحسابات يجب أن يكون بين 3 مستويات كحد أدنى و 10 مستويات كحد أقصى لضمان كفاءة التقارير المالية.", "INVALID_MAX_DEPTH");

        MaxAccountDepth = depth;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// وسم الشركة كمهيأة بعد إتمام تطبيق قالب شجرة الحسابات بنجاح.
    /// </summary>
    public void MarkCoaAsInitialized(Guid templateId)
    {
        IsCoaInitialized = true;
        InitializedFromTemplateId = templateId;
        InitializedAtUtc = DateTime.UtcNow;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// تحديث البيانات العامة للشركة.
    /// </summary>
    public void UpdateProfile(string nameArabic, string nameEnglish, string? taxNumber, string baseCurrency)
    {
        if (string.IsNullOrWhiteSpace(nameArabic))
            throw new AccountingDomainException("اسم الشركة باللغة العربية إلزامي.", "INVALID_COMPANY_NAME");

        NameArabic = nameArabic.Trim();
        NameEnglish = string.IsNullOrWhiteSpace(nameEnglish) ? nameArabic.Trim() : nameEnglish.Trim();
        TaxNumber = taxNumber?.Trim();
        BaseCurrency = string.IsNullOrWhiteSpace(baseCurrency) ? BaseCurrency : baseCurrency.Trim().ToUpperInvariant();
        UpdatedAtUtc = DateTime.UtcNow;
    }
}
