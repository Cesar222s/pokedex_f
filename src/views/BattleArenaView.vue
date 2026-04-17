<template>
  <div class="page">
    <div class="container">
      <LoadingSpinner v-if="loading" message="Cargando batalla..." />

      <!-- Esperando al oponente -->
      <div v-else-if="battle && battle.status === 'pending'" class="waiting-screen glass-card">
        <div class="waiting-icon">⏳</div>
        <h2>Esperando al oponente...</h2>
        <p class="text-muted">Tu reto ha sido enviado. La batalla comenzará cuando sea aceptado.</p>
        <button class="btn btn-secondary mt-3" @click="$router.push('/battles')">← Volver a Batallas</button>
      </div>

      <!-- Batalla Activa -->
      <div v-else-if="battle && battle.status === 'active'" class="battle-arena">
        <!-- Cabecera de Batalla -->
        <div class="arena-header">
          <span class="turn-badge">Turno {{ battle.state?.currentTurn }}</span>
          <h1 class="arena-title">⚔️ Arena de Combate</h1>
          <span class="turn-indicator" :class="isMyTurn ? 'my-turn' : 'opponent-turn'">
            {{ isMyTurn ? '🗡️ ¡Tu turno!' : '🛡️ Turno del oponente' }}
          </span>
        </div>

        <!-- Field -->
        <div class="battle-field">
          <!-- Opponent Side -->
          <div class="combatant opponent-side">
            <div class="combatant-header">
              <span class="trainer-name">{{ opponentUser?.username }}</span>
              <span class="pokemon-name">{{ opponentActive?.name }}</span>
            </div>
            <div class="hp-bar-wrap">
              <div class="hp-label">PS</div>
              <div class="hp-track">
                <div class="hp-fill opponent-hp" :style="{ width: opponentHPPercent + '%' }"
                  :class="hpClass(opponentHPPercent)" />
              </div>
              <span class="hp-value">{{ currentOpponentHP }} / {{ opponentActive?.stats?.hp }}</span>
            </div>
            <div class="sprite-container opponent">
              <img v-if="opponentActive?.sprite" :src="opponentActive.sprite"
                :alt="opponentActive.name" class="battle-sprite" :class="{ fainted: currentOpponentHP <= 0, shaking: opponentHit }" />
            </div>
            <div class="opponent-team-row">
              <div v-for="(p, i) in opponentTeam?.pokemon" :key="i" class="team-pip"
                :class="{ active: i === battle.state?.opponentActive, fainted: opponentHP[i] <= 0 }">
              </div>
            </div>
          </div>

          <!-- VS -->
          <div class="vs-divider">
            <span class="vs-text">VS</span>
          </div>

          <!-- Your Side -->
          <div class="combatant your-side">
            <div class="sprite-container yours">
              <img v-if="yourActive?.sprite" :src="yourActive.sprite"
                :alt="yourActive.name" class="battle-sprite yours-sprite" :class="{ fainted: currentYourHP <= 0, shaking: yourHit }" />
            </div>
            <div class="your-team-row">
              <div v-for="(p, i) in yourTeam?.pokemon" :key="i" class="team-pip"
                :class="{ active: i === yourActiveIndex, fainted: yourHP[i] <= 0 }">
              </div>
            </div>
            <div class="combatant-header yours">
              <span class="pokemon-name">{{ yourActive?.name }}</span>
              <span class="trainer-name">Tú</span>
            </div>
            <div class="hp-bar-wrap">
              <div class="hp-label">PS</div>
              <div class="hp-track">
                <div class="hp-fill your-hp" :style="{ width: yourHPPercent + '%' }"
                  :class="hpClass(yourHPPercent)" />
              </div>
              <span class="hp-value">{{ currentYourHP }} / {{ yourActive?.stats?.hp }}</span>
            </div>
          </div>
        </div>

        <!-- Registro de Batalla -->
        <div class="battle-log glass-card" ref="logRef">
          <div class="log-header">📜 Registro de Combate</div>
          <div class="log-entries">
            <div v-for="(log, i) in battle.log" :key="i" class="log-turn">
              <span class="log-turn-label">Turno {{ log.turn }}</span>
              <div v-for="(event, j) in log.events" :key="j" class="log-event"
                :class="getEventClass(event)">{{ event }}</div>
            </div>
          </div>
        </div>

        <!-- Selección de Movimiento — solo si es tu turno -->
        <div class="move-panel glass-card" v-if="isMyTurn && currentYourHP > 0">
          <div class="move-panel-header">
            <span>🗡️ Elige movimiento para <strong class="capitalize">{{ yourActive?.name }}</strong></span>
          </div>

          <div class="moves-grid">
            <button v-for="move in yourActive?.selectedMoves" :key="move.name"
              class="move-btn"
              :class="['type-move', 'type-bg-' + move.type]"
              @click="submitMove(move.name)"
              :disabled="submitting">
              <div class="move-btn-name">{{ move.name?.replace(/-/g,' ') }}</div>
              <div class="move-btn-details">
                <span class="type-badge" :class="'type-' + move.type">{{ translateType(move.type) }}</span>
                <span class="move-stat" v-if="move.power">POT {{ move.power }}</span>
                <span class="move-stat" v-if="move.accuracy">PRE {{ move.accuracy }}%</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Esperando al oponente (no es tu turno) -->
        <div class="waiting-turn glass-card" v-if="!isMyTurn && currentYourHP > 0 && battle.status === 'active'">
          <div class="waiting-turn-content">
            <div class="waiting-spinner"></div>
            <span>Esperando que <strong>{{ opponentUser?.username }}</strong> haga su movimiento...</span>
          </div>
        </div>

        <!-- Debilitado — necesita cambio -->
        <div class="switch-panel glass-card" v-if="currentYourHP <= 0 && hasAliveTeammates">
          <h3>¡{{ yourActive?.name }} se ha debilitado! Envía al siguiente Pokémon:</h3>
          <div class="switch-options">
            <button v-for="(p, i) in yourTeam?.pokemon" :key="i"
              class="switch-btn"
              :disabled="yourHP[i] <= 0 || i === yourActiveIndex"
              @click="switchPokemon(i)">
              <img :src="p.sprite" :alt="p.name" class="switch-sprite" />
              <span class="capitalize">{{ p.name }}</span>
              <span class="hp-tag" :class="{ low: yourHP[i] < (p.stats?.hp * 0.3) }">
                {{ yourHP[i] }} PS
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Batalla Completada -->
      <div v-else-if="battle && battle.status === 'completed'" class="result-screen glass-card">
        <div class="result-icon">{{ isWinner ? '🏆' : '💀' }}</div>
        <h1 class="result-title">{{ isWinner ? '¡Victoria!' : 'Derrota' }}</h1>
        <p class="text-muted">Ganador: <strong>{{ battle.winner?.username }}</strong></p>

        <!-- Final log -->
        <div class="final-log">
          <div v-for="(log, i) in battle.log?.slice(-3)" :key="i" class="log-turn">
            <div v-for="(ev, j) in log.events" :key="j" class="log-event">{{ ev }}</div>
          </div>
        </div>

        <div class="result-actions">
          <router-link to="/battles" class="btn btn-primary">Ver Batallas</router-link>
          <router-link to="/social" class="btn btn-secondary">Revancha</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useBattleStore } from '@/stores/battle';
import { useAuthStore } from '@/stores/auth';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import socketService from '@/services/socket';
import { translateType } from '@/utils/translations';

const route = useRoute();
const battleStore = useBattleStore();
const authStore = useAuthStore();

const loading = computed(() => battleStore.loading);
const battle = computed(() => battleStore.currentBattle);
const perspective = computed(() => battleStore.perspective);

const submitting = ref(false);
const logRef = ref(null);
const yourHit = ref(false);
const opponentHit = ref(false);

const isChallenger = computed(() => perspective.value === 'challenger');

const yourTeam = computed(() => isChallenger.value ? battle.value?.challengerTeam : battle.value?.opponentTeam);
const opponentTeam = computed(() => isChallenger.value ? battle.value?.opponentTeam : battle.value?.challengerTeam);
const yourUser = computed(() => isChallenger.value ? battle.value?.challenger : battle.value?.opponent);
const opponentUser = computed(() => isChallenger.value ? battle.value?.opponent : battle.value?.challenger);

const yourActiveIndex = computed(() =>
  isChallenger.value ? battle.value?.state?.challengerActive : battle.value?.state?.opponentActive
);
const opponentActiveIndex = computed(() =>
  isChallenger.value ? battle.value?.state?.opponentActive : battle.value?.state?.challengerActive
);

const yourActive = computed(() => yourTeam.value?.pokemon?.[yourActiveIndex.value]);
const opponentActive = computed(() => opponentTeam.value?.pokemon?.[opponentActiveIndex.value]);

const yourHP = computed(() =>
  isChallenger.value ? battle.value?.state?.challengerHP : battle.value?.state?.opponentHP
);
const opponentHP = computed(() =>
  isChallenger.value ? battle.value?.state?.opponentHP : battle.value?.state?.challengerHP
);

const currentYourHP = computed(() => yourHP.value?.[yourActiveIndex.value] ?? 0);
const currentOpponentHP = computed(() => opponentHP.value?.[opponentActiveIndex.value] ?? 0);
const yourHPPercent = computed(() => {
  const max = yourActive.value?.stats?.hp || 1;
  return Math.max(0, Math.min(100, (currentYourHP.value / max) * 100));
});
const opponentHPPercent = computed(() => {
  const max = opponentActive.value?.stats?.hp || 1;
  return Math.max(0, Math.min(100, (currentOpponentHP.value / max) * 100));
});

const hasAliveTeammates = computed(() => {
  if (!yourHP.value) return false;
  return yourHP.value.some((hp, i) => hp > 0 && i !== yourActiveIndex.value);
});

// Turn-by-turn: is it my turn?
const isMyTurn = computed(() => {
  if (!battle.value?.state?.currentAttacker) return false;
  const myRole = isChallenger.value ? 'challenger' : 'opponent';
  return battle.value.state.currentAttacker === myRole;
});

const isWinner = computed(() => {
  const winner = battle.value?.winner;
  const userId = authStore.user?._id;
  if (!winner || !userId) return false;
  return (winner._id || winner) === userId;
});

function hpClass(pct) {
  if (pct > 50) return 'hp-green';
  if (pct > 20) return 'hp-yellow';
  return 'hp-red';
}

function getEventClass(event) {
  const ev = event.toLowerCase();
  if (ev.includes('muy eficaz')) return 'ev-super';
  if (ev.includes("no es muy eficaz")) return 'ev-weak';
  if (ev.includes("no afecta")) return 'ev-immune';
  if (ev.includes('debilitado')) return 'ev-faint';
  if (ev.includes('usó')) return 'ev-move';
  if (ev.includes('terminado') || ev.includes('victoria') || ev.includes('gana')) return 'ev-result';
  return '';
}

async function submitMove(moveName) {
  if (submitting.value) return;
  submitting.value = true;
  
  try {
    await battleStore.submitMove(route.params.id, moveName);
    scrollLog();
  } catch (err) {
    console.error(err);
  } finally {
    submitting.value = false;
  }
}

async function switchPokemon(idx) {
  await battleStore.switchPokemon(route.params.id, idx);
}

function scrollLog() {
  nextTick(() => {
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight;
    }
  });
}

// Trigger hit animation
function triggerHitAnimation(wasMyTurn) {
  if (wasMyTurn) {
    // I attacked, opponent got hit
    opponentHit.value = true;
    setTimeout(() => { opponentHit.value = false; }, 500);
  } else {
    // Opponent attacked, I got hit
    yourHit.value = true;
    setTimeout(() => { yourHit.value = false; }, 500);
  }
}

// Socket Integration + Polling Fallback
let pollInterval = null;

function initSockets() {
  const battleId = route.params.id;

  // Join battle room (handles case where socket isn't connected yet)
  socketService.joinBattle(battleId);

  // If socket connects/reconnects later, re-join the room
  socketService.onConnect(() => {
    console.log('Socket: Connected/reconnected, joining battle room');
    socketService.joinBattle(battleId);
  });

  socketService.onBattleUpdated(({ battle: updatedBattle }) => {
    console.log('Socket: Battle updated in arena');
    
    // Determine who just attacked for hit animation
    const myRole = isChallenger.value ? 'challenger' : 'opponent';
    if (updatedBattle.state?.currentAttacker) {
      const wasMyTurn = updatedBattle.state.currentAttacker !== myRole;
      triggerHitAnimation(!wasMyTurn);
    }
    
    battleStore.currentBattle = updatedBattle;
    scrollLog();
  });
}

// Polling fallback — checks for updates every 3 seconds when waiting
function startPolling() {
  stopPolling();
  pollInterval = setInterval(async () => {
    if (!battle.value || battle.value.status !== 'active') {
      stopPolling();
      return;
    }
    try {
      await battleStore.fetchBattle(route.params.id, true);
      scrollLog();
    } catch (err) {
      console.error('Poll error:', err);
    }
  }, 3000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// Start/stop polling based on whose turn it is
watch(isMyTurn, (myTurn) => {
  if (!myTurn && battle.value?.status === 'active') {
    // Not my turn — poll for updates in case sockets fail
    startPolling();
  } else {
    stopPolling();
  }
});

watch(() => battle.value?.status, (status) => {
  if (status === 'completed') {
    stopPolling();
  }
});

watch(() => battle.value?.log?.length, scrollLog);

onMounted(async () => {
  await battleStore.fetchBattle(route.params.id);
  initSockets();
  scrollLog();
  // Start polling if it's not my turn initially
  if (!isMyTurn.value && battle.value?.status === 'active') {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
  socketService.leaveBattle(route.params.id);
  socketService.offBattleUpdated();
});
</script>

<style scoped>
/* Header */
.arena-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.arena-title { font-size: 1.5rem; }
.turn-badge {
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
}

.turn-indicator {
  font-size: 0.85rem;
  padding: 0.4rem 1rem;
  border-radius: var(--radius-full);
  font-weight: 700;
  animation: pulse-glow 2s ease-in-out infinite;
}

.turn-indicator.my-turn {
  background: linear-gradient(135deg, hsla(145, 65%, 50%, 0.2), hsla(145, 65%, 50%, 0.1));
  color: hsl(145, 65%, 60%);
  border: 1px solid hsla(145, 65%, 50%, 0.4);
}

.turn-indicator.opponent-turn {
  background: linear-gradient(135deg, hsla(38, 95%, 55%, 0.2), hsla(38, 95%, 55%, 0.1));
  color: hsl(38, 95%, 65%);
  border: 1px solid hsla(38, 95%, 55%, 0.4);
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Field */
.battle-field {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 2rem;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  min-height: 320px;
}

.combatant { display: flex; flex-direction: column; gap: 0.75rem; }
.combatant-header { display: flex; flex-direction: column; }
.combatant-header.yours { align-items: flex-end; text-align: right; }

.trainer-name { font-size: 0.75rem; color: var(--text-muted); }
.pokemon-name { font-size: 1.1rem; font-weight: 700; text-transform: capitalize; }

.hp-bar-wrap { display: flex; align-items: center; gap: 0.5rem; }
.hp-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); width: 20px; }
.hp-track { flex: 1; height: 10px; background: var(--bg-tertiary); border-radius: 5px; overflow: hidden; }
.hp-fill { height: 100%; border-radius: 5px; transition: width 0.5s ease; }
.hp-fill.hp-green { background: linear-gradient(90deg, hsl(145,65%,50%), hsl(145,65%,60%)); }
.hp-fill.hp-yellow { background: linear-gradient(90deg, hsl(38,95%,55%), hsl(55,80%,55%)); }
.hp-fill.hp-red { background: linear-gradient(90deg, hsl(0,75%,55%), hsl(20,80%,55%)); }
.hp-value { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; }

.sprite-container { display: flex; justify-content: center; }
.battle-sprite { width: 140px; height: 140px; object-fit: contain; transition: all 0.3s; }
.opponent .battle-sprite { filter: brightness(0.85); }
.yours-sprite { animation: float 3s ease-in-out infinite; filter: drop-shadow(0 8px 20px rgba(0,0,0,0.4)); }
.battle-sprite.fainted { opacity: 0.3; transform: rotate(90deg) !important; }
.battle-sprite.shaking { animation: shake 0.5s ease-in-out !important; }

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.team-pip {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--success);
  border: 2px solid var(--bg-secondary);
}
.team-pip.active { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 6px var(--accent); }
.team-pip.fainted { background: var(--text-muted); }

.opponent-team-row, .your-team-row {
  display: flex; gap: 0.35rem; justify-content: center;
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
}

.vs-text {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent), hsl(300, 80%, 60%));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Battle Log */
.battle-log { padding: 1rem; margin-bottom: 1.5rem; max-height: 200px; overflow-y: auto; }
.log-header { font-weight: 600; font-size: 0.85rem; margin-bottom: 0.5rem; color: var(--text-muted); }
.log-entries { display: flex; flex-direction: column; gap: 0.75rem; }
.log-turn { display: flex; flex-direction: column; gap: 0.25rem; }
.log-turn-label { font-size: 0.7rem; color: var(--text-muted); font-weight: 600; }
.log-event { font-size: 0.85rem; padding: 0.2rem 0.5rem; border-radius: 4px; }
.ev-super { color: hsl(38, 95%, 65%); font-weight: 600; }
.ev-weak { color: var(--text-muted); }
.ev-immune { color: var(--danger); }
.ev-faint { color: var(--danger); font-weight: 700; }
.ev-move { color: var(--text-primary); }
.ev-result { color: var(--accent); font-weight: 700; font-size: 0.95rem; }

/* Move Panel */
.move-panel { padding: 1.25rem; margin-bottom: 1.5rem; }
.move-panel-header { font-size: 0.9rem; margin-bottom: 1rem; font-weight: 500; display: flex; justify-content: space-between; }

.moves-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }

.move-btn {
  padding: 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  font-family: var(--font-body);
}

.move-btn:hover:not(:disabled) { background: var(--bg-card-hover); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.move-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.move-btn-name { font-weight: 600; font-size: 0.9rem; text-transform: capitalize; margin-bottom: 0.5rem; }
.move-btn-details { display: flex; gap: 0.4rem; flex-wrap: wrap; align-items: center; }
.move-stat { font-size: 0.7rem; color: var(--text-muted); }

/* Waiting for opponent turn */
.waiting-turn {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.waiting-turn-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.waiting-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Switch Panel */
.switch-panel { padding: 1.5rem; margin-bottom: 1.5rem; }
.switch-panel h3 { margin-bottom: 1rem; font-size: 1.1rem; }

.switch-options { display: flex; gap: 1rem; flex-wrap: wrap; }

.switch-btn {
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
  color: var(--text-primary); cursor: pointer; transition: all 0.2s;
  font-family: var(--font-body); min-width: 90px;
}

.switch-btn:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-2px); }
.switch-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.switch-sprite { width: 48px; height: 48px; object-fit: contain; }

.hp-tag { font-size: 0.7rem; color: var(--success); }
.hp-tag.low { color: var(--danger); }

/* Waiting / Result Screens */
.waiting-screen, .result-screen {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 500px;
  margin: 4rem auto;
}

.waiting-icon, .result-icon { font-size: 4rem; margin-bottom: 1rem; }
.result-title { font-size: 3rem; margin-bottom: 0.5rem; }
.result-actions { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; }

.final-log { margin: 1.5rem 0; text-align: left; background: var(--bg-card); padding: 1rem; border-radius: var(--radius-md); }

.capitalize { text-transform: capitalize; }

@media (max-width: 768px) {
  .battle-field { grid-template-columns: 1fr; grid-template-rows: auto auto auto; }
  .moves-grid { grid-template-columns: 1fr; }
  .arena-header { flex-direction: column; gap: 0.5rem; text-align: center; }
}
</style>
