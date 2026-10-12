/**
 * إضافة Vite تُشغّل واجهة REST وهمية داخل سيرفر التطوير/المعاينة.
 * الهدف: تشغيل الواجهة الأمامية كاملةً دون الحاجة إلى .NET + PostgreSQL،
 * مع نفس العقود تمامًا — فقط بدّل VITE_API_MODE=real للاتصال بالـ Backend الحقيقي.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { createMockApi } from './handlers.ts'
import type { MockRequest, MockResponse } from './handlers.ts'

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve(undefined)
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(raw)
      }
    })
    req.on('error', () => resolve(undefined))
  })
}

function send(res: ServerResponse, response: MockResponse): void {
  res.statusCode = response.status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')

  if (response.status === 204 || response.body === undefined) {
    res.end()
    return
  }

  res.end(JSON.stringify(response.body))
}

export function mockApiPlugin(options?: { latencyMs?: number }): Plugin {
  const latency = options?.latencyMs ?? 140

  const createMiddleware = () => {
    const api = createMockApi()

    return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const isApi = url.pathname.startsWith('/api') || url.pathname === '/ping'

      if (!isApi) {
        next()
        return
      }

      const body = req.method === 'GET' || req.method === 'DELETE' ? undefined : await readBody(req)

      const request: MockRequest = {
        method: (req.method ?? 'GET').toUpperCase(),
        pathname: url.pathname,
        searchParams: url.searchParams,
        body,
      }

      const response = api.handled(request)

      // محاكاة زمن استجابة واقعي للشبكة
      const jitter = latency > 0 ? Math.round(latency * (0.4 + Math.random())) : 0
      if (jitter > 0) await new Promise((resolve) => setTimeout(resolve, jitter))

      if (req.method === 'GET') {
        // eslint-disable-next-line no-console
        console.log(`[mock-api] ${request.method} ${url.pathname}${url.search} → ${response.status}`)
      } else {
        // eslint-disable-next-line no-console
        console.log(
          `[mock-api] ${request.method} ${url.pathname}${url.search} → ${response.status}${
            response.status >= 400 ? ` (${JSON.stringify(response.body).slice(0, 160)})` : ''
          }`,
        )
      }

      send(res, response)
    }
  }

  return {
    name: 'coa-mock-api',
    configureServer(server) {
      server.middlewares.use(createMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware())
    },
  }
}
