/**
 * مُشغّل اختبار الدخان: يحمّل وحدة الاختبار عبر Vite (SSR) ثم ينفذها.
 * npm run smoke
 */
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
})

try {
  const module = await server.ssrLoadModule('/scripts/smoke-render.tsx')
  await module.run()
} finally {
  await server.close()
}
