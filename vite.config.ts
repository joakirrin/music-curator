import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['*'], // or ['jbm-macbook-air-m1','localhost', 'http://127.0.0.1:5173','.local']
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
