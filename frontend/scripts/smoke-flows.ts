/**
 * اختبار تدفقات العمل (Flows) على طبقة الـ API:
 * يمرّ عبر عميل HTTP → واجهة المحاكاة → التطبيع (normalize)، ويتحقق من:
 *  - إنشاء شركة وحساباتها وحدود العمق
 *  - أوضاع التهيئة الثلاثة (DryRun / Strict / IdempotentMerge) وقاعدة التكرار الآمن
 *  - قواعد الحذف وربط الأدوار النظامية وضبط حد العمق
 */
import { companiesApi } from '@/api/companies'
import { accountsApi } from '@/api/accounts'
import { templatesApi } from '@/api/templates'
import { initializationApi } from '@/api/initialization'
import { systemAccountsApi } from '@/api/system-accounts'
import { AccountType, InitializationMode, InitializationStatus, SystemAccountRole } from '@/api/enums'
import { ApiError } from '@/lib/http'

const failures: string[] = []
let checks = 0

function expect(condition: boolean, label: string) {
  checks += 1
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    failures.push(label)
    console.log(`  ✗ ${label}`)
  }
}

function expectApiErrorCode(error: unknown, code: string, label: string) {
  const isApiError = error instanceof ApiError
  expect(isApiError && error.errorCode === code, `${label} (متوقع ${code}${isApiError ? ` - فعليًا ${error.errorCode}` : ''})`)
}

export async function runFlows(): Promise<void> {
  console.log('\nتدفقات العمل:')

  /* 1) إنشاء شركة جديدة بحد عمق 3 مستويات */
  const company = await companiesApi.create({
    code: 'COMP-TEST',
    nameArabic: 'شركة اختبار التدفقات',
    nameEnglish: 'Flows Test Co.',
    taxNumber: null,
    baseCurrency: 'SAR',
    fiscalYearStartMonth: 1,
    maxAccountDepth: 3,
  })
  expect(company.code === 'COMP-TEST' && company.isCoaInitialized === false, 'إنشاء شركة جديدة بنجاح')
  expect(company.totalAccountsCount === 0, 'الشركة الجديدة بدون حسابات')

  try {
    await companiesApi.create({
      code: 'COMP-TEST',
      nameArabic: 'تكرار',
      nameEnglish: 'Duplicate',
      baseCurrency: 'SAR',
      fiscalYearStartMonth: 1,
      maxAccountDepth: 5,
    })
    expect(false, 'منع تكرار رمز الشركة')
  } catch (error) {
    expectApiErrorCode(error, 'DUPLICATE_COMPANY_CODE', 'منع تكرار رمز الشركة')
  }

  /* 2) الفحص المسبق والتهيئة */
  const templates = await templatesApi.list()
  const smeTemplate = templates.find((template) => template.code === 'SME_SIMPLIFIED')
  const commercialTemplate = templates.find((template) => template.code === 'COMMERCIAL_IFRS')
  expect(Boolean(smeTemplate && commercialTemplate), 'قراءة القوالب المعيارية')

  const incompatible = await initializationApi.validate({
    companyId: company.id,
    templateId: commercialTemplate!.id,
  })
  expect(
    incompatible.canInitialize === false && incompatible.depthCompatible === false,
    'رفض التهيئة عند تجاوز عمق القالب لحد الشركة',
  )

  const validation = await initializationApi.validate({
    companyId: company.id,
    templateId: smeTemplate!.id,
  })
  expect(validation.canInitialize && validation.depthCompatible, 'اجتياز الفحص المسبق للقالب المتوافق')

  const dryRun = await initializationApi.initialize({
    companyId: company.id,
    templateId: smeTemplate!.id,
    mode: InitializationMode.DryRun,
    autoMapSystemRoles: true,
  })
  expect(
    dryRun.accountsCreatedCount === smeTemplate!.totalNodesCount && dryRun.mappedRoles.length === 0,
    'المحاكاة الجافة تحسب الحسابات دون حفظ',
  )

  const stillEmpty = await accountsApi.flat({ companyId: company.id })
  expect(stillEmpty.length === 0, 'المحاكاة الجافة لم تغيّر قاعدة البيانات')

  const strictRun = await initializationApi.initialize({
    companyId: company.id,
    templateId: smeTemplate!.id,
    mode: InitializationMode.Strict,
    autoMapSystemRoles: true,
  })
  expect(
    strictRun.accountsCreatedCount === smeTemplate!.totalNodesCount &&
      strictRun.status === InitializationStatus.Success,
    `التهيئة الصارمة أنشأت ${strictRun.accountsCreatedCount} حسابًا`,
  )
  expect(strictRun.mappedRoles.length > 0, `ربط ${strictRun.systemRolesMappedCount} دورًا نظاميًا`)

  try {
    await initializationApi.initialize({
      companyId: company.id,
      templateId: smeTemplate!.id,
      mode: InitializationMode.Strict,
      autoMapSystemRoles: true,
    })
    expect(false, 'رفض التهيئة الصارمة لشركة مهيأة مسبقًا')
  } catch (error) {
    expectApiErrorCode(error, 'COMPANY_ALREADY_INITIALIZED', 'رفض التهيئة الصارمة لشركة مهيأة مسبقًا')
  }

  const mergeRun = await initializationApi.initialize({
    companyId: company.id,
    templateId: smeTemplate!.id,
    mode: InitializationMode.IdempotentMerge,
    autoMapSystemRoles: true,
  })
  expect(
    mergeRun.accountsCreatedCount === 0 && mergeRun.status === InitializationStatus.Reconciled,
    'الدمج الآمن لم يُنشئ حسابات مكررة (تكرارية آمنة)',
  )

  /* 3) قواعد الحسابات وحدود العمق */
  const tree = await accountsApi.tree(company.id)
  expect(tree.length === 5, `الشجرة تحتوي على 5 جذور للمستوى الأول (فعليًا ${tree.length})`)
  const maxLevel = Math.max(
    ...tree.flatMap(function collect(node): number[] {
      return [node.level, ...node.children.flatMap(collect)]
    }),
  )
  expect(maxLevel === 3, `أقصى مستوى في الشجرة = 3 (فعليًا ${maxLevel})`)

  const postable = await accountsApi.flat({ companyId: company.id, postableOnly: true })
  expect(postable.length > 0 && postable.every((account) => account.isPostable), 'فلترة الحسابات القابلة للترحيل')

  const allAccounts = await accountsApi.flat({ companyId: company.id })
  const expenseHeader = allAccounts.find(
    (account) => account.accountType === AccountType.Expense && account.level === 2,
  )!
  const deepParent = allAccounts.find(
    (account) => account.accountType === AccountType.Expense && account.level === 3,
  )!
  const assetHeader = allAccounts.find(
    (account) => account.accountType === AccountType.Asset && account.level === 2,
  )!

  try {
    await accountsApi.create({
      companyId: company.id,
      code: '9999',
      nameArabic: 'حساب غير متوافق',
      nameEnglish: 'Mismatched',
      accountType: AccountType.Expense,
      parentAccountId: assetHeader.id,
      isHeader: false,
      isPostable: true,
    })
    expect(false, 'منع إضافة حساب بنوع مختلف عن الحساب الأب')
  } catch (error) {
    expectApiErrorCode(error, 'INVALID_ACCOUNT_HIERARCHY', 'منع إضافة حساب بنوع مختلف عن الحساب الأب')
  }

  try {
    await accountsApi.create({
      companyId: company.id,
      code: '52010101',
      nameArabic: 'مستوى أعمق من الحد',
      nameEnglish: 'Too deep',
      accountType: deepParent.accountType,
      parentAccountId: deepParent.id,
      isHeader: false,
      isPostable: true,
    })
    expect(false, 'منع تجاوز حد العمق الأقصى للشركة')
  } catch (error) {
    expectApiErrorCode(error, 'ACCOUNT_DEPTH_EXCEEDED', 'منع تجاوز حد العمق الأقصى للشركة')
  }

  const created = await accountsApi.create({
    companyId: company.id,
    code: '520101',
    nameArabic: 'مصروف اختبار التدفقات',
    nameEnglish: 'Flows Test Expense',
    accountType: expenseHeader.accountType,
    parentAccountId: expenseHeader.id,
    isHeader: false,
    isPostable: true,
    description: 'أُنشئ من اختبار التدفقات',
  })
  expect(created.level === expenseHeader.level + 1, 'الحساب الجديد يأخذ مستوى الحساب الأب + 1')

  const updated = await accountsApi.update(company.id, created.id, {
    nameArabic: 'مصروف اختبار التدفقات (معدّل)',
    nameEnglish: 'Flows Test Expense Updated',
    description: null,
    currencyCode: 'SAR',
    isActive: false,
  })
  expect(updated.isActive === false, 'تحديث بيانات الحساب وإيقافه')

  /* 4) الأدوار النظامية */
  try {
    await systemAccountsApi.setMapping(company.id, {
      role: SystemAccountRole.SalesRevenue,
      accountId: created.id,
      isLocked: false,
      forceIfLocked: false,
    })
    expect(false, 'منع ربط دور نظامي بحساب من نوع غير متوافق')
  } catch (error) {
    expectApiErrorCode(error, 'SYSTEM_ACCOUNT_MAPPING_ERROR', 'منع ربط دور نظامي بحساب من نوع غير متوافق')
  }

  try {
    await systemAccountsApi.setMapping(company.id, {
      role: SystemAccountRole.SalesRevenue,
      accountId: tree[0].id,
      isLocked: false,
      forceIfLocked: false,
    })
    expect(false, 'منع ربط دور نظامي بحساب تجميعي')
  } catch (error) {
    expectApiErrorCode(error, 'SYSTEM_ACCOUNT_MAPPING_ERROR', 'منع ربط دور نظامي بحساب تجميعي')
  }

  const salesAccount = postable.find((account) => account.accountType === AccountType.Revenue)!
  const mapping = await systemAccountsApi.setMapping(company.id, {
    role: SystemAccountRole.SalesRevenue,
    accountId: salesAccount.id,
    isLocked: true,
    forceIfLocked: false,
    notes: 'ربط تجريبي',
  })
  expect(mapping.isLocked && mapping.role === SystemAccountRole.SalesRevenue, 'ربط دور نظامي بنجاح مع قفل')

  try {
    await systemAccountsApi.setMapping(company.id, {
      role: SystemAccountRole.SalesRevenue,
      accountId: salesAccount.id,
      isLocked: true,
      forceIfLocked: false,
    })
    expect(false, 'رفض تعديل ربط مقفل بدون صلاحية كسر القفل')
  } catch (error) {
    expectApiErrorCode(error, 'SYSTEM_ACCOUNT_MAPPING_ERROR', 'رفض تعديل ربط مقفل بدون صلاحية كسر القفل')
  }

  const forced = await systemAccountsApi.setMapping(company.id, {
    role: SystemAccountRole.SalesRevenue,
    accountId: salesAccount.id,
    isLocked: false,
    forceIfLocked: true,
    notes: 'كسر القفل',
  })
  expect(forced.isLocked === false, 'كسر قفل الربط وإلغاء القفل بنجاح')

  const critical = await systemAccountsApi.validateCritical(company.id)
  expect(critical.allCriticalRolesMapped === true, 'فحص اكتمال الأدوار الحرجة')

  /* 5) الحذف وضبط العمق */
  try {
    await accountsApi.remove(company.id, tree[0].id)
    expect(false, 'منع حذف حساب له فروع')
  } catch (error) {
    expectApiErrorCode(error, 'INVALID_ACCOUNT_HIERARCHY', 'منع حذف حساب له فروع')
  }

  try {
    await accountsApi.remove(company.id, mapping.accountId)
    expect(false, 'منع حذف حساب مربوط بدور نظامي')
  } catch (error) {
    expectApiErrorCode(error, 'ACCOUNT_MAPPED_TO_ROLE', 'منع حذف حساب مربوط بدور نظامي')
  }

  await accountsApi.remove(company.id, created.id)
  const afterDelete = await accountsApi.flat({ companyId: company.id })
  expect(!afterDelete.some((account) => account.id === created.id), 'حذف الحساب غير المربوط بنجاح')

  try {
    await companiesApi.updateDepth(company.id, 2)
    expect(false, 'منع ضبط عمق خارج النطاق المسموح (3 - 10)')
  } catch (error) {
    expectApiErrorCode(error, 'INVALID_MAX_DEPTH', 'منع ضبط عمق خارج النطاق المسموح (3 - 10)')
  }

  const depthUpdated = await companiesApi.updateDepth(company.id, 5)
  expect(depthUpdated.maxAccountDepth === 5, 'رفع حد العمق الأقصى إلى 5 مستويات')

  // بعد رفع العمق، يمكن إضافة مستوى رابع ثم يُرفض تخفيض العمق لأقل من أعمق حساب قائم
  const level4 = await accountsApi.create({
    companyId: company.id,
    code: '510101',
    nameArabic: 'حساب بالمستوى الرابع',
    nameEnglish: 'Level 4 account',
    accountType: deepParent.accountType,
    parentAccountId: deepParent.id,
    isHeader: false,
    isPostable: true,
  })
  expect(level4.level === 4, 'إضافة حساب في المستوى الرابع بعد رفع حد العمق')

  try {
    await companiesApi.updateDepth(company.id, 3)
    expect(false, 'منع تخفيض العمق لأقل من أعمق حساب قائم')
  } catch (error) {
    expectApiErrorCode(
      error,
      'CANNOT_REDUCE_DEPTH_BELOW_EXISTING',
      'منع تخفيض العمق لأقل من أعمق حساب قائم',
    )
  }

  const depthRestored = await companiesApi.updateDepth(company.id, 5)
  expect(depthRestored.maxAccountDepth === 5, 'إبقاء حد العمق على 5 مستويات')

  const auditLogs = await initializationApi.auditLogs(company.id)
  expect(auditLogs.length >= 2, `تسجيل عمليات التهيئة في سجل التدقيق (${auditLogs.length} سجل)`)

  console.log(`\nعدد الفحوصات: ${checks} — الإخفاقات: ${failures.length}`)
  if (failures.length) {
    failures.forEach((failure) => console.error(` ✗ ${failure}`))
    throw new Error(`${failures.length} فحصًا لم يجتز الاختبار`)
  }
}
