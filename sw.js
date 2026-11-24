// Ape Pin Potha Service Worker (v182-live)
// Strategy: Network-First for HTML, JS, CSS to guarantee instant updates; Stale-While-Revalidate for media assets
const CACHE_NAME = 'pin-potha-cache-v182-live';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css?v=182',
  './js/app.js?v=182',
  './js/storage.js?v=182',
  './js/imgbb-service.js?v=68',
  './js/aranya-data.js',
  './js/dhamma-library-data.js',
  './js/spiritual-avatars.js?v=147',
  './js/security.js?v=160',
  './js/algorithm.js?v=147',
  './js/sound.js?v=66',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/og-banner.jpg',
  './assets/official-welcome-banner.webp',
  './assets/sangha-frame.webp',
  './assets/artisan-banner-buddha.webp',
  './assets/Watermark.png',
  './assets/banner.webp',
  './assets/nexiapro-logo.webp'
];

// Install: Cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
});

// Message listener for skip waiting and badge synchronization
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'SET_BADGE') {
    const count = parseInt(event.data.count || 0, 10);
    try {
      if ('setAppBadge' in self.navigator) {
        if (count > 0) {
          self.navigator.setAppBadge(count).catch(() => {});
        } else {
          self.navigator.clearAppBadge().catch(() => {});
        }
      }
    } catch (e) {}
  }
});

// Activate: Clean up old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Strategy:
// 1. App Shell (HTML, JS, CSS) -> Network-First (Ensures instant live updates without cache delay)
// 2. Firebase / Google APIs / Media -> Direct Network (Never cache dynamic cloud databases)
// 3. Static Media Assets -> Stale-While-Revalidate (Fast offline + fresh updates in background)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Bypass non-GET requests and cloud services (Firebase, YouTube, etc.)
  if (request.method !== 'GET') return;
  if (
    url.pathname.includes('google') ||
    url.pathname.includes('admin.html') ||
    url.pathname.includes('admin.js') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('ytimg.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('cloudflare.com')
  ) {
    return;
  }

  // App Shell (HTML, JS, CSS): Stale-While-Revalidate with instant cache match
  const isAppShell =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/';

  if (isAppShell) {
    // True Network-First for App Shell: fetch fresh assets from network, fallback to cache if offline
    event.respondWith(
      fetch((request.mode === 'navigate') ? request.url : request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((res) => {
            return res || (request.mode === 'navigate' ? caches.match('./index.html') : null);
          });
        })
    );
    return;
  }

  // Static Media Assets (Images, Icons, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Notification click listener: Focus open window or open new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

