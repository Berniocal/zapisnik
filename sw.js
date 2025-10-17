// PWA Zápisník – Service Worker (GitHub Pages /zapisnik/)
const VERSION = 'zapisnik-2025-10-17-v3';
const STATIC_CACHE = `static-${VERSION}`;
const PRECACHE = [
  '/zapisnik/',
  '/zapisnik/index.html',
  '/zapisnik/styles.css',
  '/zapisnik/app.js',
  '/zapisnik/manifest.webmanifest',
  '/zapisnik/icons/icon-192.png',
  '/zapisnik/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function navFallback() {
  const cache = await caches.open(STATIC_CACHE);
  return (await cache.match('/zapisnik/index.html')) ||
         new Response('<!doctype html><h1>Offline</h1>', { headers:{'Content-Type':'text/html; charset=utf-8'} });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(STATIC_CACHE);
        const p = new URL(req.url).pathname;
        if (p === '/zapisnik/' || p.endsWith('/zapisnik/index.html')) {
          cache.put('/zapisnik/index.html', fresh.clone());
        }
        return fresh;
      } catch {
        return navFallback();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    const fetchPromise = fetch(req).then(res => {
      if (res && res.status === 200 && req.method === 'GET') cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || fetchPromise || new Response('', { status: 504 });
  })());
});
