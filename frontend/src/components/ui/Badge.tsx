import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

import type { ColorTone } from '@/api/enums'

export type BadgeTone = ColorTone

const TONES: Record<BadgeTone, string> = {
  slate: 'bg-ink-100 text-ink-700 border-ink-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  brand: 'bg-brand-50 text-brand-800 border-brand-200',
  teal: 'bg-teal-50 text-teal-700 border-teal-200',
}

export interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'slate', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  )
}
