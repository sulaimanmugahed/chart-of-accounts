

namespace ChartOfAccounts;

/// <summary>
/// استثناء يُطلق عند وجود خلل في الهيكل الشجري للحسابات، مثل:
/// - الحساب الأب غير موجود
/// - الحساب الأب يتبع شركة أخرى (خرق العزل التعددي للشركات)
/// - اختلاف نوع الحساب بين الأب والابن
/// - الترحيل على حساب رئيسي أو وجود دورات حلقية (Circular Hierarchy)
/// </summary>
public class InvalidAccountHierarchyException : AccountingDomainException
{
    public InvalidAccountHierarchyException(string message)
        : base(message, "INVALID_ACCOUNT_HIERARCHY")
    {
    }
}
