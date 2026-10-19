// Service worker: caché sin conexión + notificaciones de recordatorio (Web Push).
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Stockfish (~7 MB) se descarga la primera vez que se analiza y queda guardado
registerRoute(
  ({ url }) => url.pathname.includes('/stockfish/'),
  new CacheFirst({ cacheName: 'stockfish', plugins: [new ExpirationPlugin({ maxEntries: 4 })] }),
);

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Woodpecker', {
    body: d.body || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'woodpecker-reminder',
    renotify: true,
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = wins.find(w => w.url.startsWith(self.registration.scope));
    if (win) return win.focus();
    return self.clients.openWindow(url);
  })());
});
