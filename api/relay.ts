import { createRelay } from '../server/relay';
export default {
  fetch(request: Request) {
    return createRelay({
      upstream: process.env.API_UPSTREAM,
      token: process.env.PROXY_TOKEN,
      origins: (process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    })(request);
  },
};
