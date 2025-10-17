// Jednoduchý SW: cache-first pro shell, network-first pro HTML navigaci, stale-while-revalidate pro skripty/styly.
const VERSION = 'notebook-v1.0.0';
const STATIC_CACHE = `static-${VERSION}`;
const PRECACHE = [
'./',
'./index.html',
'./styles.css',
'./app.js',
'./manifest.webmanifest',
'./icons/icon-192.png',
'./icons/icon-512.png'
];


self.addEventListener('install', (e)=>{
e.waitUntil(caches.open(STATIC_CACHE).then(c=>c.addAll(PRECACHE)));
self.skipWaiting();
});


self.addEventListener('activate', (e)=>{
e.waitUntil((async()=>{
const keys = await caches.keys();
await Promise.all(keys.filter(k=>k!==STATIC_CACHE).map(k=>caches.delete(k)));
await self.clients.claim();
})());
});


self.addEventListener('fetch', (e)=>{
const req = e.request;
if(req.mode==='navigate'){
e.respondWith((async()=>{
try{ return await fetch(req); } catch{
const cache = await caches.open(STATIC_CACHE);
return await cache.match('./index.html');
}
})());
return;
}
e.respondWith((async()=>{
const cache = await caches.open(STATIC_CACHE);
const cached = await cache.match(req);
const prom = fetch(req).then(res=>{ cache.put(req,res.clone()); return res; }).catch(()=>null);
return cached || prom || fetch(req);
})());
});
