import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ACCOUNT_TYPE_OPTIONS, SYSTEM_ROLE_OPTIONS } from '@/api/enums'
import type { AccountType, SystemAccountRole } from '@/api/enums'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form'
import { Modal } from '@/components/ui/Modal'
import { PlusIcon, TrashIcon } from '@/components/ui/icons'
import { useCreateTemplate } from './hooks'

const INDUSTRY_OPTIONS = [
  { value: 'Commercial', label: 'تجاري' },
  { value: 'Services', label: 'خدمات واستشارات' },
  { value: 'Manufacturing', label: 'صناعي' },
  { value: 'RealEstate', label: 'عقاري' },
  { value: 'NonProfit', label: 'غير ربحي' },
  { value: 'General', label: 'عام' },
]

const nodeSchema = z.object({
  code: z.string().trim().min(1, 'الرمز إلزامي'),
  nameArabic: z.string().trim().min(2, 'الاسم العربي إلزامي'),
  nameEnglish: z.string().trim().min(1, 'الاسم الإنجليزي إلزامي'),
  accountType: z.number({ error: 'النوع إلزامي' }).int(),
  level: z.number({ error: 'المستوى إلزامي' }).int().min(1, 'المستوى 1 على الأقل').max(10),
  parentNodeCode: z.string().trim().optional(),
  isHeader: z.boolean(),
  isPostable: z.boolean(),
  defaultSystemRole: z.number().nullable(),
})

const templateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'رمز القالب إلزامي (3 أحرف على الأقل)')
      .regex(/^[A-Za-z0-9_]+$/, 'يُسمح بالأحرف اللاتينية والأرقام والشرطة السفلية فقط'),
    nameArabic: z.string().trim().min(3, 'اسم القالب بالعربية إلزامي'),
    nameEnglish: z.string().trim().min(3, 'اسم القالب بالإنجليزية إلزامي'),
    industryType: z.string().trim().min(2),
    recommendedMaxDepth: z.number().int().min(3).max(10),
    description: z.string().trim().optional(),
    nodes: z.array(nodeSchema).min(1, 'أضف بندًا واحدًا على الأقل'),
  })
  .superRefine((value, ctx) => {
    const codes = new Set<string>()
    value.nodes.forEach((node, index) => {
      const code = node.code.trim()
      if (codes.has(code)) {
        ctx.addIssue({
          code: 'custom',
          path: ['nodes', index, 'code'],
          message: 'رمز مكرر داخل القالب',
        })
      }
      codes.add(code)
    })

    value.nodes.forEach((node, index) => {
      const parent = node.parentNodeCode?.trim()
      if (parent) {
        const parentNode = value.nodes.find((candidate) => candidate.code.trim() === parent)
        if (!parentNode) {
          ctx.addIssue({
            code: 'custom',
            path: ['nodes', index, 'parentNodeCode'],
            message: 'رمز الحساب الأب غير موجود في القالب',
          })
        } else if (parentNode.level + 1 !== node.level) {
          ctx.addIssue({
            code: 'custom',
            path: ['nodes', index, 'level'],
            message: `المستوى يجب أن يساوي مستوى الأب + 1 (= ${parentNode.level + 1})`,
          })
        } else if (parentNode.accountType !== node.accountType) {
          ctx.addIssue({
            code: 'custom',
            path: ['nodes', index, 'accountType'],
            message: 'نوع الحساب يجب أن يطابق نوع الحساب الأب',
          })
        }
      } else if (node.level !== 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['nodes', index, 'level'],
          message: 'الحساب الجذري يجب أن يكون في المستوى 1',
        })
      }
    })
  })

type TemplateFormValues = z.infer<typeof templateSchema>

const defaultValues: TemplateFormValues = {
  code: '',
  nameArabic: '',
  nameEnglish: '',
  industryType: 'Commercial',
  recommendedMaxDepth: 5,
  description: '',
  nodes: [
    {
      code: '1',
      nameArabic: 'الأصول',
      nameEnglish: 'Assets',
      accountType: 1,
      level: 1,
      parentNodeCode: '',
      isHeader: true,
      isPostable: false,
      defaultSystemRole: null,
    },
  ],
}

export function TemplateFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createTemplate = useCreateTemplate()

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'nodes' })

  useEffect(() => {
    if (open) form.reset(defaultValues)
  }, [open, form])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createTemplate.mutateAsync({
        code: values.code.trim().toUpperCase(),
        nameArabic: values.nameArabic,
        nameEnglish: values.nameEnglish,
        industryType: values.industryType,
        recommendedMaxDepth: values.recommendedMaxDepth,
        description: values.description || null,
        nodes: values.nodes.map((node) => ({
          code: node.code.trim(),
          nameArabic: node.nameArabic,
          nameEnglish: node.nameEnglish,
          accountType: node.accountType as AccountType,
          level: node.level,
          parentNodeCode: node.parentNodeCode?.trim() || null,
          isHeader: node.isHeader,
          isPostable: node.isHeader ? false : node.isPostable,
          defaultSystemRole: node.defaultSystemRole as SystemAccountRole | null,
        })),
      })
      onClose()
    } catch {
      /* التنبيه يُعرض من الـ hook */
    }
  })

  const nodesError = form.formState.errors.nodes
  const rootNodesError = nodesError?.root?.message ?? (typeof nodesError?.message === 'string' ? nodesError.message : undefined)

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="إنشاء قالب دليل حسابات مخصص"
      description="يتم التحقق من سلامة الهيكل في الواجهة والخادم: عدم تكرار الرموز، وجود الآباء، تطابق المستوى مع الأب، وتطابق النوع المحاسبي."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={createTemplate.isPending}>
            إلغاء
          </Button>
          <Button type="submit" form="template-form" loading={createTemplate.isPending}>
            إنشاء القالب
          </Button>
        </>
      }
    >
      <form id="template-form" onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="رمز القالب" required error={form.formState.errors.code?.message}>
            <Input {...form.register('code')} dir="ltr" placeholder="RETAIL_CUSTOM" />
          </Field>
          <Field
            label="الاسم بالعربية"
            required
            error={form.formState.errors.nameArabic?.message}
          >
            <Input {...form.register('nameArabic')} placeholder="دليل حسابات التجزئة" />
          </Field>
          <Field label="الاسم بالإنجليزية" error={form.formState.errors.nameEnglish?.message}>
            <Input {...form.register('nameEnglish')} dir="ltr" placeholder="Retail Chart of Accounts" />
          </Field>
          <Field label="القطاع" error={form.formState.errors.industryType?.message}>
            <Select {...form.register('industryType')} options={INDUSTRY_OPTIONS} />
          </Field>
          <Field
            label="العمق الموصى به"
            error={form.formState.errors.recommendedMaxDepth?.message}
          >
            <Input
              type="number"
              min={3}
              max={10}
              dir="ltr"
              {...form.register('recommendedMaxDepth', { valueAsNumber: true })}
            />
          </Field>
          <Field label="الوصف" className="sm:col-span-2 lg:col-span-1">
            <Textarea {...form.register('description')} rows={2} />
          </Field>
        </div>

        <section className="rounded-xl border border-ink-200">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-200 bg-ink-50/60 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-ink-800">بنود القالب ({fields.length})</p>
              {rootNodesError ? (
                <p className="text-xs font-medium text-rose-600">{rootNodesError}</p>
              ) : null}
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={<PlusIcon width={14} height={14} />}
              onClick={() =>
                append({
                  code: '',
                  nameArabic: '',
                  nameEnglish: '',
                  accountType: 1,
                  level: 1,
                  parentNodeCode: '',
                  isHeader: false,
                  isPostable: true,
                  defaultSystemRole: null,
                })
              }
            >
              إضافة بند
            </Button>
          </header>

          <div className="divide-y divide-ink-100">
            {fields.map((field, index) => {
              const rowErrors = form.formState.errors.nodes?.[index]
              return (
                <div key={field.id} className="grid gap-3 p-3 lg:grid-cols-12">
                  <div className="lg:col-span-2">
                    <Field label="الرمز" required error={rowErrors?.code?.message}>
                      <Input {...form.register(`nodes.${index}.code`)} dir="ltr" placeholder="110101" />
                    </Field>
                  </div>
                  <div className="lg:col-span-3">
                    <Field label="الاسم بالعربية" required error={rowErrors?.nameArabic?.message}>
                      <Input
                        {...form.register(`nodes.${index}.nameArabic`)}
                        placeholder="صندوق النقدية"
                      />
                    </Field>
                  </div>
                  <div className="lg:col-span-3">
                    <Field label="الاسم بالإنجليزية" error={rowErrors?.nameEnglish?.message}>
                      <Input
                        {...form.register(`nodes.${index}.nameEnglish`)}
                        dir="ltr"
                        placeholder="Cash on Hand"
                      />
                    </Field>
                  </div>
                  <div className="lg:col-span-2">
                    <Field label="النوع" error={rowErrors?.accountType?.message}>
                      <Select
                        {...form.register(`nodes.${index}.accountType`, { valueAsNumber: true })}
                        options={ACCOUNT_TYPE_OPTIONS}
                      />
                    </Field>
                  </div>
                  <div className="lg:col-span-2">
                    <Field label="المستوى" error={rowErrors?.level?.message}>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        dir="ltr"
                        {...form.register(`nodes.${index}.level`, { valueAsNumber: true })}
                      />
                    </Field>
                  </div>

                  <div className="lg:col-span-2">
                    <Field label="الرمز الأب" error={rowErrors?.parentNodeCode?.message}>
                      <Input
                        {...form.register(`nodes.${index}.parentNodeCode`)}
                        dir="ltr"
                        placeholder="11"
                      />
                    </Field>
                  </div>
                  <div className="lg:col-span-4">
                    <Field label="الدور النظامي (اختياري)">
                      <Select
                        placeholder="بدون دور"
                        {...form.register(`nodes.${index}.defaultSystemRole`, {
                          setValueAs: (value) => (value === '' || value === null ? null : Number(value)),
                        })}
                        options={SYSTEM_ROLE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: `${option.label} — ${option.hint}`,
                        }))}
                      />
                    </Field>
                  </div>
                  <div className="flex items-end gap-4 lg:col-span-4">
                    <Checkbox
                      label="حساب تجميعي"
                      description="يمنع الترحيل"
                      {...form.register(`nodes.${index}.isHeader`)}
                    />
                    <Checkbox label="يقبل الترحيل" {...form.register(`nodes.${index}.isPostable`)} />
                  </div>
                  <div className="flex items-end justify-end lg:col-span-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                      icon={<TrashIcon width={14} height={14} />}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {createTemplate.isError ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {errorMessage(createTemplate.error)}
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
