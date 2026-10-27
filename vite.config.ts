import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { routeWebRequest } from './web-routes';

const pageRoutes: Plugin = {
  name: 'claw-page-routes',
  configureServer(server) {
    server.middlewares.use(routeWebRequest);
  },
  configurePreviewServer(server) {
    server.middlewares.use(routeWebRequest);
  },
};

export default defineConfig({
  plugins: [pageRoutes, react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
      },
    },
  },
  server: {
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:4318', changeOrigin: false } },
  },
});
