/**
 * بيانات البذر (Seed) لواجهة المحاكاة الداخلية.
 * تحاكي بنية القوالب الثلاثة المعيارية في الـ Backend (الرموز والمعرفات مطابقة
 * لـ CoaTemplateSeedData في المشروع الأصلي) بالإضافة إلى ثلاث شركات تجريبية.
 */
import {
  AccountType,
  SystemAccountRole,
  defaultClassification,
  defaultNormalBalance,
} from '../src/api/enums.ts'
import type { MockDb, TemplateNodeRow, TemplateRow } from './types.ts'

/* معرفات ثابتة مطابقة لبذور الـ Backend */
export const COMMERCIAL_TEMPLATE_ID = '11111111-1111-1111-1111-111111111111'
export const SERVICES_TEMPLATE_ID = '22222222-2222-2222-2222-222222222222'
export const SME_TEMPLATE_ID = '33333333-3333-3333-3333-333333333333'

interface NodeSpec {
  code: string
  ar: string
  en: string
  type: AccountType
  level: number
  parent: string | null
  isHeader: boolean
  isPostable: boolean
  role?: SystemAccountRole
  description?: string
}

/** مُنشئ بند مختصر: (الرمز، الاسم العربي، الاسم الإنجليزي، النوع، المستوى، الأب، تجميعي؟، قابل للترحيل؟، الدور) */
function n(
  code: string,
  ar: string,
  en: string,
  type: AccountType,
  level: number,
  parent: string | null,
  isHeader: boolean,
  isPostable: boolean,
  role?: SystemAccountRole,
  description?: string,
): NodeSpec {
  return { code, ar, en, type, level, parent, isHeader, isPostable, role, description }
}

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-0000-4000-8000-${String(idCounter).padStart(12, '0')}`
}

function buildTemplate(
  meta: {
    id: string
    code: string
    nameArabic: string
    nameEnglish: string
    industryType: string
    recommendedMaxDepth: number
    description: string
  },
  specs: NodeSpec[],
): TemplateRow {
  const nodes: TemplateNodeRow[] = specs.map((spec) => ({
    id: nextId('aaaa'),
    code: spec.code,
    nameArabic: spec.ar,
    nameEnglish: spec.en,
    accountType: spec.type,
    normalBalance: defaultNormalBalance(spec.type),
    classification: defaultClassification(spec.type),
    level: spec.level,
    parentNodeCode: spec.parent,
    isHeader: spec.isHeader,
    isPostable: spec.isPostable,
    defaultSystemRole: spec.role ?? null,
    description: spec.description ?? null,
  }))

  return {
    id: meta.id,
    code: meta.code,
    nameArabic: meta.nameArabic,
    nameEnglish: meta.nameEnglish,
    industryType: meta.industryType,
    recommendedMaxDepth: meta.recommendedMaxDepth,
    description: meta.description,
    isActive: true,
    isSystemTemplate: true,
    version: 1,
    createdAtUtc: '2026-01-05T08:00:00Z',
    nodes,
  }
}

/* ------------------------------------------------------------------ */
/* 1) دليل الحسابات المعياري للشركات التجارية (5 مستويات)             */
/* ------------------------------------------------------------------ */
function createCommercialTemplate(): TemplateRow {
  return buildTemplate(
    {
      id: COMMERCIAL_TEMPLATE_ID,
      code: 'COMMERCIAL_IFRS',
      nameArabic: 'دليل الحسابات المعياري للشركات التجارية (متوافق مع معايير IFRS)',
      nameEnglish: 'Standard Commercial Chart of Accounts (IFRS Compliant)',
      industryType: 'Commercial',
      recommendedMaxDepth: 5,
      description:
        'قالب محاسبي متكامل للشركات التجارية، يدعم إدارة المخزون، ضريبة القيمة المضافة، العملاء والموردين، وإقفال الحسابات التلقائي.',
    },
    [
      // ============ الأصول ============
      n('1', 'الأصول', 'Assets', AccountType.Asset, 1, null, true, false),
      n('11', 'الأصول المتداولة', 'Current Assets', AccountType.Asset, 2, '1', true, false),
      n('1101', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', AccountType.Asset, 3, '11', true, false),
      n('110101', 'صندوق النقدية الرئيسي', 'Main Cash on Hand', AccountType.Asset, 4, '1101', false, true, SystemAccountRole.CashOnHand),
      n('110102', 'الحساب البنكي الجاري الرئيسي', 'Operating Bank Account', AccountType.Asset, 4, '1101', false, true, SystemAccountRole.BankDefault),
      n('1102', 'العملاء والذمم المدينة', 'Accounts Receivable and Debtors', AccountType.Asset, 3, '11', true, false),
      n('110201', 'حساب العملاء التجاريين', 'Trade Accounts Receivable', AccountType.Asset, 4, '1102', false, true, SystemAccountRole.AccountsReceivable),
      n('110202', 'شيكات برسم التحصيل', 'Cheques under Collection', AccountType.Asset, 4, '1102', false, true),
      n('1103', 'المخزون السلعي', 'Merchandise Inventory', AccountType.Asset, 3, '11', true, false),
      n('110301', 'مخزون بضائع جاهزة للبيع', 'Finished Goods Inventory', AccountType.Asset, 4, '1103', false, true, SystemAccountRole.Inventory),
      n('110302', 'مخزون بضاعة بالطريق', 'Goods in Transit', AccountType.Asset, 4, '1103', false, true),
      n('1104', 'مصروفات مدفوعة مقدماً وأرصدة مدينة أخرى', 'Prepaid Expenses and Other Receivables', AccountType.Asset, 3, '11', true, false),
      n('110401', 'المصروفات المدفوعة مقدماً', 'Prepaid Expenses', AccountType.Asset, 4, '1104', false, true, SystemAccountRole.PrepaidExpenses),
      n('110402', 'ضريبة القيمة المضافة على المدخلات (قابلة للاسترداد)', 'VAT Input Tax Receivable', AccountType.Asset, 4, '1104', false, true, SystemAccountRole.VatInputTax),
      n('12', 'الأصول غير المتداولة', 'Non-Current Assets', AccountType.Asset, 2, '1', true, false),
      n('1201', 'الأصول الثابتة', 'Property, Plant and Equipment', AccountType.Asset, 3, '12', true, false),
      n('120101', 'الأراضي', 'Land', AccountType.Asset, 4, '1201', false, true),
      n('120102', 'المباني والتحسينات', 'Buildings and Improvements', AccountType.Asset, 4, '1201', false, true),
      n('120103', 'أجهزة الحاسب والبرمجيات', 'Computers and Software', AccountType.Asset, 4, '1201', false, true),
      n('120104', 'مجمع إهلاك الأصول الثابتة', 'Accumulated Depreciation', AccountType.Asset, 4, '1201', false, true, SystemAccountRole.AccumulatedDepreciation),
      n('1202', 'الأصول غير الملموسة', 'Intangible Assets', AccountType.Asset, 3, '12', true, false),
      n('120201', 'العلامات التجارية والشهرة', 'Trademarks and Goodwill', AccountType.Asset, 4, '1202', false, true),

      // ============ الخصوم ============
      n('2', 'الخصوم', 'Liabilities', AccountType.Liability, 1, null, true, false),
      n('21', 'الالتزامات المتداولة', 'Current Liabilities', AccountType.Liability, 2, '2', true, false),
      n('2101', 'الموردون والذمم الدائنة', 'Accounts Payable and Creditors', AccountType.Liability, 3, '21', true, false),
      n('210101', 'حساب الموردين التجاريين', 'Trade Accounts Payable', AccountType.Liability, 4, '2101', false, true, SystemAccountRole.AccountsPayable),
      n('210102', 'مصروفات مستحقة الدفع', 'Accrued Expenses', AccountType.Liability, 4, '2101', false, true),
      n('2102', 'ضريبة القيمة المضافة المستحقة', 'VAT Payable', AccountType.Liability, 3, '21', true, false),
      n('210201', 'ضريبة القيمة المضافة على المخرجات', 'VAT Output Tax Payable', AccountType.Liability, 4, '2102', false, true, SystemAccountRole.VatOutputTax),
      n('2103', 'الإيرادات غير المكتسبة', 'Unearned Revenue', AccountType.Liability, 3, '21', true, false),
      n('210301', 'دفعات مقدمة من العملاء', 'Advance Payments from Customers', AccountType.Liability, 4, '2103', false, true, SystemAccountRole.UnearnedRevenue),
      n('2104', 'قروض وتسهيلات قصيرة الأجل', 'Short-term Loans and Facilities', AccountType.Liability, 3, '21', true, false),
      n('210401', 'قروض بنكية قصيرة الأجل', 'Short-term Bank Loans', AccountType.Liability, 4, '2104', false, true),
      n('22', 'الالتزامات غير المتداولة', 'Non-Current Liabilities', AccountType.Liability, 2, '2', true, false),
      n('2201', 'قروض طويلة الأجل', 'Long-term Loans', AccountType.Liability, 3, '22', true, false),
      n('220101', 'قروض بنكية طويلة الأجل', 'Long-term Bank Loans', AccountType.Liability, 4, '2201', false, true),
      n('2202', 'المخصصات طويلة الأجل', 'Long-term Provisions', AccountType.Liability, 3, '22', true, false),
      n('220201', 'مخصص مكافأة نهاية الخدمة', 'End of Service Benefits Provision', AccountType.Liability, 4, '2202', false, true),

      // ============ حقوق الملكية ============
      n('3', 'حقوق الملكية', 'Equity', AccountType.Equity, 1, null, true, false),
      n('31', 'رأس المال والاحتياطيات', 'Capital and Reserves', AccountType.Equity, 2, '3', true, false),
      n('3101', 'رأس المال', 'Capital', AccountType.Equity, 3, '31', true, false),
      n('310101', 'رأس المال المدفوع', 'Paid-in Capital', AccountType.Equity, 4, '3101', false, true),
      n('310102', 'الاحتياطي النظامي', 'Statutory Reserve', AccountType.Equity, 4, '3101', false, true),
      n('32', 'الأرباح المبقاة والأرصدة الافتتاحية', 'Retained Earnings and Opening Balances', AccountType.Equity, 2, '3', true, false),
      n('320101', 'الأرباح المبقاة (المدورة)', 'Retained Earnings (Accumulated)', AccountType.Equity, 3, '32', false, true, SystemAccountRole.RetainedEarnings),
      n('320102', 'أرباح وخسائر العام الحالي', 'Current Year Profit and Loss', AccountType.Equity, 3, '32', false, true, SystemAccountRole.CurrentYearProfitLoss),
      n('320103', 'حساب تسوية الأرصدة الافتتاحية', 'Opening Balance Equity', AccountType.Equity, 3, '32', false, true, SystemAccountRole.OpeningBalanceEquity),

      // ============ الإيرادات ============
      n('4', 'الإيرادات', 'Revenue', AccountType.Revenue, 1, null, true, false),
      n('41', 'إيرادات النشاط الرئيسي', 'Operating Revenue', AccountType.Revenue, 2, '4', true, false),
      n('4101', 'إيرادات المبيعات', 'Sales Revenue', AccountType.Revenue, 3, '41', true, false),
      n('410101', 'إيرادات المبيعات المحلية', 'Local Sales Revenue', AccountType.Revenue, 4, '4101', false, true, SystemAccountRole.SalesRevenue),
      n('410102', 'إيرادات المبيعات للتصدير', 'Export Sales Revenue', AccountType.Revenue, 4, '4101', false, true),
      n('410103', 'مردودات ومسموحات المبيعات', 'Sales Returns and Allowances', AccountType.Revenue, 4, '4101', false, true, SystemAccountRole.SalesReturns),
      n('4102', 'إيرادات أخرى', 'Other Revenue', AccountType.Revenue, 3, '41', true, false),
      n('410201', 'أرباح فروق أسعار الصرف', 'Foreign Exchange Gain', AccountType.Revenue, 4, '4102', false, true, SystemAccountRole.ForeignExchangeGain),
      n('410202', 'إيرادات متنوعة أخرى', 'Other Miscellaneous Revenue', AccountType.Revenue, 4, '4102', false, true),

      // ============ المصروفات ============
      n('5', 'المصروفات', 'Expenses', AccountType.Expense, 1, null, true, false),
      n('51', 'تكلفة النشاط', 'Cost of Revenue', AccountType.Expense, 2, '5', true, false),
      n('5101', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', AccountType.Expense, 3, '51', true, false),
      n('510101', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', AccountType.Expense, 4, '5101', false, true, SystemAccountRole.CostOfGoodsSold),
      n('510102', 'مشتريات البضاعة', 'Merchandise Purchases', AccountType.Expense, 4, '5101', false, true),
      n('52', 'المصروفات التشغيلية', 'Operating Expenses', AccountType.Expense, 2, '5', true, false),
      n('5201', 'الرواتب والمنافع', 'Staff Costs and Benefits', AccountType.Expense, 3, '52', true, false),
      n('520101', 'مصروف الرواتب والأجور', 'Salaries and Wages Expense', AccountType.Expense, 4, '5201', false, true, SystemAccountRole.PayrollExpense),
      n('520102', 'مصروف التأمينات الاجتماعية', 'Social Insurance Expense', AccountType.Expense, 4, '5201', false, true),
      n('520103', 'مصروف مكافأة نهاية الخدمة', 'End of Service Benefits Expense', AccountType.Expense, 4, '5201', false, true),
      n('5202', 'مصروفات عمومية وإدارية', 'General and Administrative Expenses', AccountType.Expense, 3, '52', true, false),
      n('520201', 'مصروف الإيجارات', 'Rent Expense', AccountType.Expense, 4, '5202', false, true),
      n('520202', 'مصروف الكهرباء والمياه والاتصالات', 'Utilities Expense', AccountType.Expense, 4, '5202', false, true),
      n('520203', 'مصروفات عمومية وإدارية أخرى', 'Other G&A Expenses', AccountType.Expense, 4, '5202', false, true, SystemAccountRole.GeneralAndAdminExpense),
      n('5203', 'مصروفات التسويق والبيع', 'Marketing and Selling Expenses', AccountType.Expense, 3, '52', true, false),
      n('520301', 'التسويق والعلامة التجارية', 'Marketing and Branding', AccountType.Expense, 4, '5203', true, false),
      n('52030101', 'مصروفات الإعلانات الرقمية', 'Digital Advertising Expense', AccountType.Expense, 5, '520301', false, true),
      n('52030102', 'مصروفات الحملات الترويجية', 'Promotional Campaigns Expense', AccountType.Expense, 5, '520301', false, true),
      n('5204', 'الإهلاك والاستهلاك', 'Depreciation and Amortization', AccountType.Expense, 3, '52', true, false),
      n('520401', 'مصروف إهلاك الأصول الثابتة', 'Depreciation Expense', AccountType.Expense, 4, '5204', false, true, SystemAccountRole.DepreciationExpense),
      n('5205', 'المصروفات المالية', 'Finance Costs', AccountType.Expense, 3, '52', true, false),
      n('520501', 'خسائر فروق أسعار الصرف', 'Foreign Exchange Loss', AccountType.Expense, 4, '5205', false, true, SystemAccountRole.ForeignExchangeLoss),
      n('520502', 'عمولات ومصاريف بنكية', 'Bank Charges and Commissions', AccountType.Expense, 4, '5205', false, true),
    ],
  )
}

/* ------------------------------------------------------------------ */
/* 2) دليل الحسابات لشركات الخدمات والاستشارات (4 مستويات)            */
/* ------------------------------------------------------------------ */
function createServicesTemplate(): TemplateRow {
  return buildTemplate(
    {
      id: SERVICES_TEMPLATE_ID,
      code: 'SERVICES_PROFESSIONAL',
      nameArabic: 'دليل الحسابات المعياري لشركات الخدمات والاستشارات',
      nameEnglish: 'Professional Services Chart of Accounts',
      industryType: 'Services',
      recommendedMaxDepth: 4,
      description:
        'قالب مخصص لشركات الخدمات المهنية والاستشارات مع حسابات الإيرادات غير المفوترة، عقود الصيانة، والتكاليف المباشرة.',
    },
    [
      n('1', 'الأصول', 'Assets', AccountType.Asset, 1, null, true, false),
      n('11', 'الأصول المتداولة', 'Current Assets', AccountType.Asset, 2, '1', true, false),
      n('1101', 'النقدية وما في حكمها', 'Cash and Cash Equivalents', AccountType.Asset, 3, '11', true, false),
      n('110101', 'صندوق النقدية', 'Cash on Hand', AccountType.Asset, 4, '1101', false, true, SystemAccountRole.CashOnHand),
      n('110102', 'الحساب البنكي الجاري', 'Operating Bank Account', AccountType.Asset, 4, '1101', false, true, SystemAccountRole.BankDefault),
      n('1102', 'العملاء والذمم المدينة', 'Accounts Receivable', AccountType.Asset, 3, '11', true, false),
      n('110201', 'حساب العملاء', 'Trade Accounts Receivable', AccountType.Asset, 4, '1102', false, true, SystemAccountRole.AccountsReceivable),
      n('110202', 'إيرادات مستحقة غير مفوترة', 'Accrued Unbilled Revenue', AccountType.Asset, 4, '1102', false, true),
      n('1103', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', AccountType.Asset, 3, '11', true, false),
      n('110301', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', AccountType.Asset, 4, '1103', false, true, SystemAccountRole.PrepaidExpenses),
      n('110302', 'ضريبة المدخلات القابلة للاسترداد', 'VAT Input Tax Receivable', AccountType.Asset, 4, '1103', false, true, SystemAccountRole.VatInputTax),
      n('12', 'الأصول غير المتداولة', 'Non-Current Assets', AccountType.Asset, 2, '1', true, false),
      n('1201', 'الأصول الثابتة', 'Property, Plant and Equipment', AccountType.Asset, 3, '12', true, false),
      n('120101', 'أجهزة الحاسب والمعدات', 'Computers and Equipment', AccountType.Asset, 4, '1201', false, true),
      n('120102', 'أثاث وتجهيزات المكاتب', 'Office Furniture and Fixtures', AccountType.Asset, 4, '1201', false, true),
      n('120103', 'مجمع الإهلاك', 'Accumulated Depreciation', AccountType.Asset, 4, '1201', false, true, SystemAccountRole.AccumulatedDepreciation),
      n('1202', 'الأصول غير الملموسة', 'Intangible Assets', AccountType.Asset, 3, '12', true, false),
      n('120201', 'البرمجيات والتراخيص', 'Software and Licenses', AccountType.Asset, 4, '1202', false, true),

      n('2', 'الخصوم', 'Liabilities', AccountType.Liability, 1, null, true, false),
      n('21', 'الالتزامات المتداولة', 'Current Liabilities', AccountType.Liability, 2, '2', true, false),
      n('2101', 'الموردون والذمم الدائنة', 'Accounts Payable', AccountType.Liability, 3, '21', true, false),
      n('210101', 'حساب الموردين', 'Trade Accounts Payable', AccountType.Liability, 4, '2101', false, true, SystemAccountRole.AccountsPayable),
      n('210102', 'مصروفات مستحقة الدفع', 'Accrued Expenses', AccountType.Liability, 4, '2101', false, true),
      n('2102', 'الالتزامات الضريبية', 'Tax Liabilities', AccountType.Liability, 3, '21', true, false),
      n('210201', 'ضريبة القيمة المضافة المستحقة', 'VAT Output Tax Payable', AccountType.Liability, 4, '2102', false, true, SystemAccountRole.VatOutputTax),
      n('2103', 'الإيرادات غير المكتسبة', 'Unearned Revenue', AccountType.Liability, 3, '21', true, false),
      n('210301', 'دفعات مقدمة من العملاء', 'Advance Payments from Customers', AccountType.Liability, 4, '2103', false, true, SystemAccountRole.UnearnedRevenue),

      n('3', 'حقوق الملكية', 'Equity', AccountType.Equity, 1, null, true, false),
      n('31', 'رأس المال والاحتياطيات', 'Capital and Reserves', AccountType.Equity, 2, '3', true, false),
      n('3101', 'رأس المال', 'Capital', AccountType.Equity, 3, '31', true, false),
      n('310101', 'رأس المال المدفوع', 'Paid-in Capital', AccountType.Equity, 4, '3101', false, true),
      n('310102', 'الاحتياطي النظامي', 'Statutory Reserve', AccountType.Equity, 4, '3101', false, true),
      n('32', 'الأرباح المبقاة', 'Retained Earnings', AccountType.Equity, 2, '3', true, false),
      n('320101', 'الأرباح المبقاة (المدورة)', 'Retained Earnings (Accumulated)', AccountType.Equity, 3, '32', false, true, SystemAccountRole.RetainedEarnings),
      n('320102', 'أرباح وخسائر العام الحالي', 'Current Year Profit and Loss', AccountType.Equity, 3, '32', false, true, SystemAccountRole.CurrentYearProfitLoss),
      n('320103', 'حساب تسوية الأرصدة الافتتاحية', 'Opening Balance Equity', AccountType.Equity, 3, '32', false, true, SystemAccountRole.OpeningBalanceEquity),

      n('4', 'الإيرادات', 'Revenue', AccountType.Revenue, 1, null, true, false),
      n('41', 'إيرادات الخدمات', 'Service Revenue', AccountType.Revenue, 2, '4', true, false),
      n('4101', 'إيرادات الأتعاب المهنية', 'Professional Fees Revenue', AccountType.Revenue, 3, '41', true, false),
      n('410101', 'إيرادات الاستشارات', 'Consulting Revenue', AccountType.Revenue, 4, '4101', false, true, SystemAccountRole.SalesRevenue),
      n('410102', 'إيرادات التطوير والتنفيذ', 'Implementation Revenue', AccountType.Revenue, 4, '4101', false, true),
      n('410103', 'إيرادات عقود الدعم والصيانة', 'Support and Maintenance Contracts Revenue', AccountType.Revenue, 4, '4101', false, true),
      n('410104', 'مردودات ومسموحات الأتعاب', 'Fee Returns and Allowances', AccountType.Revenue, 4, '4101', false, true, SystemAccountRole.SalesReturns),
      n('4102', 'إيرادات أخرى', 'Other Revenue', AccountType.Revenue, 3, '41', true, false),
      n('410201', 'أرباح فروق أسعار الصرف', 'Foreign Exchange Gain', AccountType.Revenue, 4, '4102', false, true, SystemAccountRole.ForeignExchangeGain),
      n('410202', 'إيرادات متنوعة', 'Miscellaneous Revenue', AccountType.Revenue, 4, '4102', false, true),

      n('5', 'المصروفات', 'Expenses', AccountType.Expense, 1, null, true, false),
      n('51', 'تكلفة تقديم الخدمات', 'Cost of Services', AccountType.Expense, 2, '5', true, false),
      n('5101', 'التكاليف المباشرة', 'Direct Costs', AccountType.Expense, 3, '51', true, false),
      n('510101', 'تكلفة الأتعاب الخارجية والمقاولين', 'Subcontractors and External Fees', AccountType.Expense, 4, '5101', false, true, SystemAccountRole.CostOfGoodsSold),
      n('510102', 'تكاليف تراخيص وأدوات العمل', 'Licenses and Tooling Costs', AccountType.Expense, 4, '5101', false, true),
      n('52', 'المصروفات التشغيلية', 'Operating Expenses', AccountType.Expense, 2, '5', true, false),
      n('5201', 'الرواتب والمنافع', 'Staff Costs and Benefits', AccountType.Expense, 3, '52', true, false),
      n('520101', 'مصروف الرواتب والأجور', 'Salaries and Wages Expense', AccountType.Expense, 4, '5201', false, true, SystemAccountRole.PayrollExpense),
      n('520102', 'مصروف التأمينات الاجتماعية', 'Social Insurance Expense', AccountType.Expense, 4, '5201', false, true),
      n('5202', 'مصروفات عمومية وإدارية', 'General and Administrative Expenses', AccountType.Expense, 3, '52', true, false),
      n('520201', 'مصروف إيجار المقر', 'Office Rent Expense', AccountType.Expense, 4, '5202', false, true),
      n('520202', 'مصروف الكهرباء والمياه والاتصالات', 'Utilities Expense', AccountType.Expense, 4, '5202', false, true),
      n('520203', 'مصروفات عمومية وإدارية أخرى', 'Other G&A Expenses', AccountType.Expense, 4, '5202', false, true, SystemAccountRole.GeneralAndAdminExpense),
      n('5203', 'التسويق والبيع', 'Marketing and Selling', AccountType.Expense, 3, '52', true, false),
      n('520301', 'مصروفات تسويق وبيع', 'Marketing and Selling Expenses', AccountType.Expense, 4, '5203', false, true),
      n('5204', 'الإهلاك والمصروفات المالية', 'Depreciation and Finance Costs', AccountType.Expense, 3, '52', true, false),
      n('520401', 'مصروف الإهلاك', 'Depreciation Expense', AccountType.Expense, 4, '5204', false, true, SystemAccountRole.DepreciationExpense),
      n('520402', 'خسائر فروق أسعار الصرف', 'Foreign Exchange Loss', AccountType.Expense, 4, '5204', false, true, SystemAccountRole.ForeignExchangeLoss),
      n('520403', 'عمولات ومصاريف بنكية', 'Bank Charges and Commissions', AccountType.Expense, 4, '5204', false, true),
    ],
  )
}

/* ------------------------------------------------------------------ */
/* 3) دليل حسابات مختصر للمنشآت الصغيرة (3 مستويات)                   */
/* ------------------------------------------------------------------ */
function createSmeTemplate(): TemplateRow {
  return buildTemplate(
    {
      id: SME_TEMPLATE_ID,
      code: 'SME_SIMPLIFIED',
      nameArabic: 'دليل حسابات مختصر للمنشآت الصغيرة والمتوسطة',
      nameEnglish: 'Simplified SME Chart of Accounts',
      industryType: 'General',
      recommendedMaxDepth: 3,
      description:
        'قالب مبسط لرواد الأعمال والمتاجر الصغيرة (3 مستويات) يغطي دورة محاسبية كاملة دون تعقيد هيكلي.',
    },
    [
      n('1', 'الأصول', 'Assets', AccountType.Asset, 1, null, true, false),
      n('11', 'الأصول المتداولة', 'Current Assets', AccountType.Asset, 2, '1', true, false),
      n('1101', 'الصندوق', 'Cash on Hand', AccountType.Asset, 3, '11', false, true, SystemAccountRole.CashOnHand),
      n('1102', 'الحساب البنكي', 'Bank Account', AccountType.Asset, 3, '11', false, true, SystemAccountRole.BankDefault),
      n('1103', 'العملاء والذمم المدينة', 'Accounts Receivable', AccountType.Asset, 3, '11', false, true, SystemAccountRole.AccountsReceivable),
      n('1104', 'المخزون', 'Inventory', AccountType.Asset, 3, '11', false, true, SystemAccountRole.Inventory),
      n('1105', 'مصروفات مدفوعة مقدماً', 'Prepaid Expenses', AccountType.Asset, 3, '11', false, true, SystemAccountRole.PrepaidExpenses),
      n('12', 'الأصول الثابتة', 'Fixed Assets', AccountType.Asset, 2, '1', true, false),
      n('1201', 'الأثاث والتجهيزات', 'Furniture and Fixtures', AccountType.Asset, 3, '12', false, true),
      n('1202', 'مجمع الإهلاك', 'Accumulated Depreciation', AccountType.Asset, 3, '12', false, true, SystemAccountRole.AccumulatedDepreciation),

      n('2', 'الخصوم', 'Liabilities', AccountType.Liability, 1, null, true, false),
      n('21', 'الالتزامات المتداولة', 'Current Liabilities', AccountType.Liability, 2, '2', true, false),
      n('2101', 'الموردون', 'Accounts Payable', AccountType.Liability, 3, '21', false, true, SystemAccountRole.AccountsPayable),
      n('2102', 'ضريبة القيمة المضافة المستحقة', 'VAT Payable', AccountType.Liability, 3, '21', false, true, SystemAccountRole.VatOutputTax),
      n('2103', 'ضريبة المدخلات القابلة للاسترداد', 'VAT Input Tax Receivable', AccountType.Liability, 3, '21', false, true, SystemAccountRole.VatInputTax),
      n('22', 'القروض', 'Loans', AccountType.Liability, 2, '2', true, false),
      n('2201', 'قروض قصيرة الأجل', 'Short-term Loans', AccountType.Liability, 3, '22', false, true),

      n('3', 'حقوق الملكية', 'Equity', AccountType.Equity, 1, null, true, false),
      n('31', 'رأس المال والأرباح', 'Capital and Earnings', AccountType.Equity, 2, '3', true, false),
      n('3101', 'رأس المال المدفوع', 'Paid-in Capital', AccountType.Equity, 3, '31', false, true),
      n('3102', 'الأرباح المبقاة', 'Retained Earnings', AccountType.Equity, 3, '31', false, true, SystemAccountRole.RetainedEarnings),
      n('3103', 'أرباح وخسائر العام الحالي', 'Current Year Profit and Loss', AccountType.Equity, 3, '31', false, true, SystemAccountRole.CurrentYearProfitLoss),

      n('4', 'الإيرادات', 'Revenue', AccountType.Revenue, 1, null, true, false),
      n('41', 'إيرادات المبيعات', 'Sales Revenue', AccountType.Revenue, 2, '4', true, false),
      n('4101', 'إيرادات المبيعات', 'Sales Revenue', AccountType.Revenue, 3, '41', false, true, SystemAccountRole.SalesRevenue),
      n('4102', 'مردودات ومسموحات المبيعات', 'Sales Returns and Allowances', AccountType.Revenue, 3, '41', false, true, SystemAccountRole.SalesReturns),

      n('5', 'المصروفات', 'Expenses', AccountType.Expense, 1, null, true, false),
      n('51', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', AccountType.Expense, 2, '5', true, false),
      n('5101', 'تكلفة البضاعة المباعة', 'Cost of Goods Sold', AccountType.Expense, 3, '51', false, true, SystemAccountRole.CostOfGoodsSold),
      n('52', 'المصروفات التشغيلية', 'Operating Expenses', AccountType.Expense, 2, '5', true, false),
      n('5201', 'الرواتب والأجور', 'Salaries and Wages', AccountType.Expense, 3, '52', false, true, SystemAccountRole.PayrollExpense),
      n('5202', 'الإيجار', 'Rent', AccountType.Expense, 3, '52', false, true),
      n('5203', 'مصروفات عمومية وإدارية', 'General and Administrative Expenses', AccountType.Expense, 3, '52', false, true, SystemAccountRole.GeneralAndAdminExpense),
      n('5204', 'مصروف الإهلاك', 'Depreciation Expense', AccountType.Expense, 3, '52', false, true, SystemAccountRole.DepreciationExpense),
    ],
  )
}

/* ------------------------------------------------------------------ */
/* توليد شجرة حسابات شركة انطلاقاً من قالب                            */
/* ------------------------------------------------------------------ */
export function generateCompanyAccounts(
  db: MockDb,
  companyId: string,
  template: TemplateRow,
  options: { accountCodePrefix?: string | null; baseCurrency: string; createdAtUtc: string },
): { created: number; mappedRoleIds: string[] } {
  const byTemplateCode = new Map<string, string>()
  const prefix = options.accountCodePrefix?.trim() ?? ''
  let created = 0
  const mappedRoleIds: string[] = []

  const orderedNodes = [...template.nodes].sort(
    (a, b) => a.level - b.level || a.code.localeCompare(b.code),
  )

  for (const node of orderedNodes) {
    const targetCode = `${prefix}${node.code}`

    const existing = db.accounts.find((a) => a.companyId === companyId && a.code === targetCode)
    if (existing) {
      byTemplateCode.set(node.code, existing.id)
      continue
    }

    let parentAccountId: string | null = null
    let parentLineage = ''
    if (node.parentNodeCode) {
      const parentId = byTemplateCode.get(node.parentNodeCode)
      if (!parentId) continue
      const parent = db.accounts.find((a) => a.id === parentId)
      if (!parent) continue
      parentAccountId = parent.id
      parentLineage = parent.lineagePath
      // الحساب الأب يتحول تلقائياً إلى حساب تجميعي غير قابل للترحيل
      if (!parent.isHeader) {
        parent.isHeader = true
        parent.isPostable = false
      }
    }

    const id = nextId('acct')
    db.accounts.push({
      id,
      companyId,
      code: targetCode,
      nameArabic: node.nameArabic,
      nameEnglish: node.nameEnglish,
      accountType: node.accountType,
      normalBalance: node.normalBalance,
      classification: node.classification,
      level: node.level,
      parentAccountId,
      isHeader: node.isHeader,
      isPostable: node.isPostable,
      isActive: true,
      systemRole: node.defaultSystemRole,
      lineagePath: parentLineage
        ? `${parentLineage.replace(/\/$/, '')}/${targetCode}/`
        : `/${targetCode}/`,
      description: node.description,
      currencyCode: options.baseCurrency,
      createdAtUtc: options.createdAtUtc,
      updatedAtUtc: null,
    })

    byTemplateCode.set(node.code, id)
    created += 1

    if (node.defaultSystemRole) {
      mappedRoleIds.push(id)
    }
  }

  return { created, mappedRoleIds }
}

/** تعيين الأدوار النظامية تلقائياً للحسابات التي تحمل دوراً في القالب */
export function mapTemplateRoles(
  db: MockDb,
  companyId: string,
  template: TemplateRow,
  accountCodePrefix: string | null | undefined,
  assignedAtUtc: string,
  autoMap: boolean,
): number {
  if (!autoMap) return 0
  const prefix = accountCodePrefix?.trim() ?? ''
  let mapped = 0

  for (const node of template.nodes) {
    if (!node.defaultSystemRole) continue
    const targetCode = `${prefix}${node.code}`
    const account = db.accounts.find((a) => a.companyId === companyId && a.code === targetCode)
    if (!account) continue

    const existingMapping = db.mappings.find(
      (m) => m.companyId === companyId && m.role === node.defaultSystemRole,
    )

    if (existingMapping) {
      if (!existingMapping.isLocked && existingMapping.accountId !== account.id) {
        existingMapping.accountId = account.id
        existingMapping.assignedAtUtc = assignedAtUtc
        mapped += 1
      }
      continue
    }

    db.mappings.push({
      id: nextId('map'),
      companyId,
      role: node.defaultSystemRole,
      accountId: account.id,
      isLocked: false,
      assignedAtUtc,
      notes: 'تعيين تلقائي من القالب أثناء التهيئة',
    })
    mapped += 1
  }

  return mapped
}

/* ------------------------------------------------------------------ */
/* قاعدة البيانات الوهمية الأولية                                     */
/* ------------------------------------------------------------------ */
export function createSeedDb(): MockDb {
  idCounter = 0
  const db: MockDb = {
    companies: [],
    templates: [
      createCommercialTemplate(),
      createServicesTemplate(),
      createSmeTemplate(),
    ],
    accounts: [],
    mappings: [],
    auditLogs: [],
  }

  const companies: Array<{
    id: string
    code: string
    nameArabic: string
    nameEnglish: string
    taxNumber: string
    baseCurrency: string
    maxAccountDepth: number
    templateId: string | null
    initializedAtUtc: string | null
  }> = [
    {
      id: 'c0000000-0000-4000-8000-000000000001',
      code: 'COMP-001',
      nameArabic: 'شركة الأمل للتجارة والاستيراد',
      nameEnglish: 'Al-Amal Trading & Import Co.',
      taxNumber: '300123456700003',
      baseCurrency: 'SAR',
      maxAccountDepth: 5,
      templateId: COMMERCIAL_TEMPLATE_ID,
      initializedAtUtc: '2026-02-01T09:15:00Z',
    },
    {
      id: 'c0000000-0000-4000-8000-000000000002',
      code: 'COMP-002',
      nameArabic: 'مكتب الرواد للحلول التقنية والاستشارات',
      nameEnglish: 'Al-Rowad Tech Solutions & Consulting',
      taxNumber: '300987654300003',
      baseCurrency: 'SAR',
      maxAccountDepth: 4,
      templateId: SERVICES_TEMPLATE_ID,
      initializedAtUtc: '2026-02-03T11:40:00Z',
    },
    {
      id: 'c0000000-0000-4000-8000-000000000003',
      code: 'COMP-003',
      nameArabic: 'متجر النور للمبيعات السريعة',
      nameEnglish: 'Al-Noor Express Retail',
      taxNumber: '300555666700003',
      baseCurrency: 'SAR',
      maxAccountDepth: 3,
      templateId: null,
      initializedAtUtc: null,
    },
  ]

  for (const company of companies) {
    db.companies.push({
      id: company.id,
      code: company.code,
      nameArabic: company.nameArabic,
      nameEnglish: company.nameEnglish,
      taxNumber: company.taxNumber,
      baseCurrency: company.baseCurrency,
      fiscalYearStartMonth: 1,
      maxAccountDepth: company.maxAccountDepth,
      isCoaInitialized: company.templateId !== null,
      initializedFromTemplateId: company.templateId,
      initializedAtUtc: company.initializedAtUtc,
      isActive: true,
      createdAtUtc: '2026-01-20T07:30:00Z',
    })

    if (!company.templateId || !company.initializedAtUtc) continue

    const template = db.templates.find((t) => t.id === company.templateId)
    if (!template) continue

    const { created } = generateCompanyAccounts(db, company.id, template, {
      baseCurrency: company.baseCurrency,
      createdAtUtc: company.initializedAtUtc,
    })

    const mapped = mapTemplateRoles(
      db,
      company.id,
      template,
      null,
      company.initializedAtUtc,
      true,
    )

    db.auditLogs.push({
      id: nextId('log'),
      companyId: company.id,
      templateId: template.id,
      templateName: template.nameArabic,
      status: 2, // InitializationStatus.Success
      accountsCreatedCount: created,
      systemRolesMappedCount: mapped,
      executionDurationMs: 180 + Math.round(Math.random() * 220),
      errorMessage: null,
      timestampUtc: company.initializedAtUtc,
      detailsJson: JSON.stringify({
        mode: 'Strict',
        autoMapSystemRoles: true,
        maxDepthEnforced: company.maxAccountDepth,
      }),
    })
  }

  return db
}

export type { TemplateRow }
