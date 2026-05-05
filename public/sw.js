// Service Worker for offline support and aggressive caching
// Helps users on slow/unreliable networks work offline and speeds up repeat visits

const CACHE_NAME = 'exercises-app-v1';
const STATIC_CACHE = 'exercises-static-v1';
const IMAGE_CACHE = 'exercises-images-v1';

// Precache critical assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/explore',
        '/home',
        '/profile',
        '/progress',
        '/workout',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== IMAGE_CACHE && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-first for assets, falling back to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Strategy for images (posters + GIFs): cache-first, fallback to network
  if (url.pathname.includes('/exercise-')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) return response;
            const cache = caches.open(IMAGE_CACHE);
            cache.then((c) => c.put(request, response.clone()));
            return response;
          })
          .catch(() => {
            // Offline fallback for missing images
            return caches.match('/offline-image.png').catch(() => null);
          });
      })
    );
    return;
  }

  // Strategy for pages: network-first, fallback to cache
  if (url.pathname === '/' || url.pathname.includes('/explore') || url.pathname.includes('/home')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const cache = caches.open(CACHE_NAME);
        cache.then((c) => c.put(request, response.clone()));
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
