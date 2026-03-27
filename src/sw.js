import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { 
  StaleWhileRevalidate, 
  CacheFirst, 
  NetworkFirst 
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// ═══════════════════════════════════════════════
// 1. Precache App Shell (Vite Assets)
// ═══════════════════════════════════════════════
precacheAndRoute(self.__WB_MANIFEST);

// ═══════════════════════════════════════════════
// 2. Dynamic Caching & Background Sync
// ═══════════════════════════════════════════════

// - Background Sync Queue for API writes
const bgSyncPlugin = new BackgroundSyncPlugin('api-sync-queue', {
  maxRetentionTime: 24 * 60 // Retry for max 24 Hours
});

// - PokeAPI Data (StaleWhileRevalidate)
registerRoute(
  /^https:\/\/pokeapi\.co\/api\/v2\/.*/,
  new StaleWhileRevalidate({
    cacheName: 'pokeapi-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 60 * 60 * 24 * 30
      })
    ]
  })
);

// - Official Pokémon Sprites (CacheFirst)
registerRoute(
  /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/.*/,
  new CacheFirst({
    cacheName: 'pokemon-sprites',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 60 * 60 * 24 * 365
      })
    ]
  })
);

// - Backend API (NetworkFirst + Background Sync)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      bgSyncPlugin
    ]
  }),
  'POST'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      bgSyncPlugin
    ]
  }),
  'PUT'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      bgSyncPlugin
    ]
  }),
  'DELETE'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] })
    ]
  }),
  'GET'
);

// ═══════════════════════════════════════════════
// 3. Service Worker Lifecycle & Push
// ═══════════════════════════════════════════════

// Cleanup old cache versions
cleanupOutdatedCaches();

// Auto-activate and take control
self.skipWaiting();
import { clientsClaim } from 'workbox-core';
clientsClaim();

// Push Notifications handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.notification.body,
    icon: '/pwa-192x192.svg',
    badge: '/pwa-192x192.svg',
    vibrate: [100, 50, 100],
    data: data.notification.data || {},
    actions: [{ action: 'open', title: 'Ver ahora' }]
  };
  event.waitUntil(self.registration.showNotification(data.notification.title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
