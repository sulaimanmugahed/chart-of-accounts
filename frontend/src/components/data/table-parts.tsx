import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/form'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ColumnsIcon,
  SearchIcon,
} from '@/components/ui/icons'

/* --------------------------- رأس عمود قابل للفرز --------------------------- */

/**
 * واجهة مختصرة لعمود يمكن فرزه — تتوافق مع Column في TanStack Table v9
 * عندما تكون خصائص الفرز (rowSortingFeature) مسجّلة في الجدول.
 */
export interface SortableColumn {
  getCanSort: () => boolean
  getIsSorted: () => false | 'asc' | 'desc'
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined
}

export function SortableHeader({
  column,
  children,
  className,
}: {
  column: SortableColumn
  children: ReactNode
  className?: string
}) {
  const canSort = column.getCanSort()
  const sorted = column.getIsSorted()

  if (!canSort) return <span className={className}>{children}</span>

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-ink-100 hover:text-ink-700',
        sorted ? 'text-brand-800' : undefined,
        className,
      )}
      title="اضغط للفرز"
    >
      {children}
      {sorted === 'asc' ? (
        <ArrowUpIcon width={13} height={13} />
      ) : sorted === 'desc' ? (
        <ArrowDownIcon width={13} height={13} />
      ) : (
        <ChevronsUpDownIcon width={13} height={13} className="opacity-40" />
      )}
    </button>
  )
}

/* ------------------------------ شريط الأدوات ------------------------------ */

export function DataTableToolbar({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 px-3 py-2.5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'بحث...',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <SearchIcon
        width={16}
        height={16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-400"
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pr-9"
      />
    </div>
  )
}

/* ---------------------------- قائمة إظهار الأعمدة ---------------------------- */

export interface VisibilityItem {
  id: string
  label: string
  visible: boolean
  onToggle: () => void
}

export function ColumnVisibilityMenu({ columns }: { columns: VisibilityItem[] }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        icon={<ColumnsIcon width={15} height={15} />}
        onClick={() => setOpen((current) => !current)}
      >
        الأعمدة
      </Button>

      {open ? (
        <div className="absolute start-0 z-30 mt-1 w-56 rounded-xl border border-ink-200 bg-white p-2 shadow-[var(--shadow-pop)] animate-pop-in">
          <p className="px-2 py-1 text-[11px] font-semibold text-ink-400">إظهار/إخفاء الأعمدة</p>
          <div className="max-h-64 overflow-y-auto">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                <input
                  type="checkbox"
                  className="size-4 accent-brand-700"
                  checked={column.visible}
                  onChange={column.onToggle}
                />
                {column.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* -------------------------------- الترقيم -------------------------------- */

export interface PaginationProps {
  pageIndex: number
  pageSize: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
  totalRows?: number
  pageSizeOptions?: number[]
  onPageIndexChange: (pageIndex: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function Pagination({
  pageIndex,
  pageSize,
  pageCount,
  canPreviousPage,
  canNextPage,
  totalRows,
  pageSizeOptions = [10, 20, 50, 100],
  onPageIndexChange,
  onPageSizeChange,
}: PaginationProps) {
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const end = pageIndex * pageSize + pageSize

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 px-3 py-2.5 text-xs text-ink-600">
      <div className="flex items-center gap-2">
        <span>عدد الصفوف</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-8 rounded-lg border border-ink-300 bg-white px-2 text-xs"
          aria-label="عدد الصفوف في الصفحة"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        {typeof totalRows === 'number' ? (
          <span className="text-ink-500">
            ({start.toLocaleString('ar-EG-u-nu-latn')}–{Math.min(end, totalRows).toLocaleString('ar-EG-u-nu-latn')} من{' '}
            {totalRows.toLocaleString('ar-EG-u-nu-latn')})
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium text-ink-700">
          الصفحة {(pageIndex + 1).toLocaleString('ar-EG-u-nu-latn')} من{' '}
          {Math.max(pageCount, 1).toLocaleString('ar-EG-u-nu-latn')}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={!canPreviousPage}
            onClick={() => onPageIndexChange(pageIndex - 1)}
            aria-label="الصفحة السابقة"
          >
            <ChevronRightIcon width={15} height={15} />
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNextPage}
            onClick={() => onPageIndexChange(pageIndex + 1)}
            aria-label="الصفحة التالية"
          >
            التالي
            <ChevronLeftIcon width={15} height={15} />
          </Button>
        </div>
      </div>
    </div>
  )
}
