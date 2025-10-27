const CACHE_NAME = 'apolloai-v1';
const ASSETS = [
  '/', '/index.html', '/main.js', '/manifest.json', '/resources/hero-ai-education.svg', '/resources/user-avatar.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then(resp => resp || fetch(event.request)));
});
