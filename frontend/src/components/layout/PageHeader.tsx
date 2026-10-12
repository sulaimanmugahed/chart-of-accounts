import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-xs leading-5 text-ink-500">{description}</p>
        ) : null}
        {meta ? <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
