import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { templateKeys, templatesApi } from '@/api/templates'
import type { CreateTemplateRequest } from '@/api/types'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/lib/errors'

export function useTemplatesQuery() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: ({ signal }) => templatesApi.list(signal),
  })
}

export function useTemplateQuery(templateId: string | undefined) {
  return useQuery({
    queryKey: templateKeys.detail(templateId ?? 'none'),
    queryFn: ({ signal }) => templatesApi.byId(templateId as string, signal),
    enabled: Boolean(templateId),
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (body: CreateTemplateRequest) => templatesApi.create(body),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all })
      toast.success('تم إنشاء القالب', `${template.nameArabic} (${template.code})`)
    },
    onError: (error) => {
      toast.error('تعذّر إنشاء القالب', errorMessage(error))
    },
  })
}
