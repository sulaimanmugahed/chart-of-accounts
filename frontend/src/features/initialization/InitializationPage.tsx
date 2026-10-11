import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import {
  INITIALIZATION_MODE_DESCRIPTION,
  INITIALIZATION_MODE_OPTIONS,
  INITIALIZATION_STATUS_LABEL,
  INITIALIZATION_STATUS_TONE,
  InitializationMode,
  InitializationStatus,
  SYSTEM_ROLE_LABEL,
  readEnum,
} from '@/api/enums'
import type {
  CoaInitializationAuditLogDto,
  InitializeCoaResultDto,
} from '@/api/types'
import { DataTable } from '@/components/data/DataTable'
import { clientTableFeatures } from '@/components/data/table-features'
import { Pagination, SortableHeader } from '@/components/data/table-parts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card'
import { Checkbox, Field, Input, RadioGroup, Select } from '@/components/ui/form'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  HistoryIcon,
  InfoIcon,
  PlayIcon,
  RefreshIcon,
  SparklesIcon,
  XCircleIcon,
} from '@/components/ui/icons'
import { formatDateTime, formatDuration, formatNumber } from '@/lib/format'
import { errorCode, errorMessage } from '@/lib/errors'
import { useSelectedCompany } from '@/hooks/useSelectedCompany'
import { useTemplatesQuery } from '@/features/templates/hooks'
import {
  useAuditLogsQuery,
  useInitializeCompanyCoa,
  useValidationQuery,
} from './hooks'

const schema = z.object({
  templateId: z.string().min(1, 'اختر القالب المحاسبي المراد تطبيقه'),
  mode: z.number({ error: 'اختر وضع التهيئة' }).int(),
  autoMapSystemRoles: z.boolean(),
  accountCodePrefix: z
    .string()
    .trim()
    .max(6, 'البادئة طويلة جدًا')
    .regex(/^[0-9A-Za-z]*$/, 'البادئة تقبل الأرقام والأحرف اللاتينية فقط')
    .optional(),
})

type FormValues = z.infer<typeof schema>

const emptyLogs: CoaInitializationAuditLogDto[] = []

/** حالة سجل التدقيق تصل كنص من الخادم (ToString) */
const statusOf = (raw: string): InitializationStatus =>
  readEnum(InitializationStatus, raw, InitializationStatus.Pending)
const logColumnHelper = createColumnHelper<typeof clientTableFeatures, CoaInitializationAuditLogDto>()

export function InitializationPage() {
  const { selectedCompany, selectedCompanyId } = useSelectedCompany()
  const templatesQuery = useTemplatesQuery()
  const initialize = useInitializeCompanyCoa()

  const [result, setResult] = useState<InitializeCoaResultDto | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      templateId: '',
      mode: InitializationMode.DryRun,
      autoMapSystemRoles: true,
      accountCodePrefix: '',
    },
  })

  const templateId = form.watch('templateId')
  const mode = form.watch('mode')

  const validationQuery = useValidationQuery(selectedCompanyId, templateId || null)
  const auditLogsQuery = useAuditLogsQuery(selectedCompanyId)

  const templates = templatesQuery.data ?? []

  // اختيار القالب الملائم تلقائيًا: قالب التهيئة الحالي أو أول قالب نشط
  useEffect(() => {
    if (templateId || !templates.length) return
    const preferred =
      templates.find((template) => template.id === selectedCompany?.initializedFromTemplateId) ??
      templates[0]
    form.setValue('templateId', preferred.id, { shouldValidate: true })
  }, [templates, templateId, selectedCompany, form])

  // وضع الدمج الآمن افتراضيًا للشركات المهيأة (تجنّب خطأ 409)
  useEffect(() => {
    if (selectedCompany?.isCoaInitialized && mode === InitializationMode.DryRun) {
      form.setValue('mode', InitializationMode.IdempotentMerge)
    }
  }, [selectedCompany, mode, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedCompanyId) return
    try {
      const response = await initialize.mutateAsync({
        companyId: selectedCompanyId,
        templateId: values.templateId,
        mode: values.mode as InitializationMode,
        autoMapSystemRoles: values.autoMapSystemRoles,
        accountCodePrefix: values.accountCodePrefix || null,
      })
      setResult(response)
      validationQuery.refetch()
    } catch {
      setResult(null)
    }
  })

  const selectedTemplate = templates.find((template) => template.id === templateId)
  const validation = validationQuery.data

  const logColumns = useMemo(
    () =>
      logColumnHelper.columns([
        logColumnHelper.accessor('timestampUtc', {
          id: 'timestampUtc',
          header: ({ column }) => <SortableHeader column={column}>التاريخ</SortableHeader>,
          cell: (info) => (
            <span className="text-xs text-ink-600">{formatDateTime(info.getValue())}</span>
          ),
        }),
        logColumnHelper.accessor((row) => statusOf(row.status), {
          id: 'status',
          header: 'الحالة',
          cell: ({ row }) => {
            const status = statusOf(row.original.status)
            return (
              <Badge tone={INITIALIZATION_STATUS_TONE[status]} dot>
                {INITIALIZATION_STATUS_LABEL[status]}
              </Badge>
            )
          },
        }),
        logColumnHelper.accessor('templateName', {
          id: 'templateName',
          header: 'القالب',
          cell: (info) => <span className="text-xs text-ink-700">{info.getValue()}</span>,
        }),
        logColumnHelper.accessor('accountsCreatedCount', {
          id: 'accountsCreatedCount',
          header: 'حسابات أُنشئت',
          cell: (info) => <span className="tabular-nums">{formatNumber(info.getValue())}</span>,
        }),
        logColumnHelper.accessor('systemRolesMappedCount', {
          id: 'systemRolesMappedCount',
          header: 'أدوار مرتبطة',
          cell: (info) => <span className="tabular-nums">{formatNumber(info.getValue())}</span>,
        }),
        logColumnHelper.accessor('executionDurationMs', {
          id: 'executionDurationMs',
          header: 'مدة التنفيذ',
          cell: (info) => (
            <span className="text-xs text-ink-500">{formatDuration(info.getValue())}</span>
          ),
        }),
        logColumnHelper.display({
          id: 'errorMessage',
          header: 'ملاحظات',
          cell: ({ row }) =>
            row.original.errorMessage ? (
              <span className="text-xs text-rose-600">{row.original.errorMessage}</span>
            ) : (
              <span className="text-xs text-ink-400">—</span>
            ),
        }),
      ]),
    [],
  )

  const logs = auditLogsQuery.data ?? emptyLogs
  const logTable = useTable({
    features: clientTableFeatures,
    columns: logColumns,
    data: logs,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  })

  const logPagination = logTable.state.pagination
  const logPageCount = logTable.getPageCount()

  if (!selectedCompanyId) {
    return (
      <div className="card-surface p-8 text-center text-sm text-ink-500">
        اختر شركة من الشريط العلوي لبدء عملية التهيئة.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="محرك تهيئة دليل الحسابات"
        description="تنفيذ ذري ومعاملاتي آمن لإنشاء شجرة حسابات الشركة من قالب معياري، مع فحص مسبق للمتطلبات، دعم الأوضاع الثلاثة (صارم، دمج آمن، محاكاة جافة)، وتعيين الأدوار النظامية تلقائيًا."
        meta={
          <>
            <Badge tone="brand">{selectedCompany?.nameArabic}</Badge>
            <Badge tone="slate">{selectedCompany?.code}</Badge>
            <Badge tone="violet">حد العمق {selectedCompany?.maxAccountDepth} مستويات</Badge>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="حسابات الشركة الحالية"
          value={formatNumber(selectedCompany?.totalAccountsCount ?? 0)}
          icon={<SparklesIcon width={18} height={18} />}
        />
        <StatCard
          label="حالة التهيئة"
          value={selectedCompany?.isCoaInitialized ? 'مهيأة' : 'غير مهيأة'}
          tone={selectedCompany?.isCoaInitialized ? 'emerald' : 'amber'}
        />
        <StatCard
          label="عمق القالب المختار"
          value={selectedTemplate ? `${selectedTemplate.recommendedMaxDepth} مستويات` : '—'}
          tone="sky"
        />
        <StatCard
          label="سجلات التدقيق"
          value={formatNumber(logs.length)}
          tone="violet"
          icon={<HistoryIcon width={18} height={18} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="إعداد عملية التهيئة"
            description="اختر القالب ووضع التنفيذ، ثم ابدأ الفحص المسبق قبل الحفظ."
            icon={<SparklesIcon width={18} height={18} />}
          />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-5">
              <Field
                label="القالب المحاسبي"
                required
                error={form.formState.errors.templateId?.message}
                hint={selectedTemplate?.description ?? undefined}
              >
                <Select
                  placeholder="اختر القالب..."
                  {...form.register('templateId')}
                  options={templates.map((template) => ({
                    value: template.id,
                    label: `${template.nameArabic} — ${template.code} (${template.totalNodesCount} بند)`,
                  }))}
                />
              </Field>

              <div>
                <p className="mb-2 text-xs font-semibold text-ink-700">وضع التهيئة</p>
                <RadioGroup
                  name="mode"
                  value={mode}
                  onChange={(value) => form.setValue('mode', value, { shouldValidate: true })}
                  options={INITIALIZATION_MODE_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                    description: INITIALIZATION_MODE_DESCRIPTION[option.value],
                  }))}
                />
                {form.formState.errors.mode?.message ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    {form.formState.errors.mode.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="بادئة رموز الحسابات (اختياري)"
                  hint="تُضاف قبل رموز القالب، مثال: 1 => 10001"
                  error={form.formState.errors.accountCodePrefix?.message}
                >
                  <Input
                    {...form.register('accountCodePrefix')}
                    dir="ltr"
                    placeholder="01"
                  />
                </Field>

                <div className="flex items-end">
                  <Checkbox
                    label="تعيين الأدوار النظامية تلقائيًا"
                    description="يربط الصندوق والعملاء والموردين والمبيعات وغيرها من أدوار القالب"
                    {...form.register('autoMapSystemRoles')}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-ink-200 pt-4">
                <Button
                  type="submit"
                  loading={initialize.isPending}
                  icon={<PlayIcon width={15} height={15} />}
                >
                  تنفيذ التهيئة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  icon={<RefreshIcon width={15} height={15} />}
                  loading={validationQuery.isFetching}
                  onClick={() => validationQuery.refetch()}
                >
                  فحص المتطلبات مسبقًا
                </Button>
                {initialize.error ? (
                  <span className="text-xs font-medium text-rose-600">
                    {errorCode(initialize.error)} — {errorMessage(initialize.error)}
                  </span>
                ) : null}
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="نتيجة الفحص المسبق"
              description="POST /api/initialization/validate"
              icon={<InfoIcon width={18} height={18} />}
              actions={
                validationQuery.isFetching ? (
                  <Badge tone="sky" dot>
                    جارٍ الفحص
                  </Badge>
                ) : validation ? (
                  validation.canInitialize ? (
                    <Badge tone="emerald" dot>
                      يمكن التهيئة
                    </Badge>
                  ) : (
                    <Badge tone="rose" dot>
                      لا يمكن التهيئة
                    </Badge>
                  )
                ) : null
              }
            />
            <CardBody className="space-y-3">
              {validationQuery.isLoading ? (
                <p className="text-xs text-ink-500">جارٍ فحص المتطلبات...</p>
              ) : validation ? (
                <>
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-ink-50 p-2">
                      <dt className="text-ink-500">الحسابات القائمة</dt>
                      <dd className="font-semibold text-ink-800">
                        {formatNumber(validation.existingAccountsCount)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-ink-50 p-2">
                      <dt className="text-ink-500">عمق الشركة / القالب</dt>
                      <dd className="font-semibold text-ink-800">
                        {validation.companyMaxDepth} / {validation.templateMaxDepth}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-ink-50 p-2">
                      <dt className="text-ink-500">توافق العمق</dt>
                      <dd
                        className={
                          validation.depthCompatible
                            ? 'font-semibold text-emerald-700'
                            : 'font-semibold text-rose-700'
                        }
                      >
                        {validation.depthCompatible ? 'متوافق' : 'غير متوافق'}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-ink-50 p-2">
                      <dt className="text-ink-500">مهيأة مسبقًا</dt>
                      <dd className="font-semibold text-ink-800">
                        {validation.isCompanyAlreadyInitialized ? 'نعم' : 'لا'}
                      </dd>
                    </div>
                  </dl>

                  {validation.validationErrors.map((error) => (
                    <p
                      key={error}
                      className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700"
                    >
                      <XCircleIcon width={15} height={15} className="mt-0.5 shrink-0" />
                      {error}
                    </p>
                  ))}

                  {validation.validationWarnings.map((warning) => (
                    <p
                      key={warning}
                      className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    >
                      <AlertTriangleIcon width={15} height={15} className="mt-0.5 shrink-0" />
                      {warning}
                    </p>
                  ))}

                  {validation.validationErrors.length === 0 &&
                  validation.validationWarnings.length === 0 ? (
                    <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      <CheckCircleIcon width={15} height={15} />
                      الشركة جاهزة للتهيئة من القالب المختار.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-ink-500">اختر قالبًا لبدء الفحص.</p>
              )}
            </CardBody>
          </Card>

          {result ? (
            <Card>
              <CardHeader
                title="نتيجة التنفيذ"
                description={`${result.templateName} • ${formatDuration(result.durationMs)}`}
                icon={<CheckCircleIcon width={18} height={18} />}
                actions={
                  <Badge tone={INITIALIZATION_STATUS_TONE[result.status]} dot>
                    {INITIALIZATION_STATUS_LABEL[result.status]}
                  </Badge>
                }
              />
              <CardBody className="space-y-3">
                <p className="text-xs leading-6 text-ink-700">{result.message}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-brand-50 p-2">
                    <p className="text-[11px] text-brand-800">حسابات أُنشئت</p>
                    <p className="text-lg font-semibold text-brand-900">
                      {formatNumber(result.accountsCreatedCount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-2">
                    <p className="text-[11px] text-violet-800">أدوار مرتبطة</p>
                    <p className="text-lg font-semibold text-violet-900">
                      {formatNumber(result.systemRolesMappedCount)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-ink-50 p-2">
                    <p className="text-[11px] text-ink-500">العمق المطبّق</p>
                    <p className="text-lg font-semibold text-ink-800">
                      {formatNumber(result.maxDepthEnforced)}
                    </p>
                  </div>
                </div>

                {result.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
                  >
                    {warning}
                  </p>
                ))}

                {result.mappedRoles.length ? (
                  <details className="rounded-lg border border-ink-200 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-semibold text-ink-700">
                      الأدوار النظامية المرتبطة ({formatNumber(result.mappedRoles.length)})
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-ink-600">
                      {result.mappedRoles.map((mapping) => (
                        <li key={mapping.id} className="flex items-center justify-between gap-2">
                          <span>{SYSTEM_ROLE_LABEL[mapping.role]}</span>
                          <span className="font-mono text-[11px] text-ink-500">
                            {mapping.accountCode}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <HistoryIcon width={16} height={16} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink-900">سجلات التدقيق (Audit Logs)</h3>
            <p className="text-xs text-ink-500">
              تتبّع حوكمة عمليات التهيئة عبر GET /api/initialization/audit-logs/{'{'}companyId{'}'}
            </p>
          </div>
        </div>

        <DataTable
          table={logTable}
          isLoading={auditLogsQuery.isLoading}
          isFetching={auditLogsQuery.isFetching && !auditLogsQuery.isLoading}
          error={auditLogsQuery.error}
          onRetry={() => auditLogsQuery.refetch()}
          emptyTitle="لا توجد سجلات تهيئة لهذه الشركة"
          emptyDescription="ستظهر هنا كل عملية تهيئة (ناجحة أو فاشلة) مع عدد الحسابات والأدوار ومدة التنفيذ."
          dense
          pagination={
            <Pagination
              pageIndex={logPagination.pageIndex}
              pageSize={logPagination.pageSize}
              pageCount={logPageCount}
              canPreviousPage={logPagination.pageIndex > 0}
              canNextPage={logPagination.pageIndex < logPageCount - 1}
              totalRows={logs.length}
              pageSizeOptions={[5, 10, 25]}
              onPageIndexChange={(index) => logTable.setPageIndex(index)}
              onPageSizeChange={(size) => logTable.setPageSize(size)}
            />
          }
        />
      </section>

    </div>
  )
}
