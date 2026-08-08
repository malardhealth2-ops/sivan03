/* Sivan VIP Taxi - Service Worker
 * Features: offline cache, push notifications, notification click
 */

const CACHE_VERSION = 'sivan-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Core assets to precache for offline use
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
];

// Install: precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] precache partial fail:', err);
      })
    )
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigations/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // Skip cross-origin (e.g. OSM tiles, Nominatim)
  if (url.origin !== self.location.origin) return;

  // *** DEV SAFETY ***
  // Next.js dev server (Turbopack) generates /_next/* URLs with content hashes
  // that change on every recompile. If we cache them and serve stale copies
  // after a recompile, the browser loads chunks that no longer exist on the
  // server → React throws "client-side exception" and the page goes blank.
  // Same for HMR/websocket endpoints. So in dev we must NEVER intercept them.
  const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1' || self.location.port === '3000';
  if (isDev && (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__nextjs'))) {
    return; // let the request go straight to the network, no caching
  }
  // Always skip HMR websocket upgrade regardless of dev/prod
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // API requests: network-first, no cache fallback (always fresh)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigations: network-first, fall back to cached "/" (offline shell)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((m) => m || caches.match('/')))
    );
    return;
  }

  // Static assets: cache-first, then network (and cache runtime)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'سیوان', body: event.data ? event.data.text() : 'اعلان جدید' };
  }

  const title = payload.title || 'تاکسی ویژه سیوان';
  const options = {
    body: payload.body || 'اعلان جدیدی دریافت شد',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    dir: 'rtl',
    lang: 'fa',
    tag: payload.tag || 'sivan-notification',
    renotify: !!payload.renotify,
    data: payload.data || { url: '/' },
    vibrate: [120, 60, 120],
    actions: payload.actions || [
      { action: 'open', title: 'مشاهده' },
      { action: 'close', title: 'بستن' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();
  const targetUrl = (notification.data && notification.data.url) || '/';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if found
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// Message handler (e.g. for SKIP_WAITING from page)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
