import axios from 'axios';

export const API_ORIGIN = (import.meta.env.VITE_API_URL || '')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
  timeout: 25_000,
  headers: {
    Accept: 'application/json',
  },
});

let csrfToken = null;
let csrfRequest = null;

async function fetchCsrfToken() {
  if (!csrfRequest) {
    csrfRequest = api
      .get('/auth/csrf')
      .then((response) => {
        csrfToken = response.data?.data?.csrfToken || null;
        return csrfToken;
      })
      .finally(() => {
        csrfRequest = null;
      });
  }
  return csrfRequest;
}

export function ensureCsrf() {
  return csrfToken ? Promise.resolve(csrfToken) : fetchCsrfToken();
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const token = await ensureCsrf();
    if (token) {
      config.headers['X-CSRF-Token'] = token;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isCsrfError =
      error.response?.status === 403 &&
      String(error.response?.data?.message || '').toLowerCase().includes('csrf');

    if (isCsrfError && config && !config._csrfRetry) {
      config._csrfRetry = true;
      csrfToken = null;
      const token = await fetchCsrfToken();
      if (token) {
        config.headers['X-CSRF-Token'] = token;
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

export function imageUrl(path, fallback = '/images/foods/hero-food.jpg') {
  if (!path) return fallback;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  if (path.startsWith('/uploads') && API_ORIGIN) {
    return `${API_ORIGIN}${path}`;
  }
  return path;
}
