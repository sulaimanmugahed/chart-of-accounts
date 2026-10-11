import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { XIcon } from './icons'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlay?: boolean
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-4 backdrop-blur-sm animate-fade-in sm:items-center"
      onMouseDown={(event) => {
        if (closeOnOverlay && event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'my-auto w-full rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-pop)] animate-pop-in',
          SIZES[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description ? <p className="mt-1 text-xs text-ink-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
          >
            <XIcon />
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-ink-50/60 px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
