import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useSelectedCompany } from '@/hooks/useSelectedCompany'
import { formatNumber } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { BuildingIcon, CheckIcon, ChevronDownIcon } from '@/components/ui/icons'
import { Spinner } from '@/components/ui/Spinner'

export function CompanySwitcher() {
  const { companies, selectedCompany, selectCompany, isLoading } = useSelectedCompany()
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

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs text-ink-500">
        <Spinner className="size-3.5" />
        جارٍ تحميل الشركات...
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full max-w-72 items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-2 text-right transition-colors hover:border-brand-300 hover:bg-brand-50/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <BuildingIcon width={18} height={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-ink-900">
            {selectedCompany?.nameArabic ?? 'لا توجد شركة مختارة'}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-500">
            {selectedCompany ? (
              <>
                <span className="font-mono">{selectedCompany.code}</span>
                <span>•</span>
                <span>{selectedCompany.baseCurrency}</span>
                <span>•</span>
                <span>{formatNumber(selectedCompany.totalAccountsCount)} حساب</span>
              </>
            ) : (
              'أنشئ شركة للبدء'
            )}
          </span>
        </span>
        <ChevronDownIcon width={16} height={16} className="shrink-0 text-ink-400" />
      </button>

      {open ? (
        <div className="absolute end-0 z-40 mt-1 w-[22rem] rounded-xl border border-ink-200 bg-white p-1.5 shadow-[var(--shadow-pop)] animate-pop-in">
          <p className="px-2 py-1.5 text-[11px] font-semibold text-ink-400">
            الشركات المتاحة ({formatNumber(companies.length)})
          </p>
          <div className="max-h-80 overflow-y-auto">
            {companies.map((company) => {
              const selected = company.id === selectedCompany?.id
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => {
                    selectCompany(company.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-lg px-2 py-2 text-right transition-colors',
                    selected ? 'bg-brand-50' : 'hover:bg-ink-50',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink-800">
                      {company.nameArabic}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-ink-500">
                      {company.code} • عمق {company.maxAccountDepth} مستويات •{' '}
                      {company.isCoaInitialized ? 'مهيأة' : 'غير مهيأة'}
                    </span>
                  </span>
                  {company.isCoaInitialized ? (
                    <Badge tone="emerald" className="shrink-0">
                      مهيأة
                    </Badge>
                  ) : (
                    <Badge tone="amber" className="shrink-0">
                      بانتظار التهيئة
                    </Badge>
                  )}
                  {selected ? <CheckIcon width={15} height={15} className="mt-0.5 text-brand-700" /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
