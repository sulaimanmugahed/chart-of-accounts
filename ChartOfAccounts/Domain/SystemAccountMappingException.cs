

namespace ChartOfAccounts;

/// <summary>
/// استثناء يُطلق عند حدوث خطأ في ربط دور الحساب النظامي، مثل ربط دور بحساب غير قابل للترحيل
/// أو ربط دور بحساب من نوع غير متوافق (مثال: ربط دور الموردين بحساب إيرادات).
/// </summary>
public class SystemAccountMappingException : AccountingDomainException
{
    public SystemAccountRole Role { get; }

    public SystemAccountMappingException(SystemAccountRole role, string message)
        : base($"خطأ في تعيين دور الحساب النظامي '{role}': {message}", "SYSTEM_ACCOUNT_MAPPING_ERROR")
    {
        Role = role;
    }
}
