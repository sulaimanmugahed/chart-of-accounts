import { http } from '@/lib/http'
import { normalizeAuditLog, normalizeInitResult, normalizeValidationResult } from './normalize'
import type {
  CoaInitializationAuditLogDto,
  InitializeCoaRequest,
  InitializeCoaResultDto,
  ValidationResultDto,
  ValidatePrerequisitesRequest,
} from './types'

export const initializationKeys = {
  all: ['initialization'] as const,
  auditLogs: (companyId: string) => [...initializationKeys.all, 'audit-logs', companyId] as const,
  validation: (companyId: string, templateId: string) =>
    [...initializationKeys.all, 'validation', companyId, templateId] as const,
}

export const initializationApi = {
  /** POST /api/initialization/validate */
  validate: async (body: ValidatePrerequisitesRequest): Promise<ValidationResultDto> => {
    const raw = await http.post<Record<string, unknown>>('/api/initialization/validate', body)
    return normalizeValidationResult(raw)
  },

  /** POST /api/initialization/initialize */
  initialize: async (body: InitializeCoaRequest): Promise<InitializeCoaResultDto> => {
    const raw = await http.post<Record<string, unknown>>('/api/initialization/initialize', body)
    return normalizeInitResult(raw)
  },

  /** GET /api/initialization/audit-logs/{companyId} */
  auditLogs: async (
    companyId: string,
    signal?: AbortSignal,
  ): Promise<CoaInitializationAuditLogDto[]> => {
    const raw = await http.get<Record<string, unknown>[]>(
      `/api/initialization/audit-logs/${companyId}`,
      undefined,
      signal,
    )
    return (raw ?? []).map(normalizeAuditLog)
  },
}
