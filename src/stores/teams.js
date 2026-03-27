import { defineStore } from 'pinia';
import api from '@/services/api';

export const useTeamsStore = defineStore('teams', {
  state: () => ({
    teams: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchTeams() {
      this.loading = true;
      try {
        const { data } = await api.get('/teams');
        this.teams = data.teams;
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      } finally {
        this.loading = false;
      }
    },

    async createTeam(name) {
      try {
        const { data } = await api.post('/teams', { name });
        this.teams.unshift(data.team);
        return data.team;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to create team';
        throw err;
      }
    },

    async updateTeam(teamId, updates) {
      try {
        const { data } = await api.put(`/teams/${teamId}`, updates);
        const idx = this.teams.findIndex(t => t._id === teamId);
        if (idx !== -1) this.teams[idx] = data.team;
        return data.team;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to update team';
        throw err;
      }
    },

    async deleteTeam(teamId) {
      try {
        await api.delete(`/teams/${teamId}`);
        this.teams = this.teams.filter(t => t._id !== teamId);
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to delete team';
        throw err;
      }
    },

    async addPokemonToTeam(teamId, pokemon) {
      try {
        const { data } = await api.post(`/teams/${teamId}/pokemon`, pokemon);
        const idx = this.teams.findIndex(t => t._id === teamId);
        if (idx !== -1) this.teams[idx] = data.team;
        return data.team;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to add Pokémon';
        throw err;
      }
    },

    async removePokemonFromTeam(teamId, pokemonId) {
      try {
        const { data } = await api.delete(`/teams/${teamId}/pokemon/${pokemonId}`);
        const idx = this.teams.findIndex(t => t._id === teamId);
        if (idx !== -1) this.teams[idx] = data.team;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to remove Pokémon';
        throw err;
      }
    }
  }
});
