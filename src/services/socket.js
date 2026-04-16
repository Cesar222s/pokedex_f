import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket) return;
    
    this.socket = io(SOCKET_URL, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('Socket: Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket: Disconnected');
    });
  }

  joinBattle(battleId) {
    if (this.socket) {
      this.socket.emit('join-battle', battleId);
    }
  }

  leaveBattle(battleId) {
    if (this.socket) {
      this.socket.emit('leave-battle', battleId);
    }
  }

  onOpponentMoved(callback) {
    if (this.socket) {
      this.socket.on('opponent-moved', callback);
    }
  }

  onBattleUpdated(callback) {
    if (this.socket) {
      this.socket.on('battle-updated', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
