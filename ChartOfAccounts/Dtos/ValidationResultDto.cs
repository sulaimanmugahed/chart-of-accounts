namespace ChartOfAccounts;

/// <summary>
/// نتيجة فحص المتطلبات المسبقة لتهيئة دليل الحسابات.
/// </summary>
public class ValidationResultDto
{
    public bool CanInitialize { get; set; }
    public bool IsCompanyAlreadyInitialized { get; set; }
    public int ExistingAccountsCount { get; set; }
    public int CompanyMaxDepth { get; set; }
    public int TemplateMaxDepth { get; set; }
    public bool DepthCompatible { get; set; }
    public List<string> ValidationErrors { get; set; } = new();
    public List<string> ValidationWarnings { get; set; } = new();
}
