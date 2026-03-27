<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1>Pokédex</h1>
        <p class="text-muted">{{ totalCount.toLocaleString() }} Pokémon disponibles</p>
      </div>

      <FilterBar />

      <!-- Estado de carga -->
      <LoadingSpinner v-if="loading" message="Cargando Pokémon..." />

      <!-- Resultados de filtros -->
      <template v-else-if="hasFilters">
        <LoadingSpinner v-if="filterLoading" message="Filtrando..." />
        <div v-else-if="filteredList.length === 0" class="empty-state">
          <div class="emoji">🔍</div>
          <h3>No se encontraron resultados</h3>
          <p>Intenta ajustar tus filtros</p>
        </div>
        <div v-else class="grid grid-auto stagger">
          <PokemonCard
            v-for="pokemon in filteredList"
            :key="pokemon.id"
            :pokemon="pokemon"
            :is-favorite="favoritesStore.isFavorite(pokemon.id)"
            @click="goToDetail(pokemon.id)"
            @toggle-favorite="favoritesStore.toggleFavorite(pokemon)"
          />
        </div>
      </template>

      <!-- Default paginated list -->
      <template v-else>
        <div class="grid grid-auto stagger">
          <PokemonCard
            v-for="pokemon in pokemonList"
            :key="pokemon.id"
            :pokemon="pokemon"
            :is-favorite="favoritesStore.isFavorite(pokemon.id)"
            @click="goToDetail(pokemon.id)"
            @toggle-favorite="favoritesStore.toggleFavorite(pokemon)"
          />
        </div>

        <!-- Cargar más -->
        <div class="load-more" ref="loadMoreRef">
          <LoadingSpinner v-if="loadingMore" />
          <button v-else-if="hasMore" class="btn btn-secondary" @click="loadMore">
            Cargar Más Pokémon
          </button>
          <p v-else class="text-muted text-center">¡Todos los {{ totalCount }} Pokémon cargados!</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePokedexStore } from '@/stores/pokedex';
import { useFavoritesStore } from '@/stores/favorites';
import PokemonCard from '@/components/PokemonCard.vue';
import FilterBar from '@/components/FilterBar.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const store = usePokedexStore();
const favoritesStore = useFavoritesStore();

const loading = computed(() => store.loading);
const loadingMore = computed(() => store.loadingMore);
const filterLoading = computed(() => store.filterLoading);
const pokemonList = computed(() => store.pokemonList);
const filteredList = computed(() => store.filteredList);
const totalCount = computed(() => store.totalCount);
const hasFilters = computed(() => {
  const f = store.filters;
  return !!(f.name || f.type1 || f.type2 || f.region);
});
const hasMore = computed(() => store.offset < store.totalCount);

function goToDetail(id) {
  router.push(`/pokemon/${id}`);
}

async function loadMore() {
  await store.fetchPokemonList();
}

const loadMoreRef = ref(null);
let observer;

onMounted(async () => {
  await Promise.all([
    store.pokemonList.length === 0 ? store.fetchPokemonList(true) : Promise.resolve(),
    store.types.length === 0 ? store.fetchTypes() : Promise.resolve(),
    store.regions.length === 0 ? store.fetchRegions() : Promise.resolve(),
    favoritesStore.fetchFavorites()
  ]);

  // Infinite scroll
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loadingMore.value && !hasFilters.value) {
      loadMore();
    }
  }, { threshold: 0.1 });

  if (loadMoreRef.value) observer.observe(loadMoreRef.value);
});
</script>

<style scoped>
.load-more {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}
</style>
