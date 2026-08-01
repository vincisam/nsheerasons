import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel serves from root domain — no subpath prefix needed
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Explicitly inject env vars at build time
    'import.meta.env.VITE_DESIGN_BACKEND_URL': JSON.stringify(
      process.env.VITE_DESIGN_BACKEND_URL || 'https://nsheera-rates-proxy-production.up.railway.app/api/design/generate'
    ),
    'import.meta.env.VITE_RATES_BACKEND_URL': JSON.stringify(
      process.env.VITE_RATES_BACKEND_URL || 'https://nsheera-rates-proxy-production.up.railway.app/api/rates'
    ),
    'import.meta.env.VITE_ASTRO_BACKEND_URL': JSON.stringify(
      process.env.VITE_ASTRO_BACKEND_URL || 'https://nsheera-rates-proxy-production.up.railway.app/api/astro/suggest-stone'
    ),
  },
  server: {
    proxy: {
      // Proxy /api/* to the Spring Boot backend during local development
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
