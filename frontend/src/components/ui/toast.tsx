import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
  XIcon,
} from './icons'

type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE_STYLE: Record<ToastTone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: <CheckCircleIcon className="text-emerald-600" />,
  },
  error: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-900',
    icon: <XCircleIcon className="text-rose-600" />,
  },
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-900',
    icon: <InfoIcon className="text-sky-600" />,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: <AlertTriangleIcon className="text-amber-600" />,
  },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { ...toast, id }])
      window.setTimeout(() => remove(id), toast.tone === 'error' ? 9000 : 6000)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) => push({ tone: 'error', title, description }),
      info: (title, description) => push({ tone: 'info', title, description }),
      warning: (title, description) => push({ tone: 'warning', title, description }),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 start-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border px-3.5 py-3 shadow-[var(--shadow-pop)] animate-pop-in',
              TONE_STYLE[toast.tone].wrapper,
            )}
          >
            <span className="mt-0.5">{TONE_STYLE[toast.tone].icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-xs leading-5 opacity-90">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(toast.id)}
              aria-label="إغلاق التنبيه"
              className="rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
            >
              <XIcon width={15} height={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast يجب استخدامه داخل ToastProvider')
  return context
}
