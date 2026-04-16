<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1>🏟️ Batallas</h1>
        <p class="text-muted">Reta a tus amigos y demuestra tu fuerza</p>
      </div>

      <!-- Retos Recibidos -->
      <section v-if="pendingIncoming.length > 0" class="battles-section">
        <h2 class="section-title">⚔️ Retos Recibidos</h2>
        <div class="challenges-list stagger">
          <div v-for="battle in pendingIncoming" :key="battle._id" class="challenge-card glass-card incoming">
            <div class="challenger-info">
              <div class="ch-avatar">{{ battle.challenger?.username?.charAt(0).toUpperCase() }}</div>
              <div>
                <h3>{{ battle.challenger?.username }}</h3>
                <p class="text-muted">te ha retado con el equipo <strong>{{ battle.challengerTeam?.name }}</strong></p>
                <div class="challenger-team-preview">
                  <img v-for="p in battle.challengerTeam?.pokemon?.slice(0,6)" :key="p.pokemonId"
                    :src="p.sprite" :alt="p.name" class="mini-sprite" />
                </div>
              </div>
            </div>
            <div class="challenge-actions">
              <button class="btn btn-success" @click="openAccept(battle)">⚔️ Aceptar</button>
              <button class="btn btn-danger btn-sm" @click="battleStore.rejectChallenge(battle._id); refresh()">Rechazar</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Retos Enviados -->
      <section v-if="pendingOutgoing.length > 0" class="battles-section">
        <h2 class="section-title">⏳ Retos Enviados</h2>
        <div class="challenges-list stagger">
          <div v-for="battle in pendingOutgoing" :key="battle._id" class="challenge-card glass-card outgoing">
            <div class="challenger-info">
              <div class="ch-avatar outgoing-av">{{ battle.opponent?.username?.charAt(0).toUpperCase() }}</div>
              <div>
                <h3>→ {{ battle.opponent?.username }}</h3>
                <p class="text-muted">Esperando respuesta...</p>
              </div>
            </div>
            <span class="pending-badge">Pendiente</span>
          </div>
        </div>
      </section>

      <!-- Sin pendientes -->
      <div v-if="pendingIncoming.length === 0 && pendingOutgoing.length === 0" class="empty-state">
        <div class="emoji">🤝</div>
        <h3>No hay batallas pendientes</h3>
        <p>¡Ve a <router-link to="/social">Social</router-link> para retar a un amigo!</p>
      </div>

      <!-- Historial -->
      <section class="battles-section">
        <h2 class="section-title">📜 Historial de Batallas</h2>
        <div v-if="history.length === 0" class="empty-state" style="padding:2rem">
          <p class="text-muted">No se han completado batallas aún</p>
        </div>
        <div v-else class="history-list stagger">
          <div v-for="battle in history" :key="battle._id"
            class="history-card glass-card"
            :class="isWinner(battle) ? 'win' : 'loss'">
            <div class="history-result">
              <span class="result-badge">{{ isWinner(battle) ? '🏆 Victoria' : '💀 Derrota' }}</span>
            </div>
            <div class="history-players">
              <span class="player">{{ battle.challenger?.username }}</span>
              <span class="vs">VS</span>
              <span class="player">{{ battle.opponent?.username }}</span>
            </div>
            <div class="history-meta">
              <span>Ganador: <strong>{{ battle.winner?.username }}</strong></span>
              <span class="text-muted">{{ formatDate(battle.createdAt) }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Accept Modal -->
    <div v-if="acceptingBattle" class="modal-overlay" @click.self="acceptingBattle = null">
      <div class="modal glass animate-fade-in-up">
        <h3>Aceptar Reto de Batalla</h3>
        <p class="text-muted mb-2">Selecciona tu equipo:</p>

        <div v-if="teamsStore.teams.length === 0" class="empty-state" style="padding:1.5rem">
          <p>¡No tienes equipos! <router-link to="/teams">Crea uno primero</router-link></p>
        </div>

        <div v-else class="team-pick-list">
          <button v-for="team in teamsStore.teams" :key="team._id"
            class="team-pick-btn"
            :class="{ selected: acceptTeam?._id === team._id }"
            :disabled="!isTeamReady(team)"
            @click="acceptTeam = team">
            <div>
              <span class="tp-name">{{ team.name }}</span>
              <span class="tp-count">{{ team.pokemon.length }}/6</span>
            </div>
            <span v-if="!isTeamReady(team)" style="font-size:0.75rem;color:var(--warning)">⚠ Sin movimientos</span>
            <span v-else-if="acceptTeam?._id === team._id" style="color:var(--success)">✓</span>
          </button>
        </div>

        <div v-if="acceptError" class="alert alert-error mt-2">{{ acceptError }}</div>

        <div class="modal-actions">
          <button class="btn btn-secondary" @click="acceptingBattle = null">Cancelar</button>
          <button class="btn btn-success" :disabled="!acceptTeam" @click="doAccept">
            ⚔️ ¡A luchar!
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBattleStore } from '@/stores/battle';
import { useTeamsStore } from '@/stores/teams';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const battleStore = useBattleStore();
const teamsStore = useTeamsStore();
const authStore = useAuthStore();

const pendingIncoming = computed(() => battleStore.pendingIncoming);
const pendingOutgoing = computed(() => battleStore.pendingOutgoing);
const history = computed(() => battleStore.history);

const acceptingBattle = ref(null);
const acceptTeam = ref(null);
const acceptError = ref('');

function isTeamReady(team) {
  return team.pokemon.length > 0 &&
    team.pokemon.every(p => p.selectedMoves && p.selectedMoves.length > 0);
}

function isWinner(battle) {
  return battle.winner?._id === authStore.user?._id ||
    battle.winner?.username === authStore.user?.username;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
}

function openAccept(battle) {
  acceptingBattle.value = battle;
  acceptTeam.value = null;
  acceptError.value = '';
  teamsStore.fetchTeams();
}

async function doAccept() {
  acceptError.value = '';
  try {
    const { battle } = await battleStore.acceptChallenge(acceptingBattle.value._id, acceptTeam.value._id);
    acceptingBattle.value = null;
    router.push(`/battles/${battle._id}`);
  } catch (err) {
    acceptError.value = err.response?.data?.error || 'Failed to accept';
  }
}

async function refresh() {
  await battleStore.fetchPending();
}

// Check for deep link to accept a specific battle
function checkDeepLink() {
  const acceptId = route.query.accept;
  if (acceptId) {
    const battle = pendingIncoming.value.find(b => b._id === acceptId);
    if (battle) {
      openAccept(battle);
      // Clear query param to avoid re-opening on refresh
      router.replace({ query: {} });
    }
  }
}

watch(pendingIncoming, (newVal) => {
  if (newVal.length > 0) checkDeepLink();
}, { immediate: true });

onMounted(async () => {
  await battleStore.fetchPending();
  battleStore.fetchHistory();
  teamsStore.fetchTeams();
  checkDeepLink();
});
</script>

<style scoped>
.battles-section { margin-bottom: 2.5rem; }
.section-title { font-size: 1.2rem; margin-bottom: 1rem; }

.challenges-list, .history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.challenge-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.challenge-card.incoming { border-left: 3px solid var(--accent); }
.challenge-card.outgoing { border-left: 3px solid var(--text-muted); }

.challenger-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.ch-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), hsl(230, 100%, 55%));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem; font-weight: 700; color: white;
  flex-shrink: 0;
}

.ch-avatar.outgoing-av {
  background: linear-gradient(135deg, var(--warning), hsl(38, 70%, 45%));
}

.challenge-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

.challenger-team-preview {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.mini-sprite {
  width: 36px; height: 36px;
  object-fit: contain;
  background: var(--bg-tertiary);
  border-radius: 50%;
  border: 1px solid var(--border);
}

.pending-badge {
  padding: 0.25rem 0.75rem;
  background: hsla(38, 95%, 55%, 0.15);
  color: var(--warning);
  border: 1px solid hsla(38, 95%, 55%, 0.3);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
}

.history-card {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.history-card.win { border-left: 3px solid var(--success); }
.history-card.loss { border-left: 3px solid var(--danger); }

.result-badge {
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  min-width: 100px;
}

.history-players {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  flex: 1;
}

.vs {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.history-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.8rem;
  gap: 0.2rem;
}

/* Modal */
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

.team-pick-btn:hover:not(:disabled) { border-color: var(--accent); }
.team-pick-btn.selected { border-color: var(--success); background: color-mix(in srgb, var(--success) 10%, transparent); }
.team-pick-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.tp-name { display: block; font-weight: 600; font-size: 0.9rem; }
.tp-count { font-size: 0.75rem; color: var(--text-muted); }

@media (max-width: 600px) {
  .challenge-card { flex-direction: column; align-items: flex-start; }
  .history-card { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
</style>
