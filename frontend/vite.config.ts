import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Note: Vite 8 removed esbuild.drop API (switched to oxc transforms).
// Console stripping in production builds can be added via a Rollup plugin if needed.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.FRONTEND_PORT ? parseInt(process.env.FRONTEND_PORT) : 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: `http://backend:${process.env.BACKEND_PORT || 3001}`,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
