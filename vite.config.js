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
    https: true,
    port: 3000,
    https: false
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  }
});
