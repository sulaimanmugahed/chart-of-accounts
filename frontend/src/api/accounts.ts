import { http } from '@/lib/http'
import { normalizeAccount, normalizeAccountTreeNode } from './normalize'
import type {
  AccountDto,
  AccountTreeNodeDto,
  CreateAccountRequest,
  FlatAccountsParams,
  UpdateAccountRequest,
} from './types'

export const accountKeys = {
  all: ['accounts'] as const,
  tree: (companyId: string) => [...accountKeys.all, 'tree', companyId] as const,
  flat: (params: FlatAccountsParams) => [...accountKeys.all, 'flat', params] as const,
  detail: (companyId: string, accountId: string) =>
    [...accountKeys.all, 'detail', companyId, accountId] as const,
}

export const accountsApi = {
  /** GET /api/accounts/tree?companyId= */
  tree: async (companyId: string, signal?: AbortSignal): Promise<AccountTreeNodeDto[]> => {
    const raw = await http.get<Record<string, unknown>[]>(
      '/api/accounts/tree',
      { companyId },
      signal,
    )
    return (raw ?? []).map(normalizeAccountTreeNode)
  },

  /** GET /api/accounts?companyId=&maxLevel=&postableOnly= */
  flat: async (params: FlatAccountsParams, signal?: AbortSignal): Promise<AccountDto[]> => {
    const raw = await http.get<Record<string, unknown>[]>(
      '/api/accounts',
      {
        companyId: params.companyId,
        maxLevel: params.maxLevel ?? undefined,
        postableOnly: params.postableOnly ?? undefined,
      },
      signal,
    )
    return (raw ?? []).map(normalizeAccount)
  },

  /** GET /api/accounts/{id}?companyId= */
  byId: async (companyId: string, accountId: string, signal?: AbortSignal): Promise<AccountDto> => {
    const raw = await http.get<Record<string, unknown>>(
      `/api/accounts/${accountId}`,
      { companyId },
      signal,
    )
    return normalizeAccount(raw)
  },

  /** POST /api/accounts */
  create: async (body: CreateAccountRequest): Promise<AccountDto> => {
    const raw = await http.post<Record<string, unknown>>('/api/accounts', body)
    return normalizeAccount(raw)
  },

  /** PUT /api/accounts/{id}?companyId= */
  update: async (
    companyId: string,
    accountId: string,
    body: UpdateAccountRequest,
  ): Promise<AccountDto> => {
    const raw = await http.put<Record<string, unknown>>(
      `/api/accounts/${accountId}`,
      body,
      { companyId },
    )
    return normalizeAccount(raw)
  },

  /** DELETE /api/accounts/{id}?companyId= */
  remove: (companyId: string, accountId: string) =>
    http.delete<void>(`/api/accounts/${accountId}`, { companyId }),
}
