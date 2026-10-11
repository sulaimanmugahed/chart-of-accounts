import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { CoaTemplateDto } from '@/api/types'
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
import { EyeIcon, LayersIcon, PlusIcon } from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'
import { TemplateFormDialog } from './TemplateFormDialog'
import { useTemplatesQuery } from './hooks'

const emptyTemplates: CoaTemplateDto[] = []
const columnHelper = createColumnHelper<typeof clientTableFeatures, CoaTemplateDto>()

export function TemplatesPage() {
  const templatesQuery = useTemplatesQuery()
  const [createOpen, setCreateOpen] = useState(false)

  const data = templatesQuery.data ?? emptyTemplates

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
          header: ({ column }) => <SortableHeader column={column}>اسم القالب</SortableHeader>,
          cell: ({ row }) => (
            <div className="min-w-64">
              <p className="font-medium text-ink-900">{row.original.nameArabic}</p>
              <p className="text-[11px] text-ink-500">{row.original.description}</p>
            </div>
          ),
        }),
        columnHelper.accessor('industryType', {
          id: 'industryType',
          header: 'القطاع',
          cell: (info) => <Badge tone="sky">{info.getValue()}</Badge>,
        }),
        columnHelper.accessor('recommendedMaxDepth', {
          id: 'recommendedMaxDepth',
          header: ({ column }) => <SortableHeader column={column}>العمق الموصى به</SortableHeader>,
          cell: (info) => <span className="tabular-nums text-xs">{info.getValue()} مستويات</span>,
        }),
        columnHelper.accessor('totalNodesCount', {
          id: 'totalNodesCount',
          header: ({ column }) => <SortableHeader column={column}>عدد البنود</SortableHeader>,
          cell: (info) => (
            <span className="tabular-nums font-medium">{formatNumber(info.getValue())}</span>
          ),
        }),
        columnHelper.accessor('systemRolesDefinedCount', {
          id: 'systemRolesDefinedCount',
          header: 'أدوار معرّفة',
          cell: (info) => <Badge tone="brand">{formatNumber(info.getValue())}</Badge>,
        }),
        columnHelper.accessor('version', {
          id: 'version',
          header: 'الإصدار',
          cell: (info) => <span className="text-xs text-ink-500">v{info.getValue()}</span>,
        }),
        columnHelper.accessor('isSystemTemplate', {
          id: 'isSystemTemplate',
          header: 'النوع',
          cell: (info) =>
            info.getValue() ? (
              <Badge tone="slate" dot>
                قالب نظامي
              </Badge>
            ) : (
              <Badge tone="violet" dot>
                قالب مخصص
              </Badge>
            ),
        }),
        columnHelper.display({
          id: 'actions',
          header: 'إجراءات',
          cell: ({ row }) => (
            <Link to={`/templates/${row.original.id}`}>
              <Button size="sm" variant="outline" icon={<EyeIcon width={14} height={14} />}>
                عرض الشجرة
              </Button>
            </Link>
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

  return (
    <div>
      <PageHeader
        title="قوالب دليل الحسابات"
        description="القوالب المعيارية الجاهزة (تجاري، خدمات، منشآت صغيرة) والقوالب المخصصة. يُستخدم القالب لتهيئة شجرة حسابات أي شركة بشكل ذري ومتكرر الأمان."
        actions={
          <Button icon={<PlusIcon width={16} height={16} />} onClick={() => setCreateOpen(true)}>
            قالب مخصص جديد
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
              placeholder="بحث باسم القالب أو رمزه..."
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
        isLoading={templatesQuery.isLoading}
        isFetching={templatesQuery.isFetching && !templatesQuery.isLoading}
        error={templatesQuery.error}
        onRetry={() => templatesQuery.refetch()}
        emptyTitle="لا توجد قوالب"
        emptyDescription="لم يتم بذر أي قوالب معيارية بعد."
        emptyIcon={<LayersIcon width={22} height={22} />}
      />

      <TemplateFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
