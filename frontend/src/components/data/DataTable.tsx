import type { ReactNode } from 'react'
import type { Row, RowData, TableFeatures } from '@tanstack/react-table'
import type { ReactTable } from '@tanstack/react-table'
import { cn } from '@/lib/cn'
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/States'
import { Spinner } from '@/components/ui/Spinner'

export interface DataTableProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
> {
  table: ReactTable<TFeatures, TData>
  isLoading?: boolean
  isFetching?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: ReactNode
  emptyAction?: ReactNode
  emptyIcon?: ReactNode
  onRowClick?: (row: Row<TFeatures, TData>) => void
  rowClassName?: (row: Row<TFeatures, TData>) => string | undefined
  className?: string
  dense?: boolean
  /** شريط أدوات (بحث/فلاتر) يُعرض أعلى الجدول داخل البطاقة */
  toolbar?: ReactNode
  /** عناصر الترقيم أسفل الجدول داخل البطاقة */
  pagination?: ReactNode
}

/**
 * جدول عام مبني على TanStack Table v9 (headless):
 * الاستخدام: أنشئ نسخة الجدول في الصفحة عبر useTable ثم مرّرها كمكوّن عرض فقط.
 */
export function DataTable<TFeatures extends TableFeatures, TData extends RowData>({
  table,
  isLoading = false,
  isFetching = false,
  error,
  onRetry,
  emptyTitle = 'لا توجد بيانات للعرض',
  emptyDescription,
  emptyAction,
  emptyIcon,
  onRowClick,
  rowClassName,
  className,
  dense = false,
  toolbar,
  pagination,
}: DataTableProps<TFeatures, TData>) {
  const rows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()
  const columnCount = table.getAllLeafColumns().length

  if (error) {
    return (
      <div className={cn('card-surface', className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('card-surface', className)}>
        <LoadingState />
      </div>
    )
  }

  const cellPadding = dense ? 'px-3 py-1.5' : 'px-3 py-2.5'

  return (
    <div className={cn('card-surface overflow-hidden', className)}>
      {toolbar}
      {isFetching ? (
        <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50/70 px-3 py-1.5 text-xs font-medium text-brand-800">
          <Spinner className="size-3.5" />
          جارٍ تحديث البيانات...
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-right text-sm">
          <thead className="bg-ink-50 text-xs text-ink-500">
            {headerGroups.map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      'border-b border-ink-200 font-semibold whitespace-nowrap',
                      cellPadding,
                    )}
                  >
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(columnCount, 1)} className="p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    icon={emptyIcon}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-ink-100 last:border-b-0 transition-colors',
                    onRowClick ? 'cursor-pointer' : undefined,
                    'hover:bg-brand-50/40',
                    rowClassName?.(row),
                  )}
                >
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className={cn('align-middle text-ink-700', cellPadding)}>
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination}
    </div>
  )
}
