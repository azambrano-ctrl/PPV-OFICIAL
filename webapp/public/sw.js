const CACHE_NAME = 'arena-ppv-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(names.map(n => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

// No fetch interception — let browser handle everything
self.addEventListener('fetch', () => {});

// Web Push: show notification when backend sends one
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data = {};
    try { data = event.data.json(); } catch (_) { data = { title: 'Arena Fight Pass', message: event.data.text() }; }

    const { title = 'Arena Fight Pass', message = '', link = '/' } = data;

    event.waitUntil(
        self.registration.showNotification(title, {
            body: message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: { link },
            vibrate: [200, 100, 200],
        })
    );
});

// Open the link when user clicks the notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const link = event.notification.data?.link || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(link);
                    return;
                }
            }
            clients.openWindow(link);
        })
    );
});
