import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CompanyDto } from '@/api/types'
import { CURRENCY_OPTIONS, MONTH_OPTIONS } from '@/lib/format'
import { firstFieldError, isNetworkError } from '@/lib/errors'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { useCreateCompany, useUpdateCompany } from './hooks'

const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'رمز الشركة إلزامي (حرفان على الأقل)')
    .max(30, 'الرمز طويل جدًا')
    .regex(/^[A-Za-z0-9_-]+$/, 'يُسمح بالأحرف اللاتينية والأرقام والشرطة فقط'),
  nameArabic: z.string().trim().min(2, 'الاسم العربي إلزامي'),
  nameEnglish: z.string().trim().min(2, 'الاسم الإنجليزي إلزامي'),
  taxNumber: z.string().trim().max(30, 'الرقم الضريبي طويل جدًا').optional(),
  baseCurrency: z.string().trim().min(3, 'العملة إلزامية'),
  fiscalYearStartMonth: z
    .number({ error: 'شهر بداية السنة المالية إلزامي' })
    .int()
    .min(1)
    .max(12),
  maxAccountDepth: z
    .number({ error: 'حد العمق إلزامي' })
    .int('يجب إدخال رقم صحيح')
    .min(3, 'الحد الأدنى للعمق 3 مستويات')
    .max(10, 'الحد الأقصى للعمق 10 مستويات'),
})

const updateSchema = createSchema.omit({ code: true, fiscalYearStartMonth: true, maxAccountDepth: true })

type CreateValues = z.infer<typeof createSchema>
type UpdateValues = z.infer<typeof updateSchema>

export interface CompanyFormDialogProps {
  open: boolean
  onClose: () => void
  company?: CompanyDto | null
}

export function CompanyFormDialog({ open, onClose, company }: CompanyFormDialogProps) {
  const isEdit = Boolean(company)
  const createCompany = useCreateCompany()
  const updateCompany = useUpdateCompany()

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      code: '',
      nameArabic: '',
      nameEnglish: '',
      taxNumber: '',
      baseCurrency: 'SAR',
      fiscalYearStartMonth: 1,
      maxAccountDepth: 5,
    },
  })

  const updateForm = useForm<UpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      nameArabic: company?.nameArabic ?? '',
      nameEnglish: company?.nameEnglish ?? '',
      taxNumber: company?.taxNumber ?? '',
      baseCurrency: company?.baseCurrency ?? 'SAR',
    },
  })

  // إعادة تعبئة النموذج عند تغيير الشركة المستهدفة
  useEffect(() => {
    if (!open) return
    if (company) {
      updateForm.reset({
        nameArabic: company.nameArabic,
        nameEnglish: company.nameEnglish,
        taxNumber: company.taxNumber ?? '',
        baseCurrency: company.baseCurrency,
      })
    } else {
      createForm.reset({
        code: '',
        nameArabic: '',
        nameEnglish: '',
        taxNumber: '',
        baseCurrency: 'SAR',
        fiscalYearStartMonth: 1,
        maxAccountDepth: 5,
      })
    }
  }, [open, company, createForm, updateForm])

  const submitting = createCompany.isPending || updateCompany.isPending

  const onCreate = createForm.handleSubmit(async (values) => {
    try {
      await createCompany.mutateAsync({
        code: values.code,
        nameArabic: values.nameArabic,
        nameEnglish: values.nameEnglish,
        taxNumber: values.taxNumber || null,
        baseCurrency: values.baseCurrency,
        fiscalYearStartMonth: values.fiscalYearStartMonth,
        maxAccountDepth: values.maxAccountDepth,
      })
      onClose()
    } catch (error) {
      if (isNetworkError(error)) return
      const codeError = firstFieldError(error, 'Code')
      if (codeError) createForm.setError('code', { message: codeError })
      const nameError = firstFieldError(error, 'NameArabic')
      if (nameError) createForm.setError('nameArabic', { message: nameError })
    }
  })

  const onUpdate = updateForm.handleSubmit(async (values) => {
    if (!company) return
    try {
      await updateCompany.mutateAsync({
        companyId: company.id,
        body: {
          nameArabic: values.nameArabic,
          nameEnglish: values.nameEnglish,
          taxNumber: values.taxNumber || null,
          baseCurrency: values.baseCurrency,
        },
      })
      onClose()
    } catch {
      /* التنبيهات تُعرض تلقائيًا من الـ hook */
    }
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `تعديل بيانات الشركة: ${company?.nameArabic}` : 'إضافة شركة جديدة'}
      description={
        isEdit
          ? 'يمكن تعديل الاسم والرقم الضريبي والعملة. رمز الشركة وحد العمق يُداران من شاشة الشركات.'
          : 'حد العمق يحدد أقصى عدد مستويات مسموح به في شجرة حسابات الشركة (من 3 إلى 10 مستويات).'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            إلغاء
          </Button>
          <Button
            type="submit"
            form={isEdit ? 'company-update-form' : 'company-create-form'}
            loading={submitting}
          >
            {isEdit ? 'حفظ التعديلات' : 'إنشاء الشركة'}
          </Button>
        </>
      }
    >
      {isEdit ? (
        <form id="company-update-form" onSubmit={onUpdate} className="grid gap-4 sm:grid-cols-2">
          <Field
            label="الاسم بالعربية"
            required
            error={updateForm.formState.errors.nameArabic?.message}
          >
            <Input
              {...updateForm.register('nameArabic')}
              invalid={Boolean(updateForm.formState.errors.nameArabic)}
              placeholder="شركة الأمل للتجارة"
            />
          </Field>

          <Field label="الاسم بالإنجليزية" error={updateForm.formState.errors.nameEnglish?.message}>
            <Input {...updateForm.register('nameEnglish')} dir="ltr" placeholder="Al-Amal Trading" />
          </Field>

          <Field label="الرقم الضريبي" error={updateForm.formState.errors.taxNumber?.message}>
            <Input {...updateForm.register('taxNumber')} dir="ltr" placeholder="300123456700003" />
          </Field>

          <Field label="عملة الأساس" error={updateForm.formState.errors.baseCurrency?.message}>
            <Select {...updateForm.register('baseCurrency')} options={CURRENCY_OPTIONS} />
          </Field>
        </form>
      ) : (
        <form id="company-create-form" onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <Field
            label="رمز الشركة"
            required
            hint="معرّف مختصر بالأحرف اللاتينية (مثال: COMP-004)"
            error={createForm.formState.errors.code?.message}
          >
            <Input {...createForm.register('code')} dir="ltr" placeholder="COMP-004" />
          </Field>

          <Field
            label="الاسم بالعربية"
            required
            error={createForm.formState.errors.nameArabic?.message}
          >
            <Input {...createForm.register('nameArabic')} placeholder="شركة الأمل للتجارة" />
          </Field>

          <Field label="الاسم بالإنجليزية" error={createForm.formState.errors.nameEnglish?.message}>
            <Input
              {...createForm.register('nameEnglish')}
              dir="ltr"
              placeholder="Al-Amal Trading & Import Co."
            />
          </Field>

          <Field label="الرقم الضريبي" error={createForm.formState.errors.taxNumber?.message}>
            <Input {...createForm.register('taxNumber')} dir="ltr" placeholder="300123456700003" />
          </Field>

          <Field label="عملة الأساس" error={createForm.formState.errors.baseCurrency?.message}>
            <Select {...createForm.register('baseCurrency')} options={CURRENCY_OPTIONS} />
          </Field>

          <Field
            label="شهر بداية السنة المالية"
            error={createForm.formState.errors.fiscalYearStartMonth?.message}
          >
            <Select
              {...createForm.register('fiscalYearStartMonth', { valueAsNumber: true })}
              options={MONTH_OPTIONS}
            />
          </Field>

          <Field
            label="حد العمق الأقصى للشجرة"
            required
            hint="يُنفَّذ على مستوى الخادم عند إضافة أي حساب جديد"
            error={createForm.formState.errors.maxAccountDepth?.message}
          >
            <Input
              type="number"
              min={3}
              max={10}
              dir="ltr"
              {...createForm.register('maxAccountDepth', { valueAsNumber: true })}
            />
          </Field>
        </form>
      )}
    </Modal>
  )
}
