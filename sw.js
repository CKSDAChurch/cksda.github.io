/*
	© CKSDA Church
	cksda.church/

	Service Worker
	Strategies:
	  Navigation (HTML):  network-first  → /offline.html fallback
	  Static assets:      stale-while-revalidate → serve cached immediately,
	                      fetch fresh in background, update cache for next visit
	  Cross-origin:       pass through   (not intercepted)
*/

'use strict';

const CACHE_NAME = 'cksda-v2.0.0-20260614_0427';

// Core assets pre-cached on first install.
// Keep this list to critical same-origin assets that are always present.
const PRECACHE_URLS = [
	'/offline.html',
	'/today.html',
	'/assets/css/main.min.css',
	'/assets/css/lightmode.min.css',
	'/assets/css/darkmode.min.css',
	'/assets/css/menu.min.css',
	'/assets/js/main.min.js',
	'/assets/js/daily.min.js',
	'/assets/js/consent.min.js',
	'/assets/js/web-vitals.min.js',
	'/assets/data/devotional-today.json',
	'/assets/images/logo-light.png',
	'/assets/images/logo-mid.png',
	'/assets/images/favicon.png',
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(async cache => {
			// Don't fail SW install if one optional precache asset is missing.
			await Promise.all(PRECACHE_URLS.map(async url => {
				try {
					await cache.add(url);
				} catch (err) {
					console.warn('[SW] Precache failed:', url, err);
				}
			}));
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', event => {
	// Remove caches from previous service worker versions.
	event.waitUntil(
		caches.keys().then(keys =>
			Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
		)
	);
	self.clients.claim();
});

// ── Push Notifications ─────────────────────────────────────────────────────
// Handles FCM data-only messages (sent by scripts/send-push.js).
// The payload is: { data: { title, body, url, icon } }

self.addEventListener('push', event => {
	if (!event.data) return;
	let payload;
	try { payload = event.data.json(); } catch { return; }

	const d     = (payload && payload.data) || {};
	const title = d.title || 'CKSDA Daily Devotional';
	const body  = d.body  || '';
	const url   = d.url   || '/today.html';
	const icon  = d.icon  || '/assets/images/icon-light-192.png';

	event.waitUntil(
		self.registration.showNotification(title, {
			body,
			icon,
			badge: '/assets/images/favicon.png',
			data:  { url },
		})
	);
});

self.addEventListener('notificationclick', event => {
	event.notification.close();
	const url = (event.notification.data && event.notification.data.url) || '/today.html';
	event.waitUntil(self.clients.openWindow(url));
});

self.addEventListener('fetch', event => {
	const { request } = event;
	const url = new URL(request.url);

	// Only intercept same-origin requests.
	if (url.origin !== self.location.origin) return;

	if (request.mode === 'navigate') {
		// Page navigations: network-first.
		// On failure, try the cached version of this page (ignoring query params like
		// ?source=pwa) so the installed app shows real content offline, then fall back
		// to the offline placeholder as a last resort.
		event.respondWith(
			fetch(request).catch(() =>
				caches.match(request, { ignoreSearch: true }).then(
					cached => cached || caches.match('/offline.html')
				)
			)
		);
		return;
	}

	// Daily JSON data: network-first so the devotional is always today's when online.
	// Falls back to the last cached copy when the device is offline or the fetch fails.
	// Daily JSON data: network-first so content is always fresh when online.
	// Falls back to the last cached copy when the device is offline or fetch fails.
	if (url.pathname === '/assets/data/devotional-today.json' ||
	    url.pathname === '/assets/data/calendar-today.json') {
		event.respondWith(
			caches.open(CACHE_NAME).then(cache =>
				fetch(request)
					.then(response => {
						if (response && response.status === 200) {
							cache.put(request, response.clone());
						}
						return response;
					})
					.catch(() => cache.match(request))
			)
		);
		return;
	}

	// Static assets: stale-while-revalidate.
	// Respond immediately with the cached version (fast), then fetch a fresh copy
	// in the background and update the cache so the *next* visit is up to date.
	event.respondWith(
		caches.open(CACHE_NAME).then(cache =>
			cache.match(request).then(cached => {
				const networkFetch = fetch(request).then(response => {
					if (response && response.status === 200 && response.type === 'basic') {
						cache.put(request, response.clone());
					}
					return response;
				}).catch(() => null);

				// Return cached immediately if available; otherwise wait for network.
				return cached || networkFetch;
			})
		)
	);
});
