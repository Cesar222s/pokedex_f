<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1>👥 Social</h1>
        <p class="text-muted">Conecta con otros entrenadores usando tu código</p>
      </div>

      <div class="social-grid">
        <!-- Left: Your Code & Requests -->
        <div class="social-sidebar">
          <!-- Your Friend Code -->
          <div class="glass-card section-card my-code-card">
            <h2>🏷️ Tu Código de Entrenador</h2>
            <div class="code-display" @click="copyCode">
              <span class="code-text">{{ currentUser?.friendCode || 'CARGANDO...' }}</span>
              <span class="copy-hint" v-if="!copied">Copiar</span>
              <span class="copy-hint success" v-else>¡Copiado!</span>
            </div>
          </div>

          <!-- Add by Code -->
          <div class="glass-card section-card">
            <h2>➕ Agregar por Código</h2>
            <div class="search-box">
              <div class="flex gap-1">
                <input type="text" class="input flex-1" placeholder="Ej: X8Y2Z9"
                  v-model="friendCodeInput" maxlength="6" id="friend-code-input" />
                <button class="btn btn-primary" @click="addByCode" :disabled="!friendCodeInput || friendCodeInput.length < 6">
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <!-- Solicitudes Pendientes -->
          <div class="glass-card section-card" v-if="incomingRequests.length > 0">
            <h2>📬 Solicitudes de Amistad</h2>
            <div class="requests-list stagger">
              <div v-for="req in incomingRequests" :key="req._id" class="request-card">
                <div class="user-avatar">{{ req.from?.username?.charAt(0).toUpperCase() }}</div>
                <div class="user-info">
                  <span class="user-name">{{ req.from?.username }}</span>
                  <span class="user-email">{{ req.from?.email }}</span>
                </div>
                <div class="request-actions">
                  <button class="btn btn-success btn-sm" @click="accept(req._id)">✓</button>
                  <button class="btn btn-danger btn-sm" @click="reject(req._id)">✕</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Solicitudes enviadas -->
          <div class="glass-card section-card" v-if="outgoingRequests.length > 0">
            <h2>⏳ Solicitudes Enviadas</h2>
            <div class="requests-list">
              <div v-for="req in outgoingRequests" :key="req._id" class="request-card">
                <div class="user-avatar pending">{{ req.to?.username?.charAt(0).toUpperCase() }}</div>
                <div class="user-info">
                  <span class="user-name">{{ req.to?.username }}</span>
                  <span class="user-email">Esperando respuesta...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Friends List -->
        <div class="friends-main">
          <div class="glass-card section-card">
            <h2>👫 Amigos ({{ friends.length }})</h2>

            <div v-if="friends.length === 0" class="empty-state" style="padding:2rem">
              <div class="emoji">🤝</div>
              <p>Aún no tienes amigos. ¡Comparte tu código para conectar!</p>
            </div>

            <div v-else class="friends-list stagger">
              <div v-for="friend in friends" :key="friend._id" class="friend-card">
                <div class="friend-avatar">{{ friend.username.charAt(0).toUpperCase() }}</div>
                <div class="friend-info">
                  <span class="friend-name">{{ friend.username }}</span>
                  <span class="friend-email">{{ friend.email }}</span>
                </div>
                <div class="friend-actions">
                  <button class="btn btn-primary btn-sm" @click="challengeFriend(friend)"
                    id="challenge-btn">
                    ⚔️ Retar
                  </button>
                  <button class="btn btn-secondary btn-sm" @click="removeFriend(friend._id)">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alert -->
      <div v-if="message" class="alert-toast" :class="messageType">
        {{ message }}
      </div>

      <!-- Challenge Modal -->
      <div v-if="challengingFriend" class="modal-overlay" @click.self="challengingFriend = null">
        <div class="modal glass animate-fade-in-up">
          <h3>⚔️ Retar a {{ challengingFriend.username }}</h3>
          <p class="text-muted mb-2">Selecciona un equipo para combatir:</p>

          <div v-if="teamsStore.teams.length === 0" class="empty-state" style="padding:1.5rem">
            <p>¡Necesitas un equipo! <router-link to="/teams">Crea uno</router-link></p>
          </div>

          <div v-else class="team-pick-list">
            <button v-for="team in teamsStore.teams" :key="team._id"
              class="team-pick-btn"
              :class="{ selected: selectedTeam?._id === team._id }"
              :disabled="!isTeamReady(team)"
              @click="selectedTeam = team">
              <div>
                <span class="tp-name">{{ team.name }}</span>
                <span class="tp-count">{{ team.pokemon.length }}/6 Pokémon</span>
              </div>
              <span v-if="!isTeamReady(team)" class="no-moves-warn">⚠ Configurar movimientos</span>
              <span v-else-if="selectedTeam?._id === team._id" class="selected-check">✓</span>
            </button>
          </div>

          <div v-if="challengeError" class="alert alert-error mt-2">{{ challengeError }}</div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="challengingFriend = null">Cancelar</button>
            <button class="btn btn-primary" :disabled="!selectedTeam" @click="sendChallenge">
              Enviar Reto
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSocialStore } from '@/stores/social';
import { useBattleStore } from '@/stores/battle';
import { useTeamsStore } from '@/stores/teams';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const socialStore = useSocialStore();
const battleStore = useBattleStore();
const teamsStore = useTeamsStore();
const authStore = useAuthStore();

const currentUser = computed(() => authStore.user);
const friends = computed(() => socialStore.friends);
const incomingRequests = computed(() => socialStore.incomingRequests);
const outgoingRequests = computed(() => socialStore.outgoingRequests);

const friendCodeInput = ref('');
const message = ref('');
const messageType = ref('alert-success');
const challengingFriend = ref(null);
const selectedTeam = ref(null);
const challengeError = ref('');
const copied = ref(false);

function isFriend(userId) {
  return friends.value.some(f => f._id === userId);
}

async function addByCode() {
  if (!friendCodeInput.value || friendCodeInput.value.length < 6) return;
  try {
    await socialStore.sendFriendRequestByCode(friendCodeInput.value);
    showMessage('¡Solicitud de amistad enviada!', 'alert-success');
    friendCodeInput.value = '';
  } catch (err) {
    showMessage(err.response?.data?.error || 'Error al enviar solicitud', 'alert-error');
  }
}

async function accept(requestId) {
  await socialStore.acceptRequest(requestId);
  showMessage('¡Solicitud aceptada!', 'alert-success');
}

async function reject(requestId) {
  await socialStore.rejectRequest(requestId);
}

async function removeFriend(friendId) {
  await socialStore.removeFriend(friendId);
  showMessage('Amigo eliminado', 'alert-error');
}

function copyCode() {
  if (!currentUser.value?.friendCode) return;
  navigator.clipboard.writeText(currentUser.value.friendCode);
  copied.value = true;
  setTimeout(() => copied.value = false, 2000);
}

function isTeamReady(team) {
  return team.pokemon.length > 0 &&
    team.pokemon.every(p => p.selectedMoves && p.selectedMoves.length > 0);
}

function challengeFriend(friend) {
  challengingFriend.value = friend;
  selectedTeam.value = null;
  challengeError.value = '';
  teamsStore.fetchTeams();
}

async function sendChallenge() {
  challengeError.value = '';
  try {
    await battleStore.challenge(challengingFriend.value._id, selectedTeam.value._id);
    showMessage(`¡Reto enviado a ${challengingFriend.value.username}!`, 'alert-success');
    challengingFriend.value = null;
    router.push('/battles');
  } catch (err) {
    challengeError.value = err.response?.data?.error || 'Failed to send challenge';
  }
}

function showMessage(msg, type) {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => message.value = '', 3000);
}

onMounted(() => {
  socialStore.fetchFriends();
  socialStore.fetchRequests();
  teamsStore.fetchTeams();
});
</script>

<style scoped>
.social-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.section-card { padding: 1.5rem; margin-bottom: 1.5rem; }
.section-card h2 { font-size: 1.1rem; margin-bottom: 1rem; }

.search-box { margin-bottom: 1rem; }

.search-results, .requests-list, .friends-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.user-card, .request-card, .friend-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.user-avatar, .friend-avatar {
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--comp-accent), var(--comp-accent-dark));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; font-weight: 800; color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 12px var(--comp-accent-glow);
  border: 1px solid rgba(255,255,255,0.2);
}

.user-avatar.pending {
  background: linear-gradient(135deg, var(--text-muted), var(--bg-tertiary));
  opacity: 0.7;
  box-shadow: none;
}

.friend-card {
  border-left: 3px solid var(--comp-accent);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.friend-card:hover {
  transform: translateX(5px);
  background: var(--bg-card-hover);
  border-color: var(--comp-accent-hover);
  box-shadow: -5px 0 20px var(--comp-accent-glow);
}

.user-info, .friend-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.user-name, .friend-name { font-size: 0.9rem; font-weight: 600; }
.user-email, .friend-email { font-size: 0.75rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.request-actions, .friend-actions {
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
}

/* Alert Toast */
.alert-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  animation: fadeInUp 0.3s ease;
  z-index: 999;
  min-width: 200px;
  text-align: center;
}

/* Challenge Modal */
.modal { padding: 1.5rem; max-width: 420px; width: 100%; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }

.team-pick-list { display: flex; flex-direction: column; gap: 0.5rem; }

.team-pick-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-body);
}

.team-pick-btn:hover:not(:disabled) { border-color: var(--accent); background: var(--bg-card-hover); }
.team-pick-btn.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.team-pick-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.tp-name { display: block; font-weight: 600; font-size: 0.9rem; }
.tp-count { font-size: 0.75rem; color: var(--text-muted); }
.no-moves-warn { font-size: 0.75rem; color: var(--warning); }
.selected-check { color: var(--success); font-size: 1.1rem; }

@media (max-width: 900px) {
  .social-grid { grid-template-columns: 1fr; }
}
</style>
