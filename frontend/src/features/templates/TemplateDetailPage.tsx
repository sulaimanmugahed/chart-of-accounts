import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createColumnHelper, useTable } from '@tanstack/react-table'
import type { CoaTemplateNodeDto } from '@/api/types'
import { ACCOUNT_CLASSIFICATION_LABEL, ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_TONE, NORMAL_BALANCE_LABEL, SYSTEM_ROLE_LABEL } from '@/api/enums'
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
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/Card'
import { ChevronDownIcon, ChevronLeftIcon, LayersIcon, ListIcon } from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'
import { useTemplateQuery } from './hooks'

interface TemplateNodeRow extends CoaTemplateNodeDto {
  children: TemplateNodeRow[]
}

const emptyRows: TemplateNodeRow[] = []
const emptyNodes: CoaTemplateNodeDto[] = []
const columnHelper = createColumnHelper<typeof treeTableFeatures, TemplateNodeRow>()

function buildTree(nodes: CoaTemplateNodeDto[]): TemplateNodeRow[] {
  const rows = new Map<string, TemplateNodeRow>()
  for (const node of nodes) rows.set(node.code, { ...node, children: [] })

  const roots: TemplateNodeRow[] = []
  for (const node of nodes) {
    const row = rows.get(node.code)!
    const parent = node.parentNodeCode ? rows.get(node.parentNodeCode) : undefined
    if (parent) parent.children.push(row)
    else roots.push(row)
  }
  return roots
}

export function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const templateQuery = useTemplateQuery(templateId)

  const data = useMemo(
    () => buildTree(templateQuery.data?.nodes ?? emptyNodes),
    [templateQuery.data],
  )

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
                  aria-label={row.getIsExpanded() ? 'طي' : 'توسيع'}
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
          header: ({ column }) => <SortableHeader column={column}>اسم البند</SortableHeader>,
          cell: ({ row }) => (
            <div className="min-w-52">
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
          cell: (info) => (
            <Badge tone={ACCOUNT_TYPE_TONE[info.getValue()]}>
              {ACCOUNT_TYPE_LABEL[info.getValue()]}
            </Badge>
          ),
        }),
        columnHelper.accessor('normalBalance', {
          id: 'normalBalance',
          header: 'الطبيعة',
          cell: (info) => <span className="text-xs">{NORMAL_BALANCE_LABEL[info.getValue()]}</span>,
        }),
        columnHelper.accessor('classification', {
          id: 'classification',
          header: 'التصنيف',
          cell: (info) => (
            <span className="text-[11px] text-ink-600">
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
        columnHelper.accessor('defaultSystemRole', {
          id: 'defaultSystemRole',
          header: 'الدور النظامي',
          cell: ({ row }) =>
            row.original.defaultSystemRole ? (
              <Badge tone="brand" dot>
                {SYSTEM_ROLE_LABEL[row.original.defaultSystemRole]}
              </Badge>
            ) : (
              <span className="text-xs text-ink-400">—</span>
            ),
        }),
      ]),
    [],
  )

  const table = useTable({
    features: treeTableFeatures,
    columns,
    data: data ?? emptyRows,
    getSubRows: (row) => row.children,
    initialState: { pagination: { pageIndex: 0, pageSize: 25 }, expanded: true },
  })

  const pagination = table.state.pagination
  const pageCount = table.getPageCount()
  const template = templateQuery.data

  return (
    <div>
      <PageHeader
        title={template?.nameArabic ?? 'تفاصيل القالب'}
        description={template?.description ?? undefined}
        actions={
          <Link to="/templates">
            <Button variant="outline" icon={<ListIcon width={15} height={15} />}>
              عودة لقائمة القوالب
            </Button>
          </Link>
        }
        meta={
          template ? (
            <>
              <Badge tone="brand">{template.code}</Badge>
              <Badge tone="sky">{template.industryType}</Badge>
              <Badge tone="slate">الإصدار {template.version}</Badge>
              {template.isSystemTemplate ? (
                <Badge tone="emerald" dot>
                  قالب نظامي
                </Badge>
              ) : (
                <Badge tone="violet" dot>
                  قالب مخصص
                </Badge>
              )}
            </>
          ) : null
        }
      />

      {template ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="إجمالي بنود القالب"
            value={formatNumber(template.totalNodesCount)}
            icon={<LayersIcon width={18} height={18} />}
          />
          <StatCard
            label="الأدوار النظامية المعرّفة"
            value={formatNumber(template.systemRolesDefinedCount)}
            tone="violet"
          />
          <StatCard
            label="العمق الموصى به"
            value={`${formatNumber(template.recommendedMaxDepth)} مستويات`}
            tone="sky"
          />
          <StatCard
            label="حالة القالب"
            value={template.isActive ? 'نشط' : 'غير نشط'}
            tone={template.isActive ? 'emerald' : 'rose'}
          />
        </div>
      ) : null}

      {template?.code ? (
        <Card className="mb-4">
          <CardHeader
            title="ملخص الهيكل"
            description="يُنشئ محرك التهيئة الحسابات مرتبةً حسب المستوى (الآباء قبل الأبناء) ويحوّل الحساب الأب تلقائيًا إلى حساب تجميعي."
          />
          <CardBody className="grid gap-2 text-xs text-ink-600 sm:grid-cols-2 lg:grid-cols-3">
            <p>
              <span className="font-semibold text-ink-800">رمز القالب:</span> {template.code}
            </p>
            <p dir="ltr" className="text-start">
              <span className="font-semibold text-ink-800">English name:</span>{' '}
              {template.nameEnglish}
            </p>
            <p>
              <span className="font-semibold text-ink-800">العمق الموصى به:</span>{' '}
              {template.recommendedMaxDepth} مستويات
            </p>
          </CardBody>
        </Card>
      ) : null}

      <DataTable
        table={table}
        toolbar={
          <DataTableToolbar>
            <SearchInput
              value={(table.state.globalFilter as string) ?? ''}
              onChange={(value) => table.setGlobalFilter(value)}
              placeholder="بحث برمز أو اسم البند..."
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => table.toggleAllRowsExpanded(true)}
              >
                توسيع الكل
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => table.toggleAllRowsExpanded(false)}
              >
                طي الكل
              </Button>
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
            totalRows={template?.totalNodesCount}
            pageSizeOptions={[25, 50, 100]}
            onPageIndexChange={(index) => table.setPageIndex(index)}
            onPageSizeChange={(size) => table.setPageSize(size)}
          />
        }
        isLoading={templateQuery.isLoading}
        error={templateQuery.error}
        onRetry={() => templateQuery.refetch()}
        emptyTitle="لا توجد بنود في هذا القالب"
        dense
      />
    </div>
  )
}
