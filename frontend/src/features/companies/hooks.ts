import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { companiesApi, companyKeys } from '@/api/companies'
import type { CreateCompanyRequest, UpdateCompanyRequest } from '@/api/types'
import { useToast } from '@/components/ui/toast'
import { errorMessage } from '@/lib/errors'
import { accountKeys } from '@/api/accounts'

export function useCompaniesQuery() {
  return useQuery({
    queryKey: companyKeys.list(),
    queryFn: ({ signal }) => companiesApi.list(signal),
  })
}

export function useCompanyQuery(companyId: string | null | undefined) {
  return useQuery({
    queryKey: companyKeys.detail(companyId ?? 'none'),
    queryFn: ({ signal }) => companiesApi.byId(companyId as string, signal),
    enabled: Boolean(companyId),
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (body: CreateCompanyRequest) => companiesApi.create(body),
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
      toast.success('تم إنشاء الشركة', `${company.nameArabic} (${company.code})`)
    },
    onError: (error) => {
      toast.error('تعذّر إنشاء الشركة', errorMessage(error))
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ companyId, body }: { companyId: string; body: UpdateCompanyRequest }) =>
      companiesApi.update(companyId, body),
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
      toast.success('تم تحديث بيانات الشركة', company.nameArabic)
    },
    onError: (error) => {
      toast.error('تعذّر تحديث بيانات الشركة', errorMessage(error))
    },
  })
}

export function useUpdateCompanyDepth() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ companyId, maxDepth }: { companyId: string; maxDepth: number }) =>
      companiesApi.updateDepth(companyId, maxDepth),
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all })
      queryClient.invalidateQueries({ queryKey: accountKeys.all })
      toast.success(
        'تم تحديث حد العمق الأقصى',
        `أصبح الحد الأقصى ${company.maxAccountDepth} مستويات لشركة ${company.nameArabic}`,
      )
    },
    onError: (error) => {
      toast.error('تعذّر تحديث حد العمق', errorMessage(error))
    },
  })
}
