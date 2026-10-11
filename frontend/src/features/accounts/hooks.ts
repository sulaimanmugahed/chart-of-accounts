import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountKeys, accountsApi } from '@/api/accounts'
import type { CreateAccountRequest, FlatAccountsParams, UpdateAccountRequest } from '@/api/types'
import { companyKeys } from '@/api/companies'
import { systemAccountKeys } from '@/api/system-accounts'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/lib/errors'

/** شجرة الحسابات المتداخلة لشركة محددة */
export function useAccountsTreeQuery(companyId: string | null) {
  return useQuery({
    queryKey: accountKeys.tree(companyId ?? 'none'),
    queryFn: ({ signal }) => accountsApi.tree(companyId as string, signal),
    enabled: Boolean(companyId),
  })
}

/** قائمة الحسابات المسطّحة مع إمكانية الفلترة من الخادم */
export function useFlatAccountsQuery(params: FlatAccountsParams, enabled = true) {
  return useQuery({
    queryKey: accountKeys.flat(params),
    queryFn: ({ signal }) => accountsApi.flat(params, signal),
    enabled: enabled && Boolean(params.companyId),
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (body: CreateAccountRequest) => accountsApi.create(body),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
      toast.success('تم إنشاء الحساب', `${account.code} — ${account.nameArabic}`)
    },
    onError: (error) => {
      toast.error('تعذّر إنشاء الحساب', errorMessage(error))
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({
      companyId,
      accountId,
      body,
    }: {
      companyId: string
      accountId: string
      body: UpdateAccountRequest
    }) => accountsApi.update(companyId, accountId, body),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      queryClient.invalidateQueries({ queryKey: systemAccountKeys.all })
      toast.success('تم تحديث الحساب', `${account.code} — ${account.nameArabic}`)
    },
    onError: (error) => {
      toast.error('تعذّر تحديث الحساب', errorMessage(error))
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ companyId, accountId }: { companyId: string; accountId: string }) =>
      accountsApi.remove(companyId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
      queryClient.invalidateQueries({ queryKey: systemAccountKeys.all })
      toast.success('تم حذف الحساب')
    },
    onError: (error) => {
      toast.error('تعذّر حذف الحساب', errorMessage(error))
    },
  })
}
