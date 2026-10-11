
namespace ChartOfAccounts;

/// <summary>
/// نتيجة تنفيذ عملية تهيئة دليل الحسابات للشركة.
/// </summary>
public class InitializeCoaResultDto
{
    public bool IsSuccess { get; set; }
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public InitializationStatus Status { get; set; }
    public int AccountsCreatedCount { get; set; }
    public int SystemRolesMappedCount { get; set; }
    public int MaxDepthEnforced { get; set; }
    public long DurationMs { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Warnings { get; set; } = new();
    public List<SystemAccountMappingDto> MappedRoles { get; set; } = new();
}

