const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const numberFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn')

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTimeFormatter.format(date)
}

export function formatNumber(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return numberFormatter.format(value)
}

export function formatDuration(ms?: number | null): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${formatNumber(ms)} مللي ثانية`
  return `${(ms / 1000).toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: 2 })} ثانية`
}

const CURRENCY_LABEL: Record<string, string> = {
  SAR: 'ريال سعودي (SAR)',
  AED: 'درهم إماراتي (AED)',
  EGP: 'جنيه مصري (EGP)',
  KWD: 'دينار كويتي (KWD)',
  QAR: 'ريال قطري (QAR)',
  OMR: 'ريال عماني (OMR)',
  BHD: 'دينار بحريني (BHD)',
  JOD: 'دينار أردني (JOD)',
  USD: 'دولار أمريكي (USD)',
  EUR: 'يورو (EUR)',
}

export function currencyLabel(code?: string | null): string {
  if (!code) return '—'
  return CURRENCY_LABEL[code.toUpperCase()] ?? code.toUpperCase()
}

export const CURRENCY_OPTIONS = Object.keys(CURRENCY_LABEL).map((code) => ({
  value: code,
  label: CURRENCY_LABEL[code],
}))

export function monthLabel(month: number): string {
  const safeMonth = month >= 1 && month <= 12 ? month : 1
  return new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(new Date(2024, safeMonth - 1, 1))
}

export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: monthLabel(index + 1),
}))
