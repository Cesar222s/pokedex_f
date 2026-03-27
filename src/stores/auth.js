import { defineStore } from 'pinia';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('pokedex_user')) || null,
    token: localStorage.getItem('pokedex_token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },

  actions: {
    async register(username, email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post('/auth/register', { username, email, password });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('pokedex_token', data.token);
        localStorage.setItem('pokedex_user', JSON.stringify(data.user));
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Registration failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.post('/auth/login', { email, password });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('pokedex_token', data.token);
        localStorage.setItem('pokedex_user', JSON.stringify(data.user));
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchMe() {
      try {
        const { data } = await api.get('/auth/me');
        this.user = data.user;
        localStorage.setItem('pokedex_user', JSON.stringify(data.user));
      } catch {
        this.logout();
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('pokedex_token');
      localStorage.removeItem('pokedex_user');
    }
  }
});
