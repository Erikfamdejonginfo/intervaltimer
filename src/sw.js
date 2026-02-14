const CACHE_NAME = 'intervaltimer-v7';
const ASSETS = [
    './',
    'index.html',
    'css/style.css',
    'js/app.js',
    'js/timer-engine.js',
    'js/audio.js',
    'js/storage.js',
    'js/schema-editor.js',
    'js/timer-view.js',
    'js/wake-lock.js',
    'js/utils.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/caballoNormal_strip.png',
    'icons/caballoNegro_strip.png'
];

// Pre-cache all assets on install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

// Cache-first strategy
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(event.request);
            })
    );
});
