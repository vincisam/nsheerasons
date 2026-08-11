import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Node backend (AI design + astro) — same-origin via Vercel serverless function
    'import.meta.env.VITE_DESIGN_BACKEND_URL': JSON.stringify('/api/ai/jewellery-design'),
    'import.meta.env.VITE_ASTRO_BACKEND_URL': JSON.stringify('/api/ai/stone-suggestion'),
    // Java rates-proxy — separate service on Railway, called directly
    'import.meta.env.VITE_RATES_BACKEND_URL': JSON.stringify(
      process.env.VITE_RATES_BACKEND_URL || 'https://nsheera-rates-proxy-production.up.railway.app/api/rates'
    ),
  },
  server: {
    proxy: {
      // nsheera-backend (Node/Express) — run it locally with
      // `cd nsheera-backend && npm run dev` (defaults to port 5000, see
      // nsheera-backend/.env.example). In production this same backend is
      // deployed as the /api/index.js Vercel function (see vercel.json),
      // so no separate base URL is needed there — same-origin /api works.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
