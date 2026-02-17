// ──────────────────────────────────────────────
// CoastalGuard Service Worker — Offline-First
// Caches app shell for instant offline load,
// and handles SOS push notifications for authorities.
// ──────────────────────────────────────────────

const CACHE_NAME = 'coastalguard-v1';
const RUNTIME_CACHE = 'coastalguard-runtime-v1';

// App Shell — core files for offline functionality
const APP_SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Tile server patterns (Leaflet map tiles)
const TILE_PATTERNS = [
    'tile.openstreetmap.org',
    'basemaps.cartocdn.com',
];

// ─── Install ─────────────────────────────────
self.addEventListener('install', (event) => {
    console.log('[SW] Installing CoastalGuard Service Worker v1...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell...');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting())
            .catch((err) => {
                console.error('[SW] Install failed:', err);
            })
    );
});

// ─── Activate ────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// ─── Fetch Strategy ──────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension:// and similar
    if (!url.protocol.startsWith('http')) return;

    // Map tiles: cache-first, helps in intermittent connectivity
    if (TILE_PATTERNS.some(p => url.hostname.includes(p))) {
        event.respondWith(tileCacheFirst(request));
        return;
    }

    // API calls: network-first with cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // App shell / assets: cache-first, then network
    event.respondWith(cacheFirst(request));
});

// ─── Cache-First Strategy ────────────────────
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Return offline fallback for navigation
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
    }
}

// ─── Network-First Strategy ──────────────────
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// ─── Tile Cache Strategy ─────────────────────
async function tileCacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        // Return transparent 1x1 PNG for missing tiles
        return new Response(
            Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), c => c.charCodeAt(0)),
            { headers: { 'Content-Type': 'image/png' } }
        );
    }
}

// ─── Push Notifications (SOS Alerts) ─────────
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    let data = { title: '🚨 SOS Alert', body: 'Emergency distress signal received' };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch {
        // Use default data
    }

    const options = {
        body: data.body || 'A fisherman needs help!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        vibrate: [500, 200, 500, 200, 500],
        tag: data.tag || 'sos-alert',
        renotify: true,
        requireInteraction: true,
        actions: [
            { action: 'acknowledge', title: '✓ Acknowledge', icon: '/icons/icon-72.png' },
            { action: 'view', title: '👁 View on Map', icon: '/icons/icon-72.png' },
        ],
        data: {
            url: data.url || '/authority',
            alertId: data.alertId,
            sosId: data.sosId,
        },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '🚨 SOS Alert', options)
    );
});

// ─── Notification Click Handler ──────────────
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/authority';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url.includes(targetUrl) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open new window
                return clients.openWindow(targetUrl);
            })
    );
});

// ─── Background Sync (future: auto-retry SOS) ─
self.addEventListener('sync', (event) => {
    if (event.tag === 'sos-retry') {
        console.log('[SW] Background sync: retrying queued SOS');
        event.waitUntil(retryCachedSOS());
    }
});

async function retryCachedSOS() {
    // This would read from IndexedDB and attempt send
    // Currently the SOSEngine handles this in-app
    console.log('[SW] Background SOS retry placeholder — handled by SOSEngine');
}
