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
              class="roster-slot empty" @click="$router.push('/pokedex')">
              <span class="empty-icon">+</span>
              <span class="empty-text">Añadir Pokémon</span>
            </div>
          </div>
        </div>
      </div>

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
                <span class="type-badge" :class="'type-' + move.type">{{ move.type }}</span>
                <span class="move-slot-name">{{ move.name?.replace(/-/g, ' ') }}</span>
                <span class="move-slot-power">POT {{ move.power || '—' }}</span>
                <button class="remove-move-btn" @click="removeMove(i)">✕</button>
              </template>
              <span v-else class="empty-slot-text">Ranura vacía</span>
            </div>
          </div>

          <div class="moves-picker">
            <LoadingSpinner v-if="movesLoading" />
            <div v-else class="moves-picker-list">
              <button v-for="move in availableMoves" :key="move.name"
                class="move-pick-btn"
                :class="{ selected: isMoveSelected(move), disabled: selectedMoves.filter(Boolean).length >= 4 && !isMoveSelected(move) }"
                @click="toggleMove(move)"
                :disabled="selectedMoves.filter(Boolean).length >= 4 && !isMoveSelected(move)">
                <span class="type-badge" :class="'type-' + move.type">{{ move.type }}</span>
                <span class="move-pick-name">{{ move.name?.replace(/-/g, ' ') }}</span>
                <span class="move-pick-power" v-if="move.power">{{ move.power }}</span>
                <span class="move-pick-class" :class="move.damageClass">{{ move.damageClass }}</span>
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
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.selected-slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  min-height: 42px;
}

.selected-slot.empty {
  opacity: 0.4;
  justify-content: center;
}

.empty-slot-text { font-size: 0.75rem; color: var(--text-muted); }
.move-slot-name { flex: 1; text-transform: capitalize; font-weight: 500; }
.move-slot-power { font-size: 0.7rem; color: var(--text-muted); }

.remove-move-btn {
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
}

.moves-picker {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem;
}

.moves-picker-list { display: flex; flex-direction: column; gap: 0.35rem; }

.move-pick-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  font-size: 0.8rem;
  transition: all 0.15s;
}

.move-pick-btn:hover { background: var(--bg-card-hover); border-color: var(--border); }
.move-pick-btn.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.move-pick-btn.disabled { opacity: 0.35; cursor: not-allowed; }

.move-pick-name { flex: 1; text-transform: capitalize; }
.move-pick-power { font-size: 0.7rem; color: var(--text-muted); }
.move-pick-class { font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 3px; }
.move-pick-class.physical { background: hsla(0, 75%, 55%, 0.2); color: hsl(0, 75%, 70%); }
.move-pick-class.special { background: hsla(210, 100%, 60%, 0.2); color: hsl(210, 100%, 70%); }
.move-pick-class.status { background: hsla(230, 10%, 60%, 0.2); color: hsl(230, 10%, 70%); }

.capitalize { text-transform: capitalize; }

@media (max-width: 768px) {
  .team-roster { grid-template-columns: repeat(2, 1fr); }
  .selected-moves { grid-template-columns: 1fr; }
}
</style>
