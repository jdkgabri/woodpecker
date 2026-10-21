// Service worker: offline cache + reminder notifications (Web Push).
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Opening trees and their notes (small, updated with the app): served from cache, refreshed in the background
registerRoute(
  ({ url }) => url.pathname.includes('/openings/trees/') || url.pathname.includes('/openings/notes/'),
  new StaleWhileRevalidate({ cacheName: 'opening-trees', plugins: [new ExpirationPlugin({ maxEntries: 200 })] }),
);

// Lichess puzzle collection (~1.3 MB per theme) and opening puzzles: cached when used
registerRoute(
  ({ url }) => url.pathname.includes('/lichess/') || url.pathname.includes('/openings/puzzles/'),
  new CacheFirst({ cacheName: 'lichess-collection', plugins: [new ExpirationPlugin({ maxEntries: 80 })] }),
);

// Stockfish (~7 MB) is downloaded on first analysis and kept
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
