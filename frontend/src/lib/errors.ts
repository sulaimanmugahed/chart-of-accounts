import { ApiError } from './http'

/** استخراج رسالة خطأ عربية واضحة من أي شكل للأخطاء */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'حدث خطأ غير متوقع. يرجى إعادة المحاولة.'
}

/** رمز الخطأ المحاسبي القادم من الخادم (مثل DUPLICATE_ACCOUNT_CODE) */
export function errorCode(error: unknown): string | null {
  if (error instanceof ApiError) return error.errorCode
  return null
}

export function errorStatus(error: unknown): number | null {
  if (error instanceof ApiError) return error.status || null
  return null
}

/** هل الخطأ ناتج عن عدم تشغيل واجهة .NET الخلفية؟ */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0
}

/** تعيين أخطاء الحقول القادمة من ModelState إلى react-hook-form */
export function fieldErrorsOf(error: unknown): Record<string, string[]> {
  if (error instanceof ApiError) return error.fieldErrors
  return {}
}

export function firstFieldError(
  error: unknown,
  fieldName: string,
): string | undefined {
  const errors = fieldErrorsOf(error)
  const key = Object.keys(errors).find(
    (candidate) =>
      candidate.toLowerCase().endsWith(fieldName.toLowerCase()) &&
      errors[candidate]?.length,
  )
  return key ? errors[key][0] : undefined
}
