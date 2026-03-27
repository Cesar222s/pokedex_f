<template>
  <div class="stat-bar-container">
    <div class="stat-label">
      <span class="stat-name">{{ label }}</span>
      <span class="stat-value">{{ value }}</span>
    </div>
    <div class="stat-track">
      <div class="stat-fill" :style="{ width: percentage + '%', background: barColor }" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  max: { type: Number, default: 255 }
});

const percentage = computed(() => Math.min(100, (props.value / props.max) * 100));

const barColor = computed(() => {
  const p = percentage.value;
  if (p >= 75) return 'linear-gradient(90deg, hsl(145, 65%, 50%), hsl(145, 65%, 60%))';
  if (p >= 50) return 'linear-gradient(90deg, hsl(55, 80%, 50%), hsl(80, 65%, 55%))';
  if (p >= 25) return 'linear-gradient(90deg, hsl(38, 95%, 55%), hsl(55, 80%, 50%))';
  return 'linear-gradient(90deg, hsl(0, 75%, 55%), hsl(20, 80%, 55%))';
});
</script>

<style scoped>
.stat-bar-container {
  margin-bottom: 0.6rem;
}

.stat-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
  font-size: 0.8rem;
}

.stat-name {
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.stat-value {
  color: var(--text-primary);
  font-weight: 700;
}

.stat-track {
  height: 8px;
  background: var(--bg-card);
  border-radius: 4px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 4px;
  animation: fillBar 0.8s ease forwards;
  transition: width 0.5s ease;
}
</style>
