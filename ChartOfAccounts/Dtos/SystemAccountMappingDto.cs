

namespace ChartOfAccounts;

/// <summary>
/// بيانات ربط دور الحساب النظامي بحساب الشركة الفعلي.
/// </summary>
public class SystemAccountMappingDto
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public SystemAccountRole Role { get; set; }
    public string RoleName => Role.ToString();
    public Guid AccountId { get; set; }
    public string AccountCode { get; set; } = string.Empty;
    public string AccountNameArabic { get; set; } = string.Empty;
    public string AccountNameEnglish { get; set; } = string.Empty;
    public AccountType AccountType { get; set; }
    public bool IsLocked { get; set; }
    public DateTime AssignedAtUtc { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// طلب تعيين أو تعديل ربط دور نظامي بحساب معين للشركة.
/// </summary>
public class UpdateSystemAccountMappingRequest
{
    public SystemAccountRole Role { get; set; }
    public Guid AccountId { get; set; }
    public bool IsLocked { get; set; } = false;
    public bool ForceIfLocked { get; set; } = false;
    public string? Notes { get; set; }
}
