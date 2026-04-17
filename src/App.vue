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
  <div v-if="syncMessage" class="pwa-toast sync-toast animate-fade-in-up">
    <div class="message">
      <span class="icon">🔄</span>
      Cambios pendientes enviados a la nube.
    </div>
  </div>

  <!-- Battle accepted toast -->
  <div v-if="battleAcceptedToast" class="pwa-toast battle-toast animate-fade-in-up">
    <div class="message">
      <span class="icon">⚔️</span>
      ¡La batalla ha comenzado! Entrando a la arena...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import NavBar from '@/components/NavBar.vue';
import AppToast from '@/components/Toast.vue';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useNotificationStore } from '@/stores/notifications';
import { useSocialStore } from '@/stores/social';
import socketService from '@/services/socket';

const router = useRouter();
const authStore = useAuthStore();
const notificationsStore = useNotificationStore();
const socialStore = useSocialStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const offlineMessage = ref(null);
const syncMessage = ref(false);
const configuringPrompt = ref(false);
const battleAcceptedToast = ref(false);

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

// ── Global Socket Connection ──
function initGlobalSocket() {
  if (!authStore.token) return;

  socketService.connect(authStore.token);

  // Listen for battle acceptance — auto-navigate to arena
  socketService.onBattleAccepted(({ battleId }) => {
    console.log('App: Battle accepted, navigating to arena:', battleId);
    battleAcceptedToast.value = true;
    setTimeout(() => { battleAcceptedToast.value = false; }, 3000);
    router.push(`/battles/${battleId}`);
  });

  // Listen for incoming challenges — we can use a custom event to refresh BattlesView
  socketService.onChallengeReceived(() => {
    console.log('App: New challenge received');
    window.dispatchEvent(new CustomEvent('battle-challenge-received'));
  });

  // Social real-time updates
  socketService.onFriendRequestAccepted(() => {
    console.log('App: Friend request accepted by someone');
    socialStore.fetchFriends();
    socialStore.fetchRequests();
  });

  socketService.onFriendRequestReceived(() => {
    console.log('App: New friend request received');
    socialStore.fetchRequests();
  });

  socketService.onFriendRemoved(() => {
    console.log('App: A friend removed you');
    socialStore.fetchFriends();
  });
}

function teardownGlobalSocket() {
  socketService.disconnect();
}

// Automatic notification permission request (Triggered by user interaction to avoid browser block)
const attemptSubscription = async () => {
  if (!isAuthenticated.value || (typeof Notification === 'undefined' || Notification.permission === 'denied') || notificationsStore.isSubscribed) {
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
    setTimeout(() => { configuringPrompt.value = false; }, 3000);
    window.removeEventListener('click', attemptSubscription);
    window.removeEventListener('touchstart', attemptSubscription);
  }
};

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  window.addEventListener('pwa-sync-queued', handleSyncQueued);
  
  if (isAuthenticated.value && typeof Notification !== 'undefined' && Notification.permission === 'default') {
    window.addEventListener('click', attemptSubscription, { once: true });
    window.addEventListener('touchstart', attemptSubscription, { once: true });
  }

  // Connect socket globally if already authenticated
  if (isAuthenticated.value) {
    initGlobalSocket();
  }
});

// Watch for auth changes
watch(isAuthenticated, (val) => {
  if (val) {
    initGlobalSocket();
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      window.addEventListener('click', attemptSubscription, { once: true });
      window.addEventListener('touchstart', attemptSubscription, { once: true });
    }
  } else {
    teardownGlobalSocket();
  }
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
  window.removeEventListener('pwa-sync-queued', handleSyncQueued);
  window.removeEventListener('click', attemptSubscription);
  window.removeEventListener('touchstart', attemptSubscription);
  teardownGlobalSocket();
});
</script>

<style>
/* No extra styles — all in main.css */
</style>
