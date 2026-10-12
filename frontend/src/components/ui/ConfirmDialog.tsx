import type { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'
import { AlertTriangleIcon } from './icons'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  destructive = true,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            destructive
              ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600'
              : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600'
          }
        >
          <AlertTriangleIcon width={20} height={20} />
        </span>
        <div className="text-sm leading-6 text-ink-600">
          {description ?? 'هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عنه.'}
        </div>
      </div>
    </Modal>
  )
}
