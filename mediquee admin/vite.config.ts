import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function rootStaticFallback() {
  return {
    name: 'root-static-fallback',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        const rawUrl = req.url || '';
        if (
          rawUrl.startsWith('/logo') ||
          rawUrl.startsWith('/favicon') ||
          rawUrl.startsWith('/icons/') ||
          rawUrl.startsWith('/optimized/')
        ) {
          req.url = '/admin' + rawUrl;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/admin/',
  plugins: [react(), tailwindcss(), rootStaticFallback()],
  server: {
    port: 5174,
    host: true,
    allowedHosts: true,
    cors: true,
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
})
