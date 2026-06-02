/*
	© CKSDA Church
	cksda.church/

	Service Worker
	Strategies:
	  Navigation (HTML):  network-first → /offline.html fallback
	  Daily verse JSON:   network-first → cached JSON fallback
	  Static assets:      cache-first   → populate cache on first fetch
	  Cross-origin:       pass through  (not intercepted)
*/

'use strict';

const CACHE_NAME = 'cksda-v2';

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

	if (url.pathname === '/assets/programs/verse-today.json') {
		// Always try to refresh the daily verse; fall back to cached JSON when offline.
		event.respondWith(
			fetch(request)
				.then(response => {
					if (response && response.status === 200 && response.type === 'basic') {
						const clone = response.clone();
						caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
					}
					return response;
				})
				.catch(() =>
					caches.match(request).then(cached =>
						cached || new Response('{}', {
							status: 503,
							headers: { 'Content-Type': 'application/json' },
						})
					)
				)
		);
		return;
	}

	// Static assets: serve from cache; populate cache on first network fetch.
	event.respondWith(
		caches.match(request).then(cached => {
			if (cached) return cached;
			return fetch(request).then(response => {
				if (!response || response.status !== 200 || response.type !== 'basic') {
					return response;
				}
				const clone = response.clone();
				caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
				return response;
			});
		})
	);
});
