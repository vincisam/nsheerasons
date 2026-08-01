import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel serves from root domain — no subpath prefix needed
export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Explicitly inject env vars at build time
    'import.meta.env.VITE_DESIGN_BACKEND_URL': JSON.stringify(
      process.env.VITE_DESIGN_BACKEND_URL || 'https://nsheerasons.up.railway.app/api/ai/jewellery-design'
    ),
    'import.meta.env.VITE_RATES_BACKEND_URL': JSON.stringify(
      process.env.VITE_RATES_BACKEND_URL || 'https://nsheera-rates-proxy-production.up.railway.app/api/rates'
    ),
    'import.meta.env.VITE_ASTRO_BACKEND_URL': JSON.stringify(
      process.env.VITE_ASTRO_BACKEND_URL || 'https://nsheerasons.up.railway.app/api/ai/stone-suggestion'
    ),
    'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(
      process.env.VITE_FRONTEND_URL || 'https://nsheerasons-crnr.vercel.app'
    ),
  },
  server: {
    proxy: {
      // Proxy /api/* to the backend during local development
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
