import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('coalgov_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('coalgov_token');
      localStorage.removeItem('coalgov_user');

      const publicPages = [
        '/',
        '/login',
        '/register',
        '/forgot-password',
        '/transparency',
      ];

      if (!publicPages.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default api;

export const getErrorMessage = (err) =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  'Something went wrong. Please try again.';