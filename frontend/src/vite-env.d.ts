/// <reference types="vite/client" />

/** يُعرَّف في vite.config.ts عبر define */
declare const __API_MODE__: 'mock' | 'real'
declare const __API_TARGET__: string

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_MODE?: 'mock' | 'real'
  readonly VITE_API_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
