// sw.js - service worker for the installable app.
// Pages, scripts and styles come from the network first, so a new deploy shows up straight away;
// the cached copy is only used when the network fails (offline or a dead connection).
// Libraries from CDNs are versioned, so they are served from the cache and refreshed in the background.
// Firebase data, sign-in and the AI endpoint are never cached.
const CACHE = 'powerprep-v1';

const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/auth/login.html',
    '/auth/signup.html',
    '/auth/style.css',
    '/auth/login.js',
    '/auth/signup.js',
    '/auth/auth-common.js',
    '/auth/firebase-config.js',
    '/shared/theme.css',
    '/shared/ui.js',
    '/shared/pwa.js',
    '/dashboard/index.html',
    '/dashboard/dashboard.css',
    '/dashboard/dashboard.js',
    '/dashboard/data.js',
    '/dashboard/questions.js',
    '/dashboard/progress.js',
    '/dashboard/classes.js',
    '/dashboard/school-data.js',
    '/dashboard/online.js',
    '/dashboard/notes.js',
    '/dashboard/admin.js',
    '/dashboard/official-papers.js',
    '/dashboard/past-papers.js',
    '/dashboard/review-answers.html',
    '/dashboard/review-answers.css',
    '/dashboard/review-answers.js',
    '/assets/favicon.svg',
    '/assets/pattern-blue.svg',
    '/assets/pattern-light.svg',
    '/assets/study-scene.svg',
    '/assets/icons/icon-192.png'
];

const CDN_HOSTS = ['www.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
    // One missing file must not stop the install, so each is cached on its own
    event.waitUntil(caches.open(CACHE).then(cache =>
        Promise.all(APP_SHELL.map(url => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    if (url.origin === self.location.origin) {
        if (url.pathname.startsWith('/api/')) return;
        event.respondWith(networkFirst(request, url));
        return;
    }
    // Only versioned library files from CDNs; Firebase's own API hosts are left alone
    if (CDN_HOSTS.includes(url.hostname) && (url.hostname !== 'www.gstatic.com' || url.pathname.startsWith('/firebasejs/'))) {
        event.respondWith(cacheFirst(request));
    }
});

async function networkFirst(request, url) {
    const cache = await caches.open(CACHE);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(stripSearch(url), response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(stripSearch(url));
        if (cached) return cached;
        // Opening a page offline that was never visited: fall back to the app's home screen
        if (request.mode === 'navigate') {
            const shell = await cache.match(url.pathname.startsWith('/dashboard/') ? '/dashboard/index.html' : '/index.html');
            if (shell) return shell;
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    const refresh = fetch(request).then(response => {
        if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
        return response;
    });
    if (cached) {
        refresh.catch(() => {});
        return cached;
    }
    return refresh;
}

// Pages are cached without their query string (?v=..., ?nc=...), so one copy serves them all
function stripSearch(url) {
    return url.origin + url.pathname;
}
