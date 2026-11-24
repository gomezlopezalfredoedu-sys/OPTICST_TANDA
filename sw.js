/* OPTICST NEXUS · Tanda Visual — Service Worker: cachea el app shell para uso instalable/offline básico */
const CACHE_NAME = 'tanda-visual-v5';
const APP_SHELL = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'fonts/orbitron-latin.woff2',
  'logo.png',
  'logo-nexus.png',
  'logo-tanda-visual.png',
  'logo-yael-circular-mono.png',
  'logo-yael-circular.png',
  'logo-yael-contorno-blanco.png',
  'logo-luna.png',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cachea en caliente solo recursos del mismo origen (nunca el backend de Apps Script).
        if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        // Sin red: si pedían la página principal, sirve el shell cacheado.
        if (event.request.mode === 'navigate') return caches.match('index.html');
        return Promise.reject(new Error('Sin conexión y sin caché para: ' + event.request.url));
      });
    })
  );
});
