// Service Worker for offline support and caching
// v2 — fixes redirect errors caused by intercepting navigation requests

const CACHE_NAME = 'exercises-app-v3';
const STATIC_CACHE = 'exercises-static-v3';
const IMAGE_CACHE = 'exercises-images-v3';

// Do NOT precache any HTML pages — they require auth and will redirect.
// Static assets and images are populated lazily on first request.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then(() => Promise.resolve()));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== IMAGE_CACHE && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept:
  //   - Non-GET (mutations, auth posts)
  //   - Navigation requests (browser page loads) — these follow auth redirects;
  //     intercepting them causes "redirect mode is not follow" errors
  //   - API routes — auth-sensitive, must never be cached
  //   - Cross-origin requests
  if (
    request.method !== 'GET' ||
    request.mode === 'navigate' ||
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Cache-first for exercise images (GIFs + posters — large, rarely change)
  if (url.pathname.includes('/exercise-')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // If the response is a redirect and the request mode is not 'follow',
          // we must return the response as is or let the browser handle it.
          if (response.redirected && request.redirect !== 'follow') {
            return response;
          }
          if (response && response.status === 200 && response.type === 'basic') {
            caches.open(IMAGE_CACHE).then((c) => c.put(request, response.clone()));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Stale-while-revalidate for compiled Next.js static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.redirected && request.redirect !== 'follow') {
            return response;
          }
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, responseToCache));
          }
          return response;
        });
        return cached || networkFetch;
      }),
    );
    return;
  }

  // All other same-origin GET requests (fonts, icons, manifests): network-only
  // Do not cache — avoids stale auth state leaking through cached responses
});
