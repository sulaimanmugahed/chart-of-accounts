import { useMemo, useState } from 'react'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { CompanyDto } from '@/api/types'
import { clientTableFeatures } from '@/components/data/table-features'
import { DataTable } from '@/components/data/DataTable'
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
import { Field, Input } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { BuildingIcon, PencilIcon, PlusIcon, SlidersIcon } from '@/components/ui/icons'
import { EmptyState } from '@/components/feedback/States'
import { formatDate, formatNumber, currencyLabel } from '@/lib/format'
import { useSelectedCompany } from '@/hooks/useSelectedCompany'
import { CompanyFormDialog } from './CompanyFormDialog'
import { useCompaniesQuery, useUpdateCompanyDepth } from './hooks'

const emptyCompanies: CompanyDto[] = []
const columnHelper = createColumnHelper<typeof clientTableFeatures, CompanyDto>()

export function CompaniesPage() {
  const companiesQuery = useCompaniesQuery()
  const { selectedCompanyId, selectCompany } = useSelectedCompany()

  const [formOpen, setFormOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyDto | null>(null)
  const [depthCompany, setDepthCompany] = useState<CompanyDto | null>(null)

  const data = companiesQuery.data ?? emptyCompanies

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor('code', {
          id: 'code',
          header: ({ column }) => <SortableHeader column={column}>الرمز</SortableHeader>,
          cell: (info) => (
            <span className="font-mono text-xs font-semibold text-ink-700">{info.getValue()}</span>
          ),
        }),
        columnHelper.accessor('nameArabic', {
          id: 'nameArabic',
          header: ({ column }) => <SortableHeader column={column}>الشركة</SortableHeader>,
          cell: ({ row }) => (
            <div className="min-w-40">
              <p className="font-medium text-ink-900">{row.original.nameArabic}</p>
              <p className="text-[11px] text-ink-500" dir="ltr">
                {row.original.nameEnglish}
              </p>
            </div>
          ),
        }),
        columnHelper.accessor('baseCurrency', {
          id: 'baseCurrency',
          header: 'العملة',
          cell: (info) => <span className="text-xs">{currencyLabel(info.getValue())}</span>,
        }),
        columnHelper.accessor('taxNumber', {
          id: 'taxNumber',
          header: 'الرقم الضريبي',
          cell: (info) => (
            <span className="font-mono text-[11px] text-ink-500">{info.getValue() ?? '—'}</span>
          ),
        }),
        columnHelper.accessor('maxAccountDepth', {
          id: 'maxAccountDepth',
          header: ({ column }) => <SortableHeader column={column}>حد العمق</SortableHeader>,
          cell: (info) => (
            <Badge tone="violet">{formatNumber(info.getValue())} مستويات</Badge>
          ),
        }),
        columnHelper.accessor('totalAccountsCount', {
          id: 'totalAccountsCount',
          header: ({ column }) => <SortableHeader column={column}>عدد الحسابات</SortableHeader>,
          cell: (info) => (
            <span className="tabular-nums font-medium">{formatNumber(info.getValue())}</span>
          ),
        }),
        columnHelper.accessor('isCoaInitialized', {
          id: 'isCoaInitialized',
          header: 'حالة التهيئة',
          cell: ({ row }) => (
            <div className="flex flex-col gap-1">
              {row.original.isCoaInitialized ? (
                <Badge tone="emerald" dot>
                  مهيأة
                </Badge>
              ) : (
                <Badge tone="amber" dot>
                  بانتظار التهيئة
                </Badge>
              )}
              {row.original.initializedAtUtc ? (
                <span className="text-[10px] text-ink-400">
                  {formatDate(row.original.initializedAtUtc)}
                </span>
              ) : null}
            </div>
          ),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'إجراءات',
          cell: ({ row }) => {
            const company = row.original
            const isSelected = company.id === selectedCompanyId
            return (
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={isSelected ? 'subtle' : 'outline'}
                  disabled={isSelected}
                  onClick={() => selectCompany(company.id)}
                >
                  {isSelected ? 'الشركة الحالية' : 'تعيين حالية'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<PencilIcon width={14} height={14} />}
                  onClick={() => {
                    setEditingCompany(company)
                    setFormOpen(true)
                  }}
                  title="تعديل بيانات الشركة"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<SlidersIcon width={14} height={14} />}
                  onClick={() => setDepthCompany(company)}
                  title="ضبط حد العمق الأقصى"
                />
              </div>
            )
          },
        }),
      ]),
    [selectCompany, selectedCompanyId],
  )

  const table = useTable({
    features: clientTableFeatures,
    columns,
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  })

  const pagination = table.state.pagination
  const pageCount = table.getPageCount()

  return (
    <div>
      <PageHeader
        title="الشركات والمستأجرون"
        description="إدارة الشركات المسجلة في المنصة، ربط كل شركة بحد عمق أقصى لشجرة حساباتها، ومتابعة حالة التهيئة."
        actions={
          <Button
            icon={<PlusIcon width={16} height={16} />}
            onClick={() => {
              setEditingCompany(null)
              setFormOpen(true)
            }}
          >
            شركة جديدة
          </Button>
        }
      />

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar>
            <SearchInput
              value={(table.state.globalFilter as string) ?? ''}
              onChange={(value) => table.setGlobalFilter(value)}
              placeholder="بحث بالاسم أو الرمز أو الرقم الضريبي..."
            />
            <ColumnVisibilityMenu
              columns={table.getAllLeafColumns().map((column) => ({
                id: column.id,
                label:
                  typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id,
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
        isLoading={companiesQuery.isLoading}
        isFetching={companiesQuery.isFetching && !companiesQuery.isLoading}
        error={companiesQuery.error}
        onRetry={() => companiesQuery.refetch()}
        emptyTitle="لا توجد شركات مسجلة"
        emptyDescription="ابدأ بإنشاء شركة ثم قم بتهيئة دليل حساباتها من قالب معياري."
        emptyIcon={<BuildingIcon width={22} height={22} />}
        emptyAction={
          <Button
            size="sm"
            icon={<PlusIcon width={15} height={15} />}
            onClick={() => {
              setEditingCompany(null)
              setFormOpen(true)
            }}
          >
            إضافة أول شركة
          </Button>
        }
        rowClassName={(row) =>
          row.original.id === selectedCompanyId ? 'bg-brand-50/40' : undefined
        }
      />

      <CompanyFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingCompany(null)
        }}
        company={editingCompany}
      />

      <CompanyDepthDialog company={depthCompany} onClose={() => setDepthCompany(null)} />
    </div>
  )
}

/* ------------------------- نافذة ضبط حد العمق ------------------------- */

function CompanyDepthDialog({
  company,
  onClose,
}: {
  company: CompanyDto | null
  onClose: () => void
}) {
  const updateDepth = useUpdateCompanyDepth()
  const [value, setValue] = useState<number>(company?.maxAccountDepth ?? 5)
  const [error, setError] = useState<string | null>(null)

  const open = Boolean(company)

  const handleSubmit = async () => {
    if (!company) return
    if (!Number.isInteger(value) || value < 3 || value > 10) {
      setError('يجب أن يكون العمق بين 3 و 10 مستويات')
      return
    }
    setError(null)
    try {
      await updateDepth.mutateAsync({ companyId: company.id, maxDepth: value })
      onClose()
    } catch {
      /* التنبيه يُعرض تلقائيًا */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ضبط حد العمق الأقصى لشجرة الحسابات"
      description={`الشركة: ${company?.nameArabic ?? ''} — لا يمكن التخفيض لأقل من أعمق مستوى قائم حاليًا.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={updateDepth.isPending}>
            إلغاء
          </Button>
          <Button loading={updateDepth.isPending} onClick={handleSubmit}>
            حفظ العمق
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="أقصى عدد مستويات" error={error ?? undefined}>
          <Input
            type="number"
            min={3}
            max={10}
            dir="ltr"
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
          />
        </Field>
        {company && !company.isCoaInitialized ? (
          <EmptyState
            className="rounded-xl bg-ink-50 py-4"
            title="الشركة غير مهيأة بعد"
            description="يمكن ضبط العمق بحرية قبل التهيئة. بعد التهيئة سيقيّد النظام التخفيض حسب أعمق حساب قائم."
          />
        ) : null}
      </div>
    </Modal>
  )
}
