// Service Worker for Habitropolis
// Handles push notifications and caching

const CACHE_NAME = 'habitropolis-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url || '/',
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Habitropolis', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(event.notification.data || '/');
    })
  );
});
