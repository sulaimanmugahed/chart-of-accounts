

namespace ChartOfAccounts;

/// <summary>
/// استثناء يُطلق عند محاولة إعادة تهيئة دليل حسابات لشركة تم تهيئتها مسبقاً،
/// عندما يكون وضع التهيئة صارماً (Strict Mode) ولا يسمح بإعادة التطبيق التلقائي.
/// </summary>
public class CompanyAlreadyInitializedException : AccountingDomainException
{
    public Guid CompanyId { get; }

    public CompanyAlreadyInitializedException(Guid companyId)
        : base($"دليل حسابات الشركة ({companyId}) مهيأ مسبقاً بالفعل. لمنع تضارب البيانات، يرجى استخدام خيار الدمج الآمن (Reconciliation) بدلاً من إعادة الإنشاء الشامل.", "COMPANY_ALREADY_INITIALIZED")
    {
        CompanyId = companyId;
    }
}
