const CACHE = "alexis-games-static-v38";
const STATIC = ["/juego", "/styles.css", "/game-overrides.css", "/app.js"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(
    caches.keys().then(keys => Promise.all(keys
        .filter(key => key.startsWith("alexis-games-static-") && key !== CACHE)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
));
self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);
    // La ROM se identifica sin el token: una vez descargada queda disponible
    // para este navegador aunque el siguiente enlace use otro token.
    if (url.pathname.startsWith("/api/roms/")) {
        event.respondWith(caches.open(CACHE).then(async cache => {
            const cached = await cache.match(new Request(url.origin + url.pathname));
            if (cached) return cached;
            const response = await fetch(request);
            if (response.ok && request.method === "GET") await cache.put(new Request(url.origin + url.pathname), response.clone());
            return response;
        }));
        return;
    }
    if (url.pathname.startsWith("/api/")) return;
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok && request.method === "GET") caches.open(CACHE).then(cache => cache.put(request, response.clone()));
        return response;
    })));
});
