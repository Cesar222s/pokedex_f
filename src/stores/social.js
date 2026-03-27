import { defineStore } from 'pinia';
import api from '@/services/api';

export const useSocialStore = defineStore('social', {
  state: () => ({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    searchResults: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchFriends() {
      try {
        const { data } = await api.get('/social/friends');
        this.friends = data.friends;
      } catch (err) {
        console.error('Failed to fetch friends:', err);
      }
    },

    async fetchRequests() {
      try {
        const { data } = await api.get('/social/friends/requests');
        this.incomingRequests = data.incoming;
        this.outgoingRequests = data.outgoing;
      } catch (err) {
        console.error('Failed to fetch friend requests:', err);
      }
    },

    async searchUsers(query) {
      if (!query || query.length < 2) {
        this.searchResults = [];
        return;
      }
      try {
        const { data } = await api.get(`/social/search?q=${encodeURIComponent(query)}`);
        this.searchResults = data.users;
      } catch (err) {
        console.error('Search failed:', err);
      }
    },

    async sendFriendRequest(email) {
      try {
        await api.post('/social/friends/request', { email });
        await this.fetchRequests();
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to send request';
        throw err;
      }
    },

    async sendFriendRequestByCode(code) {
      this.error = null;
      try {
        await api.post('/social/friends/request/code', { code });
        await this.fetchRequests();
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to send request by code';
        throw err;
      }
    },

    async acceptRequest(requestId) {
      try {
        await api.post(`/social/friends/accept/${requestId}`);
        await Promise.all([this.fetchFriends(), this.fetchRequests()]);
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to accept request';
        throw err;
      }
    },

    async rejectRequest(requestId) {
      try {
        await api.post(`/social/friends/reject/${requestId}`);
        await this.fetchRequests();
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to reject request';
        throw err;
      }
    },

    async removeFriend(friendId) {
      try {
        await api.delete(`/social/friends/${friendId}`);
        this.friends = this.friends.filter(f => f._id !== friendId);
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to remove friend';
        throw err;
      }
    }
  }
});
