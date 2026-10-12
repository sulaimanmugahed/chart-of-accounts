import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { API_MODE, API_TARGET } from '@/lib/http'
import { Badge } from '@/components/ui/Badge'
import {
  BuildingIcon,
  DatabaseIcon,
  HomeIcon,
  LayersIcon,
  LinkIcon,
  SparklesIcon,
  TreeIcon,
} from '@/components/ui/icons'
import { CompanySwitcher } from './CompanySwitcher'

interface NavItem {
  to: string
  label: string
  description: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'لوحة المتابعة',
    description: 'نظرة عامة على الشركات والحسابات',
    icon: <HomeIcon width={18} height={18} />,
  },
  {
    to: '/companies',
    label: 'الشركات',
    description: 'إدارة المستأجرين وحدود العمق',
    icon: <BuildingIcon width={18} height={18} />,
  },
  {
    to: '/templates',
    label: 'قوالب دليل الحسابات',
    description: 'القوالب المعيارية والمخصصة',
    icon: <LayersIcon width={18} height={18} />,
  },
  {
    to: '/accounts',
    label: 'شجرة الحسابات',
    description: 'استعراض وإدارة حسابات الشركة',
    icon: <TreeIcon width={18} height={18} />,
  },
  {
    to: '/initialization',
    label: 'محرك التهيئة',
    description: 'التحقق والتهيئة الذرية وسجلات التدقيق',
    icon: <SparklesIcon width={18} height={18} />,
  },
  {
    to: '/system-accounts',
    label: 'الأدوار النظامية',
    description: 'ربط الحسابات بعمليات النظام',
    icon: <LinkIcon width={18} height={18} />,
  },
]

export function AppShell() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentTitle =
    NAV_ITEMS.find((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
    )?.label ?? 'دليل الحسابات'

  return (
    <div className="min-h-screen bg-ink-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[110rem]">
        {/* الشريط الجانبي */}
        <aside
          className={cn(
            'fixed inset-y-0 right-0 z-40 w-72 shrink-0 border-s border-ink-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0',
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-ink-200 px-5 py-4">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-700 text-white">
                <TreeIcon width={20} height={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">دليل الحسابات</p>
                <p className="text-[11px] text-ink-500">Chart of Accounts Platform</p>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-900 ring-1 ring-brand-100'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                          isActive ? 'bg-brand-700 text-white' : 'bg-ink-100 text-ink-500',
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block text-[11px] leading-4 text-ink-500">
                          {item.description}
                        </span>
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-ink-200 p-3">
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600">
                  <DatabaseIcon width={13} height={13} />
                  مصدر البيانات
                </p>
                <p className="mt-1 font-mono text-[10px] leading-4 break-all text-ink-500">
                  {API_TARGET}
                </p>
                <div className="mt-2">
                  {API_MODE === 'mock' ? (
                    <Badge tone="amber" dot>
                      واجهة محاكاة داخلية
                    </Badge>
                  ) : (
                    <Badge tone="emerald" dot>
                      واجهة .NET الفعلية
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            aria-label="إغلاق القائمة"
            className="fixed inset-0 z-30 bg-ink-900/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        {/* المحتوى */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/85 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs text-ink-600 lg:hidden"
                  onClick={() => setMobileOpen((current) => !current)}
                >
                  القائمة
                </button>
                <div>
                  <p className="text-[11px] text-ink-500">منصة دليل الحسابات</p>
                  <h1 className="text-base font-semibold text-ink-900">{currentTitle}</h1>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-3">
                <CompanySwitcher />
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>

          <footer className="border-t border-ink-200 px-6 py-3 text-center text-[11px] text-ink-400">
            مبني باستخدام React + TanStack Query + TanStack Table + React Hook Form — يتصل بواجهة
            ChartOfAccounts (.NET 10)
          </footer>
        </div>
      </div>
    </div>
  )
}
