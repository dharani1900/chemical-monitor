import axios from 'axios';

const DEFAULT_API_URL = 'https://chemical-monitor-api.onrender.com';
export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 second timeout to handle Render cold-starts gracefully
});

// Interceptor to attach JWT token and ensure FormData has correct boundary
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When sending FormData, delete Content-Type to let browser/Axios append boundary
  if (config.data instanceof FormData) {
    if (config.headers && typeof (config.headers as any).delete === 'function') {
      (config.headers as any).delete('Content-Type');
      (config.headers as any).delete('content-type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  } else if (config.headers && !config.headers['Content-Type'] && !config.headers['content-type']) {
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
      const err: any = new Error('Backend endpoint returned HTML instead of API JSON');
      err.response = response;
      return Promise.reject(err);
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
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export default api;
