import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        experience: fileURLToPath(new URL('./experience.html', import.meta.url)),
      },
    },
  },
  server: {
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:4318', changeOrigin: false } },
  },
});
