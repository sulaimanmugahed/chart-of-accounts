import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { mockApiPlugin } from './mock/vite-plugin.ts'

/**
 * وضع التشغيل:
 *  - mock (الافتراضي): واجهة برمجية وهمية داخلية تعمل داخل سيرفر التطوير لمعاينة الواجهة دون تشغيل الـ Backend.
 *  - real: تمرير كافة الطلبات إلى واجهة .NET الفعلية (VITE_API_TARGET، الافتراضي http://localhost:5126).
 * يمكن تحديد الوضع عبر ملف .env: VITE_API_MODE=real
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiMode: 'mock' | 'real' = env.VITE_API_MODE?.toLowerCase() === 'real' ? 'real' : 'mock'
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:5126'
  const hmrClientPort = env.VITE_HMR_CLIENT_PORT ? Number(env.VITE_HMR_CLIENT_PORT) : undefined

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(apiMode === 'mock' ? [mockApiPlugin()] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@mock': fileURLToPath(new URL('./mock', import.meta.url)),
      },
    },
    define: {
      __API_MODE__: JSON.stringify(apiMode),
      __API_TARGET__: JSON.stringify(apiMode === 'real' ? apiTarget : 'mock://in-memory'),
    },
    server: {
      host: '0.0.0.0',
      port: Number(env.PORT || 5173),
      strictPort: false,
      // السماح بالوصول عبر نطاقات المعاينة المُوكّلة (proxy) مثل *.e2b.app
      allowedHosts: true,
      ...(hmrClientPort
        ? { hmr: { protocol: env.VITE_HMR_PROTOCOL || 'wss', clientPort: hmrClientPort } }
        : {}),
      proxy:
        apiMode === 'real'
          ? {
              '/api': { target: apiTarget, changeOrigin: true, secure: false },
              '/ping': { target: apiTarget, changeOrigin: true, secure: false },
            }
          : undefined,
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.PORT || 4173),
      allowedHosts: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
