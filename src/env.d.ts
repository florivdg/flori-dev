/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_DEFAULT_BROWSER_WEB_SOCKET_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
