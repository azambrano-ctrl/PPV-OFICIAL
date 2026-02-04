// Service Worker for PPV-OFICIAL
// Desactivado para evitar problemas con streaming y APIs
const CACHE_NAME = 'arena-ppv-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Sin interceptación de fetch para permitir que el navegador maneje todo
self.addEventListener('fetch', (event) => {
    return;
});
