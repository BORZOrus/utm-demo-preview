// Service worker БАС · Казахстан — офлайн-кэш + свежесть при интернете.
// Версию поднимать при каждой публикации.
const CACHE = 'bas-kz-v8';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const isPage = e.request.mode === 'navigate' ||
    (e.request.destination === 'document') ||
    (e.request.headers.get('accept') || '').includes('text/html');
  if (isPage) {
    // Страница: сначала сеть (свежая версия), офлайн — из кэша.
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html').then((h) => h || caches.match('./')))
    );
    return;
  }
  // Остальное: сначала кэш, потом сеть.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => hit ||
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html')))
  );
});
