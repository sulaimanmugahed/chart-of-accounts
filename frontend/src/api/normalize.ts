/**
 * تطبيع (Normalization) لردود الخادم: يضمن ثبات شكل البيانات في الواجهة
 * حتى لو أرسل الخادم قيم الـ enum كأرقام أو كأسماء نصية، أو أغفل حقولًا اختيارية.
 */
import type {
  AccountDto,
  AccountTreeNodeDto,
  CoaInitializationAuditLogDto,
  CoaTemplateDetailDto,
  CoaTemplateDto,
  CoaTemplateNodeDto,
  CompanyDto,
  InitializeCoaResultDto,
  SystemAccountMappingDto,
  ValidationResultDto,
} from './types'
import {
  AccountClassification,
  AccountType,
  InitializationStatus,
  NormalBalance,
  SystemAccountRole,
  readEnum,
  readOptionalEnum,
} from './enums'

type Raw = Record<string, unknown>

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : value === null || value === undefined ? fallback : String(value)

const asNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null
  return typeof value === 'string' ? value : String(value)
}

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : fallback

const asArray = (value: unknown): Raw[] => (Array.isArray(value) ? (value as Raw[]) : [])

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : []

/* ------------------------------- الشركات ------------------------------- */

export function normalizeCompany(raw: Raw): CompanyDto {
  return {
    id: asString(raw.id),
    code: asString(raw.code),
    nameArabic: asString(raw.nameArabic),
    nameEnglish: asString(raw.nameEnglish),
    taxNumber: asNullableString(raw.taxNumber),
    baseCurrency: asString(raw.baseCurrency, 'SAR'),
    fiscalYearStartMonth: asNumber(raw.fiscalYearStartMonth, 1),
    maxAccountDepth: asNumber(raw.maxAccountDepth, 5),
    isCoaInitialized: asBoolean(raw.isCoaInitialized),
    initializedFromTemplateId: asNullableString(raw.initializedFromTemplateId),
    initializedAtUtc: asNullableString(raw.initializedAtUtc),
    totalAccountsCount: asNumber(raw.totalAccountsCount),
    isActive: asBoolean(raw.isActive, true),
  }
}

/* ------------------------------- القوالب ------------------------------- */

export function normalizeTemplateNode(raw: Raw): CoaTemplateNodeDto {
  const accountType = readEnum(AccountType, raw.accountType, AccountType.Asset)
  return {
    id: asString(raw.id),
    code: asString(raw.code),
    nameArabic: asString(raw.nameArabic),
    nameEnglish: asString(raw.nameEnglish),
    accountType,
    normalBalance: readEnum(NormalBalance, raw.normalBalance, NormalBalance.Debit),
    classification: readEnum(
      AccountClassification,
      raw.classification,
      AccountClassification.BalanceSheet,
    ),
    level: asNumber(raw.level, 1),
    parentNodeCode: asNullableString(raw.parentNodeCode),
    isHeader: asBoolean(raw.isHeader),
    isPostable: asBoolean(raw.isPostable, true),
    defaultSystemRole: readOptionalEnum<SystemAccountRole>(SystemAccountRole, raw.defaultSystemRole),
    defaultSystemRoleName: asNullableString(raw.defaultSystemRoleName),
    description: asNullableString(raw.description),
  }
}

export function normalizeTemplate(raw: Raw): CoaTemplateDto {
  return {
    id: asString(raw.id),
    code: asString(raw.code),
    nameArabic: asString(raw.nameArabic),
    nameEnglish: asString(raw.nameEnglish),
    industryType: asString(raw.industryType, 'General'),
    recommendedMaxDepth: asNumber(raw.recommendedMaxDepth, 5),
    description: asNullableString(raw.description),
    isActive: asBoolean(raw.isActive, true),
    isSystemTemplate: asBoolean(raw.isSystemTemplate, true),
    version: asNumber(raw.version, 1),
    totalNodesCount: asNumber(raw.totalNodesCount),
    systemRolesDefinedCount: asNumber(raw.systemRolesDefinedCount),
  }
}

export function normalizeTemplateDetail(raw: Raw): CoaTemplateDetailDto {
  return {
    ...normalizeTemplate(raw),
    nodes: asArray(raw.nodes).map(normalizeTemplateNode),
  }
}

/* ----------------------------- الحسابات ------------------------------ */

export function normalizeAccount(raw: Raw): AccountDto {
  return {
    id: asString(raw.id),
    companyId: asString(raw.companyId),
    code: asString(raw.code),
    nameArabic: asString(raw.nameArabic),
    nameEnglish: asString(raw.nameEnglish),
    accountType: readEnum(AccountType, raw.accountType, AccountType.Asset),
    accountTypeName: asNullableString(raw.accountTypeName) ?? undefined,
    normalBalance: readEnum(NormalBalance, raw.normalBalance, NormalBalance.Debit),
    normalBalanceName: asNullableString(raw.normalBalanceName) ?? undefined,
    classification: readEnum(
      AccountClassification,
      raw.classification,
      AccountClassification.BalanceSheet,
    ),
    classificationName: asNullableString(raw.classificationName) ?? undefined,
    level: asNumber(raw.level, 1),
    parentAccountId: asNullableString(raw.parentAccountId),
    parentAccountCode: asNullableString(raw.parentAccountCode),
    isHeader: asBoolean(raw.isHeader),
    isPostable: asBoolean(raw.isPostable, true),
    isActive: asBoolean(raw.isActive, true),
    systemRole: readOptionalEnum<SystemAccountRole>(SystemAccountRole, raw.systemRole),
    systemRoleName: asNullableString(raw.systemRoleName),
    lineagePath: asString(raw.lineagePath),
    description: asNullableString(raw.description),
    currencyCode: asNullableString(raw.currencyCode),
    childrenCount: asNumber(raw.childrenCount),
  }
}

export function normalizeAccountTreeNode(raw: Raw): AccountTreeNodeDto {
  return {
    id: asString(raw.id),
    code: asString(raw.code),
    nameArabic: asString(raw.nameArabic),
    nameEnglish: asString(raw.nameEnglish),
    accountType: readEnum(AccountType, raw.accountType, AccountType.Asset),
    normalBalance: readEnum(NormalBalance, raw.normalBalance, NormalBalance.Debit),
    classification: readEnum(
      AccountClassification,
      raw.classification,
      AccountClassification.BalanceSheet,
    ),
    level: asNumber(raw.level, 1),
    parentAccountId: asNullableString(raw.parentAccountId),
    isHeader: asBoolean(raw.isHeader),
    isPostable: asBoolean(raw.isPostable, true),
    isActive: asBoolean(raw.isActive, true),
    systemRole: readOptionalEnum<SystemAccountRole>(SystemAccountRole, raw.systemRole),
    lineagePath: asString(raw.lineagePath),
    children: asArray(raw.children).map(normalizeAccountTreeNode),
  }
}

/* -------------------------- محرك التهيئة ---------------------------- */

export function normalizeValidationResult(raw: Raw): ValidationResultDto {
  return {
    canInitialize: asBoolean(raw.canInitialize),
    isCompanyAlreadyInitialized: asBoolean(raw.isCompanyAlreadyInitialized),
    existingAccountsCount: asNumber(raw.existingAccountsCount),
    companyMaxDepth: asNumber(raw.companyMaxDepth),
    templateMaxDepth: asNumber(raw.templateMaxDepth),
    depthCompatible: asBoolean(raw.depthCompatible, true),
    validationErrors: asStringArray(raw.validationErrors),
    validationWarnings: asStringArray(raw.validationWarnings),
  }
}

export function normalizeMapping(raw: Raw): SystemAccountMappingDto {
  return {
    id: asString(raw.id),
    companyId: asString(raw.companyId),
    role: readEnum(SystemAccountRole, raw.role, SystemAccountRole.CashOnHand),
    roleName: asNullableString(raw.roleName) ?? undefined,
    accountId: asString(raw.accountId),
    accountCode: asString(raw.accountCode),
    accountNameArabic: asString(raw.accountNameArabic),
    accountNameEnglish: asString(raw.accountNameEnglish),
    accountType: readEnum(AccountType, raw.accountType, AccountType.Asset),
    isLocked: asBoolean(raw.isLocked),
    assignedAtUtc: asString(raw.assignedAtUtc),
    notes: asNullableString(raw.notes),
  }
}

export function normalizeInitResult(raw: Raw): InitializeCoaResultDto {
  return {
    isSuccess: asBoolean(raw.isSuccess),
    companyId: asString(raw.companyId),
    companyName: asString(raw.companyName),
    templateId: asString(raw.templateId),
    templateName: asString(raw.templateName),
    status: readEnum(InitializationStatus, raw.status, InitializationStatus.Pending),
    accountsCreatedCount: asNumber(raw.accountsCreatedCount),
    systemRolesMappedCount: asNumber(raw.systemRolesMappedCount),
    maxDepthEnforced: asNumber(raw.maxDepthEnforced),
    durationMs: asNumber(raw.durationMs),
    message: asString(raw.message),
    warnings: asStringArray(raw.warnings),
    mappedRoles: asArray(raw.mappedRoles).map(normalizeMapping),
  }
}

export function normalizeAuditLog(raw: Raw): CoaInitializationAuditLogDto {
  return {
    id: asString(raw.id),
    companyId: asString(raw.companyId),
    templateId: asString(raw.templateId),
    templateName: asString(raw.templateName),
    status: asString(raw.status),
    accountsCreatedCount: asNumber(raw.accountsCreatedCount),
    systemRolesMappedCount: asNumber(raw.systemRolesMappedCount),
    executionDurationMs: asNumber(raw.executionDurationMs),
    errorMessage: asNullableString(raw.errorMessage),
    timestampUtc: asString(raw.timestampUtc),
    detailsJson: asNullableString(raw.detailsJson),
  }
}

/** قراءة حالة سجل التدقيق النصية (تأتي من ToString() في الخادم) */
export function auditStatusValue(raw: string): InitializationStatus {
  return readEnum(InitializationStatus, raw, InitializationStatus.Pending)
}
