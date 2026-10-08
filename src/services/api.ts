import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to reject HTML rewrites returned by Vercel for missing backend routes
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
      return Promise.reject(new Error('Vercel SPA rewrite returned HTML instead of API JSON'));
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default api;
