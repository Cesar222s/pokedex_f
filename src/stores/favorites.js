import { defineStore } from 'pinia';
import api from '@/services/api';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: [], // Now an array of { pokemonId, name, sprite }
    loading: false
  }),

  getters: {
    favoriteIds: (state) => state.favorites.map(f => f.pokemonId),
    isFavorite: (state) => (pokemonId) => state.favorites.some(f => f.pokemonId === pokemonId)
  },

  actions: {
    async fetchFavorites() {
      this.loading = true;
      try {
        const { data } = await api.get('/favorites');
        this.favorites = data.favorites || [];
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
      } finally {
        this.loading = false;
      }
    },

    async addFavorite(pokemon) {
      // Optimistic update
      const favObj = {
        pokemonId: pokemon.id,
        name: pokemon.name,
        sprite: pokemon.sprite || pokemon.sprites?.official_artwork || pokemon.sprites?.front_default
      };
      
      this.favorites.push(favObj);

      try {
        await api.post('/favorites', favObj);
      } catch (err) {
        console.error('Failed to add favorite (Background Sync will handle it):', err);
        // We DON'T remove it here because SW Background Sync will retry it
      }
    },

    async removeFavorite(pokemonId) {
      // Optimistic update
      const originalFavorites = [...this.favorites];
      this.favorites = this.favorites.filter(f => f.pokemonId !== pokemonId);

      try {
        await api.delete(`/favorites/${pokemonId}`);
      } catch (err) {
        console.error('Failed to remove favorite (Background Sync will handle it):', err);
      }
    },

    async toggleFavorite(pokemon) {
      if (this.isFavorite(pokemon.id)) {
        await this.removeFavorite(pokemon.id);
      } else {
        await this.addFavorite(pokemon);
      }
    }
  }
});
