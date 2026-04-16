<template>
  <div class="page">
    <div class="container">
      <!-- Teams Overview -->
      <div v-if="!isBuilderOpen" class="overview-section">
        <div class="page-header flex justify-between items-center">
          <div>
            <h1>⚔️ Mis Equipos</h1>
            <p class="text-muted">Gestiona tus configuraciones de combate</p>
          </div>
          <button class="btn btn-primary" @click="startNewTeam" id="create-team-btn">
            + Nuevo Equipo
          </button>
        </div>

        <LoadingSpinner v-if="loading" message="Cargando equipos..." />

        <div v-else-if="teams.length === 0" class="empty-state">
          <div class="emoji">⚔️</div>
          <h3>Aún no tienes equipos</h3>
          <p>¡Crea un equipo y añade hasta 6 Pokémon para combatir!</p>
          <button class="btn btn-primary mt-3" @click="startNewTeam">Crear Primer Equipo</button>
        </div>

        <div v-else class="teams-list stagger">
          <div v-for="team in teams" :key="team._id" class="team-card glass-card">
            <div class="team-header">
              <div class="team-title">
                <h3>{{ team.name }}</h3>
                <span class="team-size">{{ team.pokemon.length }}/6 Pokémon</span>
              </div>
              <div class="team-actions">
                <button class="btn btn-secondary btn-sm" @click="startEditing(team)">✏️ Entrar al Editor</button>
                <button class="btn btn-danger btn-sm" @click="confirmDelete(team)">🗑️ Eliminar</button>
              </div>
            </div>

            <div class="team-roster-preview">
              <div v-for="(poke, idx) in team.pokemon" :key="idx" class="preview-slot">
                <img :src="poke.sprite" :alt="poke.name" class="preview-sprite" />
              </div>
              <div v-for="i in (6 - team.pokemon.length)" :key="'empty-'+i" class="preview-slot empty"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Team Builder Interface (Overlay) -->
      <div v-else class="builder-section animate-fade-in">
        <div class="builder-header">
          <button class="back-btn" @click="cancelBuilder">← Cancelar</button>
          <div class="builder-title-wrap">
            <input type="text" v-model="draftTeam.name" class="builder-name-input" placeholder="Nombre del equipo..." />
            <span class="builder-status" :class="{ modified: isModified }">
              {{ isModified ? '● Cambios sin guardar' : '✓ Guardado' }}
            </span>
          </div>
          <button class="btn btn-success btn-header-save" @click="saveDraftTeam" :disabled="!draftTeam.name.trim() || saving">
            {{ saving ? 'Guardando...' : 'GUARDAR EQUIPO' }}
          </button>
        </div>

        <div class="builder-main">
          <div class="builder-roster">
            <div 
              v-for="idx in 6" 
              :key="idx" 
              class="builder-slot"
              :class="{ 
                filled: draftTeam.pokemon[idx-1], 
                empty: !draftTeam.pokemon[idx-1],
                active: activeSlot === idx-1 
              }"
              @click="activeSlot = idx-1"
            >
              <div v-if="draftTeam.pokemon[idx-1]" class="slot-content">
                <img :src="draftTeam.pokemon[idx-1].sprite" class="slot-sprite" />
                <div class="slot-info">
                  <span class="slot-name capitalize">{{ draftTeam.pokemon[idx-1].name }}</span>
                  <div class="slot-moves-mini">
                    <span v-for="m in 4" :key="m" class="move-dot" :class="{ filled: draftTeam.pokemon[idx-1].selectedMoves[m-1] }"></span>
                  </div>
                </div>
                <button class="slot-remove" @click.stop="removePokemonFromDraft(idx-1)">✕</button>
              </div>
              <div v-else class="slot-empty-content">
                <span class="plus">+</span>
                <span>Añadir</span>
              </div>
            </div>
          </div>

          <div class="builder-detail-panel glass-card">
            <div v-if="activeSlotPokemon" class="poke-editor">
              <div class="poke-editor-header">
                <img :src="activeSlotPokemon.sprite" class="editor-poke-sprite" />
                <div class="editor-poke-title">
                  <h2 class="capitalize">{{ activeSlotPokemon.name }}</h2>
                  <div class="roster-types">
                <div class="roster-types">
                    <span v-for="t in activeSlotPokemon.types" :key="t" class="type-badge" :class="'type-' + t">{{ translateType(t) }}</span>
                  </div>
                </div>
                <button class="btn btn-secondary btn-sm" @click="openPokemonSearch">Cambiar Pokémon</button>
              </div>

              <div class="move-config">
                <h3>Movimientos ({{ activeSlotPokemon.selectedMoves.length }}/4)</h3>
                <div class="selected-moves grid-2">
                  <div v-for="i in 4" :key="i" class="selected-slot" :class="{ empty: !activeSlotPokemon.selectedMoves[i-1] }">
                    <template v-if="activeSlotPokemon.selectedMoves[i-1]">
                      <div class="move-slot-row">
                        <span class="type-badge-mini" :class="'type-' + activeSlotPokemon.selectedMoves[i-1].type"></span>
                        <span class="move-slot-name">{{ activeSlotPokemon.selectedMoves[i-1].name?.replace(/-/g, ' ') }}</span>
                        <button class="remove-move-btn" @click="removeMoveFromDraft(i-1)">✕</button>
                      </div>
                    </template>
                    <span v-else class="empty-slot-text">Ranura vacía</span>
                  </div>
                </div>

                <div class="moves-picker-wrap">
                  <div v-if="movesLoading" class="p-3 text-center"><LoadingSpinner /></div>
                  <div v-else class="moves-picker-list">
                    <button v-for="move in availableMoves" :key="move.name"
                      class="move-pick-btn"
                      :class="{ 
                        selected: isMoveSelected(move), 
                        disabled: activeSlotPokemon.selectedMoves.length >= 4 && !isMoveSelected(move) 
                      }"
                      @click="toggleMoveInDraft(move)">
                      <div class="move-pick-main">
                        <span class="type-badge" :class="'type-' + move.type">{{ translateType(move.type) }}</span>
                        <span class="move-pick-name">{{ move.name?.replace(/-/g, ' ') }}</span>
                        <span class="move-pick-class" :class="move.damageClass">{{ translateClass(move.damageClass) }}</span>
                      </div>
                      <div class="move-pick-stats">
                        <span v-if="move.power" class="m-data"><b>POT</b> {{ move.power }}</span>
                        <span v-if="move.accuracy" class="m-data"><b>PRE</b> {{ move.accuracy }}%</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-detail-state">
              <div class="emoji">🔍</div>
              <h3>Selecciona una ranura</h3>
              <p>Pulsa en una ranura vacía para añadir un Pokémon o en uno existente para editar sus movimientos.</p>
              <button class="btn btn-primary mt-3" @click="openPokemonSearch">Añadir Pokémon</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pokémon Search Modal -->
      <PokemonSearchModal 
        v-if="searchModalOpen" 
        @close="searchModalOpen = false" 
        @select="addPokemonToDraft" 
      />

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
import { ref, computed, onMounted, watch } from 'vue';
import { useTeamsStore } from '@/stores/teams';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import PokemonSearchModal from '@/components/PokemonSearchModal.vue';
import { translateType, translateClass } from '@/utils/translations';

const teamsStore = useTeamsStore();
const loading = computed(() => teamsStore.loading);
const teams = computed(() => teamsStore.teams);

// Builder State
const isBuilderOpen = ref(false);
const saving = ref(false);
const activeSlot = ref(0);
const draftTeam = ref({
  _id: null,
  name: '',
  pokemon: []
});
const originalTeamJson = ref('');

const isModified = computed(() => {
  return JSON.stringify(draftTeam.value) !== originalTeamJson.value;
});

const activeSlotPokemon = computed(() => draftTeam.value.pokemon[activeSlot.value] || null);

// Start New/Edit
function startNewTeam() {
  draftTeam.value = { _id: null, name: 'Nuevo Equipo', pokemon: [] };
  originalTeamJson.value = JSON.stringify(draftTeam.value);
  activeSlot.value = 0;
  isBuilderOpen.value = true;
}

function startEditing(team) {
  draftTeam.value = JSON.parse(JSON.stringify(team)); // Deep clone
  originalTeamJson.value = JSON.stringify(draftTeam.value);
  activeSlot.value = 0;
  isBuilderOpen.value = true;
}

function cancelBuilder() {
  if (isModified.value && !confirm('Tienes cambios sin guardar. ¿Quieres salir igualmente?')) {
    return;
  }
  isBuilderOpen.value = false;
}

// Pokemon Search logic for Draft
const searchModalOpen = ref(false);
function openPokemonSearch() { searchModalOpen.value = true; }

async function addPokemonToDraft(poke) {
  try {
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
      },
      selectedMoves: []
    };
    
    draftTeam.value.pokemon[activeSlot.value] = pokemonData;
    searchModalOpen.value = false;
  } catch (err) {
    console.error('Add pokemon to draft error:', err);
  }
}

function removePokemonFromDraft(idx) {
  draftTeam.value.pokemon.splice(idx, 1);
}

// Move logic for Draft
const availableMoves = ref([]);
const movesLoading = ref(false);

watch(activeSlotPokemon, async (newPoke) => {
  if (!newPoke) {
    availableMoves.value = [];
    return;
  }
  movesLoading.value = true;
  try {
    const { data } = await api.get(`/pokemon/${newPoke.pokemonId}/moves`);
    availableMoves.value = data.moves;
  } catch {
    availableMoves.value = [];
  } finally {
    movesLoading.value = false;
  }
}, { immediate: true });

function isMoveSelected(move) {
  return activeSlotPokemon.value?.selectedMoves.some(m => m.name === move.name);
}

function toggleMoveInDraft(move) {
  const poke = activeSlotPokemon.value;
  if (!poke) return;

  const idx = poke.selectedMoves.findIndex(m => m.name === move.name);
  if (idx !== -1) {
    poke.selectedMoves.splice(idx, 1);
  } else if (poke.selectedMoves.length < 4) {
    poke.selectedMoves.push(move);
  }
}

function removeMoveFromDraft(idx) {
  activeSlotPokemon.value?.selectedMoves.splice(idx, 1);
}

// Final Save
async function saveDraftTeam() {
  saving.value = true;
  try {
    if (draftTeam.value._id) {
      await teamsStore.updateTeam(draftTeam.value._id, {
        name: draftTeam.value.name,
        pokemon: draftTeam.value.pokemon
      });
    } else {
      const newTeam = await teamsStore.createTeam(draftTeam.value.name);
      await teamsStore.updateTeam(newTeam._id, {
        pokemon: draftTeam.value.pokemon
      });
    }
    isBuilderOpen.value = false;
  } catch (err) {
    alert('Error al guardar el equipo: ' + (err.response?.data?.error || err.message));
  } finally {
    saving.value = false;
  }
}

// Global Delete
const deleteTarget = ref(null);
function confirmDelete(team) { deleteTarget.value = team; }
async function doDelete() {
  await teamsStore.deleteTeam(deleteTarget.value._id);
  deleteTarget.value = null;
}

onMounted(() => teamsStore.fetchTeams());
</script>

<style scoped>
.builder-section {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-primary);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: 1rem;
  box-shadow: var(--shadow-lg);
}

.back-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; }
.builder-title-wrap { flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; }

.builder-name-input {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  width: 100%;
  max-width: 400px;
  transition: border-color 0.2s;
}
.builder-name-input:focus { border-color: var(--accent); outline: none; }

.builder-status { font-size: 0.75rem; color: var(--success); margin-top: 0.25rem; }
.builder-status.modified { color: var(--warning); }

.builder-main {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  overflow: hidden;
}

.builder-roster {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
}

.builder-slot {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.builder-slot:hover { border-color: var(--accent-light); }
.builder-slot.active { border-color: var(--accent); background: var(--bg-card-hover); box-shadow: 0 0 0 2px var(--accent); }

.slot-content { display: flex; align-items: center; gap: 1rem; }
.slot-sprite { width: 50px; height: 50px; object-fit: contain; }
.slot-info { flex: 1; }
.slot-name { font-weight: 600; display: block; }
.slot-moves-mini { display: flex; gap: 3px; margin-top: 0.4rem; }
.move-dot { width: 12px; height: 4px; background: var(--border); border-radius: 2px; }
.move-dot.filled { background: var(--success); }

.slot-remove {
  background: none; border: none; color: var(--danger); font-size: 0.8rem; cursor: pointer; padding: 0.5rem;
  opacity: 0.3; transition: opacity 0.2s;
}
.builder-slot:hover .slot-remove { opacity: 1; }

.slot-empty-content {
  height: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 1px dashed var(--border); border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.75rem;
}
.plus { font-size: 1.2rem; margin-bottom: -0.2rem; }

.builder-detail-panel {
  overflow-y: auto;
  padding: 1.5rem;
}

.poke-editor-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
.editor-poke-sprite { width: 120px; height: 120px; object-fit: contain; }
.editor-poke-title h2 { font-size: 2rem; margin-bottom: 0.5rem; }

.move-config h3 { margin-bottom: 1rem; font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }

.moves-picker-wrap {
  margin-top: 1.5rem;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  max-height: 400px;
  overflow-y: auto;
}

.teams-list { display: flex; flex-direction: column; gap: 1rem; }
.team-card { padding: 1.25rem; }
.team-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.team-roster-preview { display: flex; gap: 0.5rem; }
.preview-slot { width: 40px; height: 40px; background: var(--bg-tertiary); border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.preview-sprite { width: 100%; height: 100%; object-fit: contain; }
.preview-slot.empty { opacity: 0.2; border: 1px dashed var(--text-muted); }

.btn-header-save { padding: 0.75rem 1.5rem; font-weight: 700; border-radius: var(--radius-full); }

.capitalize { text-transform: capitalize; }
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }

@media (max-width: 900px) {
  .builder-main { grid-template-columns: 1fr; }
  .builder-roster { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
  .slot-content { flex-direction: column; gap: 0.25rem; text-align: center; }
  .slot-sprite { width: 40px; height: 40px; }
  .slot-info { font-size: 0.7rem; }
}

@media (max-width: 600px) {
  .builder-roster { grid-template-columns: repeat(2, 1fr); }
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
