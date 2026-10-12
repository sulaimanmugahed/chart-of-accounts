/**
 * تنفيذ واجهة REST وهمية مطابقة لعقود الـ Backend (.NET) بما في ذلك:
 *  - أشكال البيانات (DTOs) كما يسلسلها ASP.NET Core (camelCase)
 *  - رسائل الأخطاء ورموزها كما ينتجها ExceptionHandlingMiddleware
 *  - القواعد المحاسبية: العمق الأقصى، تكرار الرموز، توافق الأدوار، التهيئة الذرية.
 */
import { AccountType, SystemAccountRole } from '../src/api/enums.ts'
import { createSeedDb, generateCompanyAccounts, mapTemplateRoles } from './seed.ts'
import type {
  AccountRow,
  MockDb,
  TemplateRow,
} from './types.ts'

export interface MockRequest {
  method: string
  pathname: string
  searchParams: URLSearchParams
  body: unknown
}

export interface MockResponse {
  status: number
  body?: unknown
}

const nowIso = () => new Date().toISOString()

/** خرائط عكسية للتحويل من القيمة الرقمية إلى الاسم النصي (كما تفعل ToString() في .NET) */
const TYPE_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(AccountType).map(([key, value]) => [value as number, key]),
)
const ROLE_NAME: Record<number, string> = Object.fromEntries(
  Object.entries(SystemAccountRole).map(([key, value]) => [value as number, key]),
)

let sequence = 0
function uid(prefix: string): string {
  sequence += 1
  return `${prefix}-${Date.now().toString(16)}-4000-8000-${String(sequence).padStart(12, '0')}`
}

/* ---------------------------- أدوات الأخطاء ---------------------------- */

function apiError(status: number, errorCode: string, errorMessage: string): MockResponse {
  return {
    status,
    body: {
      isSuccess: false,
      statusCode: status,
      errorCode,
      errorMessage,
      timestampUtc: nowIso(),
    },
  }
}

function notFound(message: string): MockResponse {
  return { status: 404, body: { message } }
}

/* ------------------------------ التسلسل ------------------------------ */

type Json = Record<string, unknown>

function toCompanyDto(db: MockDb, row: MockDb['companies'][number]): Json {
  return {
    id: row.id,
    code: row.code,
    nameArabic: row.nameArabic,
    nameEnglish: row.nameEnglish,
    taxNumber: row.taxNumber,
    baseCurrency: row.baseCurrency,
    fiscalYearStartMonth: row.fiscalYearStartMonth,
    maxAccountDepth: row.maxAccountDepth,
    isCoaInitialized: row.isCoaInitialized,
    initializedFromTemplateId: row.initializedFromTemplateId,
    initializedAtUtc: row.initializedAtUtc,
    totalAccountsCount: db.accounts.filter((a) => a.companyId === row.id).length,
    isActive: row.isActive,
  }
}

function toAccountDto(db: MockDb, row: AccountRow): Json {
  const parent = row.parentAccountId
    ? db.accounts.find((a) => a.id === row.parentAccountId)
    : undefined
  const childrenCount = db.accounts.filter((a) => a.parentAccountId === row.id).length

  return {
    id: row.id,
    companyId: row.companyId,
    code: row.code,
    nameArabic: row.nameArabic,
    nameEnglish: row.nameEnglish,
    accountType: row.accountType,
    accountTypeName: TYPE_NAME[row.accountType],
    normalBalance: row.normalBalance,
    normalBalanceName: row.normalBalance === 1 ? 'Debit' : 'Credit',
    classification: row.classification,
    classificationName: row.classification === 1 ? 'BalanceSheet' : 'IncomeStatement',
    level: row.level,
    parentAccountId: row.parentAccountId,
    parentAccountCode: parent?.code ?? null,
    isHeader: row.isHeader,
    isPostable: row.isPostable,
    isActive: row.isActive,
    systemRole: row.systemRole,
    systemRoleName: row.systemRole ? ROLE_NAME[row.systemRole] : null,
    lineagePath: row.lineagePath,
    description: row.description,
    currencyCode: row.currencyCode,
    childrenCount,
  }
}

function toAccountTreeNodes(db: MockDb, companyId: string): Json[] {
  const rows = db.accounts
    .filter((a) => a.companyId === companyId)
    .sort((a, b) => a.level - b.level || a.code.localeCompare(b.code))

  const nodes = new Map<string, Json>()
  for (const row of rows) {
    nodes.set(row.id, {
      id: row.id,
      code: row.code,
      nameArabic: row.nameArabic,
      nameEnglish: row.nameEnglish,
      accountType: row.accountType,
      normalBalance: row.normalBalance,
      classification: row.classification,
      level: row.level,
      parentAccountId: row.parentAccountId,
      isHeader: row.isHeader,
      isPostable: row.isPostable,
      isActive: row.isActive,
      systemRole: row.systemRole,
      lineagePath: row.lineagePath,
      children: [] as Json[],
    })
  }

  const roots: Json[] = []
  for (const row of rows) {
    const node = nodes.get(row.id)!
    const parent = row.parentAccountId ? nodes.get(row.parentAccountId) : undefined
    if (parent) {
      ;(parent.children as Json[]).push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function toTemplateDto(row: TemplateRow): Json {
  return {
    id: row.id,
    code: row.code,
    nameArabic: row.nameArabic,
    nameEnglish: row.nameEnglish,
    industryType: row.industryType,
    recommendedMaxDepth: row.recommendedMaxDepth,
    description: row.description,
    isActive: row.isActive,
    isSystemTemplate: row.isSystemTemplate,
    version: row.version,
    totalNodesCount: row.nodes.length,
    systemRolesDefinedCount: row.nodes.filter((n) => n.defaultSystemRole).length,
  }
}

function toTemplateDetailDto(row: TemplateRow): Json {
  return {
    ...toTemplateDto(row),
    nodes: [...row.nodes]
      .sort((a, b) => a.level - b.level || a.code.localeCompare(b.code))
      .map((node) => ({
        id: node.id,
        code: node.code,
        nameArabic: node.nameArabic,
        nameEnglish: node.nameEnglish,
        accountType: node.accountType,
        normalBalance: node.normalBalance,
        classification: node.classification,
        level: node.level,
        parentNodeCode: node.parentNodeCode,
        isHeader: node.isHeader,
        isPostable: node.isPostable,
        defaultSystemRole: node.defaultSystemRole,
        defaultSystemRoleName: node.defaultSystemRole
          ? ROLE_NAME[node.defaultSystemRole]
          : null,
        description: node.description,
      })),
  }
}

function toMappingDto(db: MockDb, mapping: MockDb['mappings'][number]): Json {
  const account = db.accounts.find((a) => a.id === mapping.accountId)
  return {
    id: mapping.id,
    companyId: mapping.companyId,
    role: mapping.role,
    roleName: ROLE_NAME[mapping.role],
    accountId: mapping.accountId,
    accountCode: account?.code ?? '',
    accountNameArabic: account?.nameArabic ?? '',
    accountNameEnglish: account?.nameEnglish ?? '',
    accountType: account?.accountType ?? AccountType.Asset,
    isLocked: mapping.isLocked,
    assignedAtUtc: mapping.assignedAtUtc,
    notes: mapping.notes,
  }
}

/* ------------------------------ معالجة الطلب ------------------------------ */

const EXPECTED_ROLE_TYPE: Partial<Record<SystemAccountRole, AccountType>> = {
  [SystemAccountRole.CashOnHand]: AccountType.Asset,
  [SystemAccountRole.BankDefault]: AccountType.Asset,
  [SystemAccountRole.AccountsReceivable]: AccountType.Asset,
  [SystemAccountRole.Inventory]: AccountType.Asset,
  [SystemAccountRole.PrepaidExpenses]: AccountType.Asset,
  [SystemAccountRole.VatInputTax]: AccountType.Asset,
  [SystemAccountRole.AccumulatedDepreciation]: AccountType.Asset,
  [SystemAccountRole.AccountsPayable]: AccountType.Liability,
  [SystemAccountRole.VatOutputTax]: AccountType.Liability,
  [SystemAccountRole.UnearnedRevenue]: AccountType.Liability,
  [SystemAccountRole.RetainedEarnings]: AccountType.Equity,
  [SystemAccountRole.CurrentYearProfitLoss]: AccountType.Equity,
  [SystemAccountRole.OpeningBalanceEquity]: AccountType.Equity,
  [SystemAccountRole.SalesRevenue]: AccountType.Revenue,
  [SystemAccountRole.SalesReturns]: AccountType.Revenue,
  [SystemAccountRole.ForeignExchangeGain]: AccountType.Revenue,
  [SystemAccountRole.CostOfGoodsSold]: AccountType.Expense,
  [SystemAccountRole.GeneralAndAdminExpense]: AccountType.Expense,
  [SystemAccountRole.PayrollExpense]: AccountType.Expense,
  [SystemAccountRole.DepreciationExpense]: AccountType.Expense,
  [SystemAccountRole.ForeignExchangeLoss]: AccountType.Expense,
}

const asObj = (value: unknown): Json => (value && typeof value === 'object' ? (value as Json) : {})
const asStr = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : value === undefined || value === null ? fallback : String(value)
const asNum = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
const asBool = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback
const asNullOrNum = (value: unknown): number | null =>
  value === null || value === undefined || value === '' ? null : asNum(value, 0) || null

export function createMockApi() {
  const db = createSeedDb()

  function findCompany(companyId: string) {
    return db.companies.find((c) => c.id === companyId)
  }

  function handled(request: MockRequest): MockResponse {
    const { method, searchParams, body } = request
    const pathname = normalizePath(request.pathname)
    const payload = asObj(body)

    /* ------------------------------- ping ------------------------------- */
    if (pathname === '/ping' && method === 'GET') return { status: 200, body: {} }

    /* ----------------------------- الشركات ----------------------------- */
    if (pathname === '/api/companies' && method === 'GET') {
      return { status: 200, body: db.companies.map((c) => toCompanyDto(db, c)) }
    }

    if (pathname === '/api/companies' && method === 'POST') {
      const code = asStr(payload.code).trim().toUpperCase()
      if (!code) return apiError(400, 'INVALID_COMPANY_CODE', 'رمز الشركة إلزامي.')
      if (!asStr(payload.nameArabic).trim())
        return apiError(400, 'INVALID_COMPANY_NAME', 'اسم الشركة باللغة العربية إلزامي.')
      if (db.companies.some((c) => c.code === code))
        return apiError(400, 'DUPLICATE_COMPANY_CODE', `رمز الشركة '${asStr(payload.code)}' مستخدم بالفعل.`)

      const maxAccountDepth = asNum(payload.maxAccountDepth, 5)
      if (maxAccountDepth < 3 || maxAccountDepth > 10)
        return apiError(
          400,
          'INVALID_MAX_DEPTH',
          'عمق شجرة الحسابات يجب أن يكون بين 3 مستويات كحد أدنى و 10 مستويات كحد أقصى لضمان كفاءة التقارير المالية.',
        )

      const company = {
        id: uid('comp'),
        code,
        nameArabic: asStr(payload.nameArabic).trim(),
        nameEnglish: asStr(payload.nameEnglish).trim() || asStr(payload.nameArabic).trim(),
        taxNumber: asStr(payload.taxNumber).trim() || null,
        baseCurrency: (asStr(payload.baseCurrency, 'SAR').trim() || 'SAR').toUpperCase(),
        fiscalYearStartMonth: Math.min(12, Math.max(1, asNum(payload.fiscalYearStartMonth, 1))),
        maxAccountDepth,
        isCoaInitialized: false,
        initializedFromTemplateId: null,
        initializedAtUtc: null,
        isActive: true,
        createdAtUtc: nowIso(),
      }
      db.companies.push(company)
      return { status: 201, body: toCompanyDto(db, company) }
    }

    const companyMatch = pathname.match(/^\/api\/companies\/([^/]+)$/)
    if (companyMatch) {
      const company = findCompany(companyMatch[1])
      if (!company) return notFound(`الشركة برقم (${companyMatch[1]}) غير موجودة.`)

      if (method === 'GET') return { status: 200, body: toCompanyDto(db, company) }

      if (method === 'PUT') {
        company.nameArabic = asStr(payload.nameArabic).trim() || company.nameArabic
        company.nameEnglish = asStr(payload.nameEnglish).trim() || company.nameArabic
        company.taxNumber = asStr(payload.taxNumber).trim() || null
        company.baseCurrency = (asStr(payload.baseCurrency, company.baseCurrency).trim() || 'SAR').toUpperCase()
        return { status: 200, body: toCompanyDto(db, company) }
      }
    }

    const depthMatch = pathname.match(/^\/api\/companies\/([^/]+)\/depth$/)
    if (depthMatch && method === 'PUT') {
      const company = findCompany(depthMatch[1])
      if (!company) return notFound(`الشركة برقم (${depthMatch[1]}) غير موجودة.`)

      const maxDepth = asNum(body, NaN)
      if (!Number.isFinite(maxDepth))
        return apiError(400, 'INVALID_MAX_DEPTH', 'قيمة العمق الأقصى غير صالحة.')

      if (maxDepth < 3 || maxDepth > 10)
        return apiError(
          400,
          'INVALID_MAX_DEPTH',
          'عمق شجرة الحسابات يجب أن يكون بين 3 مستويات كحد أدنى و 10 مستويات كحد أقصى لضمان كفاءة التقارير المالية.',
        )

      const companyAccounts = db.accounts.filter((a) => a.companyId === company.id)
      const currentMaxLevel = companyAccounts.length
        ? Math.max(...companyAccounts.map((a) => a.level))
        : 0

      if (maxDepth < currentMaxLevel)
        return apiError(
          400,
          'CANNOT_REDUCE_DEPTH_BELOW_EXISTING',
          `لا يمكن تخفيض أقصى عمق للشركة إلى (${maxDepth}) مستويات لأن الشركة تحتوي بالفعل على حسابات قائمة بالمستوى (${currentMaxLevel}).`,
        )

      company.maxAccountDepth = maxDepth
      return { status: 200, body: toCompanyDto(db, company) }
    }

    /* ------------------------------ القوالب ------------------------------ */
    if (pathname === '/api/templates' && method === 'GET') {
      return { status: 200, body: db.templates.map(toTemplateDto) }
    }

    if (pathname === '/api/templates' && method === 'POST') {
      const code = asStr(payload.code).trim().toUpperCase()
      if (!code) return apiError(400, 'INVALID_TEMPLATE_CODE', 'رمز القالب إلزامي.')
      if (db.templates.some((t) => t.code === code))
        return apiError(
          400,
          'DUPLICATE_TEMPLATE_CODE',
          `رمز القالب '${asStr(payload.code)}' مستخدم مسبقًا في النظام.`,
        )

      const nodesInput = Array.isArray(payload.nodes) ? (payload.nodes as unknown[]).map(asObj) : []
      if (!nodesInput.length)
        return apiError(400, 'EMPTY_TEMPLATE', 'القالب لا يحتوي على أي بنود حسابات هيكلية.')

      const codes = new Set<string>()
      for (const node of nodesInput) {
        const nodeCode = asStr(node.code).trim()
        if (!nodeCode)
          return apiError(400, 'INVALID_NODE_CODE', 'رمز بند القالب إلزامي.')
        if (codes.has(nodeCode))
          return apiError(
            400,
            'INVALID_ACCOUNT_HIERARCHY',
            `القالب يحتوي على رموز حسابات مكررة: ${nodeCode}`,
          )
        codes.add(nodeCode)
      }

      const template: TemplateRow = {
        id: uid('tmpl'),
        code,
        nameArabic: asStr(payload.nameArabic).trim(),
        nameEnglish: asStr(payload.nameEnglish).trim() || asStr(payload.nameArabic).trim(),
        industryType: asStr(payload.industryType, 'General') || 'General',
        recommendedMaxDepth: Math.max(3, asNum(payload.recommendedMaxDepth, 5)),
        description: asStr(payload.description) || null,
        isActive: true,
        isSystemTemplate: false,
        version: 1,
        createdAtUtc: nowIso(),
        nodes: nodesInput.map((node) => {
          const accountType = (asNum(node.accountType, AccountType.Asset) || AccountType.Asset) as AccountType
          const isHeader = asBool(node.isHeader)
          const level = Math.max(1, asNum(node.level, 1))
          return {
            id: uid('node'),
            code: asStr(node.code).trim(),
            nameArabic: asStr(node.nameArabic).trim(),
            nameEnglish: asStr(node.nameEnglish).trim() || asStr(node.nameArabic).trim(),
            accountType,
            normalBalance: (asNullOrNum(node.normalBalance) ??
              (accountType === AccountType.Asset || accountType === AccountType.Expense ? 1 : 2)) as 1 | 2,
            classification: (asNullOrNum(node.classification) ??
              (accountType === AccountType.Revenue || accountType === AccountType.Expense ? 2 : 1)) as 1 | 2,
            level,
            parentNodeCode: asStr(node.parentNodeCode) || null,
            isHeader,
            isPostable: isHeader ? false : asBool(node.isPostable, true),
            defaultSystemRole: asNullOrNum(node.defaultSystemRole) as
              | SystemAccountRole
              | null,
            description: asStr(node.description) || null,
          }
        }),
      }

      db.templates.push(template)
      return { status: 201, body: toTemplateDto(template) }
    }

    const templateByCode = pathname.match(/^\/api\/templates\/code\/([^/]+)$/)
    if (templateByCode && method === 'GET') {
      const code = decodeURIComponent(templateByCode[1]).toUpperCase()
      const template = db.templates.find((t) => t.code === code)
      if (!template) return notFound(`القالب برمز '${code}' غير موجود.`)
      return { status: 200, body: toTemplateDetailDto(template) }
    }

    const templateById = pathname.match(/^\/api\/templates\/([^/]+)$/)
    if (templateById && method === 'GET') {
      const template = db.templates.find((t) => t.id === templateById[1])
      if (!template) return notFound(`القالب برقم (${templateById[1]}) غير موجود.`)
      return { status: 200, body: toTemplateDetailDto(template) }
    }

    /* ----------------------------- الحسابات ----------------------------- */
    if (pathname === '/api/accounts/tree' && method === 'GET') {
      const companyId = asStr(searchParams.get('companyId'))
      if (!companyId) return apiError(400, 'COMPANY_ID_REQUIRED', 'معرف الشركة إلزامي.')
      return { status: 200, body: toAccountTreeNodes(db, companyId) }
    }

    if (pathname === '/api/accounts' && method === 'GET') {
      const companyId = asStr(searchParams.get('companyId'))
      if (!companyId) return apiError(400, 'COMPANY_ID_REQUIRED', 'معرف الشركة إلزامي.')

      const maxLevel = Number(searchParams.get('maxLevel') ?? NaN)
      const postableOnly = (searchParams.get('postableOnly') ?? '').toLowerCase() === 'true'

      let rows = db.accounts.filter((a) => a.companyId === companyId)
      if (Number.isFinite(maxLevel)) rows = rows.filter((a) => a.level <= maxLevel)
      if (postableOnly) rows = rows.filter((a) => a.isPostable)

      rows = rows.sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }))
      return { status: 200, body: rows.map((row) => toAccountDto(db, row)) }
    }

    if (pathname === '/api/accounts' && method === 'POST') {
      const companyId = asStr(payload.companyId)
      const company = findCompany(companyId)
      if (!company)
        return apiError(400, 'COMPANY_NOT_FOUND', `الشركة برقم (${companyId}) غير موجودة.`)

      const code = asStr(payload.code).trim()
      if (!code) return apiError(400, 'INVALID_ACCOUNT_CODE', 'رمز الحساب إلزامي.')
      if (db.accounts.some((a) => a.companyId === companyId && a.code === code))
        return apiError(
          409,
          'DUPLICATE_ACCOUNT_CODE',
          `رمز الحساب '${code}' مستخدم مسبقًا في شجرة حسابات هذه الشركة.`,
        )

      const accountType = (asNum(payload.accountType, AccountType.Asset) || AccountType.Asset) as AccountType
      const parentAccountId = asStr(payload.parentAccountId) || null
      let level = 1
      let parentLineage = ''

      if (parentAccountId) {
        const parent = db.accounts.find(
          (a) => a.id === parentAccountId && a.companyId === companyId,
        )
        if (!parent)
          return apiError(
            400,
            'INVALID_ACCOUNT_HIERARCHY',
            `الحساب الأب المحدد (${parentAccountId}) غير موجود في شجرة حسابات الشركة.`,
          )

        level = parent.level + 1
        if (level > company.maxAccountDepth)
          return apiError(
            400,
            'ACCOUNT_DEPTH_EXCEEDED',
            `تجاوز الحد الأقصى لعمق شجرة الحسابات المسموح به للشركة (${company.maxAccountDepth} مستويات). محاولة إضافة حساب في المستوى (${level}).`,
          )
        if (accountType !== parent.accountType)
          return apiError(
            400,
            'INVALID_ACCOUNT_HIERARCHY',
            `نوع الحساب الجديد (${TYPE_NAME[accountType]}) يجب أن يطابق نوع الحساب الأب (${TYPE_NAME[parent.accountType]}).`,
          )

        parentLineage = parent.lineagePath
        if (!parent.isHeader) {
          parent.isHeader = true
          parent.isPostable = false
          parent.updatedAtUtc = nowIso()
        }
      }

      const isHeader = asBool(payload.isHeader)
      const account: AccountRow = {
        id: uid('acct'),
        companyId,
        code,
        nameArabic: asStr(payload.nameArabic).trim(),
        nameEnglish: asStr(payload.nameEnglish).trim() || asStr(payload.nameArabic).trim(),
        accountType,
        normalBalance: (asNullOrNum(payload.normalBalance) ??
          (accountType === AccountType.Asset || accountType === AccountType.Expense ? 1 : 2)) as 1 | 2,
        classification: (asNullOrNum(payload.classification) ??
          (accountType === AccountType.Revenue || accountType === AccountType.Expense ? 2 : 1)) as 1 | 2,
        level,
        parentAccountId,
        isHeader,
        isPostable: isHeader ? false : asBool(payload.isPostable, true),
        isActive: true,
        systemRole: asNullOrNum(payload.systemRole) as SystemAccountRole | null,
        lineagePath: parentLineage
          ? `${parentLineage.replace(/\/$/, '')}/${code}/`
          : `/${code}/`,
        description: asStr(payload.description) || null,
        currencyCode: asStr(payload.currencyCode) || company.baseCurrency,
        createdAtUtc: nowIso(),
        updatedAtUtc: null,
      }

      db.accounts.push(account)
      return { status: 201, body: toAccountDto(db, account) }
    }

    const accountMatch = pathname.match(/^\/api\/accounts\/([^/]+)$/)
    if (accountMatch) {
      const accountId = accountMatch[1]
      const companyId = asStr(searchParams.get('companyId'))

      if (method === 'GET') {
        const account = db.accounts.find((a) => a.id === accountId && a.companyId === companyId)
        if (!account)
          return notFound(`الحساب برقم (${accountId}) غير موجود في الشركة.`)
        return { status: 200, body: toAccountDto(db, account) }
      }

      if (method === 'PUT') {
        const account = db.accounts.find((a) => a.id === accountId && a.companyId === companyId)
        if (!account)
          return apiError(
            400,
            'ACCOUNT_NOT_FOUND',
            `الحساب (${accountId}) غير موجود في الشركة (${companyId}).`,
          )

        account.nameArabic = asStr(payload.nameArabic).trim() || account.nameArabic
        account.nameEnglish = asStr(payload.nameEnglish).trim() || account.nameArabic
        account.description = asStr(payload.description) || null
        account.currencyCode = asStr(payload.currencyCode) || account.currencyCode
        account.isActive = asBool(payload.isActive, true)
        account.updatedAtUtc = nowIso()

        return { status: 200, body: toAccountDto(db, account) }
      }

      if (method === 'DELETE') {
        const index = db.accounts.findIndex((a) => a.id === accountId && a.companyId === companyId)
        if (index === -1) return notFound(`الحساب برقم (${accountId}) غير موجود.`)

        const account = db.accounts[index]
        const children = db.accounts.filter((a) => a.parentAccountId === account.id)
        if (children.length)
          return apiError(
            400,
            'INVALID_ACCOUNT_HIERARCHY',
            `لا يمكن حذف الحساب '${account.code}' لوجود ${children.length} حسابات فرعية تابعة له.`,
          )

        if (db.mappings.some((m) => m.companyId === companyId && m.accountId === account.id))
          return apiError(
            400,
            'ACCOUNT_MAPPED_TO_ROLE',
            `لا يمكن حذف الحساب '${account.code}' لأنه مربوط كدور نظامي أساسي للشركة.`,
          )

        db.accounts.splice(index, 1)
        return { status: 204 }
      }
    }

    /* --------------------------- محرك التهيئة --------------------------- */
    if (pathname === '/api/initialization/validate' && method === 'POST') {
      const companyId = asStr(payload.companyId)
      const templateId = asStr(payload.templateId)

      const errors: string[] = []
      const warnings: string[] = []

      const company = findCompany(companyId)
      const template = db.templates.find((t) => t.id === templateId)

      if (!company) {
        return {
          status: 200,
          body: {
            canInitialize: false,
            isCompanyAlreadyInitialized: false,
            existingAccountsCount: 0,
            companyMaxDepth: 0,
            templateMaxDepth: 0,
            depthCompatible: false,
            validationErrors: [`الشركة برقم (${companyId}) غير موجودة في النظام.`],
            validationWarnings: [],
          },
        }
      }

      if (!template) {
        return {
          status: 200,
          body: {
            canInitialize: false,
            isCompanyAlreadyInitialized: false,
            existingAccountsCount: 0,
            companyMaxDepth: company.maxAccountDepth,
            templateMaxDepth: 0,
            depthCompatible: false,
            validationErrors: [`قالب شجرة الحسابات برقم (${templateId}) غير موجود.`],
            validationWarnings: [],
          },
        }
      }

      const accounts = db.accounts.filter((a) => a.companyId === companyId)
      const templateMaxDepth = template.nodes.length
        ? Math.max(...template.nodes.map((n) => n.level))
        : 0
      const depthCompatible = templateMaxDepth <= company.maxAccountDepth

      if (!depthCompatible)
        errors.push(
          `عمق شجرة القالب (${templateMaxDepth} مستويات) يتجاوز الحد الأقصى المسموح به للشركة (${company.maxAccountDepth} مستويات). يرجى زيادة حد العمق المسموح للشركة أو اختيار قالب ملائم.`,
        )

      if (company.isCoaInitialized || accounts.length)
        warnings.push(
          `الشركة تحتوي بالفعل على ${accounts.length} حساب. يجب استخدام وضع الدمج الآمن (Idempotent Merge) لتجنب أخطاء تكرار البيانات.`,
        )

      return {
        status: 200,
        body: {
          canInitialize: errors.length === 0,
          isCompanyAlreadyInitialized: company.isCoaInitialized || accounts.length > 0,
          existingAccountsCount: accounts.length,
          companyMaxDepth: company.maxAccountDepth,
          templateMaxDepth,
          depthCompatible,
          validationErrors: errors,
          validationWarnings: warnings,
        },
      }
    }

    if (pathname === '/api/initialization/initialize' && method === 'POST') {
      const companyId = asStr(payload.companyId)
      const templateId = asStr(payload.templateId)
      const mode = asNum(payload.mode, 1)
      const autoMap = asBool(payload.autoMapSystemRoles, true)
      const prefix = asStr(payload.accountCodePrefix) || null

      const started = Date.now()
      const company = findCompany(companyId)
      if (!company)
        return apiError(400, 'COMPANY_NOT_FOUND', `الشركة المطلوبة (${companyId}) غير موجودة.`)

      const template = db.templates.find((t) => t.id === templateId)
      if (!template)
        return apiError(400, 'TEMPLATE_NOT_FOUND', `قالب دليل الحسابات (${templateId}) غير موجود.`)

      if (!template.nodes.length)
        return apiError(
          400,
          'EMPTY_TEMPLATE',
          `القالب '${template.nameArabic}' لا يحتوي على أي بنود حسابات هيكلية.`,
        )

      const templateMaxDepth = Math.max(...template.nodes.map((n) => n.level))
      if (templateMaxDepth > company.maxAccountDepth)
        return apiError(
          400,
          'ACCOUNT_DEPTH_EXCEEDED',
          `تجاوز الحد الأقصى لعمق شجرة الحسابات المسموح به للشركة (${company.maxAccountDepth} مستويات). محاولة إضافة حساب في المستوى (${templateMaxDepth}).`,
        )

      const existingAccounts = db.accounts.filter((a) => a.companyId === companyId)
      if (existingAccounts.length && mode === 1)
        return apiError(
          409,
          'COMPANY_ALREADY_INITIALIZED',
          `شركة '${company.nameArabic}' مهيأة مسبقًا وتحتوي على ${existingAccounts.length} حساب. استخدم وضع الدمج الآمن (Idempotent Merge) لإكمال الحسابات الناقصة.`,
        )

      // المحاكاة الجافة: لا يتم حفظ أي تغييرات
      if (mode === 3) {
        const existingCodes = new Set(existingAccounts.map((a) => a.code))
        const toCreate = template.nodes.filter((n) => !existingCodes.has(`${prefix ?? ''}${n.code}`)).length
        const rolesToMap = template.nodes.filter((n) => n.defaultSystemRole).length
        return {
          status: 200,
          body: {
            isSuccess: true,
            companyId: company.id,
            companyName: company.nameArabic,
            templateId: template.id,
            templateName: template.nameArabic,
            status: 2,
            accountsCreatedCount: toCreate,
            systemRolesMappedCount: rolesToMap,
            maxDepthEnforced: company.maxAccountDepth,
            durationMs: Date.now() - started,
            message: `[محاكاة جافة Dry-Run] سيتم إنشاء ${toCreate} حساب، وتعيين ${rolesToMap} دور نظامي دون تعديل قاعدة البيانات.`,
            warnings: ['تم التشغيل بوضع المحاكاة الجافة، لم يتم حفظ أي تغييرات.'],
            mappedRoles: [],
          },
        }
      }

      const { created } = generateCompanyAccounts(db, companyId, template, {
        accountCodePrefix: prefix,
        baseCurrency: company.baseCurrency,
        createdAtUtc: nowIso(),
      })
      const mapped = mapTemplateRoles(db, companyId, template, prefix, nowIso(), autoMap)

      company.isCoaInitialized = true
      company.initializedFromTemplateId = template.id
      company.initializedAtUtc = nowIso()

      const durationMs = Date.now() - started
      const status = created > 0 ? 2 : 4 // Success | Reconciled

      db.auditLogs.unshift({
        id: uid('log'),
        companyId: company.id,
        templateId: template.id,
        templateName: template.nameArabic,
        status,
        accountsCreatedCount: created,
        systemRolesMappedCount: mapped,
        executionDurationMs: durationMs,
        errorMessage: null,
        timestampUtc: nowIso(),
        detailsJson: JSON.stringify({ mode, autoMapSystemRoles: autoMap, prefix }),
      })

      const mappedRoles = db.mappings
        .filter((m) => m.companyId === companyId)
        .map((m) => toMappingDto(db, m))

      return {
        status: 200,
        body: {
          isSuccess: true,
          companyId: company.id,
          companyName: company.nameArabic,
          templateId: template.id,
          templateName: template.nameArabic,
          status,
          accountsCreatedCount: created,
          systemRolesMappedCount: mapped,
          maxDepthEnforced: company.maxAccountDepth,
          durationMs,
          message:
            created > 0
              ? `تمت تهيئة دليل الحسابات بنجاح. تم إنشاء ${created} حساب وتعيين ${mapped} دور نظامي.`
              : 'تمت مطابقة دليل الحسابات، جميع الحسابات موجودة مسبقًا.',
          warnings: [],
          mappedRoles,
        },
      }
    }

    const auditMatch = pathname.match(/^\/api\/initialization\/audit-logs\/([^/]+)$/)
    if (auditMatch && method === 'GET') {
      const logs = db.auditLogs
        .filter((l) => l.companyId === auditMatch[1])
        .sort((a, b) => (a.timestampUtc < b.timestampUtc ? 1 : -1))
      return { status: 200, body: logs }
    }

    /* ------------------------- الأدوار النظامية ------------------------- */
    if (pathname === '/api/system-accounts/validate-critical' && method === 'GET') {
      const companyId = asStr(searchParams.get('companyId'))
      if (!companyId) return apiError(400, 'COMPANY_ID_REQUIRED', 'معرف الشركة إلزامي.')

      const critical = [
        SystemAccountRole.CashOnHand,
        SystemAccountRole.AccountsReceivable,
        SystemAccountRole.AccountsPayable,
        SystemAccountRole.SalesRevenue,
        SystemAccountRole.CostOfGoodsSold,
        SystemAccountRole.RetainedEarnings,
      ]
      const mappedRoles = db.mappings.filter((m) => m.companyId === companyId).map((m) => m.role)
      const complete = critical.every((role) => mappedRoles.includes(role))

      return {
        status: 200,
        body: {
          companyId,
          allCriticalRolesMapped: complete,
          message: complete
            ? 'كافة الأدوار النظامية الحرجة مكتملة التعيين.'
            : 'تنبيه: بعض الأدوار النظامية الأساسية غير معينة بعد (مثل الصندوق، العملاء، الموردين، أو الأرباح المبقاة).',
        },
      }
    }

    if (pathname === '/api/system-accounts' && method === 'GET') {
      const companyId = asStr(searchParams.get('companyId'))
      if (!companyId) return apiError(400, 'COMPANY_ID_REQUIRED', 'معرف الشركة إلزامي.')

      const mappings = db.mappings
        .filter((m) => m.companyId === companyId)
        .sort((a, b) => a.role - b.role)
        .map((m) => toMappingDto(db, m))
      return { status: 200, body: mappings }
    }

    if (pathname === '/api/system-accounts' && method === 'POST') {
      const companyId = asStr(searchParams.get('companyId'))
      if (!companyId) return apiError(400, 'COMPANY_ID_REQUIRED', 'معرف الشركة إلزامي.')

      const accountId = asStr(payload.accountId)
      const role = asNum(payload.role, SystemAccountRole.CashOnHand) as SystemAccountRole
      const isLocked = asBool(payload.isLocked)
      const forceIfLocked = asBool(payload.forceIfLocked)
      const notes = asStr(payload.notes) || null

      const account = db.accounts.find((a) => a.companyId === companyId && a.id === accountId)
      if (!account)
        return apiError(
          400,
          'ACCOUNT_NOT_FOUND',
          `الحساب المحاسبي (${accountId}) غير موجود في الشركة (${companyId}).`,
        )

      if (!account.isPostable || account.isHeader)
        return apiError(
          400,
          'SYSTEM_ACCOUNT_MAPPING_ERROR',
          `الحساب '${account.code} - ${account.nameArabic}' هو حساب رئيسي/تجميعي، والأدوار النظامية تتطلب حسابات تحليلية تقبل الترحيل فقط.`,
        )

      const expectedType = EXPECTED_ROLE_TYPE[role]
      if (expectedType && account.accountType !== expectedType)
        return apiError(
          400,
          'SYSTEM_ACCOUNT_MAPPING_ERROR',
          `نوع الحساب '${TYPE_NAME[account.accountType]}' غير متوافق مع الدور النظامي '${ROLE_NAME[role]}'. النوع المحاسبي المتوقع هو '${TYPE_NAME[expectedType]}'.`,
        )

      const existing = db.mappings.find((m) => m.companyId === companyId && m.role === role)
      if (existing) {
        if (existing.isLocked && !forceIfLocked)
          return apiError(
            400,
            'SYSTEM_ACCOUNT_MAPPING_ERROR',
            `الدور النظامي '${ROLE_NAME[role]}' مقفل ولا يمكن تغييره إلا بصلاحية كسر القفل الاستثنائية.`,
          )
        existing.accountId = account.id
        existing.notes = notes ?? existing.notes
        existing.isLocked = isLocked
        existing.assignedAtUtc = nowIso()
      } else {
        db.mappings.push({
          id: uid('map'),
          companyId,
          role,
          accountId: account.id,
          isLocked,
          assignedAtUtc: nowIso(),
          notes,
        })
      }

      account.systemRole = role
      const mapping = db.mappings.find((m) => m.companyId === companyId && m.role === role)!
      return { status: 200, body: toMappingDto(db, mapping) }
    }

    const roleMatch = pathname.match(/^\/api\/system-accounts\/([^/]+)$/)
    if (roleMatch && method === 'GET') {
      const companyId = asStr(searchParams.get('companyId'))
      if (!companyId) return apiError(400, 'COMPANY_ID_REQUIRED', 'معرف الشركة إلزامي.')

      const roleValue = Number(roleMatch[1])
      const mapping = db.mappings.find(
        (m) => m.companyId === companyId && m.role === roleValue,
      )
      const account = mapping ? db.accounts.find((a) => a.id === mapping.accountId) : undefined

      if (!account)
        return notFound(
          `الدور النظامي '${ROLE_NAME[roleValue] ?? roleMatch[1]}' غير مرتبط بأي حساب مالي في هذه الشركة بعد.`,
        )

      return { status: 200, body: toAccountDto(db, account) }
    }

    return apiError(404, 'ENDPOINT_NOT_FOUND', `المسار غير موجود في واجهة المحاكاة: ${method} ${pathname}`)
  }

  return { db, handled }
}

/** توحيد المسارات البديلة المعلنة في الـ Controllers ([Route("api/[controller]")] + [Route("api/initialization")]) */
function normalizePath(pathname: string): string {
  return pathname
    .replace(/\/api\/coainitialization\//i, '/api/initialization/')
    .replace(/\/api\/coatemplates\//i, '/api/templates/')
    .replace(/\/api\/systemaccounts\//i, '/api/system-accounts/')
    .replace(/\/+$/, '') || pathname
}
