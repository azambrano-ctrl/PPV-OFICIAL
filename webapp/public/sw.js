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
    const url = new URL(event.request.url);

    // EXCLUIR APIS Y STREAMS: No interceptar peticiones de API ni segmentos de video
    if (
        url.pathname.includes('/api/') ||
        url.hostname.includes('cloudflarestream.com') ||
        url.hostname.includes('videodelivery.net') ||
        url.hostname.includes('b-cdn.net') ||
        url.hostname.includes('mux.com') ||
        url.pathname.endsWith('.m3u8') ||
        url.pathname.endsWith('.ts')
    ) {
        return; // Deja que el navegador maneje la petición normalmente
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
