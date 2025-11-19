/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GHN_API_URL: string
  readonly VITE_GHN_TOKEN: string
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  readonly VITE_FPT_AI_API_KEY: string
  readonly VITE_FPT_AI_OCR_URL: string
  readonly VITE_CHAT_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}