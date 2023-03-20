/// <reference types="@astrojs/image/client" />

interface ImportMetaEnv {
  readonly PUBLIC_VERCEL_EDGE_CONFIG_ID: string
  readonly PUBLIC_VERCEL_EDGE_CONFIG_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
