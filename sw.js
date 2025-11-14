const CACHE_NAME = 'albion-tools-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/themes.css', 
  '/css/components.css',
  '/js/app.js',
  '/js/api.js',
  '/js/data/items.js',
  '/js/data/recipes.js',
  '/data/items.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});