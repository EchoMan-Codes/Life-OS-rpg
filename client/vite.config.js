import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: resolve(import.meta.dirname, '..'),
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
});
