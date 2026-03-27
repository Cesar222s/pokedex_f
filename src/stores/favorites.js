import { defineStore } from 'pinia';
import api from '@/services/api';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favoriteIds: [],
    loading: false
  }),

  getters: {
    isFavorite: (state) => (pokemonId) => state.favoriteIds.includes(pokemonId)
  },

  actions: {
    async fetchFavorites() {
      this.loading = true;
      try {
        const { data } = await api.get('/favorites');
        this.favoriteIds = data.favorites;
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        this.loading = false;
      }
    },

    async addFavorite(pokemonId) {
      try {
        await api.post(`/favorites/${pokemonId}`);
        if (!this.favoriteIds.includes(pokemonId)) {
          this.favoriteIds.push(pokemonId);
        }
      } catch (err) {
        console.error('Failed to add favorite:', err);
        throw err;
      }
    },

    async removeFavorite(pokemonId) {
      try {
        await api.delete(`/favorites/${pokemonId}`);
        this.favoriteIds = this.favoriteIds.filter(id => id !== pokemonId);
      } catch (err) {
        console.error('Failed to remove favorite:', err);
        throw err;
      }
    },

    async toggleFavorite(pokemonId) {
      if (this.isFavorite(pokemonId)) {
        await this.removeFavorite(pokemonId);
      } else {
        await this.addFavorite(pokemonId);
      }
    }
  }
});
