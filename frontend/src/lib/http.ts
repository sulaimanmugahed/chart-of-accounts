/**
 * طبقة الاتصال بالـ Backend (fetch wrapper).
 *
 * - يعمل مع واجهة .NET الفعلية عبر البادئة النسبية /api (يمرّرها Vite proxy)،
 *   كما يعمل مع واجهة المحاكاة الداخلية في وضع التطوير.
 * - يوحّد شكل الأخطاء الصادرة من ExceptionHandlingMiddleware وNotFound وProblemDetails.
 */
import type {
  ApiErrorEnvelope,
  ApiMessageEnvelope,
  ProblemDetailsEnvelope,
} from '@/api/types'

export const API_MODE: 'mock' | 'real' = __API_MODE__
export const API_TARGET: string = __API_TARGET__

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined
>

/** خطأ موحّد يحمل رمز الحالة ورمز الخطأ المحاسبي القادم من الخادم. */
export class ApiError extends Error {
  readonly status: number
  readonly errorCode: string
  /** أخطاء الحقول القادمة من ModelState في ASP.NET Core */
  readonly fieldErrors: Record<string, string[]>

  constructor(options: {
    status: number
    message: string
    errorCode?: string
    fieldErrors?: Record<string, string[]>
  }) {
    super(options.message)
    this.name = 'ApiError'
    this.status = options.status
    this.errorCode = options.errorCode ?? `HTTP_${options.status}`
    this.fieldErrors = options.fieldErrors ?? {}
  }

  /** هل الخطأ ناتج عن عدم وجود السجل؟ */
  get isNotFound() {
    return this.status === 404
  }

  /** هل الخطأ ناتج عن تعارض (تكرار رمز، تهيئة مسبقة، قفل دور)؟ */
  get isConflict() {
    return this.status === 409
  }
}

export function buildUrl(path: string, params?: QueryParams): string {
  const url = `${BASE_URL}${path}`
  if (!params) return url

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    search.append(key, String(value))
  }

  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

async function parseError(response: Response): Promise<ApiError> {
  const fallbackMessage = `فشل الطلب (${response.status} ${response.statusText})`
  let payload: unknown = null

  try {
    const text = await response.text()
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiErrorEnvelope & ApiMessageEnvelope & ProblemDetailsEnvelope

    const fieldErrors = envelope.errors ?? {}
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean)

    const message =
      envelope.errorMessage ||
      envelope.message ||
      envelope.detail ||
      firstFieldError ||
      (envelope.title ? `${envelope.title}` : '') ||
      fallbackMessage

    return new ApiError({
      status: response.status,
      errorCode: envelope.errorCode ?? `HTTP_${response.status}`,
      message,
      fieldErrors,
    })
  }

  return new ApiError({ status: response.status, message: fallbackMessage })
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  params?: QueryParams
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, params } = options

  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      message:
        API_MODE === 'real'
          ? `تعذّر الاتصال بالخادم (${API_TARGET}). تأكد من تشغيل واجهة .NET الخلفية.`
          : 'تعذّر الاتصال بواجهة المحاكاة الداخلية.',
    })
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T

  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

export const http = {
  get: <T>(path: string, params?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', params, signal }),
  post: <T>(path: string, body?: unknown, params?: QueryParams) =>
    request<T>(path, { method: 'POST', body, params }),
  put: <T>(path: string, body?: unknown, params?: QueryParams) =>
    request<T>(path, { method: 'PUT', body, params }),
  delete: <T>(path: string, params?: QueryParams) =>
    request<T>(path, { method: 'DELETE', params }),
}
