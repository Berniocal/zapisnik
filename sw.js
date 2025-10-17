// PWA Zápisník – Service Worker (GitHub Pages /zapisnik/)
// - cache-first pro shell
// - network-first pro HTML navigaci s offline fallbackem
// - stale-while-revalidate pro ostatní soubory
const VERSION = 'zapisnik-2025-10-17-v2';
const STATIC_CACHE = `static-${VERSION}`;

const PRECACHE = [
  '/zapisnik/',
  '/zapisnik/index.html',
  '/zapisnik/styles.css',
  '/zapisnik/app.js',
  '/zapisnik/manifest.webmanifest',
  // Ikony (přidej další, pokud existují)
  '/zapisnik/icons/icon-192.png',
  '/zapisnik/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Pomocná funkce: navigační fallback na index.html
async function navFallback() {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match('/zapisnik/index.html');
  if (cached) return cached;
  // Poslední záchrana: prázdná odpověď
  return new Response('<!doctype html><title>Offline</title><h1>Jste offline</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' }});
}

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // HTML navigace: network-first s fallbackem
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        // volitelně: uložit poslední index.html
        const cache = await caches.open(STATIC_CACHE);
        if (new URL(req.url).pathname === '/zapisnik/' || new URL(req.url).pathname.endsWith('/zapisnik/index.html')) {
          cache.put('/zapisnik/index.html', fresh.clone());
        }
        return fresh;
      } catch {
        return navFallback();
      }
    })());
    return;
  }

  // Ostatní soubory: stale-while-revalidate
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req)
      .then((res) => {
        // Nepřekládej non-OK odpovědi do cache
        if (res && res.status === 200 && (req.method === 'GET')) {
          cache.put(req, res.clone());
        }
        return res;
      })
      .catch(() => null);

    return cached || fetchPromise || new Response('', { status: 504 });
  })());
});
