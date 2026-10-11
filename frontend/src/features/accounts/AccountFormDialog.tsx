import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ACCOUNT_TYPE_LABEL,
  ACCOUNT_TYPE_OPTIONS,
  SYSTEM_ROLE_EXPECTED_TYPE,
  SYSTEM_ROLE_LABEL,
  SYSTEM_ROLE_OPTIONS,
  AccountType,
} from '@/api/enums'
import type { AccountDto } from '@/api/types'
import { firstFieldError } from '@/lib/errors'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { useCreateAccount } from './hooks'

const accountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, 'رمز الحساب إلزامي')
      .max(20, 'الرمز طويل جدًا')
      .regex(/^[0-9A-Za-z._-]+$/, 'يُسمح بالأرقام والأحرف اللاتينية والنقطة والشرطة'),
    nameArabic: z.string().trim().min(2, 'الاسم العربي إلزامي'),
    nameEnglish: z.string().trim().min(1, 'الاسم الإنجليزي إلزامي'),
    accountType: z.number({ error: 'نوع الحساب إلزامي' }).int(),
    parentAccountId: z.string().optional(),
    isHeader: z.boolean(),
    isPostable: z.boolean(),
    systemRole: z.number().nullable(),
    description: z.string().trim().optional(),
    currencyCode: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.isHeader && value.isPostable) {
      ctx.addIssue({
        code: 'custom',
        path: ['isPostable'],
        message: 'الحساب التجميعي لا يمكن أن يقبل الترحيل في نفس الوقت',
      })
    }
  })

type AccountFormValues = z.infer<typeof accountSchema>

export interface AccountFormDialogProps {
  open: boolean
  onClose: () => void
  companyId: string
  /** جميع حسابات الشركة (تستخدم لاختيار الحساب الأب) */
  accounts: AccountDto[]
  maxAccountDepth: number
  baseCurrency: string
}

export function AccountFormDialog({
  open,
  onClose,
  companyId,
  accounts,
  maxAccountDepth,
  baseCurrency,
}: AccountFormDialogProps) {
  const createAccount = useCreateAccount()

  const defaultValues = useMemo<AccountFormValues>(
    () => ({
      code: '',
      nameArabic: '',
      nameEnglish: '',
      accountType: AccountType.Asset,
      parentAccountId: '',
      isHeader: false,
      isPostable: true,
      systemRole: null,
      description: '',
      currencyCode: baseCurrency,
    }),
    [baseCurrency],
  )

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) form.reset(defaultValues)
  }, [open, defaultValues, form])

  const parentAccountId = useWatch({ control: form.control, name: 'parentAccountId' })
  const accountType = useWatch({ control: form.control, name: 'accountType' })
  const isHeader = useWatch({ control: form.control, name: 'isHeader' })
  const systemRole = useWatch({ control: form.control, name: 'systemRole' })

  const parentAccount = accounts.find((account) => account.id === parentAccountId)

  // الآباء المتاحون: كل الحسابات التي لم تصل بعد للحد الأقصى للعمق
  const parentOptions = accounts
    .filter((account) => account.level < maxAccountDepth)
    .map((account) => ({
      value: account.id,
      label: `${account.code} — ${account.nameArabic} (المستوى ${account.level} • ${ACCOUNT_TYPE_LABEL[account.accountType]})`,
    }))

  // توافق النوع مع الحساب الأب
  const typeOptions = parentAccount
    ? ACCOUNT_TYPE_OPTIONS.filter((option) => option.value === parentAccount.accountType)
    : ACCOUNT_TYPE_OPTIONS

  const roleTypeMismatch =
    systemRole !== null &&
    SYSTEM_ROLE_EXPECTED_TYPE[systemRole as keyof typeof SYSTEM_ROLE_EXPECTED_TYPE] !== accountType

  // الاستخدام الأمثل: عند اختيار حساب أب، نجبر النوع على نوع الأب
  useEffect(() => {
    if (parentAccount && parentAccount.accountType !== accountType) {
      form.setValue('accountType', parentAccount.accountType, { shouldValidate: true })
    }
  }, [parentAccount, accountType, form])

  useEffect(() => {
    if (isHeader) form.setValue('isPostable', false, { shouldValidate: true })
  }, [isHeader, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createAccount.mutateAsync({
        companyId,
        code: values.code.trim(),
        nameArabic: values.nameArabic,
        nameEnglish: values.nameEnglish,
        accountType: values.accountType as never,
        parentAccountId: values.parentAccountId || null,
        isHeader: values.isHeader,
        isPostable: values.isPostable,
        systemRole: (values.systemRole as never) ?? null,
        description: values.description || null,
        currencyCode: values.currencyCode || null,
      })
      onClose()
    } catch (error) {
      const codeError = firstFieldError(error, 'Code')
      if (codeError) form.setError('code', { message: codeError })
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="إضافة حساب جديد إلى شجرة الشركة"
      description={`يتحقق الخادم من عدم تجاوز حد العمق (${maxAccountDepth} مستويات) وتحويل الحساب الأب تلقائيًا إلى حساب تجميعي.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={createAccount.isPending}>
            إلغاء
          </Button>
          <Button type="submit" form="account-create-form" loading={createAccount.isPending}>
            إضافة الحساب
          </Button>
        </>
      }
    >
      <form id="account-create-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="رمز الحساب" required error={form.formState.errors.code?.message}>
          <Input {...form.register('code')} dir="ltr" placeholder="110501" />
        </Field>
        <Field label="نوع الحساب" required error={form.formState.errors.accountType?.message}>
          <Select
            {...form.register('accountType', { valueAsNumber: true })}
            disabled={Boolean(parentAccount)}
            options={typeOptions}
          />
        </Field>

        <Field label="الاسم بالعربية" required error={form.formState.errors.nameArabic?.message}>
          <Input {...form.register('nameArabic')} placeholder="عهدة الصندوق الفرعية" />
        </Field>
        <Field label="الاسم بالإنجليزية" error={form.formState.errors.nameEnglish?.message}>
          <Input {...form.register('nameEnglish')} dir="ltr" placeholder="Petty Cash" />
        </Field>

        <Field
          label="الحساب الأب"
          hint={
            parentAccount
              ? `سيتم الإنشاء في المستوى ${parentAccount.level + 1} تحت ${parentAccount.code}`
              : 'اتركه فارغًا لإنشاء حساب جذري في المستوى الأول'
          }
        >
          <Select
            placeholder="بدون حساب أب (حساب جذري)"
            {...form.register('parentAccountId')}
            options={parentOptions}
          />
        </Field>

        <Field
          label="الدور النظامي (اختياري)"
          hint={
            roleTypeMismatch
              ? `تنبيه: الدور يتطلب حسابًا من نوع «${ACCOUNT_TYPE_LABEL[SYSTEM_ROLE_EXPECTED_TYPE[systemRole as keyof typeof SYSTEM_ROLE_EXPECTED_TYPE]]}»`
              : 'يربط الحساب تلقائيًا بوحدات النظام (مبيعات، مخازن، ضرائب...)'
          }
        >
          <Select
            placeholder="بدون دور نظامي"
            invalid={roleTypeMismatch}
            {...form.register('systemRole', {
              setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
            })}
            options={SYSTEM_ROLE_OPTIONS.map((option) => ({
              value: option.value,
              label: `${SYSTEM_ROLE_LABEL[option.value]} — يتطلب ${option.hint}`,
            }))}
          />
        </Field>

        <Field label="العملة" hint="افتراضيًا عملة الشركة الأساسية">
          <Input {...form.register('currencyCode')} dir="ltr" placeholder={baseCurrency} />
        </Field>

        <Field label="وصف / سياسة محاسبية" className="sm:col-span-2">
          <Textarea {...form.register('description')} rows={2} />
        </Field>

        <div className="flex flex-col gap-3 sm:col-span-2">
          <Checkbox
            label="حساب تجميعي (Header)"
            description="يجمع أرصدة الفروع ولا يقبل قيودًا مباشرة"
            {...form.register('isHeader')}
          />
          <div>
            <Checkbox
              label="حساب تحليلي يقبل الترحيل (Postable)"
              description="القيود اليومية تُرحّل على الحسابات التحليلية فقط"
              disabled={isHeader}
              {...form.register('isPostable')}
            />
            {form.formState.errors.isPostable?.message ? (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {form.formState.errors.isPostable.message}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </Modal>
  )
}
