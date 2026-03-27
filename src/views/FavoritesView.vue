<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1>❤️ Mis Favoritos</h1>
        <p class="text-muted">{{ favoriteIds.length }} Pokémon guardados</p>
      </div>

      <LoadingSpinner v-if="loading" message="Cargando favoritos..." />

      <div v-else-if="favoriteIds.length === 0" class="empty-state">
        <div class="emoji">💔</div>
        <h3>Aún no tienes favoritos</h3>
        <p>Explora la PokéDex y pulsa el corazón para añadir Pokémon a tus favoritos</p>
        <router-link to="/pokedex" class="btn btn-primary mt-3">Explorar PokéDex</router-link>
      </div>

      <div v-else class="grid grid-auto stagger">
        <PokemonCard
          v-for="pokemon in favoritePokemon"
          :key="pokemon.id"
          :pokemon="pokemon"
          :is-favorite="true"
          @click="$router.push(`/pokemon/${pokemon.id}`)"
          @toggle-favorite="removeFav(pokemon.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import api from '@/services/api';
import PokemonCard from '@/components/PokemonCard.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const favoritesStore = useFavoritesStore();
const favoriteIds = computed(() => favoritesStore.favoriteIds);
const loading = ref(false);
const favoritePokemon = ref([]);

async function loadFavoritePokemon() {
  if (favoriteIds.value.length === 0) {
    favoritePokemon.value = [];
    return;
  }
  
  loading.value = true;
  try {
    const results = await Promise.all(
      favoriteIds.value.map(async (id) => {
        try {
          const { data } = await api.get(`/pokemon/${id}`);
          return {
            id: data.id,
            name: data.name,
            sprite: data.sprites?.official_artwork || data.sprites?.front_default,
            types: data.types?.map(t => t.name) || []
          };
        } catch (cardErr) {
          console.error(`Error loading favorite ${id}:`, cardErr);
          return null;
        }
      })
    );
    favoritePokemon.value = results.filter(Boolean);
  } catch (err) {
    console.error('Error loading favorites:', err);
  } finally {
    loading.value = false;
  }
}

async function removeFav(pokemonId) {
  try {
    await favoritesStore.removeFavorite(pokemonId);
    // The watch will trigger the reload, but we can also filter locally for instant feedback
    favoritePokemon.value = favoritePokemon.value.filter(p => p.id !== pokemonId);
  } catch (err) {
    console.error('Error removing favorite:', err);
  }
}

// Keep the list in sync with the store (e.g. if removed from detail view)
watch(favoriteIds, () => {
  if (favoritePokemon.value.length !== favoriteIds.value.length) {
    loadFavoritePokemon();
  }
}, { deep: true });

onMounted(async () => {
  if (favoritesStore.favoriteIds.length === 0) {
    await favoritesStore.fetchFavorites();
  }
  await loadFavoritePokemon();
});
</script>
