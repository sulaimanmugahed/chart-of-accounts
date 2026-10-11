

namespace ChartOfAccounts;

/// <summary>
/// تصنيف الحساب في القوائم المالية الأساسية.
/// </summary>
public enum AccountClassification
{
    /// <summary>
    /// قائمة المركز المالي / الميزانية العمومية (Balance Sheet).
    /// تشمل: الأصول، الالتزامات، حقوق الملكية (حسابات مستمرة لا تقفل نهاية العام).
    /// </summary>
    BalanceSheet = 1,

    /// <summary>
    /// قائمة الدخل / الأرباح والخسائر (Income Statement).
    /// تشمل: الإيرادات، المصروفات (حسابات مؤقتة تقفل في حساب الأرباح المبقاة نهاية العام).
    /// </summary>
    IncomeStatement = 2
}
