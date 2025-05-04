// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',  // explícito para despliegue en contenedores
    port: 3000,
    https: false,     // manejado por Easypanel / proxy externo
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  }
});
