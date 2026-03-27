<template>
  <NavBar v-if="isAuthenticated" />
  
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <div v-if="needRefresh" class="pwa-toast animate-fade-in-up">
    <div class="message">
      Nueva versión disponible. ¿Deseas actualizar?
    </div>
    <div class="actions">
      <button class="btn btn-primary btn-sm" @click="updateServiceWorker()">Actualizar</button>
      <button class="btn btn-secondary btn-sm" @click="close">Cerrar</button>
    </div>
  </div>

  <div v-if="offlineMessage" class="pwa-toast offline-toast animate-fade-in-up" :class="offlineMessage.type">
    <div class="message">
      <span class="icon">{{ offlineMessage.type === 'error' ? '📡' : '✅' }}</span>
      {{ offlineMessage.text }}
    </div>
  </div>

  <div v-if="configuringPrompt" class="pwa-toast configuring-toast animate-fade-in-up">
    <div class="message">
      <span class="icon">📡</span>
      Configurando notificaciones... Por favor, pulsa <b>Permitir</b> si aparece el aviso del navegador.
    </div>
  </div>

  <AppToast />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import NavBar from '@/components/NavBar.vue';
import AppToast from '@/components/Toast.vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useNotificationStore } from '@/stores/notifications';

const authStore = useAuthStore();
const notificationsStore = useNotificationStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const offlineMessage = ref(null);
const syncMessage = ref(false);
const configuringPrompt = ref(false);

const {
  needRefresh,
  updateServiceWorker,
} = useRegisterSW();

const close = () => {
  needRefresh.value = false;
};

const updateOnlineStatus = () => {
  const isOnline = navigator.onLine;
  if (!isOnline) {
    offlineMessage.value = { text: 'Estás navegando sin conexión.', type: 'error' };
  } else {
    offlineMessage.value = { text: 'Conexión restablecida.', type: 'success' };
    setTimeout(() => { offlineMessage.value = null; }, 3000);
  }
};

const handleSyncQueued = () => {
  syncMessage.value = true;
  setTimeout(() => { syncMessage.value = false; }, 5000);
};

// Automatic notification permission request (Triggered by user interaction to avoid browser block)
const attemptSubscription = async () => {
  // Try to subscribe if not subscribed (even if granted, maybe backend session lost it)
  if (!isAuthenticated.value || (Notification.permission === 'denied') || notificationsStore.isSubscribed) {
    return;
  }

  configuringPrompt.value = true;
  console.log('App: Intentando suscripción automática (Click detectado)...');
  
  try {
    await notificationsStore.init();
    await notificationsStore.subscribe();
    console.log('App: Suscripción exitosa.');
  } catch (err) {
    console.log('App: Suscripción automática fallida o cancelada.', err);
  } finally {
    // Hide toast after a delay
    setTimeout(() => { configuringPrompt.value = false; }, 3000);
    // Cleanup listeners
    window.removeEventListener('click', attemptSubscription);
    window.removeEventListener('touchstart', attemptSubscription);
  }
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  window.addEventListener('pwa-sync-queued', handleSyncQueued);
  
  if (isAuthenticated.value && Notification.permission === 'default') {
    window.addEventListener('click', attemptSubscription, { once: true });
    window.addEventListener('touchstart', attemptSubscription, { once: true });
  }
});

watch(isAuthenticated, (val) => {
  if (val && Notification.permission === 'default') {
    window.addEventListener('click', attemptSubscription, { once: true });
    window.addEventListener('touchstart', attemptSubscription, { once: true });
  }
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
  window.removeEventListener('pwa-sync-queued', handleSyncQueued);
  window.removeEventListener('click', attemptSubscription);
  window.removeEventListener('touchstart', attemptSubscription);
});
</script>

<style>
/* No extra styles — all in main.css */
</style>
