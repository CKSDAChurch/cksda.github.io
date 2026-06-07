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

const CACHE_NAME = 'cksda-v1.7.1';

// Core assets pre-cached on first install.
// Keep this list to critical same-origin assets that are always present.
const PRECACHE_URLS = [
	'/offline.html',
	'/assets/css/main.min.css',
	'/assets/css/lightmode.min.css',
	'/assets/css/darkmode.min.css',
	'/assets/css/menu.min.css',
	'/assets/js/main.min.js',
	'/assets/js/consent.min.js',
	'/assets/js/web-vitals.min.js',
	'/images/logo-light.png',
	'/images/logo-mid.png',
	'/images/favicon.png',
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
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

self.addEventListener('fetch', event => {
	const { request } = event;
	const url = new URL(request.url);

	// Only intercept same-origin requests.
	if (url.origin !== self.location.origin) return;

	if (request.mode === 'navigate') {
		// Page navigations: try the network first; serve offline page if network fails.
		event.respondWith(
			fetch(request).catch(() => caches.match('/offline.html'))
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
