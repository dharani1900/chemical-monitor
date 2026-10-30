import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  timeout: 10000, // 10 second timeout to prevent infinite pending requests
});

// Interceptor to attach JWT token and ensure FormData has correct boundary
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When sending FormData, delete Content-Type to let browser/Axios append boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

// Interceptor to reject HTML rewrites returned by Vercel and handle 401 Unauthorized
api.interceptors.response.use(
  (response) => {
    const contentType = String(response.headers['content-type'] || '');
    if (
      (typeof response.data === 'string' &&
        (response.data.trim().startsWith('<!DOCTYPE') ||
         response.data.trim().startsWith('<html') ||
         response.data.trim().startsWith('<!'))) ||
      contentType.includes('text/html')
    ) {
      return Promise.reject(new Error('Backend endpoint returned HTML instead of API JSON'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and notify app of session expiration
      try {
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      } catch {
        // Ignore in restricted environments
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Resolves relative image and visualization paths returned by the backend
 * against the configured API base URL.
 */
export function resolveImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const rawBase = import.meta.env.VITE_API_URL || '';
  const baseUrl = typeof rawBase === 'string' ? rawBase.replace(/\/+$/, '') : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}

export default api;
