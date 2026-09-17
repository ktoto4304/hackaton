import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Умеренный лимит — оставляем как «сигнализацию» на случай,
    // если какой-то чанк внезапно раздуется.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // OpenLayers — самая тяжёлая библиотека карты
          if (id.includes('node_modules/ol/')) return 'vendor-ol';

          // Ant Design + его иконки
          if (id.includes('node_modules/antd/')) return 'vendor-antd';
          if (id.includes('node_modules/@ant-design/')) return 'vendor-antd';
          if (id.includes('node_modules/rc-')) return 'vendor-antd';

          // React и react-dom отдельно
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          // Роутер
          if (id.includes('node_modules/react-router')) return 'vendor-router';

          // Стейт
          if (id.includes('node_modules/zustand/')) return 'vendor-zustand';

          // Формы и валидация
          if (
            id.includes('node_modules/react-hook-form/') ||
            id.includes('node_modules/@hookform/') ||
            id.includes('node_modules/zod/')
          ) {
            return 'vendor-forms';
          }

          // Всё остальное — в общий vendor
          return 'vendor';
        },
      },
    },
  },
});