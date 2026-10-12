import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPE_OPTIONS,
  ACCOUNT_TYPE_TONE,
  CRITICAL_SYSTEM_ROLES,
  SYSTEM_ROLE_LABEL,
} from '@/api/enums'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card'
import {
  AlertTriangleIcon,
  BuildingIcon,
  CheckCircleIcon,
  HistoryIcon,
  LayersIcon,
  LinkIcon,
  SparklesIcon,
  TreeIcon,
} from '@/components/ui/icons'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { useSelectedCompany } from '@/hooks/useSelectedCompany'
import { useCompaniesQuery } from '@/features/companies/hooks'
import { useTemplatesQuery } from '@/features/templates/hooks'
import { useFlatAccountsQuery } from '@/features/accounts/hooks'
import { useAuditLogsQuery } from '@/features/initialization/hooks'
import { useCriticalRolesQuery, useSystemAccountsQuery } from '@/features/system-accounts/hooks'

export function DashboardPage() {
  const { selectedCompany, selectedCompanyId } = useSelectedCompany()
  const companiesQuery = useCompaniesQuery()
  const templatesQuery = useTemplatesQuery()
  const accountsQuery = useFlatAccountsQuery({ companyId: selectedCompanyId ?? 'none' }, Boolean(selectedCompanyId))
  const mappingsQuery = useSystemAccountsQuery(selectedCompanyId)
  const criticalQuery = useCriticalRolesQuery(selectedCompanyId)
  const auditQuery = useAuditLogsQuery(selectedCompanyId)

  const accounts = accountsQuery.data ?? []
  const mappings = mappingsQuery.data ?? []
  const companies = companiesQuery.data ?? []
  const templates = templatesQuery.data ?? []
  const lastLog = auditQuery.data?.[0]

  const byType = useMemo(
    () =>
      ACCOUNT_TYPE_OPTIONS.map((option) => ({
        ...option,
        count: accounts.filter((account) => account.accountType === option.value).length,
      })),
    [accounts],
  )
  const maxTypeCount = Math.max(1, ...byType.map((item) => item.count))

  const mappedRoles = new Set(mappings.map((mapping) => mapping.role))
  const missingCritical = CRITICAL_SYSTEM_ROLES.filter((role) => !mappedRoles.has(role))

  return (
    <div className="space-y-4">
      <PageHeader
        title={`مرحبًا بك في منصة دليل الحسابات`}
        description="لوحة متابعة شاملة للشركات، القوالب المعيارية، شجرة الحسابات، أدوار الحسابات النظامية، وسجلات التهيئة."
        meta={
          selectedCompany ? (
            <>
              <Badge tone="brand">{selectedCompany.nameArabic}</Badge>
              <Badge tone="slate">{selectedCompany.code}</Badge>
              <Badge tone="violet">حد العمق {selectedCompany.maxAccountDepth}</Badge>
              {selectedCompany.isCoaInitialized ? (
                <Badge tone="emerald" dot>
                  الشجرة مهيأة
                </Badge>
              ) : (
                <Badge tone="amber" dot>
                  بانتظار التهيئة
                </Badge>
              )}
            </>
          ) : null
        }
        actions={
          <>
            <Link to="/initialization">
              <Button variant="secondary" icon={<SparklesIcon width={15} height={15} />}>
                تهيئة دليل الحسابات
              </Button>
            </Link>
            <Link to="/accounts">
              <Button variant="outline" icon={<TreeIcon width={15} height={15} />}>
                استعراض الشجرة
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="الشركات المسجلة"
          value={formatNumber(companies.length)}
          hint={`${formatNumber(companies.filter((company) => company.isCoaInitialized).length)} شركة مهيأة`}
          icon={<BuildingIcon width={18} height={18} />}
        />
        <StatCard
          label="القوالب المتاحة"
          value={formatNumber(templates.length)}
          hint={`${formatNumber(templates.reduce((total, template) => total + template.totalNodesCount, 0))} بند محاسبي معياري`}
          tone="sky"
          icon={<LayersIcon width={18} height={18} />}
        />
        <StatCard
          label="حسابات الشركة المختارة"
          value={formatNumber(accounts.length)}
          hint={`${formatNumber(accounts.filter((account) => account.isPostable).length)} حساب يقبل الترحيل`}
          tone="violet"
          icon={<TreeIcon width={18} height={18} />}
        />
        <StatCard
          label="الأدوار النظامية المرتبطة"
          value={`${formatNumber(mappings.length)} / 21`}
          hint={
            missingCritical.length
              ? `${formatNumber(missingCritical.length)} دور حرج بحاجة لربط`
              : 'كل الأدوار الحرجة مربوطة'
          }
          tone={missingCritical.length ? 'amber' : 'emerald'}
          icon={<LinkIcon width={18} height={18} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="توزيع حسابات الشركة حسب النوع المحاسبي"
            description={
              selectedCompany
                ? `${selectedCompany.nameArabic} — تحليل مبني على استعلام الحسابات المسطّحة`
                : 'اختر شركة لعرض التوزيع'
            }
          />
          <CardBody className="space-y-3">
            {byType.map((item) => (
              <div key={item.value}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-700">{item.label}</span>
                  <span className="tabular-nums text-ink-500">{formatNumber(item.count)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={
                      ACCOUNT_TYPE_TONE[item.value] === 'sky'
                        ? 'h-full rounded-full bg-sky-500'
                        : ACCOUNT_TYPE_TONE[item.value] === 'rose'
                          ? 'h-full rounded-full bg-rose-500'
                          : ACCOUNT_TYPE_TONE[item.value] === 'violet'
                            ? 'h-full rounded-full bg-violet-500'
                            : ACCOUNT_TYPE_TONE[item.value] === 'emerald'
                              ? 'h-full rounded-full bg-emerald-500'
                              : 'h-full rounded-full bg-amber-500'
                    }
                    style={{ width: `${(item.count / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {accounts.length === 0 ? (
              <p className="rounded-xl bg-ink-50 px-3 py-4 text-center text-xs text-ink-500">
                لا توجد حسابات لهذه الشركة بعد. ابدأ من «محرك التهيئة» لتوليد الشجرة من قالب معياري.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="الأدوار الحرجة"
              description={criticalQuery.data?.message}
              icon={
                criticalQuery.data?.allCriticalRolesMapped ? (
                  <CheckCircleIcon width={18} height={18} />
                ) : (
                  <AlertTriangleIcon width={18} height={18} />
                )
              }
              actions={
                <Link to="/system-accounts">
                  <Button size="sm" variant="outline">
                    إدارة الربط
                  </Button>
                </Link>
              }
            />
            <CardBody className="space-y-2">
              {CRITICAL_SYSTEM_ROLES.map((role) => (
                <div key={role} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink-700">{SYSTEM_ROLE_LABEL[role]}</span>
                  {mappedRoles.has(role) ? (
                    <Badge tone="emerald" dot>
                      مرتبط
                    </Badge>
                  ) : (
                    <Badge tone="rose" dot>
                      غير مرتبط
                    </Badge>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="آخر عملية تهيئة"
              description={lastLog ? formatDateTime(lastLog.timestampUtc) : 'لا توجد سجلات'}
              icon={<HistoryIcon width={18} height={18} />}
            />
            <CardBody className="space-y-2 text-xs text-ink-600">
              {lastLog ? (
                <>
                  <p>
                    <span className="font-semibold text-ink-800">القالب:</span> {lastLog.templateName}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-800">الحسابات المنشأة:</span>{' '}
                    {formatNumber(lastLog.accountsCreatedCount)}
                  </p>
                  <p>
                    <span className="font-semibold text-ink-800">الأدوار المرتبطة:</span>{' '}
                    {formatNumber(lastLog.systemRolesMappedCount)}
                  </p>
                  {selectedCompany?.initializedAtUtc ? (
                    <p className="text-ink-400">
                      تاريخ التهيئة الحالي: {formatDate(selectedCompany.initializedAtUtc)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-ink-500">لم تُنفَّذ أي عملية تهيئة لهذه الشركة بعد.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader
          title="اختصارات سريعة"
          description="المسارات الرئيسية للمنصة وعلاقتها بواجهات الـ API"
        />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              to: '/companies',
              title: 'الشركات',
              description: 'GET/POST /api/companies',
              icon: <BuildingIcon width={18} height={18} />,
            },
            {
              to: '/templates',
              title: 'القوالب',
              description: 'GET /api/templates',
              icon: <LayersIcon width={18} height={18} />,
            },
            {
              to: '/accounts',
              title: 'شجرة الحسابات',
              description: 'GET /api/accounts/tree',
              icon: <TreeIcon width={18} height={18} />,
            },
            {
              to: '/system-accounts',
              title: 'الأدوار النظامية',
              description: 'GET/POST /api/system-accounts',
              icon: <LinkIcon width={18} height={18} />,
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                {item.icon}
              </span>
              <span>
                <span className="block text-sm font-medium text-ink-800">{item.title}</span>
                <span className="block font-mono text-[10px] text-ink-500" dir="ltr">
                  {item.description}
                </span>
              </span>
            </Link>
          ))}
        </CardBody>
      </Card>

      <p className="text-center text-[11px] text-ink-400">
        {ACCOUNT_TYPE_OPTIONS.map((option) => ACCOUNT_TYPE_LABEL[option.value]).join(' • ')}
      </p>
    </div>
  )
}
