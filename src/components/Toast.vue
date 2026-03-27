<template>
  <Transition name="toast">
    <div v-if="visible" class="app-toast" :class="type">
      <div class="toast-content">
        <span class="toast-icon">{{ icon }}</span>
        <span class="toast-message">{{ message }}</span>
      </div>
      <div class="toast-progress"></div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref('success');
const icon = ref('✨');

let timeout;

function showToast(event) {
  clearTimeout(timeout);
  message.value = event.detail.message;
  type.value = event.detail.type || 'success';
  icon.value = type.value === 'success' ? '❤️' : 'ℹ️';
  visible.value = true;

  timeout = setTimeout(() => {
    visible.value = false;
  }, 3000);
}

onMounted(() => {
  window.addEventListener('app-toast', showToast);
});

onUnmounted(() => {
  window.removeEventListener('app-toast', showToast);
  clearTimeout(timeout);
});
</script>

<style scoped>
.app-toast {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 280px;
  max-width: 90vw;
  padding: 1rem 1.25rem;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.app-toast.success {
  border-left: 4px solid var(--accent);
}

.app-toast.info {
  border-left: 4px solid var(--text-muted);
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  color: #fff;
  font-size: 0.95rem;
  font-weight: 500;
  font-family: var(--font-heading);
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  width: 100%;
  animation: progress 3s linear forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}
</style>
