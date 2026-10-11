import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useCompaniesQuery } from '@/features/companies/hooks'
import type { CompanyDto } from '@/api/types'

const STORAGE_KEY = 'coa:selected-company'

interface SelectedCompanyContextValue {
  companies: CompanyDto[]
  isLoading: boolean
  selectedCompanyId: string | null
  selectedCompany: CompanyDto | null
  selectCompany: (companyId: string) => void
}

const SelectedCompanyContext = createContext<SelectedCompanyContextValue | null>(null)

function readStoredCompanyId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function SelectedCompanyProvider({ children }: { children: ReactNode }) {
  const companiesQuery = useCompaniesQuery()
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data])
  const [storedCompanyId, setStoredCompanyId] = useState<string | null>(readStoredCompanyId)

  /**
   * الشركة المختارة تُشتق أثناء الرسم (بدون تأثير جانبي) لتفادي وميض الواجهة:
   * آخر شركة مختارة → أو أول شركة مهيأة → أو أول شركة متاحة.
   */
  const selectedCompany = useMemo<CompanyDto | null>(() => {
    const stored = companies.find((company) => company.id === storedCompanyId)
    if (stored) return stored
    return companies.find((company) => company.isCoaInitialized) ?? companies[0] ?? null
  }, [companies, storedCompanyId])

  // حفظ الاختيار التلقائي في التخزين المحلي
  useEffect(() => {
    if (!selectedCompany || selectedCompany.id === storedCompanyId) return
    try {
      window.localStorage.setItem(STORAGE_KEY, selectedCompany.id)
    } catch {
      /* تجاهل أخطاء التخزين المحلي */
    }
  }, [selectedCompany, storedCompanyId])

  const selectCompany = useCallback((companyId: string) => {
    setStoredCompanyId(companyId)
    try {
      window.localStorage.setItem(STORAGE_KEY, companyId)
    } catch {
      /* تجاهل أخطاء التخزين المحلي */
    }
  }, [])

  const value = useMemo<SelectedCompanyContextValue>(
    () => ({
      companies,
      isLoading: companiesQuery.isLoading,
      selectedCompanyId: selectedCompany?.id ?? null,
      selectedCompany,
      selectCompany,
    }),
    [companies, companiesQuery.isLoading, selectedCompany, selectCompany],
  )

  return (
    <SelectedCompanyContext.Provider value={value}>{children}</SelectedCompanyContext.Provider>
  )
}

export function useSelectedCompany(): SelectedCompanyContextValue {
  const context = useContext(SelectedCompanyContext)
  if (!context) {
    throw new Error('useSelectedCompany يجب استخدامه داخل SelectedCompanyProvider')
  }
  return context
}

/** يعيد معرف الشركة المختارة مع التأكيد على وجوده */
export function useRequiredCompanyId(): string {
  const { selectedCompanyId } = useSelectedCompany()
  if (!selectedCompanyId) throw new Error('لم يتم اختيار أي شركة بعد')
  return selectedCompanyId
}
