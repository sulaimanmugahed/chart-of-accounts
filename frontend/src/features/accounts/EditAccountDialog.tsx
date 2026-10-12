import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { AccountDto } from '@/api/types'
import { ACCOUNT_TYPE_LABEL } from '@/api/enums'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { useUpdateAccount } from './hooks'

const schema = z.object({
  nameArabic: z.string().trim().min(2, 'الاسم العربي إلزامي'),
  nameEnglish: z.string().trim().min(1, 'الاسم الإنجليزي إلزامي'),
  description: z.string().trim().optional(),
  currencyCode: z.string().trim().optional(),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export function EditAccountDialog({
  account,
  companyId,
  onClose,
}: {
  account: AccountDto | null
  companyId: string
  onClose: () => void
}) {
  const updateAccount = useUpdateAccount()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameArabic: '',
      nameEnglish: '',
      description: '',
      currencyCode: '',
      isActive: true,
    },
  })

  useEffect(() => {
    if (!account) return
    form.reset({
      nameArabic: account.nameArabic,
      nameEnglish: account.nameEnglish,
      description: account.description ?? '',
      currencyCode: account.currencyCode ?? '',
      isActive: account.isActive,
    })
  }, [account, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!account) return
    try {
      await updateAccount.mutateAsync({
        companyId,
        accountId: account.id,
        body: {
          nameArabic: values.nameArabic,
          nameEnglish: values.nameEnglish,
          description: values.description || null,
          currencyCode: values.currencyCode || null,
          isActive: values.isActive,
        },
      })
      onClose()
    } catch {
      /* التنبيه يُعرض من الـ hook */
    }
  })

  return (
    <Modal
      open={Boolean(account)}
      onClose={onClose}
      title="تعديل بيانات الحساب"
      description={
        account
          ? `${account.code} — ${account.nameArabic} • المستوى ${account.level}`
          : undefined
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={updateAccount.isPending}>
            إلغاء
          </Button>
          <Button type="submit" form="account-edit-form" loading={updateAccount.isPending}>
            حفظ التعديلات
          </Button>
        </>
      }
    >
      {account ? (
        <form id="account-edit-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex flex-wrap items-center gap-2 rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-600">
            <Badge tone="slate">{ACCOUNT_TYPE_LABEL[account.accountType]}</Badge>
            <Badge tone="brand">{account.isPostable ? 'يقبل الترحيل' : 'حساب تجميعي'}</Badge>
            <span className="font-mono">{account.code}</span>
            <span className="text-ink-400">{account.lineagePath}</span>
          </div>

          <Field label="الاسم بالعربية" required error={form.formState.errors.nameArabic?.message}>
            <Input {...form.register('nameArabic')} />
          </Field>
          <Field label="الاسم بالإنجليزية" error={form.formState.errors.nameEnglish?.message}>
            <Input {...form.register('nameEnglish')} dir="ltr" />
          </Field>
          <Field label="العملة">
            <Input {...form.register('currencyCode')} dir="ltr" placeholder="SAR" />
          </Field>
          <Field label="الوصف">
            <Textarea {...form.register('description')} rows={2} />
          </Field>

          <div className="sm:col-span-2">
            <Checkbox
              label="الحساب نشط"
              description="إيقاف الحساب يمنع استخدامه في القيود الجديدة دون حذفه"
              {...form.register('isActive')}
            />
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
