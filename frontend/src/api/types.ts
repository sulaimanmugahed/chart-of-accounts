/**
 * نسخ مطابقة (mirror) لعقود البيانات DTOs في الـ Backend (.NET / ChartOfAccounts).
 * الأسماء بصيغة camelCase تمامًا كما يُسلسلها ASP.NET Core افتراضيًا.
 */
import type {
  AccountClassification,
  AccountType,
  InitializationMode,
  InitializationStatus,
  NormalBalance,
  SystemAccountRole,
} from './enums'

/* ------------------------------- الشركات ------------------------------- */

export interface CompanyDto {
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
  totalAccountsCount: number
  isActive: boolean
}

export interface CreateCompanyRequest {
  code: string
  nameArabic: string
  nameEnglish: string
  taxNumber?: string | null
  baseCurrency: string
  fiscalYearStartMonth: number
  maxAccountDepth: number
}

export interface UpdateCompanyRequest {
  nameArabic: string
  nameEnglish: string
  taxNumber?: string | null
  baseCurrency: string
}

/* ------------------------------- القوالب ------------------------------- */

export interface CoaTemplateDto {
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
  totalNodesCount: number
  systemRolesDefinedCount: number
}

export interface CoaTemplateNodeDto {
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
  defaultSystemRoleName?: string | null
  description: string | null
}

export interface CoaTemplateDetailDto extends CoaTemplateDto {
  nodes: CoaTemplateNodeDto[]
}

export interface CreateTemplateNodeRequest {
  code: string
  nameArabic: string
  nameEnglish: string
  accountType: AccountType
  normalBalance?: NormalBalance | null
  classification?: AccountClassification | null
  level: number
  parentNodeCode?: string | null
  isHeader: boolean
  isPostable: boolean
  defaultSystemRole?: SystemAccountRole | null
  description?: string | null
}

export interface CreateTemplateRequest {
  code: string
  nameArabic: string
  nameEnglish: string
  industryType: string
  recommendedMaxDepth: number
  description?: string | null
  nodes: CreateTemplateNodeRequest[]
}

/* ----------------------------- الحسابات ------------------------------ */

export interface AccountDto {
  id: string
  companyId: string
  code: string
  nameArabic: string
  nameEnglish: string
  accountType: AccountType
  accountTypeName?: string
  normalBalance: NormalBalance
  normalBalanceName?: string
  classification: AccountClassification
  classificationName?: string
  level: number
  parentAccountId: string | null
  parentAccountCode: string | null
  isHeader: boolean
  isPostable: boolean
  isActive: boolean
  systemRole: SystemAccountRole | null
  systemRoleName?: string | null
  lineagePath: string
  description: string | null
  currencyCode: string | null
  childrenCount: number
}

export interface AccountTreeNodeDto {
  id: string
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
  children: AccountTreeNodeDto[]
}

export interface CreateAccountRequest {
  companyId: string
  code: string
  nameArabic: string
  nameEnglish: string
  accountType: AccountType
  normalBalance?: NormalBalance | null
  classification?: AccountClassification | null
  parentAccountId?: string | null
  isHeader: boolean
  isPostable: boolean
  systemRole?: SystemAccountRole | null
  description?: string | null
  currencyCode?: string | null
}

export interface UpdateAccountRequest {
  nameArabic: string
  nameEnglish: string
  description?: string | null
  currencyCode?: string | null
  isActive: boolean
}

export interface FlatAccountsParams {
  companyId: string
  maxLevel?: number | null
  postableOnly?: boolean | null
}

/* -------------------------- محرك التهيئة ---------------------------- */

export interface ValidatePrerequisitesRequest {
  companyId: string
  templateId: string
}

export interface ValidationResultDto {
  canInitialize: boolean
  isCompanyAlreadyInitialized: boolean
  existingAccountsCount: number
  companyMaxDepth: number
  templateMaxDepth: number
  depthCompatible: boolean
  validationErrors: string[]
  validationWarnings: string[]
}

export interface InitializeCoaRequest {
  companyId: string
  templateId: string
  mode: InitializationMode
  autoMapSystemRoles: boolean
  accountCodePrefix?: string | null
}

export interface SystemAccountMappingDto {
  id: string
  companyId: string
  role: SystemAccountRole
  roleName?: string
  accountId: string
  accountCode: string
  accountNameArabic: string
  accountNameEnglish: string
  accountType: AccountType
  isLocked: boolean
  assignedAtUtc: string
  notes: string | null
}

export interface InitializeCoaResultDto {
  isSuccess: boolean
  companyId: string
  companyName: string
  templateId: string
  templateName: string
  status: InitializationStatus
  accountsCreatedCount: number
  systemRolesMappedCount: number
  maxDepthEnforced: number
  durationMs: number
  message: string
  warnings: string[]
  mappedRoles: SystemAccountMappingDto[]
}

export interface CoaInitializationAuditLogDto {
  id: string
  companyId: string
  templateId: string
  templateName: string
  status: string
  accountsCreatedCount: number
  systemRolesMappedCount: number
  executionDurationMs: number
  errorMessage: string | null
  timestampUtc: string
  detailsJson: string | null
}

/* ------------------------- الأدوار النظامية -------------------------- */

export interface UpdateSystemAccountMappingRequest {
  role: SystemAccountRole
  accountId: string
  isLocked: boolean
  forceIfLocked: boolean
  notes?: string | null
}

export interface CriticalRolesValidationDto {
  companyId: string
  allCriticalRolesMapped: boolean
  message: string
}

/* ------------------------------- أخطاء ------------------------------- */

/** الخطأ الموحّد القادم من ExceptionHandlingMiddleware في الخادم */
export interface ApiErrorEnvelope {
  isSuccess?: boolean
  statusCode?: number
  errorCode?: string
  errorMessage?: string
  timestampUtc?: string
}

/** ردود NotFound في الـ Controllers: { message: "..." } */
export interface ApiMessageEnvelope {
  message?: string
}

/** ردود ProblemDetails (ModelState) في ASP.NET Core */
export interface ProblemDetailsEnvelope {
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string[]>
}
