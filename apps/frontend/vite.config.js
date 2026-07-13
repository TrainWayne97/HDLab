import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Set only in server mode (see setup.sh) - tells Vite's HMR client to reach
// the dev server through the public domain/TLS proxy instead of localhost:5173,
// which isn't reachable from the browser in that deployment.
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

    hmr: publicHost
      ? { host: publicHost, protocol: 'wss', clientPort: 443 }
      : undefined,

    proxy: {
      '/api': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
    },
  },
})