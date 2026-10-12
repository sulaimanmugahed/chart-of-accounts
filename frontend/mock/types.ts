import type {
  AccountClassification,
  AccountType,
  InitializationStatus,
  NormalBalance,
  SystemAccountRole,
} from '../src/api/enums.ts'

/** صفوف قاعدة البيانات الوهمية (بنفس حقول كيانات الـ Backend). */
export interface CompanyRow {
  id: string
  code: string
  nameArabic: string
  nameEnglish: string
  taxNumber: string | null
  baseCurrency: string
  fiscalYearStartMonth: number
  maxAccountDepth: number
  isCoaInitialized: boolean
  initializedFromTemplateId: string | null
  initializedAtUtc: string | null
  isActive: boolean
  createdAtUtc: string
}

export interface AccountRow {
  id: string
  companyId: string
  code: string
  nameArabic: string
  nameEnglish: string
  accountType: AccountType
  normalBalance: NormalBalance
  classification: AccountClassification
  level: number
  parentAccountId: string | null
  isHeader: boolean
  isPostable: boolean
  isActive: boolean
  systemRole: SystemAccountRole | null
  lineagePath: string
  description: string | null
  currencyCode: string | null
  createdAtUtc: string
  updatedAtUtc: string | null
}

export interface TemplateNodeRow {
  id: string
  code: string
  nameArabic: string
  nameEnglish: string
  accountType: AccountType
  normalBalance: NormalBalance
  classification: AccountClassification
  level: number
  parentNodeCode: string | null
  isHeader: boolean
  isPostable: boolean
  defaultSystemRole: SystemAccountRole | null
  description: string | null
}

export interface TemplateRow {
  id: string
  code: string
  nameArabic: string
  nameEnglish: string
  industryType: string
  recommendedMaxDepth: number
  description: string | null
  isActive: boolean
  isSystemTemplate: boolean
  version: number
  createdAtUtc: string
  nodes: TemplateNodeRow[]
}

export interface MappingRow {
  id: string
  companyId: string
  role: SystemAccountRole
  accountId: string
  isLocked: boolean
  assignedAtUtc: string
  notes: string | null
}

export interface AuditLogRow {
  id: string
  companyId: string
  templateId: string
  templateName: string
  status: InitializationStatus
  accountsCreatedCount: number
  systemRolesMappedCount: number
  executionDurationMs: number
  errorMessage: string | null
  timestampUtc: string
  detailsJson: string | null
}

export interface MockDb {
  companies: CompanyRow[]
  templates: TemplateRow[]
  accounts: AccountRow[]
  mappings: MappingRow[]
  auditLogs: AuditLogRow[]
}
