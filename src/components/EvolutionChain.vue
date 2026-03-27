<template>
  <div class="evolution-chain" v-if="chain && chain.length > 0">
    <div v-for="(evo, i) in chain" :key="evo.name" class="evo-step">
      <div class="evo-arrow" v-if="i > 0">
        <span class="arrow">→</span>
        <span class="evo-trigger" v-if="evo.minLevel">Lv. {{ evo.minLevel }}</span>
        <span class="evo-trigger" v-else-if="evo.item">{{ evo.item }}</span>
        <span class="evo-trigger" v-else-if="evo.trigger">{{ evo.trigger }}</span>
      </div>
      <router-link :to="`/pokemon/${evo.id}`" class="evo-pokemon">
        <img v-if="evo.sprite" :src="evo.sprite" :alt="evo.name" class="evo-sprite" />
        <div v-else class="evo-placeholder">?</div>
        <span class="evo-name">{{ evo.name }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
defineProps({
  chain: { type: Array, default: () => [] }
});
</script>

<style scoped>
.evolution-chain {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 1rem 0;
}

.evo-step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.evo-arrow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  color: var(--text-muted);
}

.arrow {
  font-size: 1.5rem;
  color: var(--accent);
}

.evo-trigger {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: capitalize;
}

.evo-pokemon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.75rem;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid var(--border);
  transition: all 0.2s;
  color: var(--text-primary) !important;
}

.evo-pokemon:hover {
  background: var(--bg-card-hover);
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.evo-sprite {
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.evo-placeholder {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  border-radius: 50%;
}

.evo-name {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

@media (max-width: 500px) {
  .evolution-chain {
    flex-direction: column;
  }
  .arrow {
    transform: rotate(90deg);
  }
}
</style>
