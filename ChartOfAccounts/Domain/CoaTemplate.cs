

namespace ChartOfAccounts;

/// <summary>
/// يمثل قالباً معيارياً قابلاً لإعادة الاستخدام لشجرة الحسابات (COA Template).
/// يسمح بتهيئة وتوليد شجرة حسابات كاملة لأي شركة بنقرة واحدة، وفق أفضل الممارسات المحاسبية لكل قطاع تجاري.
/// </summary>
public class CoaTemplate
{
    /// <summary>
    /// المعرف الفريد للقالب
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// الرمز المرجعي للقالب (مثال: "TEMPLATE_COMMERCIAL_SA", "TEMPLATE_SERVICES", "TEMPLATE_SME")
    /// </summary>
    public string Code { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم باللغة العربية (مثال: "دليل الحسابات المعياري للشركات التجارية - متوافق مع معايير IFRS")
    /// </summary>
    public string NameArabic { get; private set; } = string.Empty;

    /// <summary>
    /// الاسم باللغة الإنجليزية (مثال: "Standard Commercial Chart of Accounts Template")
    /// </summary>
    public string NameEnglish { get; private set; } = string.Empty;

    /// <summary>
    /// وصف تفصيلي لمجال وتطبيق القالب
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// القطاع الاقتصادي المستهدف (Commercial, Services, Manufacturing, RealEstate, NonProfit)
    /// </summary>
    public string IndustryType { get; private set; } = "General";

    /// <summary>
    /// الحد الأقصى الموصى به لعمق مستويات القالب
    /// </summary>
    public int RecommendedMaxDepth { get; private set; } = 5;

    /// <summary>
    /// هل القالب نشط ومتاح للاستخدام لتهيئة الشركات؟
    /// </summary>
    public bool IsActive { get; private set; } = true;

    /// <summary>
    /// هل القالب افتراضي مدمج بالنظام ومحمي من التعديل المباشر؟
    /// </summary>
    public bool IsSystemTemplate { get; private set; } = true;

    /// <summary>
    /// رقم إصدار القالب لتتبع التحديثات المحاسبية والتطويرات
    /// </summary>
    public int Version { get; private set; } = 1;

    /// <summary>
    /// تاريخ إنشاء القالب
    /// </summary>
    public DateTime CreatedAtUtc { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// بنود وحسابات القالب الهيكلية
    /// </summary>
    public virtual ICollection<CoaTemplateNode> Nodes { get; private set; } = new List<CoaTemplateNode>();

    private CoaTemplate() { }

    public CoaTemplate(
        string code,
        string nameArabic,
        string nameEnglish,
        string industryType = "General",
        int recommendedMaxDepth = 5,
        string? description = null,
        bool isSystemTemplate = true,
        int version = 1)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new AccountingDomainException("رمز القالب إلزامي.", "INVALID_TEMPLATE_CODE");

        if (string.IsNullOrWhiteSpace(nameArabic))
            throw new AccountingDomainException("اسم القالب باللغة العربية إلزامي.", "INVALID_TEMPLATE_NAME");

        Id = Guid.NewGuid();
        Code = code.Trim().ToUpperInvariant();
        NameArabic = nameArabic.Trim();
        NameEnglish = string.IsNullOrWhiteSpace(nameEnglish) ? nameArabic.Trim() : nameEnglish.Trim();
        IndustryType = string.IsNullOrWhiteSpace(industryType) ? "General" : industryType.Trim();
        RecommendedMaxDepth = recommendedMaxDepth >= 3 ? recommendedMaxDepth : 5;
        Description = description?.Trim();
        IsActive = true;
        IsSystemTemplate = isSystemTemplate;
        Version = version > 0 ? version : 1;
        CreatedAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// إضافة بند هيكلي جديد إلى القالب.
    /// </summary>
    public CoaTemplateNode AddNode(
        string code,
        string nameArabic,
        string nameEnglish,
       AccountType accountType,
        NormalBalance? normalBalance = null,
       AccountClassification? classification = null,
        int level = 1,
        string? parentCode = null,
        bool isHeader = false,
        bool isPostable = true,
        SystemAccountRole? defaultSystemRole = null,
        string? description = null)
    {
        var node = new CoaTemplateNode(
            Id,
            code,
            nameArabic,
            nameEnglish,
            accountType,
            normalBalance,
            classification,
            level,
            parentCode,
            isHeader,
            isPostable,
            defaultSystemRole,
            description);

        Nodes.Add(node);
        return node;
    }

    /// <summary>
    /// التحقق الصارم من سلامة البنية الهيكلية لجميع بنود القالب:
    /// - عدم وجود رموز مكررة
    /// - وجود كافة الحسابات الآباء
    /// - تناسق المستويات الشجرية (مستوى الابن = مستوى الأب + 1)
    /// - تطابق نوع الحساب مع نوع حسابه الأب
    /// </summary>
    public void ValidateIntegrity()
    {
        var duplicateCodes = Nodes.GroupBy(n => n.Code)
                                  .Where(g => g.Count() > 1)
                                  .Select(g => g.Key)
                                  .ToList();

        if (duplicateCodes.Any())
            throw new InvalidAccountHierarchyException($"القالب يحتوي على رموز حسابات مكررة: {string.Join(", ", duplicateCodes)}");

        var nodeLookup = Nodes.ToDictionary(n => n.Code);

        foreach (var node in Nodes)
        {
            if (!string.IsNullOrWhiteSpace(node.ParentNodeCode))
            {
                if (!nodeLookup.TryGetValue(node.ParentNodeCode, out var parentNode))
                {
                    throw new InvalidAccountHierarchyException($"الحساب '{node.Code}' مرتبط بحساب أب غير موجود بالرمز: '{node.ParentNodeCode}' في القالب '{Code}'.");
                }

                if (node.Level != parentNode.Level + 1)
                {
                    throw new InvalidAccountHierarchyException($"المستوى الهيكلي للحساب '{node.Code}' (المستوى {node.Level}) غير متطابق مع مستوى أبيه '{parentNode.Code}' (المستوى {parentNode.Level}). يجب أن يكون الأب بالمستوى المباشر السابق.");
                }

                if (node.AccountType != parentNode.AccountType)
                {
                    throw new InvalidAccountHierarchyException($"نوع الحساب '{node.Code}' ({node.AccountType}) مختلف عن نوع حسابه الأب '{parentNode.Code}' ({parentNode.AccountType}). في المحاسبة المالية، يجب أن يشترك الأبناء في نفس النوع الرئيسي للحساب الأب.");
                }
            }
            else
            {
                // الحسابات الجذرية يجب أن تكون في المستوى 1 دائماً
                if (node.Level != 1)
                {
                    throw new InvalidAccountHierarchyException($"الحساب الرئيسي الجذري '{node.Code}' يجب أن يكون في المستوى 1 بدلاً من {node.Level}.");
                }
            }
        }
    }
}
