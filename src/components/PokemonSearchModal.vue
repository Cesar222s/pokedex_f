<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal-wide glass animate-fade-in-up">
      <div class="modal-header">
        <h3>🔍 Añadir Pokémon</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="search-bar-wrap">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Busca por nombre..." 
          class="input search-input"
          @input="handleSearch"
        />
      </div>

      <div class="pokemon-grid-scroll">
        <LoadingSpinner v-if="loading" />
        <div v-else-if="results.length === 0" class="empty-results">
          No se encontraron Pokémon.
        </div>
        <div v-else class="pokemon-grid">
          <div 
            v-for="poke in results" 
            :key="poke.id" 
            class="search-card"
            @click="selectPokemon(poke)"
          >
            <div class="search-sprite-box">
              <img :src="poke.sprite" :alt="poke.name" class="search-sprite" />
            </div>
            <div class="search-info">
              <span class="search-name capitalize">{{ poke.name }}</span>
              <div class="search-types">
                <span v-for="t in poke.types" :key="t" class="type-badge-mini" :class="'type-' + t"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer" v-if="!searchQuery">
        <button 
          class="btn btn-secondary btn-sm" 
          :disabled="offset === 0" 
          @click="changePage(-1)"
        > anterior </button>
        <span class="page-info">Página {{ Math.floor(offset / limit) + 1 }}</span>
        <button 
          class="btn btn-secondary btn-sm" 
          @click="changePage(1)"
        > siguiente </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const emit = defineEmits(['close', 'select']);

const searchQuery = ref('');
const results = ref([]);
const loading = ref(false);
const offset = ref(0);
const limit = 20;

let searchTimeout = null;

async function fetchPokemon() {
  loading.value = true;
  try {
    const { data } = await api.get('/pokemon', { params: { limit, offset: offset.value } });
    results.value = data.results;
  } catch (err) {
    console.error('Search error:', err);
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  
  if (!searchQuery.value.trim()) {
    offset.value = 0;
    fetchPokemon();
    return;
  }

  searchTimeout = setTimeout(async () => {
    loading.value = true;
    try {
      // Small trick: trying to fetch direct by name for search
      const { data } = await api.get(`/pokemon/${searchQuery.value.toLowerCase().trim()}`);
      results.value = [{
        id: data.id,
        name: data.name,
        sprite: data.sprites?.official_artwork || data.sprites?.front_default,
        types: data.types.map(t => t.name)
      }];
    } catch {
      results.value = [];
    } finally {
      loading.value = false;
    }
  }, 500);
}

function selectPokemon(poke) {
  emit('select', poke);
}

function changePage(dir) {
  offset.value = Math.max(0, offset.value + (dir * limit));
  fetchPokemon();
}

onMounted(fetchPokemon);
</script>

<style scoped>
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-muted); }

.search-bar-wrap { margin-bottom: 1.5rem; }
.search-input { width: 100%; padding: 0.8rem 1.2rem; border-radius: var(--radius-full); }

.pokemon-grid-scroll {
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.search-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.search-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  background: var(--bg-card-hover);
}

.search-sprite-box {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-sprite {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.search-info { text-align: center; }
.search-name { font-weight: 600; font-size: 0.9rem; }
.search-types { display: flex; gap: 0.25rem; justify-content: center; margin-top: 0.2rem; }

.type-badge-mini {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.modal-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.page-info { font-size: 0.8rem; color: var(--text-muted); }

.empty-results { text-align: center; padding: 2rem; color: var(--text-muted); }

.capitalize { text-transform: capitalize; }
</style>
