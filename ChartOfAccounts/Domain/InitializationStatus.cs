

namespace ChartOfAccounts;

/// <summary>
/// حالات عملية تهيئة دليل الحسابات للشركة.
/// </summary>
public enum InitializationStatus
{
    /// <summary>
    /// قيد المعالجة (In Progress)
    /// </summary>
    Pending = 1,

    /// <summary>
    /// تم إنشاء الشجرة بنجاح وربط الحسابات النظامية (Completed Successfully)
    /// </summary>
    Success = 2,

    /// <summary>
    /// فشلت العملية وتم التراجع عن كافة التغييرات برمجياً (Failed and Rolled Back)
    /// </summary>
    Failed = 3,

    /// <summary>
    /// تم مطابقة وإكمال الحسابات المفقودة بشكل تكراري آمن (Reconciled / Idempotent Run)
    /// </summary>
    Reconciled = 4
}
