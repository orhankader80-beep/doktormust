"use strict";

// Çevrimdışı destek. Dosyalar önce ağdan istenir (çevrimiçiyken hep güncel sürüm),
// ağ yoksa önbellekten verilir. Dosya listesi değişince CACHE adını da değiştir.
const CACHE = "doktormust-v10-2";

const FILES = [
    "./",
    "index.html",
    "manifest.webmanifest",
    "css/style.css",
    "js/i18n.js",
    "js/lang-en.js",
    "js/core.js",
    "js/icons.js",
    "js/data.js",
    "js/app.js",
    "js/faces.js",
    "js/plus.js",
    "js/robot.js",
    "js/scene.js",
    "js/shift.js",
    "js/custom.js",
    "js/aile.js",
    "ebeveyn/index.html",
    "js/profiles.js",
    "js/music.js",
    "js/patients.js",
    "js/coach.js",
    "js/wards.js",
    "js/story.js",
    "js/games.js",
    "js/games2.js",
    "js/social.js",
    "js/clinic.js",
    "js/extras.js",
    "js/v9.js",
    "js/v10.js",
    "gizlilik.html",
    "js/main.js",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(FILES))
            .then(() => self.skipWaiting())
    );
});

// Yalnızca bu oyunun eski önbellekleri silinir; aynı adresteki başka uygulamalara dokunulmaz.
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys
                .filter(key => key.startsWith("doktormust-") && key !== CACHE)
                .map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET" || new URL(request.url).origin !== location.origin) return;

    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => cache.put(request, copy));
                }

                return response;
            })
            .catch(() => caches.match(request, { ignoreSearch: true })
                .then(hit => hit || caches.match("index.html")))
    );
});