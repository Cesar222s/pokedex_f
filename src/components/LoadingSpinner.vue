<template>
  <div class="loading-spinner">
    <div class="pokeball">
      <div class="pokeball-top"></div>
      <div class="pokeball-center"></div>
      <div class="pokeball-bottom"></div>
    </div>
    <p v-if="message" class="loading-text">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' }
});
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1.5rem;
}

.pokeball {
  width: 48px;
  height: 48px;
  position: relative;
  animation: spin 1s linear infinite;
}

.pokeball-top {
  position: absolute;
  top: 0;
  width: 48px;
  height: 24px;
  background: #ee1515;
  border-radius: 24px 24px 0 0;
  border: 3px solid #333;
  border-bottom: none;
}

.pokeball-bottom {
  position: absolute;
  bottom: 0;
  width: 48px;
  height: 24px;
  background: white;
  border-radius: 0 0 24px 24px;
  border: 3px solid #333;
  border-top: none;
}

.pokeball-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  border: 3px solid #333;
  z-index: 2;
}

.pokeball-center::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -18px;
  right: -18px;
  height: 3px;
  background: #333;
  transform: translateY(-50%);
  z-index: -1;
}

.loading-text {
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
