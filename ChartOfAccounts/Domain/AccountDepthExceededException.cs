

namespace ChartOfAccounts;

/// <summary>
/// استثناء يُطلق عند محاولة إنشاء حساب أو تطبيق قالب يتجاوز أقصى عمق مسموح به لشجرة الحسابات في الشركة.
/// </summary>
public class AccountDepthExceededException : AccountingDomainException
{
    public int AttemptedLevel { get; }
    public int MaxAllowedDepth { get; }
    public Guid CompanyId { get; }

    public AccountDepthExceededException(Guid companyId, int attemptedLevel, int maxAllowedDepth)
        : base($"تجاوز عمق شجرة الحسابات المسموح به للشركة ({companyId}). المستوى المطلوب: {attemptedLevel}، في حين أن الحد الأقصى المعتمد للشركة هو {maxAllowedDepth}.", "ACCOUNT_DEPTH_EXCEEDED")
    {
        CompanyId = companyId;
        AttemptedLevel = attemptedLevel;
        MaxAllowedDepth = maxAllowedDepth;
    }
}
