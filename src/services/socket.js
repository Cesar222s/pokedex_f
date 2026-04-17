import { io } from 'socket.io-client';

// Derive socket URL from the same env var the API uses
// VITE_API_URL = "https://domain.railway.app/api" → socket needs "https://domain.railway.app"
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SOCKET_URL = API_URL.replace('/api', '');

class SocketService {
  constructor() {
    this.socket = null;
    this._battleUpdatedCb = null;
    this._onConnectCb = null;
  }

  /**
   * Connect globally — call once on auth, stays connected across views
   */
  connect(token) {
    if (this.socket?.connected) return;

    // Disconnect any stale socket first
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('Socket: Connecting to', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      if (this._onConnectCb) this._onConnectCb();
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected:', reason);
    });

    this.socket.on('reconnect', (attempt) => {
      console.log('🔄 Socket reconnected after', attempt, 'attempts');
      // Re-join battle room if we were in one
      if (this._currentBattleId) {
        this.joinBattle(this._currentBattleId);
      }
    });
  }

  /**
   * Register a callback for when socket connects/reconnects
   */
  onConnect(callback) {
    this._onConnectCb = callback;
    // If already connected, fire immediately
    if (this.socket?.connected) {
      callback();
    }
  }

  /**
   * Join a battle room (for battle-specific events)
   */
  joinBattle(battleId) {
    this._currentBattleId = battleId;
    if (this.socket?.connected) {
      const roomId = battleId.toString();
      console.log('Socket: Joining battle room:', roomId);
      this.socket.emit('join-battle', roomId);
    } else {
      console.log('Socket: Not connected yet, will join battle room on connect');
    }
  }

  leaveBattle(battleId) {
    this._currentBattleId = null;
    if (this.socket) {
      const roomId = battleId.toString();
      this.socket.emit('leave-battle', roomId);
    }
  }

  // ── Global listeners (set once from App.vue) ──

  /**
   * Called when a battle challenge is accepted — both players receive this
   */
  onBattleAccepted(callback) {
    if (this.socket) {
      this.socket.off('battle-accepted');
      this.socket.on('battle-accepted', (data) => {
        console.log('📢 battle-accepted:', data.battleId);
        callback(data);
      });
    }
  }

  /**
   * Called when you receive a new challenge from someone
   */
  onChallengeReceived(callback) {
    if (this.socket) {
      this.socket.off('battle-challenge-received');
      this.socket.on('battle-challenge-received', (data) => {
        console.log('📢 battle-challenge-received:', data);
        callback(data);
      });
    }
  }

  /**
   * Called when someone accepts your friend request
   */
  onFriendRequestAccepted(callback) {
    if (this.socket) {
      this.socket.off('friend-request-accepted');
      this.socket.on('friend-request-accepted', (data) => {
        console.log('📢 friend-request-accepted:', data);
        callback(data);
      });
    }
  }

  /**
   * Called when you receive a new friend request
   */
  onFriendRequestReceived(callback) {
    if (this.socket) {
      this.socket.off('friend-request-received');
      this.socket.on('friend-request-received', (data) => {
        console.log('📢 friend-request-received:', data);
        callback(data);
      });
    }
  }

  /**
   * Called when someone removes you from their friend list
   */
  onFriendRemoved(callback) {
    if (this.socket) {
      this.socket.off('friend-removed');
      this.socket.on('friend-removed', (data) => {
        console.log('📢 friend-removed:', data);
        callback(data);
      });
    }
  }

  // ── Battle-specific listeners (set/cleared per BattleArenaView) ──

  onBattleUpdated(callback) {
    if (this.socket) {
      // Remove old listener first
      if (this._battleUpdatedCb) {
        this.socket.off('battle-updated', this._battleUpdatedCb);
      }
      this._battleUpdatedCb = (data) => {
        console.log('📢 battle-updated event received');
        callback(data);
      };
      this.socket.on('battle-updated', this._battleUpdatedCb);
    }
  }

  offBattleUpdated() {
    if (this.socket && this._battleUpdatedCb) {
      this.socket.off('battle-updated', this._battleUpdatedCb);
      this._battleUpdatedCb = null;
    }
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }

  /**
   * Fully disconnect (on logout)
   */
  disconnect() {
    this._currentBattleId = null;
    this._onConnectCb = null;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._battleUpdatedCb = null;
    }
  }
}

export default new SocketService();
