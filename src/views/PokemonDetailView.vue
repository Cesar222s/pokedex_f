<template>
  <div class="page">
    <div class="container">
      <LoadingSpinner v-if="loading" message="Cargando detalles del Pokémon..." />

      <template v-else-if="pokemon">
        <div class="detail-layout">
          <!-- Izquierda: Sprite e info básica -->
          <div class="detail-hero glass-card animate-fade-in-up" :style="{ background: heroGradient }">
            <button class="back-btn btn btn-secondary btn-sm" @click="$router.back()">
              ← Volver
            </button>

            <div class="hero-sprite">
              <img :src="pokemon.sprites?.official_artwork || pokemon.sprites?.front_default"
                :alt="pokemon.name" />
            </div>

            <div class="hero-id">#{{ String(pokemon.id).padStart(3, '0') }}</div>
            <h1 class="hero-name">{{ pokemon.name }}</h1>

            <div class="hero-types">
              <span v-for="t in pokemon.types" :key="t.slot"
                class="type-badge" :class="'type-' + t.name">{{ t.name }}</span>
            </div>

            <div class="hero-meta">
              <div class="meta-item">
                <span class="meta-value">{{ (pokemon.height / 10).toFixed(1) }}m</span>
                <span class="meta-label">Altura</span>
              </div>
              <div class="meta-item">
                <span class="meta-value">{{ (pokemon.weight / 10).toFixed(1) }}kg</span>
                <span class="meta-label">Peso</span>
              </div>
            </div>

            <div class="hero-actions">
              <button class="btn" :class="isFav ? 'btn-danger' : 'btn-secondary'"
                @click="toggleFav">
                {{ isFav ? '💔 Quitar Favorito' : '❤️ Añadir Favorito' }}
              </button>
              <button class="btn btn-secondary" @click="showTeamModal = true">
                ⚔️ Añadir al Equipo
              </button>
            </div>
          </div>

          <!-- Derecha: Stats, especie, evolución -->
          <div class="detail-info">
            <!-- Info de Especie -->
            <div class="glass-card info-card animate-fade-in-up" v-if="species" style="animation-delay:0.1s">
              <h2>📖 Descripción</h2>
              <p class="flavor-text">{{ species.flavorText }}</p>
              <div class="species-grid">
                <div class="spec-item" v-if="species.genus">
                  <span class="spec-label">Categoría</span>
                  <span class="spec-value">{{ species.genus }}</span>
                </div>
                <div class="spec-item" v-if="species.habitat">
                  <span class="spec-label">Hábitat</span>
                  <span class="spec-value">{{ species.habitat }}</span>
                </div>
                <div class="spec-item" v-if="species.generation">
                  <span class="spec-label">Generación</span>
                  <span class="spec-value">{{ species.generation }}</span>
                </div>
                <div class="spec-item" v-if="species.color">
                  <span class="spec-label">Color</span>
                  <span class="spec-value">{{ species.color }}</span>
                </div>
                <div class="spec-item" v-if="species.isLegendary">
                  <span class="legendary-badge">⭐ Legendario</span>
                </div>
                <div class="spec-item" v-if="species.isMythical">
                  <span class="legendary-badge">✨ Mítico</span>
                </div>
              </div>
            </div>

            <!-- Stats Base -->
            <div class="glass-card info-card animate-fade-in-up" style="animation-delay:0.2s">
              <h2>📊 Estadísticas Base</h2>
              <div class="stats-list">
                <StatBar v-for="stat in pokemon.stats" :key="stat.name"
                  :label="statLabel(stat.name)" :value="stat.value" />
              </div>
              <div class="stat-total">
                <span>Total</span>
                <span class="total-value">{{ totalStats }}</span>
              </div>
            </div>

            <!-- Habilidades -->
            <div class="glass-card info-card animate-fade-in-up" style="animation-delay:0.25s">
              <h2>✨ Habilidades</h2>
              <div class="abilities-list">
                <span v-for="a in pokemon.abilities" :key="a.name" class="ability-chip"
                  :class="{ hidden: a.hidden }">
                  {{ a.name }} <span v-if="a.hidden" class="hidden-tag">(Oculta)</span>
                </span>
              </div>
            </div>

            <!-- Cadena de Evolución -->
            <div class="glass-card info-card animate-fade-in-up" style="animation-delay:0.3s">
              <h2>🔄 Cadena de Evolución</h2>
              <EvolutionChain :chain="evolution" />
            </div>

            <!-- Movimientos -->
            <div class="glass-card info-card animate-fade-in-up" style="animation-delay:0.35s">
              <h2>⚡ Movimientos</h2>
              <div class="moves-grid">
                <div v-for="move in moves" :key="move.name" class="move-card"
                  :class="'type-move-' + move.type">
                  <div class="move-name">{{ move.name.replace(/-/g, ' ') }}</div>
                  <div class="move-details">
                    <span class="type-badge" :class="'type-' + move.type">{{ move.type }}</span>
                    <span class="move-stat" v-if="move.power">POT {{ move.power }}</span>
                    <span class="move-stat" v-if="move.accuracy">PREC {{ move.accuracy }}%</span>
                    <span class="move-class" :class="move.damageClass">{{ move.damageClass }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Modal de añadir a equipo -->
      <div v-if="showTeamModal" class="modal-overlay" @click.self="showTeamModal = false">
        <div class="modal glass">
          <h3>Añadir al Equipo</h3>
          <div v-if="teams.length === 0" class="empty-state" style="padding:2rem">
            <p>Aún no tienes equipos. <router-link to="/teams">¡Crea uno!</router-link></p>
          </div>
          <div v-else class="team-list">
            <button v-for="team in teams" :key="team._id"
              class="team-option"
              :disabled="team.pokemon.length >= 6 || isInTeam(team)"
              @click="addToTeam(team._id)">
              <span>⚔️ {{ team.name }}</span>
              <span class="team-count" :class="{ full: team.pokemon.length >= 6 }">
                {{ team.pokemon.length }}/6
              </span>
            </button>
          </div>
          <button class="btn btn-secondary" @click="showTeamModal = false" style="width:100%;margin-top:1rem">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { usePokedexStore } from '@/stores/pokedex';
import { useFavoritesStore } from '@/stores/favorites';
import { useTeamsStore } from '@/stores/teams';
import StatBar from '@/components/StatBar.vue';
import EvolutionChain from '@/components/EvolutionChain.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const route = useRoute();
const store = usePokedexStore();
const favoritesStore = useFavoritesStore();
const teamsStore = useTeamsStore();

const loading = computed(() => store.detailLoading);
const pokemon = computed(() => store.currentPokemon);
const species = computed(() => store.currentSpecies);
const evolution = computed(() => store.currentEvolution);
const moves = computed(() => store.currentMoves);
const teams = computed(() => teamsStore.teams);
const isFav = computed(() => pokemon.value && favoritesStore.isFavorite(pokemon.value.id));
const showTeamModal = ref(false);

const typeColors = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC'
};

const heroGradient = computed(() => {
  if (!pokemon.value) return '';
  const types = pokemon.value.types || [];
  const c1 = typeColors[types[0]?.name] || '#888';
  const c2 = typeColors[types[1]?.name] || c1;
  return `linear-gradient(135deg, ${c1}22 0%, ${c2}11 100%)`;
});

const totalStats = computed(() => {
  if (!pokemon.value) return 0;
  return pokemon.value.stats?.reduce((sum, s) => sum + s.value, 0) || 0;
});

function statLabel(name) {
  const labels = {
    hp: 'PS', attack: 'ATAQUE', defense: 'DEFENSA',
    'special-attack': 'AT. ESP.', 'special-defense': 'DEF. ESP.', speed: 'VELOC.'
  };
  return labels[name] || name;
}

async function toggleFav() {
  await favoritesStore.toggleFavorite(pokemon.value.id);
}

function isInTeam(team) {
  return team.pokemon?.some(p => p.pokemonId === pokemon.value.id);
}

async function addToTeam(teamId) {
  const p = pokemon.value;
  const statsObj = {};
  p.stats?.forEach(s => {
    const key = s.name === 'special-attack' ? 'specialAttack'
      : s.name === 'special-defense' ? 'specialDefense' : s.name;
    statsObj[key] = s.value;
  });
  await teamsStore.addPokemonToTeam(teamId, {
    pokemonId: p.id,
    name: p.name,
    sprite: p.sprites?.official_artwork || p.sprites?.front_default,
    types: p.types?.map(t => t.name) || [],
    stats: statsObj,
    selectedMoves: []
  });
  showTeamModal.value = false;
}

onMounted(async () => {
  await Promise.all([
    store.fetchPokemonDetail(route.params.id),
    favoritesStore.favoriteIds.length === 0 ? favoritesStore.fetchFavorites() : Promise.resolve(),
    teamsStore.fetchTeams()
  ]);
});
</script>

<style scoped>
.detail-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.detail-hero {
  position: sticky;
  top: 80px;
  text-align: center;
  padding: 1.5rem;
}

.back-btn {
  position: absolute;
  top: 1rem;
  left: 1rem;
}

.hero-sprite {
  width: 200px;
  height: 200px;
  margin: 1rem auto;
}

.hero-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.4));
}

.hero-id { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
.hero-name {
  font-family: var(--font-heading);
  font-size: 2rem;
  text-transform: capitalize;
  margin: 0.25rem 0 0.75rem;
}

.hero-types { display: flex; gap: 0.5rem; justify-content: center; }

.hero-meta {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin: 1rem 0;
}

.meta-item { display: flex; flex-direction: column; align-items: center; }
.meta-value { font-weight: 700; font-size: 1.1rem; }
.meta-label { font-size: 0.75rem; color: var(--text-muted); }

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.info-card {
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.info-card h2 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.flavor-text {
  color: var(--text-secondary);
  font-style: italic;
  line-height: 1.7;
  margin-bottom: 1rem;
}

.species-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.spec-item { display: flex; flex-direction: column; }
.spec-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
.spec-value { font-size: 0.9rem; text-transform: capitalize; font-weight: 500; }

.legendary-badge {
  background: linear-gradient(135deg, #F8D030, #F08030);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.stat-total {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.total-value { font-weight: 700; color: var(--text-primary); }

.abilities-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.ability-chip {
  padding: 0.35rem 0.85rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  text-transform: capitalize;
}

.ability-chip.hidden {
  border-color: var(--accent);
  color: var(--accent);
}

.hidden-tag { font-size: 0.7rem; }

.moves-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.move-card {
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.move-name {
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  margin-bottom: 0.35rem;
}

.move-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.move-stat {
  font-size: 0.7rem;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-sm);
}

.move-class {
  font-size: 0.7rem;
  text-transform: capitalize;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-sm);
}

.move-class.physical { background: hsla(0, 75%, 55%, 0.2); color: hsl(0, 75%, 70%); }
.move-class.special { background: hsla(210, 100%, 60%, 0.2); color: hsl(210, 100%, 70%); }
.move-class.status { background: hsla(230, 10%, 60%, 0.2); color: hsl(230, 10%, 70%); }

/* Team Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
}

.modal h3 { margin-bottom: 1rem; }

.team-list { display: flex; flex-direction: column; gap: 0.5rem; }

.team-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.team-option:hover:not(:disabled) { background: var(--bg-card-hover); border-color: var(--accent); }
.team-option:disabled { opacity: 0.4; cursor: not-allowed; }

.team-count { font-size: 0.8rem; color: var(--text-muted); }
.team-count.full { color: var(--danger); }

@media (max-width: 900px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-hero { position: static; }
}
</style>
