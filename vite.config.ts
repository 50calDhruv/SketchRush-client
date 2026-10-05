import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

// The wire protocol lives in the server package; both sides import the same file.
const sharedDir = fileURLToPath(new URL('../SketchRush-server/src/shared', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@shared': sharedDir },
  },
  server: {
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), sharedDir] },
    // Same-origin in development: the browser talks to Vite, which forwards the socket to the
    // game server. In production, set VITE_SERVER_URL instead.
    proxy: {
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
})
