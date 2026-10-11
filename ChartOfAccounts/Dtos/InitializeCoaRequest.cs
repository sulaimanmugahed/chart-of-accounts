namespace ChartOfAccounts;


/// <summary>
/// طلب تهيئة شجرة الحسابات لشركة محددة باستخدام قالب معتمد.
/// </summary>
public class InitializeCoaRequest
{
    /// <summary>
    /// معرف الشركة المراد تهيئة دليل حساباتها
    /// </summary>
    public Guid CompanyId { get; set; }

    /// <summary>
    /// معرف القالب المحاسبي المراد تطبيقه
    /// </summary>
    public Guid TemplateId { get; set; }

    /// <summary>
    /// وضع التهيئة (صارم، دمج آمن متكرر، محاكاة جافة)
    /// </summary>
    public InitializationMode Mode { get; set; } = InitializationMode.Strict;

    /// <summary>
    /// هل يتم التعيين التلقائي للأدوار النظامية للحسابات المنشأة؟
    /// </summary>
    public bool AutoMapSystemRoles { get; set; } = true;

    /// <summary>
    /// بادئة اختيارية لإضافتها لرموز الحسابات (Prefix) إن وجدت
    /// </summary>
    public string? AccountCodePrefix { get; set; }
}
