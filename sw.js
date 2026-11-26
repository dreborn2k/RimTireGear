/**
 * Service Worker — Robot Soccer CAD Studio (GitHub Pages PWA)
 * Menyimpan aset aplikasi ke Cache Storage agar tetap berjalan offline.
 */
const CACHE_NAME = 'robot-soccer-cad-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// Tahap Install: Simpan kerangka utama aplikasi ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Tahap Activate: Hapus cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Tahap Fetch: Network-first untuk halaman utama agar pembaruan GitHub langsung masuk,
// serta Cache-first untuk aset pendukung (manifest, font, CDN) agar cepat & jalan offline.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Navigasi halaman (index.html)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkRes) => {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
          return networkRes;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Aset statis lainnya
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      if (cachedRes) return cachedRes;
      return fetch(event.request)
        .then((networkRes) => {
          if (networkRes && (networkRes.status === 200 || networkRes.type === 'opaque')) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkRes;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
