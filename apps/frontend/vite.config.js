import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Set only in server mode (see setup.sh). The HMR websocket has to cross the
// university's external reverse proxy, whose idle timeout we don't control -
// it keeps killing the long-lived connection, which makes Vite think the dev
// server restarted and force a full-page reload every ~30s. Disable HMR
// entirely in that mode instead; local dev (no PUBLIC_HOST) keeps live-reload.
const publicHost = process.env.PUBLIC_HOST

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,

    allowedHosts: [
      'hdlab.eit.htwk-leipzig.de'
    ],

    hmr: publicHost ? false : undefined,

    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
})