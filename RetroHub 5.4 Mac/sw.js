const CACHE_NAME = 'retrohub-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/db.js',
  '/ui.js',
  'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap'
];

// Install Service Worker & Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell & assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker & Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Network-First falling back to Cache
// Ini ideal untuk marketplace agar barang jualan selalu ter-update secara real-time,
// namun shell aplikasi tetap terbuka walau offline.
self.addEventListener('fetch', (event) => {
  // Hanya tangani request GET dan bypass API requests (/api/)
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // Hanya tangani request HTTP/HTTPS (hindari chrome-extension:// dll.)
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('https://fonts.')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Simpan salinan response terbaru ke cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(event.request);
      })
  );
});
