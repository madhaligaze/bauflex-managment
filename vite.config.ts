import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // ГЛАВНОЕ: запрещаем Vite очищать папку dist, чтобы не удалить сервер от tsup
    emptyOutDir: false,
  },
  server: {
    proxy: {
      // Все запросы, начинающиеся с /api, будут перенаправлены на бэкенд (порт 5000)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});