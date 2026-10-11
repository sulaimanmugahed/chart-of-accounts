import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ACCOUNT_TYPE_LABEL,
  SYSTEM_ROLE_EXPECTED_TYPE,
  SYSTEM_ROLE_LABEL,
  SYSTEM_ROLE_OPTIONS,
  SystemAccountRole,
} from '@/api/enums'
import type { AccountDto, SystemAccountMappingDto } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Select, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { useSetRoleMapping } from './hooks'

const schema = z.object({
  role: z.number({ error: 'اختر الدور النظامي' }).int(),
  accountId: z.string().min(1, 'اختر الحساب المحاسبي المرتبط'),
  isLocked: z.boolean(),
  forceIfLocked: z.boolean(),
  notes: z.string().trim().max(300, 'الملاحظات طويلة جدًا').optional(),
})

type FormValues = z.infer<typeof schema>

export interface RoleMappingDialogProps {
  open: boolean
  onClose: () => void
  companyId: string
  accounts: AccountDto[]
  mappings: SystemAccountMappingDto[]
  /** الدور المحدد مسبقًا (عند الربط السريع من قائمة الأدوار غير المعينة) */
  presetRole?: SystemAccountRole | null
  /** الربط الجاري تعديله */
  editingMapping?: SystemAccountMappingDto | null
}

export function RoleMappingDialog({
  open,
  onClose,
  companyId,
  accounts,
  mappings,
  presetRole,
  editingMapping,
}: RoleMappingDialogProps) {
  const setMapping = useSetRoleMapping()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: presetRole ?? SystemAccountRole.CashOnHand,
      accountId: '',
      isLocked: false,
      forceIfLocked: false,
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      role: editingMapping?.role ?? presetRole ?? SystemAccountRole.CashOnHand,
      accountId: editingMapping?.accountId ?? '',
      isLocked: editingMapping?.isLocked ?? false,
      forceIfLocked: false,
      notes: editingMapping?.notes ?? '',
    })
  }, [open, presetRole, editingMapping, form])

  const role = useWatch({ control: form.control, name: 'role' }) as SystemAccountRole
  const isLocked = useWatch({ control: form.control, name: 'isLocked' })
  const expectedType = SYSTEM_ROLE_EXPECTED_TYPE[role]
  const existingForRole = mappings.find((mapping) => mapping.role === role)
  const isChangingLockedMapping = Boolean(existingForRole?.isLocked && editingMapping)

  // الحسابات المرشحة: تحليلية (تقبل الترحيل) ومن النوع المتوقع للدور
  const candidateAccounts = useMemo(
    () =>
      accounts.filter(
        (account) => account.isPostable && !account.isHeader && account.accountType === expectedType,
      ),
    [accounts, expectedType],
  )

  // إعادة ضبط الحساب المختار إذا لم يعد متوافقًا مع الدور
  useEffect(() => {
    const selected = form.getValues('accountId')
    if (selected && !candidateAccounts.some((account) => account.id === selected)) {
      form.setValue('accountId', '')
    }
  }, [candidateAccounts, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await setMapping.mutateAsync({
        companyId,
        body: {
          role: values.role as SystemAccountRole,
          accountId: values.accountId,
          isLocked: values.isLocked,
          forceIfLocked: values.forceIfLocked,
          notes: values.notes || null,
        },
      })
      onClose()
    } catch {
      /* التنبيه يُعرض من الـ hook */
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingMapping ? 'تعديل ربط دور نظامي' : 'ربط دور نظامي بحساب محاسبي'}
      description="يتحقق الخادم من أن الحساب تحليلي (يقبل الترحيل) وأن نوعه مطابق للنوع المتوقع للدور (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={setMapping.isPending}>
            إلغاء
          </Button>
          <Button type="submit" form="role-mapping-form" loading={setMapping.isPending}>
            حفظ الربط
          </Button>
        </>
      }
    >
      <form id="role-mapping-form" onSubmit={onSubmit} className="space-y-4">
        <Field label="الدور النظامي" required error={form.formState.errors.role?.message}>
          <Select
            {...form.register('role', { valueAsNumber: true })}
            disabled={Boolean(editingMapping)}
            options={SYSTEM_ROLE_OPTIONS.map((option) => ({
              value: option.value,
              label: `${option.label} — ${option.hint}`,
            }))}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-600">
          <Badge tone="brand">{SYSTEM_ROLE_LABEL[role]}</Badge>
          <span>
            النوع المتوقع: <strong>{ACCOUNT_TYPE_LABEL[expectedType]}</strong>
          </span>
          <span className="text-ink-400">|</span>
          <span>حسابات مرشحة: {candidateAccounts.length}</span>
        </div>

        <Field
          label="الحساب المحاسبي المرتبط"
          required
          error={form.formState.errors.accountId?.message}
          hint={
            candidateAccounts.length
              ? 'القائمة تعرض الحسابات التحليلية المطابقة للنوع المتوقع فقط'
              : 'لا يوجد حساب تحليلي مطابق لهذا النوع في شجرة الشركة — أضف حسابًا أولًا'
          }
        >
          <Select
            placeholder="اختر الحساب..."
            {...form.register('accountId')}
            options={candidateAccounts.map((account) => ({
              value: account.id,
              label: `${account.code} — ${account.nameArabic}`,
            }))}
          />
        </Field>

        <Field label="ملاحظات" error={form.formState.errors.notes?.message}>
          <Textarea {...form.register('notes')} rows={2} placeholder="سبب التعيين أو مرجع القرار" />
        </Field>

        <div className="space-y-3 rounded-xl border border-ink-200 p-3">
          <Checkbox
            label="قفل الربط"
            description="يمنع تغيير الحساب المرتبط لاحقًا إلا بكسر القفل"
            {...form.register('isLocked')}
          />
          {isLocked || existingForRole?.isLocked ? (
            <Checkbox
              label="كسر القفل الحالي (Force)"
              description="صلاحية استثنائية لتغيير ربط مقفل"
              {...form.register('forceIfLocked')}
            />
          ) : null}
          {isChangingLockedMapping && !form.watch('forceIfLocked') ? (
            <p className="text-xs text-amber-700">
              هذا الربط مقفل حاليًا؛ سيُرفض التعديل من الخادم ما لم تفعّل خيار كسر القفل.
            </p>
          ) : null}
        </div>
      </form>
    </Modal>
  )
}
