const cacheName = 'anti-adhd-todo';
const staticAssets = [
    './',
    './index.html',
    './style.css',
    './appearance.css',
    './interaction.css',
    './script.js',
    './manifest.json'
];

self.addEventListener('install', async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
});

self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);

    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(req));
    } else {
        event.respondWith(networkFirst(req));
    }
});

async function cacheFirst(req) {
    const cachedResponse = await caches.match(req);
    return cachedResponse || fetch(req);
}

async function networkFirst(req) {
    const cache = await caches.open(cacheName);
    try {
        const res = await fetch(req);
        await cache.put(req, res.clone());
        return res;
    } catch (error) {
        return await cache.match(req);
    }
}