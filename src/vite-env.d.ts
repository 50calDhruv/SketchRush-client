/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Game server origin for production builds. Unset in dev (Vite proxies /socket.io). */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
