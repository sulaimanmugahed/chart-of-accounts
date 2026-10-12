import { cn } from '@/lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="جارٍ التحميل"
      className={cn(
        'inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className,
      )}
    />
  )
}
