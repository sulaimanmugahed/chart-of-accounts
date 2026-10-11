/**
 * اختبار دخان (Smoke Test) يعمل على الخادم دون متصفح:
 * يشغّل واجهة المحاكاة، يعبّئ ذاكرة TanStack Query بالبيانات، ثم يرسم كل صفحة
 * عبر renderToString ويتحقق من ظهور النصوص المتوقعة.
 *
 * التشغيل: npm run smoke
 */
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ToastProvider } from '@/components/ui/toast'
import { SelectedCompanyProvider } from '@/hooks/useSelectedCompany'
import { App } from '@/App'
import { companyKeys, companiesApi } from '@/api/companies'
import { accountKeys, accountsApi } from '@/api/accounts'
import { templateKeys, templatesApi } from '@/api/templates'
import { initializationKeys, initializationApi } from '@/api/initialization'
import { systemAccountKeys, systemAccountsApi } from '@/api/system-accounts'
import { createMockApi } from '@mock/handlers'
import { runFlows } from './smoke-flows'

const COMPANY_ID = 'c0000000-0000-4000-8000-000000000001'
const TEMPLATE_ID = '11111111-1111-1111-1111-111111111111'

function installMockFetch(): () => void {
  const api = createMockApi()
  const originalFetch = globalThis.fetch

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : String(input), 'http://localhost')
    const method = (init?.method ?? 'GET').toUpperCase()
    let body: unknown = undefined
    if (typeof init?.body === 'string' && init.body.length) {
      try {
        body = JSON.parse(init.body)
      } catch {
        body = init.body
      }
    }

    const response = api.handled({
      method,
      pathname: url.pathname,
      searchParams: url.searchParams,
      body,
    })

    return new Response(response.body === undefined ? null : JSON.stringify(response.body), {
      status: response.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }) as typeof fetch

  return () => {
    globalThis.fetch = originalFetch
  }
}

interface RouteCheck {
  path: string
  expect: string[]
}

const ROUTES: RouteCheck[] = [
  { path: '/', expect: ['مرحبًا بك في منصة دليل الحسابات', 'الشركات المسجلة', 'الأدوار الحرجة'] },
  { path: '/companies', expect: ['الشركات والمستأجرون', 'COMP-001', 'شركة الأمل للتجارة والاستيراد'] },
  { path: '/templates', expect: ['قوالب دليل الحسابات', 'COMMERCIAL_IFRS'] },
  { path: `/templates/${TEMPLATE_ID}`, expect: ['الأصول', 'الأصول المتداولة', 'صندوق النقدية الرئيسي'] },
  { path: '/accounts', expect: ['شجرة حسابات', 'الأصول', 'إجمالي الحسابات المعروضة'] },
  { path: '/initialization', expect: ['محرك تهيئة دليل الحسابات', 'نتيجة الفحص المسبق', 'سجلات التدقيق'] },
  { path: '/system-accounts', expect: ['أدوار الحسابات النظامية', 'الصندوق (النقدية بالصندوق)'] },
  { path: '/unknown-route', expect: ['الصفحة غير موجودة'] },
]

async function seedQueryCache(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: companyKeys.list(),
    queryFn: ({ signal }) => companiesApi.list(signal),
  })
  await queryClient.prefetchQuery({
    queryKey: templateKeys.list(),
    queryFn: ({ signal }) => templatesApi.list(signal),
  })
  await queryClient.prefetchQuery({
    queryKey: templateKeys.detail(TEMPLATE_ID),
    queryFn: ({ signal }) => templatesApi.byId(TEMPLATE_ID, signal),
  })
  await queryClient.prefetchQuery({
    queryKey: accountKeys.tree(COMPANY_ID),
    queryFn: ({ signal }) => accountsApi.tree(COMPANY_ID, signal),
  })
  await queryClient.prefetchQuery({
    queryKey: accountKeys.flat({ companyId: COMPANY_ID }),
    queryFn: ({ signal }) => accountsApi.flat({ companyId: COMPANY_ID }, signal),
  })
  await queryClient.prefetchQuery({
    queryKey: accountKeys.flat({ companyId: COMPANY_ID, maxLevel: null, postableOnly: false }),
    queryFn: ({ signal }) =>
      accountsApi.flat({ companyId: COMPANY_ID, maxLevel: null, postableOnly: false }, signal),
  })
  await queryClient.prefetchQuery({
    queryKey: initializationKeys.auditLogs(COMPANY_ID),
    queryFn: ({ signal }) => initializationApi.auditLogs(COMPANY_ID, signal),
  })
  await queryClient.prefetchQuery({
    queryKey: initializationKeys.validation(COMPANY_ID, TEMPLATE_ID),
    queryFn: () => initializationApi.validate({ companyId: COMPANY_ID, templateId: TEMPLATE_ID }),
  })
  await queryClient.prefetchQuery({
    queryKey: systemAccountKeys.list(COMPANY_ID),
    queryFn: ({ signal }) => systemAccountsApi.list(COMPANY_ID, signal),
  })
  await queryClient.prefetchQuery({
    queryKey: systemAccountKeys.critical(COMPANY_ID),
    queryFn: ({ signal }) => systemAccountsApi.validateCritical(COMPANY_ID, signal),
  })
}

export async function run(): Promise<void> {
  const restoreFetch = installMockFetch()
  const failures: string[] = []

  try {
    for (const route of ROUTES) {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: 5 * 60_000 } },
      })

      await seedQueryCache(queryClient)

      const html = renderToString(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(
            ToastProvider,
            null,
            createElement(
              SelectedCompanyProvider,
              null,
              createElement(
                MemoryRouter,
                { initialEntries: [route.path] },
                createElement(App),
              ),
            ),
          ),
        ),
      )

      const missing = route.expect.filter((needle) => !html.includes(needle))
      if (missing.length) {
        failures.push(`${route.path} → نصوص مفقودة: ${missing.join(' | ')}`)
        console.log(`✗ ${route.path} (${html.length} حرف) — مفقود: ${missing.join(', ')}`)
      } else {
        console.log(`✓ ${route.path} (${html.length} حرف)`)
      }
    }
    await runFlows()
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error))
  } finally {
    restoreFetch()
  }

  if (failures.length) {
    console.error('\nفشل اختبار الدخان:')
    failures.forEach((failure) => console.error(` - ${failure}`))
    throw new Error(`${failures.length} مسار/مسارات لم تجتز الاختبار`)
  }

  console.log('\nتم اجتياز اختبار الدخان لكل المسارات والتدفقات بنجاح.')
}
