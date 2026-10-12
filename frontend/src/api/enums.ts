/**
 * ثوابت وقوائم النطاق المحاسبي المطابقة للـ Backend (.NET).
 *
 * ملاحظة مهمة: يرسل الخادم قيم الـ enum كأرقام (System.Text.Json default)،
 * لذلك نقوم دائمًا بالإرسال كأرقام مع قراءة متسامحة تقبل الأرقام أو الأسماء النصية
 * حتى تعمل الواجهة مع أي إعداد تسلسل يستخدمه الخادم.
 */

/** ألوان الشارات المشتركة بين الواجهة والثوابت */
export type ColorTone =
  | 'slate'
  | 'sky'
  | 'rose'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'brand'
  | 'teal'

/* ------------------------------------------------------------------ */
/* AccountType - أنواع الحسابات الرئيسية                              */
/* ------------------------------------------------------------------ */
export const AccountType = {
  Asset: 1,
  Liability: 2,
  Equity: 3,
  Revenue: 4,
  Expense: 5,
} as const
export type AccountType = (typeof AccountType)[keyof typeof AccountType]

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  [AccountType.Asset]: 'أصول',
  [AccountType.Liability]: 'خصوم',
  [AccountType.Equity]: 'حقوق ملكية',
  [AccountType.Revenue]: 'إيرادات',
  [AccountType.Expense]: 'مصروفات',
}

export const ACCOUNT_TYPE_LABEL_EN: Record<AccountType, string> = {
  [AccountType.Asset]: 'Assets',
  [AccountType.Liability]: 'Liabilities',
  [AccountType.Equity]: 'Equity',
  [AccountType.Revenue]: 'Revenue',
  [AccountType.Expense]: 'Expenses',
}

/** أصناف الألوان المستخدمة في الشارات (Tailwind) */
export const ACCOUNT_TYPE_TONE: Record<AccountType, ColorTone> = {
  [AccountType.Asset]: 'sky',
  [AccountType.Liability]: 'rose',
  [AccountType.Equity]: 'violet',
  [AccountType.Revenue]: 'emerald',
  [AccountType.Expense]: 'amber',
}

export const ACCOUNT_TYPE_OPTIONS: Array<{ value: AccountType; label: string }> = [
  { value: AccountType.Asset, label: ACCOUNT_TYPE_LABEL[AccountType.Asset] },
  { value: AccountType.Liability, label: ACCOUNT_TYPE_LABEL[AccountType.Liability] },
  { value: AccountType.Equity, label: ACCOUNT_TYPE_LABEL[AccountType.Equity] },
  { value: AccountType.Revenue, label: ACCOUNT_TYPE_LABEL[AccountType.Revenue] },
  { value: AccountType.Expense, label: ACCOUNT_TYPE_LABEL[AccountType.Expense] },
]

/* ------------------------------------------------------------------ */
/* NormalBalance - طبيعة الرصيد                                       */
/* ------------------------------------------------------------------ */
export const NormalBalance = {
  Debit: 1,
  Credit: 2,
} as const
export type NormalBalance = (typeof NormalBalance)[keyof typeof NormalBalance]

export const NORMAL_BALANCE_LABEL: Record<NormalBalance, string> = {
  [NormalBalance.Debit]: 'مدين',
  [NormalBalance.Credit]: 'دائن',
}

export const NORMAL_BALANCE_OPTIONS = [
  { value: NormalBalance.Debit, label: NORMAL_BALANCE_LABEL[NormalBalance.Debit] },
  { value: NormalBalance.Credit, label: NORMAL_BALANCE_LABEL[NormalBalance.Credit] },
]

/* ------------------------------------------------------------------ */
/* AccountClassification - التصنيف المالي                             */
/* ------------------------------------------------------------------ */
export const AccountClassification = {
  BalanceSheet: 1,
  IncomeStatement: 2,
} as const
export type AccountClassification =
  (typeof AccountClassification)[keyof typeof AccountClassification]

export const ACCOUNT_CLASSIFICATION_LABEL: Record<AccountClassification, string> = {
  [AccountClassification.BalanceSheet]: 'قائمة المركز المالي',
  [AccountClassification.IncomeStatement]: 'قائمة الدخل',
}

export const ACCOUNT_CLASSIFICATION_OPTIONS = [
  {
    value: AccountClassification.BalanceSheet,
    label: ACCOUNT_CLASSIFICATION_LABEL[AccountClassification.BalanceSheet],
  },
  {
    value: AccountClassification.IncomeStatement,
    label: ACCOUNT_CLASSIFICATION_LABEL[AccountClassification.IncomeStatement],
  },
]

/* ------------------------------------------------------------------ */
/* SystemAccountRole - أدوار الحسابات النظامية                        */
/* ------------------------------------------------------------------ */
export const SystemAccountRole = {
  CashOnHand: 1,
  BankDefault: 2,
  AccountsReceivable: 3,
  AccountsPayable: 4,
  Inventory: 5,
  SalesRevenue: 6,
  SalesReturns: 7,
  CostOfGoodsSold: 8,
  RetainedEarnings: 9,
  CurrentYearProfitLoss: 10,
  OpeningBalanceEquity: 11,
  VatInputTax: 12,
  VatOutputTax: 13,
  ForeignExchangeGain: 14,
  ForeignExchangeLoss: 15,
  GeneralAndAdminExpense: 16,
  PayrollExpense: 17,
  AccumulatedDepreciation: 18,
  DepreciationExpense: 19,
  UnearnedRevenue: 20,
  PrepaidExpenses: 21,
} as const
export type SystemAccountRole = (typeof SystemAccountRole)[keyof typeof SystemAccountRole]

export const SYSTEM_ROLE_LABEL: Record<SystemAccountRole, string> = {
  [SystemAccountRole.CashOnHand]: 'الصندوق (النقدية بالصندوق)',
  [SystemAccountRole.BankDefault]: 'الحساب البنكي الافتراضي',
  [SystemAccountRole.AccountsReceivable]: 'العملاء / المدينون التجاريون',
  [SystemAccountRole.AccountsPayable]: 'الموردون / الدائنون التجاريون',
  [SystemAccountRole.Inventory]: 'المخزون السلعي',
  [SystemAccountRole.SalesRevenue]: 'إيرادات المبيعات',
  [SystemAccountRole.SalesReturns]: 'مردودات ومسموحات المبيعات',
  [SystemAccountRole.CostOfGoodsSold]: 'تكلفة البضاعة المباعة',
  [SystemAccountRole.RetainedEarnings]: 'الأرباح المبقاة',
  [SystemAccountRole.CurrentYearProfitLoss]: 'أرباح وخسائر العام الحالي',
  [SystemAccountRole.OpeningBalanceEquity]: 'تسوية الأرصدة الافتتاحية',
  [SystemAccountRole.VatInputTax]: 'ضريبة القيمة المضافة (مدخلات)',
  [SystemAccountRole.VatOutputTax]: 'ضريبة القيمة المضافة (مخرجات)',
  [SystemAccountRole.ForeignExchangeGain]: 'أرباح فروق أسعار الصرف',
  [SystemAccountRole.ForeignExchangeLoss]: 'خسائر فروق أسعار الصرف',
  [SystemAccountRole.GeneralAndAdminExpense]: 'المصروفات العمومية والإدارية',
  [SystemAccountRole.PayrollExpense]: 'مصروف الرواتب والأجور',
  [SystemAccountRole.AccumulatedDepreciation]: 'مجمع إهلاك الأصول الثابتة',
  [SystemAccountRole.DepreciationExpense]: 'مصروف إهلاك الأصول الثابتة',
  [SystemAccountRole.UnearnedRevenue]: 'الإيرادات غير المكتسبة',
  [SystemAccountRole.PrepaidExpenses]: 'المصروفات المدفوعة مقدماً',
}

export const SYSTEM_ROLE_KEY: Record<SystemAccountRole, keyof typeof SystemAccountRole> = {
  [SystemAccountRole.CashOnHand]: 'CashOnHand',
  [SystemAccountRole.BankDefault]: 'BankDefault',
  [SystemAccountRole.AccountsReceivable]: 'AccountsReceivable',
  [SystemAccountRole.AccountsPayable]: 'AccountsPayable',
  [SystemAccountRole.Inventory]: 'Inventory',
  [SystemAccountRole.SalesRevenue]: 'SalesRevenue',
  [SystemAccountRole.SalesReturns]: 'SalesReturns',
  [SystemAccountRole.CostOfGoodsSold]: 'CostOfGoodsSold',
  [SystemAccountRole.RetainedEarnings]: 'RetainedEarnings',
  [SystemAccountRole.CurrentYearProfitLoss]: 'CurrentYearProfitLoss',
  [SystemAccountRole.OpeningBalanceEquity]: 'OpeningBalanceEquity',
  [SystemAccountRole.VatInputTax]: 'VatInputTax',
  [SystemAccountRole.VatOutputTax]: 'VatOutputTax',
  [SystemAccountRole.ForeignExchangeGain]: 'ForeignExchangeGain',
  [SystemAccountRole.ForeignExchangeLoss]: 'ForeignExchangeLoss',
  [SystemAccountRole.GeneralAndAdminExpense]: 'GeneralAndAdminExpense',
  [SystemAccountRole.PayrollExpense]: 'PayrollExpense',
  [SystemAccountRole.AccumulatedDepreciation]: 'AccumulatedDepreciation',
  [SystemAccountRole.DepreciationExpense]: 'DepreciationExpense',
  [SystemAccountRole.UnearnedRevenue]: 'UnearnedRevenue',
  [SystemAccountRole.PrepaidExpenses]: 'PrepaidExpenses',
}

/**
 * النوع المحاسبي المتوقع لكل دور نظامي — مطابق للقاعدة
 * CompanySystemAccount.GetExpectedAccountType في الخادم.
 */
export const SYSTEM_ROLE_EXPECTED_TYPE: Record<SystemAccountRole, AccountType> = {
  [SystemAccountRole.CashOnHand]: AccountType.Asset,
  [SystemAccountRole.BankDefault]: AccountType.Asset,
  [SystemAccountRole.AccountsReceivable]: AccountType.Asset,
  [SystemAccountRole.AccountsPayable]: AccountType.Liability,
  [SystemAccountRole.Inventory]: AccountType.Asset,
  [SystemAccountRole.SalesRevenue]: AccountType.Revenue,
  [SystemAccountRole.SalesReturns]: AccountType.Revenue,
  [SystemAccountRole.CostOfGoodsSold]: AccountType.Expense,
  [SystemAccountRole.RetainedEarnings]: AccountType.Equity,
  [SystemAccountRole.CurrentYearProfitLoss]: AccountType.Equity,
  [SystemAccountRole.OpeningBalanceEquity]: AccountType.Equity,
  [SystemAccountRole.VatInputTax]: AccountType.Asset,
  [SystemAccountRole.VatOutputTax]: AccountType.Liability,
  [SystemAccountRole.ForeignExchangeGain]: AccountType.Revenue,
  [SystemAccountRole.ForeignExchangeLoss]: AccountType.Expense,
  [SystemAccountRole.GeneralAndAdminExpense]: AccountType.Expense,
  [SystemAccountRole.PayrollExpense]: AccountType.Expense,
  [SystemAccountRole.AccumulatedDepreciation]: AccountType.Asset,
  [SystemAccountRole.DepreciationExpense]: AccountType.Expense,
  [SystemAccountRole.UnearnedRevenue]: AccountType.Liability,
  [SystemAccountRole.PrepaidExpenses]: AccountType.Asset,
}

/** الأدوار الحرجة التي لا يعمل النظام بدون تعيينها (مطابق للخادم) */
export const CRITICAL_SYSTEM_ROLES: SystemAccountRole[] = [
  SystemAccountRole.CashOnHand,
  SystemAccountRole.AccountsReceivable,
  SystemAccountRole.AccountsPayable,
  SystemAccountRole.SalesRevenue,
  SystemAccountRole.CostOfGoodsSold,
  SystemAccountRole.RetainedEarnings,
]

export const SYSTEM_ROLE_OPTIONS: Array<{ value: SystemAccountRole; label: string; hint: string }> = (
  [
    SystemAccountRole.CashOnHand,
    SystemAccountRole.BankDefault,
    SystemAccountRole.AccountsReceivable,
    SystemAccountRole.AccountsPayable,
    SystemAccountRole.Inventory,
    SystemAccountRole.SalesRevenue,
    SystemAccountRole.SalesReturns,
    SystemAccountRole.CostOfGoodsSold,
    SystemAccountRole.RetainedEarnings,
    SystemAccountRole.CurrentYearProfitLoss,
    SystemAccountRole.OpeningBalanceEquity,
    SystemAccountRole.VatInputTax,
    SystemAccountRole.VatOutputTax,
    SystemAccountRole.ForeignExchangeGain,
    SystemAccountRole.ForeignExchangeLoss,
    SystemAccountRole.GeneralAndAdminExpense,
    SystemAccountRole.PayrollExpense,
    SystemAccountRole.AccumulatedDepreciation,
    SystemAccountRole.DepreciationExpense,
    SystemAccountRole.UnearnedRevenue,
    SystemAccountRole.PrepaidExpenses,
  ] as SystemAccountRole[]
).map((value) => ({
  value,
  label: SYSTEM_ROLE_LABEL[value],
  hint: ACCOUNT_TYPE_LABEL[SYSTEM_ROLE_EXPECTED_TYPE[value]],
}))

/* ------------------------------------------------------------------ */
/* InitializationMode / InitializationStatus                          */
/* ------------------------------------------------------------------ */
export const InitializationMode = {
  Strict: 1,
  IdempotentMerge: 2,
  DryRun: 3,
} as const
export type InitializationMode = (typeof InitializationMode)[keyof typeof InitializationMode]

export const INITIALIZATION_MODE_LABEL: Record<InitializationMode, string> = {
  [InitializationMode.Strict]: 'صارم (Strict)',
  [InitializationMode.IdempotentMerge]: 'دمج آمن متكرر (Idempotent Merge)',
  [InitializationMode.DryRun]: 'محاكاة جافة (Dry Run)',
}

export const INITIALIZATION_MODE_DESCRIPTION: Record<InitializationMode, string> = {
  [InitializationMode.Strict]:
    'يفشل التنفيذ فورًا إذا كانت الشركة تحتوي على أي حسابات، ويضمن عدم المساس ببيانات قائمة.',
  [InitializationMode.IdempotentMerge]:
    'يضيف الحسابات المفقودة من القالب فقط ويربط الأدوار غير المعينة دون تعديل الحسابات الحالية.',
  [InitializationMode.DryRun]:
    'يحاكي العملية ويظهر عدد الحسابات والأدوار التي ستُنشأ دون حفظ أي تغييرات في قاعدة البيانات.',
}

export const INITIALIZATION_MODE_OPTIONS = [
  { value: InitializationMode.Strict, label: INITIALIZATION_MODE_LABEL[InitializationMode.Strict] },
  {
    value: InitializationMode.IdempotentMerge,
    label: INITIALIZATION_MODE_LABEL[InitializationMode.IdempotentMerge],
  },
  { value: InitializationMode.DryRun, label: INITIALIZATION_MODE_LABEL[InitializationMode.DryRun] },
]

export const InitializationStatus = {
  Pending: 1,
  Success: 2,
  Failed: 3,
  Reconciled: 4,
} as const
export type InitializationStatus = (typeof InitializationStatus)[keyof typeof InitializationStatus]

export const INITIALIZATION_STATUS_LABEL: Record<InitializationStatus, string> = {
  [InitializationStatus.Pending]: 'قيد المعالجة',
  [InitializationStatus.Success]: 'ناجحة',
  [InitializationStatus.Failed]: 'فاشلة',
  [InitializationStatus.Reconciled]: 'مطابقة تكرارية',
}

export const INITIALIZATION_STATUS_TONE: Record<InitializationStatus, ColorTone> = {
  [InitializationStatus.Pending]: 'amber',
  [InitializationStatus.Success]: 'emerald',
  [InitializationStatus.Failed]: 'rose',
  [InitializationStatus.Reconciled]: 'sky',
}

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                       */
/* ------------------------------------------------------------------ */

type EnumMap = Record<string, number>

/**
 * قراءة متسامحة لقيمة enum قادمة من الخادم: تقبل الرقم أو الاسم النصي
 * (مثل "CashOnHand") أو قيمة فارغة، وتُرجع دائمًا القيمة الرقمية.
 */
export function readEnum<T extends number>(
  map: EnumMap,
  raw: unknown,
  fallback: T,
): T {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw as T
  if (typeof raw === 'string') {
    const asNumber = Number(raw)
    if (raw.trim() !== '' && Number.isFinite(asNumber) && map[String(asNumber)] !== undefined) {
      return asNumber as T
    }
    const key = Object.keys(map).find(
      (k) => k.toLowerCase() === raw.trim().toLowerCase(),
    )
    if (key) return map[key] as T
  }
  return fallback
}

/** قراءة enum اختياري (قد يكون null) */
export function readOptionalEnum<T extends number>(
  map: EnumMap,
  raw: unknown,
): T | null {
  if (raw === null || raw === undefined || raw === '') return null
  const value = readEnum(map, raw, 0 as T)
  return value === 0 ? null : value
}

/** اسم مستوى العمق بالعربية: 1 => المستوى الأول */
export function levelLabel(level: number): string {
  const names = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن']
  return `المستوى ${names[level - 1] ?? level}`
}

/** طبيعة الرصيد الافتراضية حسب نوع الحساب (مطابق للخادم) */
export function defaultNormalBalance(type: AccountType): NormalBalance {
  return type === AccountType.Asset || type === AccountType.Expense
    ? NormalBalance.Debit
    : NormalBalance.Credit
}

/** التصنيف المالي الافتراضي حسب نوع الحساب (مطابق للخادم) */
export function defaultClassification(type: AccountType): AccountClassification {
  return type === AccountType.Revenue || type === AccountType.Expense
    ? AccountClassification.IncomeStatement
    : AccountClassification.BalanceSheet
}
