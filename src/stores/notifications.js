import { defineStore } from 'pinia';
import api from '@/services/api';

const VAPID_PUBLIC_KEY = 'BPE51Br7BNW5BlSBv2jHBH0xkXoE6ms36ARUsBWB9CfEgAOuFxj8XeoxmCmfhq9FfA9HbAfxYlunkoRmLdOTpJU';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    isSubscribed: false,
    loading: false,
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'default'
  }),

  actions: {
    async init() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return;
      }

      this.permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      if (this.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        this.isSubscribed = !!subscription;
      }
    },

    async subscribe() {
      this.loading = true;
      console.log('Push: Iniciando proceso de suscripción...');
      try {
        if (typeof Notification === 'undefined') {
          throw new Error('Notificaciones no soportadas en este navegador');
        }
        const permission = await Notification.requestPermission();
        this.permission = permission;
        console.log('Push: Permiso de notificación:', permission);

        if (permission !== 'granted') {
          throw new Error('Permiso denegado para notificaciones');
        }

        console.log('Push: Esperando al Service Worker...');
        const registration = await navigator.serviceWorker.ready;
        console.log('Push: Service Worker listo en:', registration.scope);

        console.log('Push: Solicitando suscripción al Push Manager...');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        console.log('Push: Suscripción obtenida con éxito, enviando al servidor...');
        await api.post('/notifications/subscribe', subscription);
        
        this.isSubscribed = true;
        console.log('Push: Proceso de suscripción completado con éxito.');
        return true;
      } catch (err) {
        console.error('Push: Error crítico en suscripción:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async unsubscribe() {
      this.loading = true;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          // Optional: Notify backend to remove
          await api.post('/notifications/subscribe', null);
        }
        this.isSubscribed = false;
      } catch (err) {
        console.error('Error unsubscribing:', err);
      } finally {
        this.loading = false;
      }
    }
  }
});
