import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('coalgov_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("coalgov_token");
      localStorage.removeItem("coalgov_user");

      // Home page aur public pages par redirect mat karo
      const publicPages = ["/", "/login", "/register", "/forgot-password", "/transparency"];

      if (!publicPages.includes(window.location.pathname)) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(err);
  }
);

export default api;

export const getErrorMessage = (err) =>
  err?.response?.data?.error || 'Something went wrong. Please try again.';
