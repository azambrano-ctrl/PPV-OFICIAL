const CACHE_NAME = 'arena-ppv-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Solo interceptamos recursos estáticos definidos en ASSETS_TO_CACHE
    const url = new URL(event.request.url);
    const isStaticAsset = ASSETS_TO_CACHE.some(asset => url.pathname === asset || (asset === '/' && url.pathname === '/'));

    if (!isStaticAsset) {
        return; // Passthrough total para todo lo demás (APIs, Video, Sockets, etc)
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(err => {
                console.warn('[SW] Fetch failed for:', event.request.url, err);
                return undefined;
            });
        })
    );
});
