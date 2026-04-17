import { io } from 'socket.io-client';

// Use production URL in Railway, or localhost in dev
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this._battleUpdatedCb = null;
    this._opponentMovedCb = null;
  }

  /**
   * Connect globally — call once on auth, stays connected across views
   */
  connect(token) {
    if (this.socket?.connected) return;

    console.log('Socket: Connecting to', SOCKET_URL);
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ Socket disconnected:', reason);
    });
  }

  /**
   * Join a battle room (for battle-specific events)
   */
  joinBattle(battleId) {
    if (this.socket) {
      const roomId = battleId.toString();
      console.log('Socket: Joining battle room:', roomId);
      this.socket.emit('join-battle', roomId);
    }
  }

  leaveBattle(battleId) {
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
      this.socket.off('battle-accepted'); // avoid duplicates
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

  onOpponentMoved(callback) {
    if (this.socket) {
      if (this._opponentMovedCb) {
        this.socket.off('opponent-moved', this._opponentMovedCb);
      }
      this._opponentMovedCb = callback;
      this.socket.on('opponent-moved', this._opponentMovedCb);
    }
  }

  offOpponentMoved() {
    if (this.socket && this._opponentMovedCb) {
      this.socket.off('opponent-moved', this._opponentMovedCb);
      this._opponentMovedCb = null;
    }
  }

  /**
   * Fully disconnect (on logout)
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._battleUpdatedCb = null;
      this._opponentMovedCb = null;
    }
  }
}

export default new SocketService();
