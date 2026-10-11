import { http } from '@/lib/http'
import { normalizeCompany } from './normalize'
import type { CompanyDto, CreateCompanyRequest, UpdateCompanyRequest } from './types'

export const companyKeys = {
  all: ['companies'] as const,
  list: () => [...companyKeys.all, 'list'] as const,
  detail: (companyId: string) => [...companyKeys.all, 'detail', companyId] as const,
}

export const companiesApi = {
  list: async (signal?: AbortSignal): Promise<CompanyDto[]> => {
    const raw = await http.get<Record<string, unknown>[]>('/api/companies', undefined, signal)
    return (raw ?? []).map(normalizeCompany)
  },

  byId: async (companyId: string, signal?: AbortSignal): Promise<CompanyDto> => {
    const raw = await http.get<Record<string, unknown>>(`/api/companies/${companyId}`, undefined, signal)
    return normalizeCompany(raw)
  },

  create: async (body: CreateCompanyRequest): Promise<CompanyDto> => {
    const raw = await http.post<Record<string, unknown>>('/api/companies', body)
    return normalizeCompany(raw)
  },

  update: async (companyId: string, body: UpdateCompanyRequest): Promise<CompanyDto> => {
    const raw = await http.put<Record<string, unknown>>(`/api/companies/${companyId}`, body)
    return normalizeCompany(raw)
  },

  /** PUT /api/companies/{id}/depth — يستقبل رقمًا خامًا في متن الطلب (كما في الـ Controller) */
  updateDepth: async (companyId: string, maxDepth: number): Promise<CompanyDto> => {
    const raw = await http.put<Record<string, unknown>>(
      `/api/companies/${companyId}/depth`,
      maxDepth,
    )
    return normalizeCompany(raw)
  },
}
