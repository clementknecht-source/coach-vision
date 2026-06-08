// ═══ COACH VISION SERVICE WORKER ═══════════════════════════════
const CACHE_NAME = 'coach-vision-v1';
const OFFLINE_URL = '/index.html';

// Files to cache for offline use
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // For API calls (Anthropic), always go to network
  if (url.hostname === 'api.anthropic.com') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For Google Fonts, try network first
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // For everything else: cache first, then network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});

// Background sync for offline actions (future feature)
self.addEventListener('sync', event => {
  console.log('Coach Vision SW: background sync', event.tag);
});

// Push notifications (future feature)
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || 'Coach Vision', {
    body: data.body || 'Notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
  });
});
