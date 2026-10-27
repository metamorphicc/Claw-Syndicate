// Isolated, local-only media fixture. Never reads .env.api or the production database.
import { buildApi } from '../../../server/app';
import { Store } from '../../../server/store';
import { createServer } from 'vite';

const store = new Store(':memory:');
// Deliberately public throwaway credentials: this database exists only for the capture session.
await store.register('capture@claw.invalid', 'Claw Studio', 'LocalCaptureOnly2026!', true);
const api = buildApi({ store, origins: ['http://127.0.0.1:5182'], secureCookies: false });
await api.listen({ host: '127.0.0.1', port: 4320 });
const web = await createServer({
  server: {
    host: '127.0.0.1', port: 5182, strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:4320', changeOrigin: false } },
  },
});
await web.listen();
console.log('Local media capture: http://127.0.0.1:5182');
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await web.close();
  await api.close();
  store.db.close();
  process.exit(0);
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
