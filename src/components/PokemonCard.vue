<template>
  <div class="pokemon-card glass-card" @click="$emit('click')" :style="{ '--card-glow': typeColor }">
    <button v-if="showFavorite" class="fav-btn" @click.stop="$emit('toggle-favorite')"
      :class="{ active: isFavorite }">
      {{ isFavorite ? '❤️' : '🤍' }}
    </button>
    <div class="card-sprite">
      <img :src="pokemon.sprite" :alt="pokemon.name" loading="lazy" />
    </div>
    <div class="card-info">
      <span class="card-id">#{{ String(pokemon.id).padStart(3, '0') }}</span>
      <h3 class="card-name">{{ pokemon.name }}</h3>
      <div class="card-types">
        <span v-for="type in pokemon.types" :key="type" class="type-badge" :class="'type-' + type">
          {{ type }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  pokemon: { type: Object, required: true },
  isFavorite: { type: Boolean, default: false },
  showFavorite: { type: Boolean, default: true }
});

defineEmits(['click', 'toggle-favorite']);

const typeColors = {
  normal: '#A8A878', fire: '#F08030', water: '#6890F0', electric: '#F8D030',
  grass: '#78C850', ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0',
  ground: '#E0C068', flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
  rock: '#B8A038', ghost: '#705898', dragon: '#7038F8', dark: '#705848',
  steel: '#B8B8D0', fairy: '#EE99AC'
};

const typeColor = computed(() => {
  const firstType = props.pokemon.types?.[0];
  return typeColors[firstType] || '#A8A878';
});
</script>

<style scoped>
.pokemon-card {
  position: relative;
  cursor: pointer;
  padding: 1.25rem;
  text-align: center;
  overflow: hidden;
}

.pokemon-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--card-glow);
  opacity: 0;
  transition: opacity 0.3s;
}

.pokemon-card:hover::before {
  opacity: 1;
}

.pokemon-card:hover {
  box-shadow: 0 0 25px color-mix(in srgb, var(--card-glow) 20%, transparent);
}

.fav-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  z-index: 2;
  transition: transform 0.2s;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
}

.fav-btn:hover { transform: scale(1.2); }
.fav-btn.active { animation: pulse 0.3s ease; }

.card-sprite {
  width: 120px;
  height: 120px;
  margin: 0 auto 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-sprite img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s ease;
  image-rendering: auto;
}

.pokemon-card:hover .card-sprite img {
  transform: scale(1.1) translateY(-5px);
}

.card-id {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.card-name {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  text-transform: capitalize;
  margin: 0.25rem 0 0.5rem;
}

.card-types {
  display: flex;
  gap: 0.35rem;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
