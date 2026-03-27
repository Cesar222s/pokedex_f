<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <h1>❤️ Mis Favoritos</h1>
        <p class="text-muted">{{ favorites.length }} Pokémon guardados</p>
      </div>

      <LoadingSpinner v-if="loading" message="Cargando favoritos..." />

      <div v-else-if="favorites.length === 0" class="empty-state">
        <div class="emoji">💔</div>
        <h3>Aún no tienes favoritos</h3>
        <p>Explora la PokéDex y pulsa el corazón para añadir Pokémon a tus favoritos</p>
        <router-link to="/pokedex" class="btn btn-primary mt-3">Explorar PokéDex</router-link>
      </div>

      <div v-else class="grid grid-auto stagger">
        <PokemonCard
          v-for="f in favorites"
          :key="f.pokemonId"
          :pokemon="{ id: f.pokemonId, name: f.name, sprite: f.sprite, types: [] }"
          :is-favorite="true"
          @click="$router.push(`/pokemon/${f.pokemonId}`)"
          @toggle-favorite="removeFav(f.pokemonId)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import PokemonCard from '@/components/PokemonCard.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const favoritesStore = useFavoritesStore();
const favorites = computed(() => favoritesStore.favorites);
const loading = computed(() => favoritesStore.loading);

async function removeFav(pokemonId) {
  try {
    await favoritesStore.removeFavorite(pokemonId);
  } catch (err) {
    console.error('Error removing favorite:', err);
  }
}

onMounted(async () => {
  if (favoritesStore.favorites.length === 0) {
    await favoritesStore.fetchFavorites();
  }
});
</script>
