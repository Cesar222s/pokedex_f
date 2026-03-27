<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1>👥 Social</h1>
        <p class="text-muted">Encuentra entrenadores y reta a tus amigos</p>
      </div>

      <div class="social-grid">
        <!-- Left: Search & Requests -->
        <div class="social-sidebar">
          <!-- Search Users -->
          <div class="glass-card section-card">
            <h2>🔍 Buscar Entrenadores</h2>
            <div class="search-box">
              <input type="text" class="input" placeholder="Buscar por usuario o correo..."
                v-model="searchQuery" @input="onSearch" id="search-users" />
            </div>

            <div v-if="searchResults.length > 0" class="search-results stagger">
              <div v-for="user in searchResults" :key="user._id" class="user-card">
                <div class="user-avatar">{{ user.username.charAt(0).toUpperCase() }}</div>
                <div class="user-info">
                  <span class="user-name">{{ user.username }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                <button class="btn btn-primary btn-sm"
                  @click="sendRequest(user.email)"
                  :disabled="isPending(user._id) || isFriend(user._id)">
                  {{ isFriend(user._id) ? '✓ Amigos' : isPending(user._id) ? 'Pendiente' : '+ Añadir' }}
                </button>
              </div>
            </div>
            <p v-else-if="searchQuery.length > 1 && !searching" class="text-muted text-center" style="margin-top:1rem">
              No se encontraron entrenadores
            </p>
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
              <p>Aún no tienes amigos. ¡Busca entrenadores arriba!</p>
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

const router = useRouter();
const socialStore = useSocialStore();
const battleStore = useBattleStore();
const teamsStore = useTeamsStore();

const friends = computed(() => socialStore.friends);
const incomingRequests = computed(() => socialStore.incomingRequests);
const outgoingRequests = computed(() => socialStore.outgoingRequests);
const searchResults = computed(() => socialStore.searchResults);

const searchQuery = ref('');
const searching = ref(false);
const message = ref('');
const messageType = ref('alert-success');
const challengingFriend = ref(null);
const selectedTeam = ref(null);
const challengeError = ref('');

let searchDebounce;
function onSearch() {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => socialStore.searchUsers(searchQuery.value), 350);
}

function isPending(userId) {
  return outgoingRequests.value.some(r => r.to?._id === userId);
}
function isFriend(userId) {
  return friends.value.some(f => f._id === userId);
}

async function sendRequest(email) {
  try {
    await socialStore.sendFriendRequest(email);
    showMessage('¡Solicitud de amistad enviada!', 'alert-success');
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
  width: 40px; height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), hsl(230, 100%, 55%));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 700; color: white;
  flex-shrink: 0;
}

.user-avatar.pending {
  background: linear-gradient(135deg, var(--warning), hsl(38, 70%, 45%));
  opacity: 0.7;
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
