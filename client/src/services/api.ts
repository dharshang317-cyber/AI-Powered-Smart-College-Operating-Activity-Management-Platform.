import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusnexus_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for auth error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config.url?.includes('/auth/login')) {
        localStorage.removeItem('campusnexus_token');
        localStorage.removeItem('campusnexus_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
