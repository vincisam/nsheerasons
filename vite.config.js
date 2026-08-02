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
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
