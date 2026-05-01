const CACHE = 'dayone-v1';
const STATIC = [
  '/static/css/style.css',
  '/static/js/main.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Cache-first for static assets only
  if (url.pathname.startsWith('/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return resp;
      }))
    );
  }
});

self.addEventListener('push', e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: 'DayOne', body: e.data.text(), url: '/' }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'DayOne Guild', {
      body:    data.body  || '',
      icon:    '/static/images/icon-192.png',
      badge:   '/static/images/icon-192.png',
      data:    { url: data.url || '/' },
      vibrate: [200, 100, 200],
      tag:     'dayone-event',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => w.url.includes(self.location.origin));
      if (match) { match.focus(); match.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
