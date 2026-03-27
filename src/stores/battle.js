import { defineStore } from 'pinia';
import api from '@/services/api';

export const useBattleStore = defineStore('battle', {
  state: () => ({
    pendingIncoming: [],
    pendingOutgoing: [],
    currentBattle: null,
    perspective: null,
    history: [],
    loading: false,
    error: null
  }),

  actions: {
    async challenge(opponentId, teamId) {
      try {
        const { data } = await api.post('/battles/challenge', { opponentId, teamId });
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to send challenge';
        throw err;
      }
    },

    async fetchPending() {
      try {
        const { data } = await api.get('/battles/pending');
        this.pendingIncoming = data.incoming;
        this.pendingOutgoing = data.outgoing;
      } catch (err) {
        console.error('Failed to fetch pending battles:', err);
      }
    },

    async acceptChallenge(battleId, teamId) {
      try {
        const { data } = await api.post(`/battles/${battleId}/accept`, { teamId });
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to accept challenge';
        throw err;
      }
    },

    async rejectChallenge(battleId) {
      try {
        await api.post(`/battles/${battleId}/reject`);
        await this.fetchPending();
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to reject challenge';
        throw err;
      }
    },

    async fetchBattle(battleId) {
      this.loading = true;
      try {
        const { data } = await api.get(`/battles/${battleId}`);
        this.currentBattle = data.battle;
        this.perspective = data.perspective;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to fetch battle';
      } finally {
        this.loading = false;
      }
    },

    async submitMove(battleId, moveName) {
      try {
        const { data } = await api.post(`/battles/${battleId}/turn`, { moveName });
        this.currentBattle = data.battle;
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to submit move';
        throw err;
      }
    },

    async switchPokemon(battleId, switchTo) {
      try {
        const { data } = await api.post(`/battles/${battleId}/turn`, { switchTo });
        this.currentBattle = data.battle;
        return data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to switch Pokémon';
        throw err;
      }
    },

    async fetchHistory() {
      try {
        const { data } = await api.get('/battles');
        this.history = data.battles;
      } catch (err) {
        console.error('Failed to fetch battle history:', err);
      }
    }
  }
});
