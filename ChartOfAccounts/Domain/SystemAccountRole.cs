

namespace ChartOfAccounts;

/// <summary>
/// أدوار الحسابات النظامية الأساسية في نظام تخطيط الموارد (ERP).
/// تُستخدم هذه الأدوار لربط العمليات الآلية (فواتير المبيعات، المشتريات، المخازن، الرواتب، إقفال الفترات)
/// بالحسابات المالية الفعلية لشجرة الشركة دون الحاجة إلى ترميز الحسابات برمجياً بصورة ثابتة (Hardcoded).
/// </summary>
public enum SystemAccountRole
{
    /// <summary>
    /// صندوق النقدية الرئيسي الافتراضي (Cash On Hand)
    /// </summary>
    CashOnHand = 1,

    /// <summary>
    /// الحساب البنكي الافتراضي (Default Bank Account)
    /// </summary>
    BankDefault = 2,

    /// <summary>
    /// حساب العملاء / المدينون التجاريون (Accounts Receivable)
    /// </summary>
    AccountsReceivable = 3,

    /// <summary>
    /// حساب الموردين / الدائنون التجاريون (Accounts Payable)
    /// </summary>
    AccountsPayable = 4,

    /// <summary>
    /// حساب المخزون السلعي (Inventory)
    /// </summary>
    Inventory = 5,

    /// <summary>
    /// إيرادات المبيعات الرئيسية (Sales Revenue)
    /// </summary>
    SalesRevenue = 6,

    /// <summary>
    /// مردودات ومسموحات المبيعات (Sales Returns and Allowances)
    /// </summary>
    SalesReturns = 7,

    /// <summary>
    /// تكلفة البضاعة المباعة (Cost Of Goods Sold - COGS)
    /// </summary>
    CostOfGoodsSold = 8,

    /// <summary>
    /// الأرباح المبقاة / المدورة (Retained Earnings)
    /// </summary>
    RetainedEarnings = 9,

    /// <summary>
    /// أرباح وخسائر العام الحالي (Current Year Profit and Loss)
    /// </summary>
    CurrentYearProfitLoss = 10,

    /// <summary>
    /// حساب تسوية الأرصدة الافتتاحية (Opening Balance Equity)
    /// </summary>
    OpeningBalanceEquity = 11,

    /// <summary>
    /// ضريبة القيمة المضافة على المدخلات / المشتريات (VAT Input Tax)
    /// </summary>
    VatInputTax = 12,

    /// <summary>
    /// ضريبة القيمة المضافة على المخرجات / المبيعات (VAT Output Tax)
    /// </summary>
    VatOutputTax = 13,

    /// <summary>
    /// أرباح فروق أسعار صرف العملات الأجنبية (Foreign Exchange Gain)
    /// </summary>
    ForeignExchangeGain = 14,

    /// <summary>
    /// خسائر فروق أسعار صرف العملات الأجنبية (Foreign Exchange Loss)
    /// </summary>
    ForeignExchangeLoss = 15,

    /// <summary>
    /// المصروفات الإدارية والعمومية العامة (General & Administrative Expenses)
    /// </summary>
    GeneralAndAdminExpense = 16,

    /// <summary>
    /// مصروفات الرواتب والأجور (Salaries and Wages Expense)
    /// </summary>
    PayrollExpense = 17,

    /// <summary>
    /// مجمع إهلاك الأصول الثابتة (Accumulated Depreciation)
    /// </summary>
    AccumulatedDepreciation = 18,

    /// <summary>
    /// مصروف إهلاك الأصول الثابتة (Depreciation Expense)
    /// </summary>
    DepreciationExpense = 19,

    /// <summary>
    /// الإيرادات غير المكتسبة / المقبوضة مقدماً (Unearned Revenue)
    /// </summary>
    UnearnedRevenue = 20,

    /// <summary>
    /// المصروفات المدفوعة مقدماً (Prepaid Expenses)
    /// </summary>
    PrepaidExpenses = 21
}
