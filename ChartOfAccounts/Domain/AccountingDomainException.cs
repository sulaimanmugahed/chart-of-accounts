

namespace ChartOfAccounts;

/// <summary>
/// الاستثناء الأساسي لأخطاء قواعد العمل المحاسبية ونطاق النظام.
/// </summary>
public class AccountingDomainException : Exception
{
    public string? ErrorCode { get; }

    public AccountingDomainException(string message, string? errorCode = null) : base(message)
    {
        ErrorCode = errorCode;
    }

    public AccountingDomainException(string message, Exception innerException, string? errorCode = null) : base(message, innerException)
    {
        ErrorCode = errorCode;
    }
}
