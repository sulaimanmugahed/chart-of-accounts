import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('card-surface', className)}>{children}</section>
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 px-4 py-3 sm:px-5',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-ink-500">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function CardBody({
  className,
  children,
  padded = true,
}: {
  className?: string
  children: ReactNode
  padded?: boolean
}) {
  return <div className={cn(padded && 'p-4 sm:p-5', className)}>{children}</div>
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'brand',
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'brand' | 'sky' | 'amber' | 'rose' | 'violet' | 'emerald'
  icon?: ReactNode
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="card-surface flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink-500">{label}</p>
        <p className="mt-1 text-xl font-semibold text-ink-900 tabular-nums">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-xs text-ink-500">{hint}</p> : null}
      </div>
      {icon ? (
        <span className={cn('flex size-10 items-center justify-center rounded-xl', tones[tone])}>
          {icon}
        </span>
      ) : null}
    </div>
  )
}
