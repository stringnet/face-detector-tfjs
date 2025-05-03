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
    host: true,      // Escucha en 0.0.0.0 para permitir conexiones externas
    port: 46607,      // Puerto para servir la app
    https: false     // HTTPS se maneja fuera del contenedor, por el proxy (Easypanel)
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  }
});
