

namespace ChartOfAccounts;

/// <summary>
/// سجل تدقيق لعمليات تهيئة دليل الحسابات للشركات.
/// يحتفظ بتاريخ كل محاولة تهيئة، القالب المستخدم، عدد الحسابات المنشأة، وحالة العملية لضمان الحوكمة وتتبع العمليات.
/// </summary>
public class CoaInitializationAuditLog
{
    public Guid Id { get; private set; }
    public Guid CompanyId { get; private set; }
    public Guid TemplateId { get; private set; }
    public InitializationStatus Status { get; private set; }
    public int AccountsCreatedCount { get; private set; }
    public int SystemRolesMappedCount { get; private set; }
    public long ExecutionDurationMs { get; private set; }
    public string? ErrorMessage { get; private set; }
    public DateTime TimestampUtc { get; private set; } = DateTime.UtcNow;
    public string? DetailsJson { get; private set; }

    public virtual Company Company { get; private set; } = null!;
    public virtual CoaTemplate Template { get; private set; } = null!;

    private CoaInitializationAuditLog() { }

    public CoaInitializationAuditLog(
        Guid companyId,
        Guid templateId,
        InitializationStatus status,
        int accountsCreatedCount,
        int systemRolesMappedCount,
        long executionDurationMs,
        string? errorMessage = null,
        string? detailsJson = null)
    {
        Id = Guid.NewGuid();
        CompanyId = companyId;
        TemplateId = templateId;
        Status = status;
        AccountsCreatedCount = accountsCreatedCount;
        SystemRolesMappedCount = systemRolesMappedCount;
        ExecutionDurationMs = executionDurationMs;
        ErrorMessage = errorMessage;
        DetailsJson = detailsJson;
        TimestampUtc = DateTime.UtcNow;
    }
}
