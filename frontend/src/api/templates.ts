import { http } from '@/lib/http'
import { normalizeTemplate, normalizeTemplateDetail } from './normalize'
import type { CoaTemplateDetailDto, CoaTemplateDto, CreateTemplateRequest } from './types'

export const templateKeys = {
  all: ['templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const,
  detail: (templateId: string) => [...templateKeys.all, 'detail', templateId] as const,
  byCode: (code: string) => [...templateKeys.all, 'code', code] as const,
}

export const templatesApi = {
  list: async (signal?: AbortSignal): Promise<CoaTemplateDto[]> => {
    const raw = await http.get<Record<string, unknown>[]>('/api/templates', undefined, signal)
    return (raw ?? []).map(normalizeTemplate)
  },

  byId: async (templateId: string, signal?: AbortSignal): Promise<CoaTemplateDetailDto> => {
    const raw = await http.get<Record<string, unknown>>(`/api/templates/${templateId}`, undefined, signal)
    return normalizeTemplateDetail(raw)
  },

  byCode: async (code: string, signal?: AbortSignal): Promise<CoaTemplateDetailDto> => {
    const raw = await http.get<Record<string, unknown>>(
      `/api/templates/code/${encodeURIComponent(code)}`,
      undefined,
      signal,
    )
    return normalizeTemplateDetail(raw)
  },

  create: async (body: CreateTemplateRequest): Promise<CoaTemplateDto> => {
    const raw = await http.post<Record<string, unknown>>('/api/templates', body)
    return normalizeTemplate(raw)
  },
}
