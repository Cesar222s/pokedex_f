import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add JWT token and check offline status
api.interceptors.request.use(
  (config) => {
    // Immediate offline check for WRITES (to trigger PWA sync UI faster)
    if (!navigator.onLine && ['post', 'put', 'delete'].includes(config.method?.toLowerCase())) {
      window.dispatchEvent(new CustomEvent('pwa-sync-queued'));
      return Promise.reject(new Error('OFFLINE'));
    }

    const token = localStorage.getItem('pokedex_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pokedex_token');
      localStorage.removeItem('pokedex_user');
      if (window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/';
      }
    }
    
    // Detect network errors (likely offline) for Background Sync notification
    if (!error.response && error.config && ['post', 'put', 'delete'].includes(error.config.method?.toLowerCase())) {
      window.dispatchEvent(new CustomEvent('pwa-sync-queued'));
    }
    
    return Promise.reject(error);
  }
);

export default api;
