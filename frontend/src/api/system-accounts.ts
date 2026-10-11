import { http } from '@/lib/http'
import { normalizeAccount, normalizeMapping } from './normalize'
import type { SystemAccountRole } from './enums'
import type {
  AccountDto,
  CriticalRolesValidationDto,
  SystemAccountMappingDto,
  UpdateSystemAccountMappingRequest,
} from './types'

export const systemAccountKeys = {
  all: ['system-accounts'] as const,
  list: (companyId: string) => [...systemAccountKeys.all, 'list', companyId] as const,
  critical: (companyId: string) => [...systemAccountKeys.all, 'critical', companyId] as const,
  byRole: (companyId: string, role: SystemAccountRole) =>
    [...systemAccountKeys.all, 'role', companyId, role] as const,
}

export const systemAccountsApi = {
  /** GET /api/system-accounts?companyId= */
  list: async (companyId: string, signal?: AbortSignal): Promise<SystemAccountMappingDto[]> => {
    const raw = await http.get<Record<string, unknown>[]>(
      '/api/system-accounts',
      { companyId },
      signal,
    )
    return (raw ?? []).map(normalizeMapping)
  },

  /** GET /api/system-accounts/{role}?companyId= */
  byRole: async (
    companyId: string,
    role: SystemAccountRole,
    signal?: AbortSignal,
  ): Promise<AccountDto> => {
    const raw = await http.get<Record<string, unknown>>(
      `/api/system-accounts/${role}`,
      { companyId },
      signal,
    )
    return normalizeAccount(raw)
  },

  /** POST /api/system-accounts?companyId= */
  setMapping: async (
    companyId: string,
    body: UpdateSystemAccountMappingRequest,
  ): Promise<SystemAccountMappingDto> => {
    const raw = await http.post<Record<string, unknown>>(
      '/api/system-accounts',
      body,
      { companyId },
    )
    return normalizeMapping(raw)
  },

  /** GET /api/system-accounts/validate-critical?companyId= */
  validateCritical: async (
    companyId: string,
    signal?: AbortSignal,
  ): Promise<CriticalRolesValidationDto> => {
    const raw = await http.get<Record<string, unknown>>(
      '/api/system-accounts/validate-critical',
      { companyId },
      signal,
    )
    return {
      companyId: String(raw?.companyId ?? companyId),
      allCriticalRolesMapped: Boolean(raw?.allCriticalRolesMapped),
      message: String(raw?.message ?? ''),
    }
  },
}
