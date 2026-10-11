import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<SegmentedOption<T>>
  className?: string
  size?: 'sm' | 'md'
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1',
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-xs',
              selected
                ? 'bg-brand-700 text-white shadow-sm'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-800',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
