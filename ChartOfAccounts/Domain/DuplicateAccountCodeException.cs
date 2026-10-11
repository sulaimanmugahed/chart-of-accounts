

namespace ChartOfAccounts;

/// <summary>
/// استثناء يُطلق عند محاولة إنشاء حساب بنفس الرمز المحاسبي لشركة محددة.
/// </summary>
public class DuplicateAccountCodeException : AccountingDomainException
{
    public string AccountCode { get; }
    public Guid CompanyId { get; }

    public DuplicateAccountCodeException(Guid companyId, string accountCode)
        : base($"رمز الحساب المحاسبي '{accountCode}' مسجل ومستخدم مسبقاً في الشركة ({companyId}). يجب أن تكون رموز الحسابات فريدة لكل شركة.", "DUPLICATE_ACCOUNT_CODE")
    {
        CompanyId = companyId;
        AccountCode = accountCode;
    }
}
