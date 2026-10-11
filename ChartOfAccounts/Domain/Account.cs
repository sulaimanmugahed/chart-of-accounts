

namespace ChartOfAccounts;

/// <summary>
/// يمثل الحساب المالي الفعلي ضمن شجرة الحسابات (Chart of Accounts) لشركة محددة.
/// يدعم الهيكلية الشجرية متعددة المستويات، وقواعد الفصل الصارم بين الحسابات التجميعية والتحليلية.
/// </summary>
public class Account
{
    /// <summary>
    /// المعرف الفريد للحساب
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// معرف الشركة التابع لها الحساب (لتحقيق مبدأ عزل المستأجرين Multi-Tenancy)
    /// </summary>
    public Guid CompanyId { get; private set; }

    /// <summary>
    /// الرمز الرقمي المحاسبي للحساب (مثال: "1", "11", "1101", "110101")
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم المحاسبي باللغة العربية (مثال: "النقدية في الصندوق")
    /// </summary>
    public string NameArabic { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم المحاسبي باللغة الإنجليزية (مثال: "Cash on Hand")
    /// </summary>
    public string NameEnglish { get; private set; } = string.Empty;

    /// <summary>
    /// النوع المحاسبي الرئيسي (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات)
    /// </summary>
    public AccountType AccountType { get; private set; }

    /// <summary>
    /// طبيعة الرصيد الطبيعي (مدين / دائن)
    /// </summary>
    public NormalBalance NormalBalance { get; private set; }

    /// <summary>
    /// التصنيف المالي (قائمة المركز المالي أو قائمة الدخل)
    /// </summary>
    public AccountClassification Classification { get; private set; }

    /// <summary>
    /// مستوى الحساب في الشجرة الهيكلية (يبدأ من 1 للحسابات الرئيسية)
    /// </summary>
    public int Level { get; private set; }

    /// <summary>
    /// معرف الحساب الأب (يكون فارغاً للحسابات الجذرية الرئيسية من المستوى 1)
    /// </summary>
    public Guid? ParentAccountId { get; private set; }

    /// <summary>
    /// هل الحساب رئيسي/تجميعي (Header Account)؟
    /// الحسابات الرئيسية تجمع أرصدة الفروع ولا يمكن إجراء قيود يومية مباشرة عليها.
    /// </summary>
    public bool IsHeader { get; private set; }

    /// <summary>
    /// هل الحساب تحليلي يقبل الترحيل (Postable / Leaf Account)؟
    /// القيود اليومية المحاسبية تقبل الترحيل فقط على الحسابات التحليلية النهائية.
    /// القاعدة المحاسبية الصارمة: الحساب لا يمكن أن يكون تجميعياً وقابلاً للترحيل في آنٍ واحد (IsHeader != IsPostable).
    /// </summary>
    public bool IsPostable { get; private set; }

    /// <summary>
    /// حالة الحساب (نشط / موقف مؤقتاً)
    /// </summary>
    public bool IsActive { get; private set; } = true;

    /// <summary>
    /// دور الحساب في العمليات النظامية التلقائية إن وجد
    /// </summary>
    public SystemAccountRole? SystemRole { get; private set; }

    /// <summary>
    /// مسار النسب المادي (Materialized Lineage Path) للحساب مثل "/1/11/1101/"
    /// يسهل الاستعلامات الهيكلية التجميعية الفائقة السرعة ويمنع الدورات الحلقية.
    /// </summary>
    public string LineagePath { get; private set; } = string.Empty;

    /// <summary>
    /// وصف اختياري للحساب أو السياسة المحاسبية المرتبطة به
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// رمز العملة في حال تخصيص الحساب لعملة معينة (اختياري)
    /// </summary>
    public string? CurrencyCode { get; private set; }

    /// <summary>
    /// تاريخ إنشاء الحساب
    /// </summary>
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// تاريخ آخر تعديل على الحساب
    /// </summary>
    public DateTime? UpdatedAtUtc { get; private set; }

    // العلاقات الملاحية (Navigation Properties)
    public virtual Company Company { get; private set; } = null!;
    public virtual Account? ParentAccount { get; private set; }
    public virtual ICollection<Account> ChildAccounts { get; private set; } = new List<Account>();

    private Account() { }

    /// <summary>
    /// مُنشئ لإنشاء حساب محاسبي مع تطبيق كافة القواعد والضوابط المحاسبية بدقة.
    /// </summary>
    public Account(
        Guid companyId,
        string code,
        string nameArabic,
        string nameEnglish,
        AccountType accountType,
        NormalBalance? normalBalance = null,
        AccountClassification? classification = null,
        int level = 1,
        Guid? parentAccountId = null,
        bool isHeader = false,
        bool isPostable = true,
        SystemAccountRole? systemRole = null,
        string? description = null,
        string? currencyCode = null,
        string? parentLineage = null)
    {
        if (companyId == Guid.Empty)
            throw new AccountingDomainException("معرف الشركة غير صالح.", "INVALID_COMPANY_ID");

        if (string.IsNullOrWhiteSpace(code))
            throw new AccountingDomainException("رمز الحساب المحاسبي إلزامي.", "INVALID_ACCOUNT_CODE");

        if (string.IsNullOrWhiteSpace(nameArabic))
            throw new AccountingDomainException("اسم الحساب باللغة العربية إلزامي.", "INVALID_ACCOUNT_NAME");

        if (level < 1)
            throw new AccountingDomainException("مستوى الحساب يجب أن يكون 1 على الأقل.", "INVALID_ACCOUNT_LEVEL");

        // تحديد طبيعة الرصيد التلقائية بناءً على نوع الحساب إذا لم يتم تحديدها صراحة
        var determinedBalance = normalBalance ?? DetermineDefaultNormalBalance(accountType);

        // تحديد التصنيف المالي التلقائي (قائمة دخل أو مركز مالي)
        var determinedClassification = classification ?? DetermineDefaultClassification(accountType);

        // ضبط تناسق الحساب التجميعي والتحليلي
        if (isHeader)
        {
            isPostable = false; // الحسابات التجميعية لا تقبل القيود إطلاقاً
        }

        Id = Guid.NewGuid();
        CompanyId = companyId;
        Code = code.Trim();
        NameArabic = nameArabic.Trim();
        NameEnglish = string.IsNullOrWhiteSpace(nameEnglish) ? nameArabic.Trim() : nameEnglish.Trim();
        AccountType = accountType;
        NormalBalance = determinedBalance;
        Classification = determinedClassification;
        Level = level;
        ParentAccountId = parentAccountId;
        IsHeader = isHeader;
        IsPostable = isPostable;
        IsActive = true;
        SystemRole = systemRole;
        Description = description?.Trim();
        CurrencyCode = currencyCode?.Trim().ToUpperInvariant();
        CreatedAtUtc = DateTime.UtcNow;

        // حساب مسار النسب المادي
        LineagePath = string.IsNullOrWhiteSpace(parentLineage)
            ? $"/{Code}/"
            : $"{parentLineage.TrimEnd('/')}/{Code}/";
    }

    /// <summary>
    /// تحويل الحساب إلى حساب تجميعي (Header) عند إضافة حسابات فرعية تحته.
    /// يُعطل إمكانية الترحيل المباشر (IsPostable = false) لحماية التوازن المالي.
    /// </summary>
    public void ConvertToHeader()
    {
        IsHeader = true;
        IsPostable = false;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// تحويل الحساب إلى حساب تحليلي يقبل الترحيل في حال عدم وجود حسابات فرعية تتبعه.
    /// </summary>
    public void ConvertToPostable()
    {
        if (ChildAccounts.Any())
            throw new InvalidAccountHierarchyException($"لا يمكن تحويل الحساب '{Code}' إلى حساب تحليلي قابل للترحيل لأنه يحتوي على حسابات فرعية تابعة.");

        IsHeader = false;
        IsPostable = true;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// تعيين دور نظامي للحساب (مثل صندوق النقدية، العملاء، ضريبة القيمة المضافة)
    /// </summary>
    public void AssignSystemRole(SystemAccountRole role)
    {
        SystemRole = role;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// إزالة الدور النظامي المرتبط بالحساب
    /// </summary>
    public void ClearSystemRole()
    {
        SystemRole = null;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// تحديث بيانات الحساب الأساسية
    /// </summary>
    public void UpdateInformation(string nameArabic, string nameEnglish, string? description, string? currencyCode)
    {
        if (string.IsNullOrWhiteSpace(nameArabic))
            throw new AccountingDomainException("اسم الحساب باللغة العربية إلزامي.", "INVALID_ACCOUNT_NAME");

        NameArabic = nameArabic.Trim();
        NameEnglish = string.IsNullOrWhiteSpace(nameEnglish) ? nameArabic.Trim() : nameEnglish.Trim();
        Description = description?.Trim();
        CurrencyCode = currencyCode?.Trim().ToUpperInvariant();
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// تفعيل أو تعطيل الحساب المحاسبي
    /// </summary>
    public void SetActiveStatus(bool active)
    {
        IsActive = active;
        UpdatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// تحديد طبيعة الرصيد الافتراضية وفقاً للأعراف والمعايير المحاسبية الدولية.
    /// </summary>
    public static NormalBalance DetermineDefaultNormalBalance(AccountType type) => type switch
    {
        AccountType.Asset => NormalBalance.Debit,
        AccountType.Expense => NormalBalance.Debit,
        AccountType.Liability => NormalBalance.Credit,
        AccountType.Equity => NormalBalance.Credit,
        AccountType.Revenue => NormalBalance.Credit,
        _ => throw new ArgumentOutOfRangeException(nameof(type), $"نوع الحساب غير معروف: {type}")
    };

    /// <summary>
    /// تحديد التصنيف المالي الافتراضي بناءً على نوع الحساب.
    /// </summary>
    public static AccountClassification DetermineDefaultClassification(AccountType type) => type switch
    {
        AccountType.Asset => AccountClassification.BalanceSheet,
        AccountType.Liability => AccountClassification.BalanceSheet,
        AccountType.Equity => AccountClassification.BalanceSheet,
        AccountType.Revenue => AccountClassification.IncomeStatement,
        AccountType.Expense => AccountClassification.IncomeStatement,
        _ => throw new ArgumentOutOfRangeException(nameof(type), $"نوع الحساب غير معروف: {type}")
    };
}
