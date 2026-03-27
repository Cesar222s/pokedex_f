import { defineStore } from 'pinia';
import api from '@/services/api';

export const usePokedexStore = defineStore('pokedex', {
  state: () => ({
    pokemonList: [],
    totalCount: 0,
    offset: 0,
    limit: 20,
    loading: false,
    loadingMore: false,
    currentPokemon: null,
    currentSpecies: null,
    currentEvolution: null,
    currentMoves: [],
    detailLoading: false,

    // Filters
    types: [],
    regions: [],
    filters: {
      name: '',
      type1: '',
      type2: '',
      region: ''
    },
    filteredList: [],
    filterLoading: false
  }),

  actions: {
    async fetchPokemonList(reset = false) {
      if (reset) {
        this.offset = 0;
        this.pokemonList = [];
      }

      if (this.offset === 0) this.loading = true;
      else this.loadingMore = true;

      try {
        const { data } = await api.get(`/pokemon?limit=${this.limit}&offset=${this.offset}`);
        this.pokemonList = [...this.pokemonList, ...data.results];
        this.totalCount = data.count;
        this.offset += this.limit;
      } catch (err) {
        console.error('Failed to fetch Pokémon list:', err);
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },

    async fetchPokemonDetail(idOrName) {
      this.detailLoading = true;
      this.currentPokemon = null;
      this.currentSpecies = null;
      this.currentEvolution = null;
      this.currentMoves = [];
      try {
        const [pokemonRes, speciesRes, evoRes, movesRes] = await Promise.all([
          api.get(`/pokemon/${idOrName}`),
          api.get(`/pokemon/${idOrName}/species`),
          api.get(`/pokemon/${idOrName}/evolution`),
          api.get(`/pokemon/${idOrName}/moves`)
        ]);
        this.currentPokemon = pokemonRes.data;
        this.currentSpecies = speciesRes.data;
        this.currentEvolution = evoRes.data.chain;
        this.currentMoves = movesRes.data.moves;
      } catch (err) {
        console.error('Failed to fetch Pokémon detail:', err);
      } finally {
        this.detailLoading = false;
      }
    },

    async fetchTypes() {
      try {
        const { data } = await api.get('/types');
        this.types = data.types;
      } catch (err) {
        console.error('Failed to fetch types:', err);
      }
    },

    async fetchRegions() {
      try {
        const { data } = await api.get('/generations');
        this.regions = data.regions;
      } catch (err) {
        console.error('Failed to fetch regions:', err);
      }
    },

    async applyFilters() {
      const { name, type1, type2, region } = this.filters;

      // If no filters, show the paginated list
      if (!name && !type1 && !type2 && !region) {
        this.filteredList = [];
        return;
      }

      this.filterLoading = true;
      try {
        let result = [];

        // Region filter: get Pokémon from that generation
        if (region) {
          const { data } = await api.get(`/generations/${region}`);
          result = data.pokemon;
        }

        // Type filter: intersect with type Pokémon
        if (type1) {
          const { data } = await api.get(`/types/${type1}`);
          const typeIds = data.pokemon.map(p => p.id);
          if (result.length > 0) {
            result = result.filter(p => typeIds.includes(p.id));
          } else {
            result = data.pokemon;
          }
        }

        if (type2 && type2 !== type1) {
          const { data } = await api.get(`/types/${type2}`);
          const typeIds = data.pokemon.map(p => p.id);
          if (result.length > 0) {
            result = result.filter(p => typeIds.includes(p.id));
          } else {
            result = data.pokemon;
          }
        }

        // Name filter
        if (name) {
          const q = name.toLowerCase();
          if (result.length > 0) {
            result = result.filter(p => p.name.includes(q));
          } else {
            // Search within loaded list
            result = this.pokemonList.filter(p => p.name.includes(q));
          }
        }

        // Enrich with sprites (limit to first 40 for performance)
        const toEnrich = result.slice(0, 40);
        const enriched = await Promise.all(
          toEnrich.map(async (p) => {
            try {
              const { data } = await api.get(`/pokemon/${p.id || p.name}`);
              return {
                id: data.id,
                name: data.name,
                sprite: data.sprites?.official_artwork || data.sprites?.front_default,
                types: data.types.map(t => t.name)
              };
            } catch {
              return { id: p.id, name: p.name, sprite: null, types: [] };
            }
          })
        );

        this.filteredList = enriched;
      } catch (err) {
        console.error('Filter error:', err);
      } finally {
        this.filterLoading = false;
      }
    },

    clearFilters() {
      this.filters = { name: '', type1: '', type2: '', region: '' };
      this.filteredList = [];
    }
  }
});
