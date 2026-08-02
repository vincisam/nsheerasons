import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    'import.meta.env.VITE_DESIGN_BACKEND_URL': JSON.stringify('/api/ai/jewellery-design'),
    'import.meta.env.VITE_RATES_BACKEND_URL': JSON.stringify('/api/rates'),
    'import.meta.env.VITE_ASTRO_BACKEND_URL': JSON.stringify('/api/ai/stone-suggestion'),
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
