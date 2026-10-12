import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { errorCode, errorMessage, isNetworkError } from '@/lib/errors'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { AlertTriangleIcon, DatabaseIcon, RefreshIcon, SearchIcon } from '@/components/ui/icons'

export function LoadingState({ label = 'جارٍ تحميل البيانات...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-12 text-sm text-ink-500">
      <Spinner className="size-4 text-brand-700" />
      {label}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-12 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        {icon ?? <SearchIcon width={22} height={22} />}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-800">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-ink-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const code = errorCode(error)
  const offline = isNetworkError(error)

  return (
    <div className={cn('flex flex-col items-center gap-3 px-4 py-12 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        {offline ? <DatabaseIcon width={22} height={22} /> : <AlertTriangleIcon width={22} height={22} />}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink-800">
          {offline ? 'تعذّر الوصول إلى الخادم' : 'لم نتمكن من إتمام الطلب'}
        </p>
        <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-ink-500">
          {errorMessage(error)}
        </p>
        {code ? (
          <p className="mt-2 inline-block rounded-lg bg-ink-100 px-2 py-0.5 font-mono text-[11px] text-ink-600">
            {code}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" icon={<RefreshIcon width={15} height={15} />} onClick={onRetry}>
          إعادة المحاولة
        </Button>
      ) : null}
    </div>
  )
}
