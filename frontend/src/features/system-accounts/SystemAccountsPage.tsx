import { useMemo, useState } from 'react'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import {
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPE_TONE,
  CRITICAL_SYSTEM_ROLES,
  SYSTEM_ROLE_KEY,
  SYSTEM_ROLE_LABEL,
  SYSTEM_ROLE_OPTIONS,
} from '@/api/enums'
import type { SystemAccountMappingDto } from '@/api/types'
import type { SystemAccountRole } from '@/api/enums'
import { DataTable } from '@/components/data/DataTable'
import { clientTableFeatures } from '@/components/data/table-features'
import {
  ColumnVisibilityMenu,
  DataTableToolbar,
  Pagination,
  SearchInput,
  SortableHeader,
} from '@/components/data/table-parts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  LinkIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  UnlockIcon,
} from '@/components/ui/icons'
import { formatDateTime, formatNumber } from '@/lib/format'
import { useSelectedCompany } from '@/hooks/useSelectedCompany'
import { useFlatAccountsQuery } from '@/features/accounts/hooks'
import { RoleMappingDialog } from './RoleMappingDialog'
import { useCriticalRolesQuery, useSystemAccountsQuery } from './hooks'

const emptyMappings: SystemAccountMappingDto[] = []
const columnHelper = createColumnHelper<typeof clientTableFeatures, SystemAccountMappingDto>()

export function SystemAccountsPage() {
  const { selectedCompany, selectedCompanyId } = useSelectedCompany()
  const companyId = selectedCompanyId

  const mappingsQuery = useSystemAccountsQuery(companyId)
  const criticalQuery = useCriticalRolesQuery(companyId)
  const accountsQuery = useFlatAccountsQuery({ companyId: companyId ?? 'none' }, Boolean(companyId))

  const [dialogOpen, setDialogOpen] = useState(false)
  const [presetRole, setPresetRole] = useState<SystemAccountRole | null>(null)
  const [editingMapping, setEditingMapping] = useState<SystemAccountMappingDto | null>(null)
  const [onlyCritical, setOnlyCritical] = useState<'all' | 'critical'>('all')

  const mappings = useMemo(() => mappingsQuery.data ?? emptyMappings, [mappingsQuery.data])
  const accounts = accountsQuery.data ?? []
  const criticalStatus = criticalQuery.data

  const mappedRoles = useMemo(() => new Set(mappings.map((mapping) => mapping.role)), [mappings])
  const unmappedRoles = SYSTEM_ROLE_OPTIONS.filter((option) => !mappedRoles.has(option.value))
  const criticalMappedCount = CRITICAL_SYSTEM_ROLES.filter((role) => mappedRoles.has(role)).length

  const data = useMemo(
    () =>
      onlyCritical === 'critical'
        ? mappings.filter((mapping) => CRITICAL_SYSTEM_ROLES.includes(mapping.role))
        : mappings,
    [mappings, onlyCritical],
  )

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('role', {
          id: 'role',
          header: ({ column }) => <SortableHeader column={column}>الدور النظامي</SortableHeader>,
          cell: ({ row }) => {
            const isCritical = CRITICAL_SYSTEM_ROLES.includes(row.original.role)
            return (
              <div className="min-w-52">
                <p className="font-medium text-ink-900">
                  {SYSTEM_ROLE_LABEL[row.original.role]}
                  {isCritical ? (
                    <span className="ms-1 text-[10px] font-semibold text-amber-600">(حرج)</span>
                  ) : null}
                </p>
                <p className="font-mono text-[11px] text-ink-500" dir="ltr">
                  {SYSTEM_ROLE_KEY[row.original.role]}
                </p>
              </div>
            )
          },
        }),
        columnHelper.accessor('accountCode', {
          id: 'account',
          header: 'الحساب المرتبط',
          cell: ({ row }) => (
            <div className="min-w-48">
              <p className="text-sm text-ink-800">
                <span className="font-mono text-xs font-semibold">{row.original.accountCode}</span>{' '}
                — {row.original.accountNameArabic}
              </p>
              <p className="text-[11px] text-ink-500" dir="ltr">
                {row.original.accountNameEnglish}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor('accountType', {
          id: 'accountType',
          header: 'النوع',
          cell: (info) => (
            <Badge tone={ACCOUNT_TYPE_TONE[info.getValue()]}>
              {ACCOUNT_TYPE_LABEL[info.getValue()]}
            </Badge>
          ),
        }),
        columnHelper.accessor('isLocked', {
          id: 'isLocked',
          header: 'القفل',
          cell: ({ row }) =>
            row.original.isLocked ? (
              <Badge tone="rose">
                <LockIcon width={12} height={12} /> مقفل
              </Badge>
            ) : (
              <Badge tone="emerald">
                <UnlockIcon width={12} height={12} /> مفتوح
              </Badge>
            ),
        }),
        columnHelper.accessor('assignedAtUtc', {
          id: 'assignedAtUtc',
          header: ({ column }) => <SortableHeader column={column}>تاريخ الربط</SortableHeader>,
          cell: (info) => (
            <span className="text-xs text-ink-600">{formatDateTime(info.getValue())}</span>
          ),
        }),
        columnHelper.accessor('notes', {
          id: 'notes',
          header: 'ملاحظات',
          cell: (info) => (
            <span className="text-xs text-ink-500">{info.getValue() ?? '—'}</span>
          ),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'إجراءات',
          cell: ({ row }) => (
            <Button
              size="sm"
              variant="outline"
              icon={<PencilIcon width={14} height={14} />}
              onClick={() => {
                setEditingMapping(row.original)
                setPresetRole(row.original.role)
                setDialogOpen(true)
              }}
            >
              تعديل الربط
            </Button>
          ),
        }),
      ]),
    [],
  )

  const table = useTable({
    features: clientTableFeatures,
    columns,
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  const pagination = table.state.pagination
  const pageCount = table.getPageCount()

  if (!companyId) {
    return (
      <div className="card-surface p-8 text-center text-sm text-ink-500">
        اختر شركة من الشريط العلوي لعرض الأدوار النظامية.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="أدوار الحسابات النظامية"
        description="ربط الأدوار النظامية (الصندوق، العملاء، الموردون، المبيعات، الضرائب...) بالحسابات الفعلية في شجرة الشركة، لتستخدمها وحدات النظام آليًا دون ربط رموز ثابتة في الكود."
        meta={
          <>
            <Badge tone="brand">{selectedCompany?.nameArabic}</Badge>
            <Badge tone="slate">{selectedCompany?.code}</Badge>
          </>
        }
        actions={
          <Button
            icon={<PlusIcon width={16} height={16} />}
            onClick={() => {
              setEditingMapping(null)
              setPresetRole(null)
              setDialogOpen(true)
            }}
          >
            ربط دور بحساب
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="أدوار مرتبطة"
          value={`${formatNumber(mappings.length)} / ${formatNumber(SYSTEM_ROLE_OPTIONS.length)}`}
          icon={<LinkIcon width={18} height={18} />}
        />
        <StatCard
          label="الأدوار الحرجة"
          value={`${formatNumber(criticalMappedCount)} / ${formatNumber(CRITICAL_SYSTEM_ROLES.length)}`}
          tone={criticalMappedCount === CRITICAL_SYSTEM_ROLES.length ? 'emerald' : 'amber'}
          icon={<ShieldIcon width={18} height={18} />}
        />
        <StatCard
          label="أدوار مقفلة"
          value={formatNumber(mappings.filter((mapping) => mapping.isLocked).length)}
          tone="rose"
        />
        <StatCard
          label="حسابات تحليلية متاحة"
          value={formatNumber(accounts.filter((account) => account.isPostable).length)}
          tone="violet"
        />
      </div>

      <Card
        className={
          criticalStatus?.allCriticalRolesMapped
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-amber-200 bg-amber-50/50'
        }
      >
        <CardHeader
          title="فحص الأدوار الحرجة"
          description="GET /api/system-accounts/validate-critical?companyId="
          icon={
            criticalStatus?.allCriticalRolesMapped ? (
              <CheckCircleIcon width={18} height={18} />
            ) : (
              <AlertTriangleIcon width={18} height={18} />
            )
          }
          actions={
            <Button
              size="sm"
              variant="outline"
              icon={<RefreshIcon width={14} height={14} />}
              loading={criticalQuery.isFetching}
              onClick={() => criticalQuery.refetch()}
            >
              إعادة الفحص
            </Button>
          }
        />
        <CardBody className="space-y-3">
          <p className="text-xs leading-6 text-ink-700">
            {criticalStatus?.message ?? 'جارٍ فحص الأدوار الحرجة...'}
          </p>
          <div className="flex flex-wrap gap-2">
            {CRITICAL_SYSTEM_ROLES.map((role) => (
              <Badge key={role} tone={mappedRoles.has(role) ? 'emerald' : 'rose'} dot>
                {SYSTEM_ROLE_LABEL[role]}
              </Badge>
            ))}
          </div>
        </CardBody>
      </Card>

      {unmappedRoles.length ? (
        <Card>
          <CardHeader
            title={`أدوار غير معينة (${formatNumber(unmappedRoles.length)})`}
            description="اختر دورًا لربطه بحساب من شجرة الشركة — تُعرض الحسابات المطابقة لنوع الدور فقط."
          />
          <CardBody className="flex flex-wrap gap-2">
            {unmappedRoles.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingMapping(null)
                  setPresetRole(option.value)
                  setDialogOpen(true)
                }}
              >
                {option.label}
                <span className="text-[10px] text-ink-400">({option.hint})</span>
              </Button>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={(table.state.globalFilter as string) ?? ''}
                onChange={(value) => table.setGlobalFilter(value)}
                placeholder="بحث بالدور أو الحساب..."
              />
              <SegmentedControl
                size="sm"
                value={onlyCritical}
                onChange={(value) => setOnlyCritical(value)}
                options={[
                  { value: 'all', label: 'كل الأدوار' },
                  { value: 'critical', label: 'الحرجة فقط' },
                ]}
              />
            </div>
            <ColumnVisibilityMenu
              columns={table.getAllLeafColumns().map((column) => ({
                id: column.id,
                label:
                  typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id,
                visible: column.getIsVisible(),
                onToggle: () => column.toggleVisibility(),
              }))}
            />
          </DataTableToolbar>
        }
        pagination={
          <Pagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            pageCount={pageCount}
            canPreviousPage={pagination.pageIndex > 0}
            canNextPage={pagination.pageIndex < pageCount - 1}
            totalRows={data.length}
            onPageIndexChange={(index) => table.setPageIndex(index)}
            onPageSizeChange={(size) => table.setPageSize(size)}
          />
        }
        isLoading={mappingsQuery.isLoading}
        isFetching={mappingsQuery.isFetching && !mappingsQuery.isLoading}
        error={mappingsQuery.error}
        onRetry={() => mappingsQuery.refetch()}
        emptyTitle="لا توجد أدوار نظامية مربوطة"
        emptyDescription="ابدأ بربط الأدوار الحرجة: الصندوق، العملاء، الموردون، إيرادات المبيعات، تكلفة البضاعة المباعة، والأرباح المبقاة."
        emptyIcon={<LinkIcon width={22} height={22} />}
        dense
      />

      <RoleMappingDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingMapping(null)
          setPresetRole(null)
        }}
        companyId={companyId}
        accounts={accounts}
        mappings={mappings}
        presetRole={presetRole}
        editingMapping={editingMapping}
      />
    </div>
  )
}
