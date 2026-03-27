<template>
  <div class="filter-bar glass">
    <div class="filter-item">
      <input type="text" class="input" placeholder="Buscar por nombre..."
        v-model="filters.name" @input="onFilter" id="filter-name" />
    </div>
    <div class="filter-item">
      <select class="input" v-model="filters.type1" @change="onFilter" id="filter-type1">
        <option value="">Tipo 1</option>
        <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    <div class="filter-item">
      <select class="input" v-model="filters.type2" @change="onFilter" id="filter-type2">
        <option value="">Tipo 2</option>
        <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    <div class="filter-item">
      <select class="input" v-model="filters.region" @change="onFilter" id="filter-region">
        <option value="">Región</option>
        <option v-for="r in regions" :key="r.id" :value="r.name.toLowerCase()">{{ r.name }}</option>
      </select>
    </div>
    <button v-if="hasFilters" class="btn btn-secondary btn-sm" @click="clearAll">✕ Limpiar</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePokedexStore } from '@/stores/pokedex';

const store = usePokedexStore();
const filters = store.filters;
const types = computed(() => store.types);
const regions = computed(() => store.regions);

const hasFilters = computed(() => filters.name || filters.type1 || filters.type2 || filters.region);

let debounceTimer;
function onFilter() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    store.applyFilters();
  }, 400);
}

function clearAll() {
  store.clearFilters();
}
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.filter-item {
  flex: 1;
  min-width: 140px;
}

.filter-item .input {
  width: 100%;
}

@media (max-width: 600px) {
  .filter-item {
    min-width: 100%;
  }
}
</style>
