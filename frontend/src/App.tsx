import { Link, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/feedback/States'
import { Button } from '@/components/ui/Button'
import { AccountsPage } from '@/features/accounts/AccountsPage'
import { CompaniesPage } from '@/features/companies/CompaniesPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { InitializationPage } from '@/features/initialization/InitializationPage'
import { SystemAccountsPage } from '@/features/system-accounts/SystemAccountsPage'
import { TemplateDetailPage } from '@/features/templates/TemplateDetailPage'
import { TemplatesPage } from '@/features/templates/TemplatesPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:templateId" element={<TemplateDetailPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/initialization" element={<InitializationPage />} />
        <Route path="/system-accounts" element={<SystemAccountsPage />} />
        <Route
          path="*"
          element={
            <div className="card-surface">
              <EmptyState
                title="الصفحة غير موجودة"
                description="الرابط الذي تحاول الوصول إليه غير متاح في المنصة."
                action={
                  <Link to="/">
                    <Button size="sm" variant="outline">
                      العودة للوحة المتابعة
                    </Button>
                  </Link>
                }
              />
            </div>
          }
        />
      </Route>
    </Routes>
  )
}
