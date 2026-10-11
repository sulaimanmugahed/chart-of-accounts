import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { systemAccountKeys, systemAccountsApi } from '@/api/system-accounts'
import type { UpdateSystemAccountMappingRequest } from '@/api/types'
import { accountKeys } from '@/api/accounts'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/lib/errors'

export function useSystemAccountsQuery(companyId: string | null) {
  return useQuery({
    queryKey: systemAccountKeys.list(companyId ?? 'none'),
    queryFn: ({ signal }) => systemAccountsApi.list(companyId as string, signal),
    enabled: Boolean(companyId),
  })
}

export function useCriticalRolesQuery(companyId: string | null) {
  return useQuery({
    queryKey: systemAccountKeys.critical(companyId ?? 'none'),
    queryFn: ({ signal }) => systemAccountsApi.validateCritical(companyId as string, signal),
    enabled: Boolean(companyId),
  })
}

export function useSetRoleMapping() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({
      companyId,
      body,
    }: {
      companyId: string
      body: UpdateSystemAccountMappingRequest
    }) => systemAccountsApi.setMapping(companyId, body),
    onSuccess: (mapping) => {
      queryClient.invalidateQueries({ queryKey: systemAccountKeys.all })
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      toast.success('تم تحديث ربط الدور النظامي', `${mapping.accountCode} — ${mapping.accountNameArabic}`)
    },
    onError: (error) => {
      toast.error('تعذّر تحديث الربط', errorMessage(error))
    },
  })
}
