import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { AccountDto, AccountTreeNodeDto } from '@/api/types'
import {
  ACCOUNT_CLASSIFICATION_LABEL,
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPE_OPTIONS,
  ACCOUNT_TYPE_TONE,
  NORMAL_BALANCE_LABEL,
  SYSTEM_ROLE_LABEL,
} from '@/api/enums'
import { DataTable } from '@/components/data/DataTable'
import { treeTableFeatures } from '@/components/data/table-features'
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
import { Checkbox, Select } from '@/components/ui/form'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { StatCard } from '@/components/ui/Card'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  TreeIcon,
} from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'
import { useSelectedCompany } from '@/hooks/useSelectedCompany'
import { AccountFormDialog } from './AccountFormDialog'
import { EditAccountDialog } from './EditAccountDialog'
import { useAccountsTreeQuery, useDeleteAccount, useFlatAccountsQuery } from './hooks'

/** صف موحّد للعرض في الوضعين (الشجري والمسطّح) */
interface AccountRow extends AccountDto {
  children: AccountRow[]
}

const columnHelper = createColumnHelper<typeof treeTableFeatures, AccountRow>()

function fromTree(node: AccountTreeNodeDto): AccountRow {
  return {
    id: node.id,
    companyId: '',
    code: node.code,
    nameArabic: node.nameArabic,
    nameEnglish: node.nameEnglish,
    accountType: node.accountType,
    normalBalance: node.normalBalance,
    classification: node.classification,
    level: node.level,
    parentAccountId: node.parentAccountId,
    parentAccountCode: null,
    isHeader: node.isHeader,
    isPostable: node.isPostable,
    isActive: node.isActive,
    systemRole: node.systemRole,
    lineagePath: node.lineagePath,
    description: null,
    currencyCode: null,
    childrenCount: node.children.length,
    children: node.children.map(fromTree),
  }
}

function fromFlat(account: AccountDto): AccountRow {
  return { ...account, children: [] }
}

function flatten(rows: AccountRow[]): AccountRow[] {
  return rows.flatMap((row) => [row, ...flatten(row.children)])
}

export function AccountsPage() {
  const { selectedCompany, selectedCompanyId } = useSelectedCompany()
  const companyId = selectedCompanyId
  const [view, setView] = useState<'tree' | 'flat'>('tree')
  const [flatMaxLevel, setFlatMaxLevel] = useState<number | ''>('')
  const [flatPostableOnly, setFlatPostableOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountDto | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<AccountDto | null>(null)

  const treeQuery = useAccountsTreeQuery(view === 'tree' ? companyId : null)
  const flatQuery = useFlatAccountsQuery(
    {
      companyId: companyId ?? 'none',
      maxLevel: flatMaxLevel === '' ? null : flatMaxLevel,
      postableOnly: flatPostableOnly,
    },
    view === 'flat',
  )
  // قائمة كاملة تُستخدم لخيارات الحساب الأب والإحصاءات
  const allAccountsQuery = useFlatAccountsQuery({ companyId: companyId ?? 'none' }, Boolean(companyId))

  const deleteAccount = useDeleteAccount()

  const data = useMemo<AccountRow[]>(() => {
    if (view === 'tree') return (treeQuery.data ?? []).map(fromTree)
    return (flatQuery.data ?? []).map(fromFlat)
  }, [view, treeQuery.data, flatQuery.data])

  const allAccounts = allAccountsQuery.data ?? []
  const stats = useMemo(() => {
    const source = view === 'tree' ? flatten(data) : data
    return {
      total: source.length,
      postable: source.filter((account) => account.isPostable).length,
      headers: source.filter((account) => account.isHeader).length,
      roles: source.filter((account) => account.systemRole !== null).length,
      maxLevel: source.reduce((max, account) => Math.max(max, account.level), 0),
    }
  }, [data, view])

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('code', {
          id: 'code',
          header: ({ column }) => <SortableHeader column={column}>الرمز</SortableHeader>,
          cell: ({ row, getValue }) => (
            <div
              className="flex items-center gap-1.5"
              style={{ paddingInlineStart: `${row.depth * 1.15}rem` }}
            >
              {row.getCanExpand() ? (
                <button
                  type="button"
                  onClick={row.getToggleExpandedHandler()}
                  className="flex size-5 shrink-0 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
                  aria-label={row.getIsExpanded() ? 'طي الفروع' : 'توسيع الفروع'}
                >
                  {row.getIsExpanded() ? (
                    <ChevronDownIcon width={14} height={14} />
                  ) : (
                    <ChevronLeftIcon width={14} height={14} />
                  )}
                </button>
              ) : (
                <span className="inline-block size-5 shrink-0" />
              )}
              <span className="font-mono text-xs font-semibold text-ink-700">{getValue()}</span>
            </div>
          ),
        }),
        columnHelper.accessor('nameArabic', {
          id: 'nameArabic',
          header: ({ column }) => <SortableHeader column={column}>الحساب</SortableHeader>,
          cell: ({ row }) => (
            <div className="min-w-48">
              <p className="font-medium text-ink-900">{row.original.nameArabic}</p>
              <p className="text-[11px] text-ink-500" dir="ltr">
                {row.original.nameEnglish}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor('accountType', {
          id: 'accountType',
          header: ({ column }) => <SortableHeader column={column}>النوع</SortableHeader>,
          filterFn: (row, _columnId, filterValue) =>
            filterValue === undefined || filterValue === '' || filterValue === null
              ? true
              : row.original.accountType === Number(filterValue),
          cell: (info) => (
            <Badge tone={ACCOUNT_TYPE_TONE[info.getValue()]}>
              {ACCOUNT_TYPE_LABEL[info.getValue()]}
            </Badge>
          ),
        }),
        columnHelper.accessor('normalBalance', {
          id: 'normalBalance',
          header: 'الطبيعة',
          cell: (info) => (
            <span className="text-xs text-ink-600">{NORMAL_BALANCE_LABEL[info.getValue()]}</span>
          ),
        }),
        columnHelper.accessor('classification', {
          id: 'classification',
          header: 'التصنيف',
          cell: (info) => (
            <span className="text-[11px] text-ink-500">
              {ACCOUNT_CLASSIFICATION_LABEL[info.getValue()]}
            </span>
          ),
        }),
        columnHelper.accessor('level', {
          id: 'level',
          header: ({ column }) => <SortableHeader column={column}>المستوى</SortableHeader>,
          cell: (info) => <span className="tabular-nums text-xs">{info.getValue()}</span>,
        }),
        columnHelper.accessor('isPostable', {
          id: 'isPostable',
          header: 'الترحيل',
          cell: ({ row }) =>
            row.original.isPostable ? (
              <Badge tone="emerald">يقبل الترحيل</Badge>
            ) : (
              <Badge tone="slate">تجميعي</Badge>
            ),
        }),
        columnHelper.accessor('systemRole', {
          id: 'systemRole',
          header: 'الدور النظامي',
          cell: ({ row }) =>
            row.original.systemRole ? (
              <Badge tone="brand" dot>
                {SYSTEM_ROLE_LABEL[row.original.systemRole]}
              </Badge>
            ) : (
              <span className="text-xs text-ink-400">—</span>
            ),
        }),
        columnHelper.accessor('isActive', {
          id: 'isActive',
          header: 'الحالة',
          cell: ({ row }) =>
            row.original.isActive ? (
              <Badge tone="emerald" dot>
                نشط
              </Badge>
            ) : (
              <Badge tone="rose" dot>
                موقوف
              </Badge>
            ),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'إجراءات',
          cell: ({ row }) => (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="ghost"
                icon={<PencilIcon width={14} height={14} />}
                title="تعديل"
                onClick={() => setEditingAccount(row.original)}
              />
              <Button
                size="sm"
                variant="ghost"
                icon={<TrashIcon width={14} height={14} />}
                title="حذف"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => setDeletingAccount(row.original)}
              />
            </div>
          ),
        }),
      ]),
    [],
  )

  const table = useTable({
    features: treeTableFeatures,
    columns,
    data,
    getSubRows: (row) => row.children,
    initialState: { pagination: { pageIndex: 0, pageSize: 25 } },
  })

  const pagination = table.state.pagination
  const pageCount = table.getPageCount()
  const typeFilterValue = (table.state.columnFilters.find((filter) => filter.id === 'accountType')
    ?.value ?? '') as string | number
  const activeQuery = view === 'tree' ? treeQuery : flatQuery

  if (!companyId) {
    return (
      <div className="card-surface p-8 text-center text-sm text-ink-500">
        لا توجد شركة مختارة. اختر شركة من الشريط العلوي أو أنشئ شركة جديدة.
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`شجرة حسابات: ${selectedCompany?.nameArabic ?? ''}`}
        description="استعراض هيكل الحسابات بشكل شجري أو مسطّح، مع إضافة الحسابات المخصصة. حد العمق الأقصى للشركة يُنفَّذ على الخادم."
        meta={
          <>
            <Badge tone="violet">حد العمق: {selectedCompany?.maxAccountDepth ?? 0} مستويات</Badge>
            <Badge tone="slate">العملة: {selectedCompany?.baseCurrency}</Badge>
            {selectedCompany?.isCoaInitialized ? (
              <Badge tone="emerald" dot>
                الشجرة مهيأة
              </Badge>
            ) : (
              <Badge tone="amber" dot>
                الشجرة غير مهيأة بعد
              </Badge>
            )}
          </>
        }
        actions={
          <>
            <SegmentedControl
              value={view}
              onChange={(value) => setView(value)}
              options={[
                { value: 'tree', label: 'عرض شجري', icon: <TreeIcon width={14} height={14} /> },
                { value: 'flat', label: 'عرض مسطّح', icon: <ListIcon width={14} height={14} /> },
              ]}
            />
            <Button
              icon={<PlusIcon width={16} height={16} />}
              onClick={() => setCreateOpen(true)}
            >
              حساب جديد
            </Button>
          </>
        }
      />

      {!selectedCompany?.isCoaInitialized && allAccounts.length === 0 ? (
        <div className="card-surface mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-ink-800">
              هذه الشركة لا تحتوي على شجرة حسابات بعد
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              يمكنك تهيئة الشجرة من قالب معياري، أو إضافة الحسابات يدويًا من زر «حساب جديد».
            </p>
          </div>
          <Link to="/initialization">
            <Button variant="secondary" icon={<SparklesIcon width={15} height={15} />}>
              الانتقال لمحرك التهيئة
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي الحسابات المعروضة" value={formatNumber(stats.total)} />
        <StatCard
          label="حسابات تقبل الترحيل"
          value={formatNumber(stats.postable)}
          tone="emerald"
        />
        <StatCard label="حسابات تجميعية" value={formatNumber(stats.headers)} tone="sky" />
        <StatCard
          label="حسابات مرتبطة بأدوار نظامية"
          value={formatNumber(stats.roles)}
          tone="violet"
        />
      </div>

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={(table.state.globalFilter as string) ?? ''}
                onChange={(value) => table.setGlobalFilter(value)}
                placeholder="بحث بالرمز أو الاسم..."
              />
              <Select
                className="w-44"
                value={String(typeFilterValue ?? '')}
                onChange={(event) =>
                  table.getColumn('accountType')?.setFilterValue(event.target.value || undefined)
                }
                placeholder="كل الأنواع"
                options={ACCOUNT_TYPE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {view === 'flat' ? (
                <>
                  <Select
                    className="w-40"
                    value={flatMaxLevel === '' ? '' : String(flatMaxLevel)}
                    onChange={(event) =>
                      setFlatMaxLevel(event.target.value === '' ? '' : Number(event.target.value))
                    }
                    placeholder="كل المستويات"
                    options={Array.from(
                      { length: selectedCompany?.maxAccountDepth ?? 0 },
                      (_, index) => ({ value: index + 1, label: `حتى المستوى ${index + 1}` }),
                    )}
                  />
                  <Checkbox
                    label="القابلة للترحيل فقط"
                    checked={flatPostableOnly}
                    onChange={(event) => setFlatPostableOnly(event.target.checked)}
                  />
                </>
              ) : null}

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
            </div>
          </DataTableToolbar>
        }
        pagination={
          <Pagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            pageCount={pageCount}
            canPreviousPage={pagination.pageIndex > 0}
            canNextPage={pagination.pageIndex < pageCount - 1}
            totalRows={stats.total}
            pageSizeOptions={[25, 50, 100]}
            onPageIndexChange={(index) => table.setPageIndex(index)}
            onPageSizeChange={(size) => table.setPageSize(size)}
          />
        }
        isLoading={activeQuery.isLoading}
        isFetching={activeQuery.isFetching && !activeQuery.isLoading}
        error={activeQuery.error}
        onRetry={() => activeQuery.refetch()}
        emptyTitle={view === 'tree' ? 'لا توجد حسابات في هذه الشركة' : 'لا توجد نتائج مطابقة'}
        emptyDescription={
          view === 'flat'
            ? 'جرّب تعديل الفلاتر (المستوى، القابلة للترحيل، بحث)'
            : 'ابدأ بالتهيئة من قالب أو أضف حسابًا جديدًا'
        }
        emptyIcon={<TreeIcon width={22} height={22} />}
        onRowClick={
          view === 'flat' ? (row) => setEditingAccount(row.original) : undefined
        }
        rowClassName={(row) => (row.original.isHeader ? 'bg-ink-50/60' : undefined)}
        dense
      />

      <AccountFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        companyId={companyId}
        accounts={allAccounts}
        maxAccountDepth={selectedCompany?.maxAccountDepth ?? 5}
        baseCurrency={selectedCompany?.baseCurrency ?? 'SAR'}
      />

      <EditAccountDialog
        account={editingAccount}
        companyId={companyId}
        onClose={() => setEditingAccount(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingAccount)}
        title="تأكيد حذف الحساب"
        description={
          deletingAccount
            ? `سيتم حذف الحساب «${deletingAccount.code} — ${deletingAccount.nameArabic}». لا يمكن الحذف إذا كان للحساب فروع أو كان مربوطًا بدور نظامي.`
            : undefined
        }
        confirmLabel="حذف الحساب"
        loading={deleteAccount.isPending}
        onClose={() => setDeletingAccount(null)}
        onConfirm={async () => {
          if (!deletingAccount) return
          try {
            await deleteAccount.mutateAsync({ companyId, accountId: deletingAccount.id })
            setDeletingAccount(null)
          } catch {
            /* الخطأ يُعرض في تنبيه */
          }
        }}
      />
    </div>
  )
}
