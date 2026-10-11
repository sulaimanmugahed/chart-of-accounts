import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { initializationApi, initializationKeys } from '@/api/initialization'
import type { InitializeCoaRequest } from '@/api/types'
import { accountKeys } from '@/api/accounts'
import { companyKeys } from '@/api/companies'
import { systemAccountKeys } from '@/api/system-accounts'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/lib/errors'

/** فحص متطلبات التهيئة (POST /validate) — يُنفّذ تلقائيًا عند تغيير الشركة أو القالب */
export function useValidationQuery(companyId: string | null, templateId: string | null) {
  return useQuery({
    queryKey: initializationKeys.validation(companyId ?? 'none', templateId ?? 'none'),
    queryFn: () => initializationApi.validate({ companyId: companyId as string, templateId: templateId as string }),
    enabled: Boolean(companyId && templateId),
    staleTime: 0,
  })
}

export function useInitializeCompanyCoa() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (body: InitializeCoaRequest) => initializationApi.initialize(body),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: initializationKeys.all })
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
      queryClient.invalidateQueries({ queryKey: systemAccountKeys.all })

      if (result.warnings.length) {
        toast.warning('تمت التهيئة مع ملاحظات', result.message)
      } else {
        toast.success('تمت عملية التهيئة بنجاح', result.message)
      }
    },
    onError: (error) => {
      toast.error('فشلت عملية التهيئة', errorMessage(error))
    },
  })
}

export function useAuditLogsQuery(companyId: string | null) {
  return useQuery({
    queryKey: initializationKeys.auditLogs(companyId ?? 'none'),
    queryFn: ({ signal }) => initializationApi.auditLogs(companyId as string, signal),
    enabled: Boolean(companyId),
  })
}
