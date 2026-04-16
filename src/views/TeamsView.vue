<template>
  <div class="page">
    <div class="container">
      <div class="page-header flex justify-between items-center">
        <div>
          <h1>⚔️ Mis Equipos</h1>
          <p class="text-muted">Crea y gestiona tus equipos Pokémon</p>
        </div>
        <button class="btn btn-primary" @click="showCreate = true" id="create-team-btn">
          + Nuevo Equipo
        </button>
      </div>

      <LoadingSpinner v-if="loading" message="Cargando equipos..." />

      <div v-else-if="teams.length === 0" class="empty-state">
        <div class="emoji">⚔️</div>
        <h3>Aún no tienes equipos</h3>
        <p>¡Crea un equipo y añade hasta 6 Pokémon para combatir con amigos!</p>
        <button class="btn btn-primary mt-3" @click="showCreate = true">Crear Primer Equipo</button>
      </div>

      <div v-else class="teams-list stagger">
        <div v-for="team in teams" :key="team._id" class="team-card glass-card">
          <div class="team-header">
            <div class="team-title">
              <h3>{{ team.name }}</h3>
              <span class="team-size">{{ team.pokemon.length }}/6 Pokémon</span>
            </div>
            <div class="team-actions">
              <button class="btn btn-secondary btn-sm" @click="openEdit(team)">✏️ Editar</button>
              <button class="btn btn-danger btn-sm" @click="confirmDelete(team)">🗑️ Eliminar</button>
            </div>
          </div>

          <div class="team-roster">
            <div v-for="(poke, idx) in team.pokemon" :key="idx" class="roster-slot filled"
              @click="openMoveEditor(team, poke)">
              <img :src="poke.sprite" :alt="poke.name" class="roster-sprite" />
              <div class="roster-info">
                <span class="roster-name">{{ poke.name }}</span>
                <div class="roster-types">
                  <span v-for="t in poke.types" :key="t" class="type-badge" :class="'type-' + t">{{ t }}</span>
                </div>
                <div class="roster-moves">
                  <span v-if="poke.selectedMoves?.length > 0" class="moves-ok">
                    ✓ {{ poke.selectedMoves.length }} movimientos
                  </span>
                  <span v-else class="moves-warn">⚠ Sin movimientos — pulsa para configurar</span>
                </div>
              </div>
              <button class="remove-poke-btn" @click.stop="removePokemon(team._id, poke.pokemonId)"
                title="Remove from team">✕</button>
            </div>

            <!-- Empty slots -->
            <div v-for="i in (6 - team.pokemon.length)" :key="'empty-' + i"
              class="roster-slot empty" @click="openPokemonSearch(team)">
              <span class="empty-icon">+</span>
              <span class="empty-text">Añadir Pokémon</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pokémon Search Modal -->
      <PokemonSearchModal 
        v-if="searchModalOpen" 
        @close="searchModalOpen = false" 
        @select="addPokemonToTeam" 
      />

      <!-- Create Team Modal -->
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal glass animate-fade-in-up">
          <h3>Crear Nuevo Equipo</h3>
          <div class="input-group mt-2">
            <label>Nombre del Equipo</label>
            <input type="text" class="input" placeholder="Mi Equipo Ideal" v-model="newTeamName"
              id="new-team-name" maxlength="30" @keyup.enter="createTeam" />
          </div>
          <div v-if="createError" class="alert alert-error mt-2">{{ createError }}</div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showCreate = false">Cancelar</button>
            <button class="btn btn-primary" @click="createTeam" :disabled="!newTeamName.trim()">
              Crear Equipo
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Team Name Modal -->
      <div v-if="editTeam" class="modal-overlay" @click.self="editTeam = null">
        <div class="modal glass animate-fade-in-up">
          <h3>Renombrar Equipo</h3>
          <div class="input-group mt-2">
            <label>Nombre del Equipo</label>
            <input type="text" class="input" v-model="editName" id="edit-team-name"
              maxlength="30" @keyup.enter="saveEdit" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="editTeam = null">Cancelar</button>
            <button class="btn btn-primary" @click="saveEdit">Guardar</button>
          </div>
        </div>
      </div>

      <!-- Editor de movimientos -->
      <div v-if="moveEditorOpen && editingPoke" class="modal-overlay" @click.self="moveEditorOpen = false">
        <div class="modal modal-wide glass animate-fade-in-up">
          <h3>Configurar Movimientos — <span class="capitalize">{{ editingPoke.name }}</span></h3>
          <p class="text-muted mb-2">Selecciona hasta 4 movimientos para el combate</p>

          <div class="selected-moves">
            <div v-for="(move, i) in selectedMoves" :key="i" class="selected-slot"
              :class="{ empty: !move }">
              <template v-if="move">
                <div class="move-slot-row">
                  <span class="type-badge" :class="'type-' + move.type">{{ move.type }}</span>
                  <span class="move-slot-name">{{ move.name?.replace(/-/g, ' ') }}</span>
                  <button class="remove-move-btn" @click="removeMove(i)">✕</button>
                </div>
                <div class="move-slot-stats">
                  <span v-if="move.power" class="m-stat">💥 {{ move.power }}</span>
                  <span v-if="move.accuracy" class="m-stat">🎯 {{ move.accuracy }}%</span>
                  <span v-if="move.pp" class="m-stat">🧪 {{ move.pp }} PP</span>
                </div>
              </template>
              <span v-else class="empty-slot-text">Ranura vacía</span>
            </div>
          </div>

          <div class="moves-picker">
            <LoadingSpinner v-if="movesLoading" />
            <div v-else class="moves-picker-list">
              <button v-for="move in availableMoves" :key="move.name"
                class="move-pick-btn"
                :class="{ 
                  selected: isMoveSelected(move), 
                  disabled: selectedMoves.filter(Boolean).length >= 4 && !isMoveSelected(move) 
                }"
                @click="toggleMove(move)"
                :disabled="selectedMoves.filter(Boolean).length >= 4 && !isMoveSelected(move)">
                <div class="move-pick-main">
                  <span class="type-badge" :class="'type-' + move.type">{{ move.type }}</span>
                  <span class="move-pick-name">{{ move.name?.replace(/-/g, ' ') }}</span>
                </div>
                <div class="move-pick-stats">
                  <span v-if="move.power" class="m-data"><b>POW</b> {{ move.power }}</span>
                  <span v-if="move.accuracy" class="m-data"><b>ACC</b> {{ move.accuracy }}%</span>
                  <span class="move-pick-class" :class="move.damageClass">{{ move.damageClass }}</span>
                </div>
                <div v-if="move.effect" class="move-pick-desc">{{ move.effect }}</div>
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" @click="moveEditorOpen = false">Cancelar</button>
            <button class="btn btn-primary" @click="saveMoves">
              Guardar {{ selectedMoves.filter(Boolean).length }} Movimientos
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirm -->
      <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
        <div class="modal glass animate-fade-in-up">
          <h3>Eliminar Equipo</h3>
          <p class="text-muted">¿Estás seguro de que quieres eliminar <strong>{{ deleteTarget.name }}</strong>?</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="deleteTarget = null">Cancelar</button>
            <button class="btn btn-danger" @click="doDelete">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import PokemonSearchModal from '@/components/PokemonSearchModal.vue';

const teamsStore = useTeamsStore();
const loading = computed(() => teamsStore.loading);
const teams = computed(() => teamsStore.teams);

// Create
const showCreate = ref(false);
const newTeamName = ref('');
const createError = ref('');

async function createTeam() {
  if (!newTeamName.value.trim()) return;
  try {
    await teamsStore.createTeam(newTeamName.value.trim());
    newTeamName.value = '';
    showCreate.value = false;
  } catch (err) {
    createError.value = err.response?.data?.error || 'Failed to create team';
  }
}

// Edit
const editTeam = ref(null);
const editName = ref('');

function openEdit(team) {
  editTeam.value = team;
  editName.value = team.name;
}

async function saveEdit() {
  await teamsStore.updateTeam(editTeam.value._id, { name: editName.value });
  editTeam.value = null;
}

// Delete
const deleteTarget = ref(null);
function confirmDelete(team) { deleteTarget.value = team; }
async function doDelete() {
  await teamsStore.deleteTeam(deleteTarget.value._id);
  deleteTarget.value = null;
}

// Remove Pokémon
async function removePokemon(teamId, pokemonId) {
  await teamsStore.removePokemonFromTeam(teamId, pokemonId);
}

// Inline Pokemon Search
const searchModalOpen = ref(false);
const searchingForTeam = ref(null);

function openPokemonSearch(team) {
  searchingForTeam.value = team;
  searchModalOpen.value = true;
}

async function addPokemonToTeam(poke) {
  if (!searchingForTeam.value) return;
  try {
    // We need complete data for stats (matching how it is stored)
    const { data } = await api.get(`/pokemon/${poke.id}`);
    const pokemonData = {
      pokemonId: data.id,
      name: data.name,
      sprite: data.sprites.official_artwork || data.sprites.front_default,
      types: data.types.map(t => t.name),
      stats: {
        hp: data.stats.find(s => s.name === 'hp')?.value || 100,
        attack: data.stats.find(s => s.name === 'attack')?.value || 100,
        defense: data.stats.find(s => s.name === 'defense')?.value || 100,
        specialAttack: data.stats.find(s => s.name === 'special-attack')?.value || 100,
        specialDefense: data.stats.find(s => s.name === 'special-defense')?.value || 100,
        speed: data.stats.find(s => s.name === 'speed')?.value || 100,
      }
    };
    
    await teamsStore.addPokemonToTeam(searchingForTeam.value._id, pokemonData);
    searchModalOpen.value = false;
  } catch (err) {
    console.error('Add pokemon error:', err);
  }
}

// Move Editor
const moveEditorOpen = ref(false);
const editingTeam = ref(null);
const editingPoke = ref(null);
const selectedMoves = ref([null, null, null, null]);
const availableMoves = ref([]);
const movesLoading = ref(false);

async function openMoveEditor(team, poke) {
  editingTeam.value = team;
  editingPoke.value = poke;
  selectedMoves.value = [...(poke.selectedMoves || [null, null, null, null])].slice(0, 4);
  while (selectedMoves.value.length < 4) selectedMoves.value.push(null);
  moveEditorOpen.value = true;

  movesLoading.value = true;
  try {
    const { data } = await api.get(`/pokemon/${poke.pokemonId}/moves`);
    availableMoves.value = data.moves.filter(m => m.power && m.power > 0);
  } catch {
    availableMoves.value = [];
  } finally {
    movesLoading.value = false;
  }
}

function isMoveSelected(move) {
  return selectedMoves.value.some(m => m?.name === move.name);
}

function toggleMove(move) {
  if (isMoveSelected(move)) {
    const idx = selectedMoves.value.findIndex(m => m?.name === move.name);
    selectedMoves.value[idx] = null;
  } else {
    const emptyIdx = selectedMoves.value.findIndex(m => !m);
    if (emptyIdx !== -1) selectedMoves.value[emptyIdx] = move;
  }
}

function removeMove(i) { selectedMoves.value[i] = null; }

async function saveMoves() {
  const updatedPokemon = editingTeam.value.pokemon.map(p => {
    if (p.pokemonId === editingPoke.value.pokemonId) {
      return { ...p, selectedMoves: selectedMoves.value.filter(Boolean) };
    }
    return p;
  });
  await teamsStore.updateTeam(editingTeam.value._id, { pokemon: updatedPokemon });
  moveEditorOpen.value = false;
}

onMounted(() => teamsStore.fetchTeams());
</script>

<style scoped>
.teams-list { display: flex; flex-direction: column; gap: 1.5rem; }

.team-card { padding: 1.5rem; }

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.team-title h3 { font-size: 1.3rem; margin-bottom: 0.2rem; }
.team-size { font-size: 0.8rem; color: var(--text-muted); }

.team-actions { display: flex; gap: 0.5rem; }

.team-roster {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.roster-slot {
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  padding: 0.75rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  position: relative;
  transition: all 0.2s;
  cursor: pointer;
}

.roster-slot.filled { background: var(--bg-card); }
.roster-slot.filled:hover { background: var(--bg-card-hover); border-color: var(--accent); }

.roster-slot.empty {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 80px;
  border-style: dashed;
  opacity: 0.5;
  cursor: pointer;
}
.roster-slot.empty:hover { opacity: 0.9; border-color: var(--accent); }

.empty-icon { font-size: 1.5rem; color: var(--text-muted); }
.empty-text { font-size: 0.75rem; color: var(--text-muted); }

.roster-sprite {
  width: 48px;
  height: 48px;
  object-fit: contain;
  flex-shrink: 0;
}

.roster-info { flex: 1; min-width: 0; }
.roster-name { font-size: 0.85rem; font-weight: 600; text-transform: capitalize; display: block; }
.roster-types { display: flex; gap: 0.25rem; flex-wrap: wrap; margin: 0.25rem 0; }
.roster-moves { font-size: 0.7rem; }
.moves-ok { color: var(--success); }
.moves-warn { color: var(--warning); }

.remove-poke-btn {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0.15rem 0.3rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.roster-slot:hover .remove-poke-btn { opacity: 1; }

/* Modal */
.modal { padding: 1.5rem; max-width: 460px; width: 100%; }
.modal-wide { max-width: 680px; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* Move Editor */
.selected-moves {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.selected-slot {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  min-height: 80px;
}

.selected-slot.empty {
  opacity: 0.4;
  justify-content: center;
  align-items: center;
  border-style: dashed;
}

.move-slot-row { display: flex; align-items: center; gap: 0.5rem; width: 100%; }
.move-slot-name { flex: 1; text-transform: capitalize; font-weight: 600; font-size: 0.9rem; }

.move-slot-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.remove-move-btn {
  background: var(--bg-tertiary);
  border: none;
  color: var(--danger);
  cursor: pointer;
  width: 20px; height: 20px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem;
}

.moves-picker {
  max-height: 350px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
}

.moves-picker-list { display: flex; flex-direction: column; }

.move-pick-btn {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.move-pick-btn:hover { background: var(--bg-card-hover); }
.move-pick-btn.selected { background: hsla(230, 100%, 65%, 0.1); border-left: 3px solid var(--accent); }
.move-pick-btn.disabled { opacity: 0.4; cursor: not-allowed; }

.move-pick-main { display: flex; align-items: center; gap: 0.5rem; }
.move-pick-name { flex: 1; text-transform: capitalize; font-weight: 600; font-size: 0.95rem; }

.move-pick-stats { display: flex; align-items: center; gap: 1rem; font-size: 0.75rem; }
.m-data b { color: var(--text-muted); margin-right: 0.2rem; }

.move-pick-class { font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 4px; text-transform: uppercase; font-weight: 700; }
.move-pick-class.physical { background: #c92112; color: white; }
.move-pick-class.special { background: #4f5870; color: white; }
.move-pick-class.status { background: #8c888c; color: white; }

.move-pick-desc { font-size: 0.75rem; color: var(--text-muted); font-style: italic; line-height: 1.2; margin-top: 0.2rem; }

.capitalize { text-transform: capitalize; }

@media (max-width: 768px) {
  .team-roster { grid-template-columns: 1fr; }
  .selected-moves { grid-template-columns: 1fr; }
  .moves-picker { max-height: 300px; }
}
</style>
