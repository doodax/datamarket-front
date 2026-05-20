import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le base path doit correspondre au nom du repo GitHub
// Si le repo s'appelle "datamarket-front", base = '/datamarket-front/'
// Pour le dev local, base = '/'
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/datamarket-front/' : '/',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
}));
