import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach JWT Bearer token from tab-isolated sessionStorage (with localStorage fallback)
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('lms_token') || localStorage.getItem('lms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle token expiration or unauthorized access
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Clear token if invalid or expired
      if (
        error.response.data?.message?.includes('expired') ||
        error.response.data?.message?.includes('token')
      ) {
        sessionStorage.removeItem('lms_token');
        sessionStorage.removeItem('lms_user');
        localStorage.removeItem('lms_token');
        localStorage.removeItem('lms_user');
        window.dispatchEvent(new Event('lms_auth_logout'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
