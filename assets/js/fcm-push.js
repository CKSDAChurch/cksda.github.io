// @ts-check
/*
	© CKSDA Church
	cksda.church/

	FCM Push Notifications — opt-in, time preferences, and token registration.
	Bundled by esbuild (bundle: true); loaded as <script type="module"> on today.html.

	Delivery is handled entirely by Firebase Cloud Functions (functions/index.js).
	This file only manages the browser-side: permission request, FCM token
	registration in Firestore, and user preference UI.

	Firestore schema — pushSubscriptions/{fcmToken}:
	  platform:         'web'
	  lastSeen:         Timestamp
	  devotionalHour:   number   (0–23, America/New_York)
	  devotionalMinute: number   (0 | 15 | 30 | 45)
	  sabbathReminder:  boolean  (default true)
*/

import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const FIREBASE_CONFIG = {
	apiKey:            'AIzaSyCM8uA5_c2UBMiaw-fIkpXHlZtoxzvc7fY',
	authDomain:        'cksda-website-eb944.firebaseapp.com',
	projectId:         'cksda-website-eb944',
	storageBucket:     'cksda-website-eb944.firebasestorage.app',
	messagingSenderId: '759028758542',
	appId:             '1:759028758542:web:ab019c8bcd27815d80e45f',
};

const VAPID_KEY     = 'BAiNg9ul1tZMkowIUvqydNsJ4yJJFo8g8z4y3tK5obj9Y3spi9BLj-H-Na8_fLFVUSGnPuc_PBo8osgOPQG-RKA';
const DISMISSED_KEY = 'cksda-push-dismissed';
const DEFAULT_HOUR   = 6;
const DEFAULT_MINUTE = 30;

function isStandalonePwaContext() {
	return (
		(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
		(window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
		(window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches) ||
		/** @type {{ standalone?: boolean }} */(navigator).standalone === true ||
		document.referrer.startsWith('android-app://')
	);
}

// ── Time picker helpers ───────────────────────────────────────────────────────

/**
 * Build <option> markup for a time-of-day select (15-min increments, Eastern).
 * @param {number} selHour
 * @param {number} selMinute
 * @returns {string}
 */
function buildTimeOptions(selHour = DEFAULT_HOUR, selMinute = DEFAULT_MINUTE) {
	const opts = [];
	for (let h = 0; h < 24; h++) {
		for (const m of [0, 15, 30, 45]) {
			const period = h < 12 ? 'AM' : 'PM';
			const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
			const dm = String(m).padStart(2, '0');
			const sel = h === selHour && m === selMinute ? ' selected' : '';
			opts.push(`<option value="${h}:${m}"${sel}>${dh}:${dm} ${period} ET</option>`);
		}
	}
	return opts.join('');
}

/** @param {string} val — "H:M" @returns {{ hour: number, minute: number }} */
function parseTimeValue(val) {
	const [h, m] = val.split(':').map(Number);
	return { hour: h || 0, minute: m || 0 };
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

/**
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} token
 * @param {{ devotionalHour?: number, devotionalMinute?: number, sabbathReminder?: boolean }} [prefs]
 */
async function saveToken(db, token, prefs = {}) {
	await setDoc(doc(db, 'pushSubscriptions', token), {
		platform:         'web',
		lastSeen:         serverTimestamp(),
		devotionalHour:   prefs.devotionalHour   ?? DEFAULT_HOUR,
		devotionalMinute: prefs.devotionalMinute ?? DEFAULT_MINUTE,
		sabbathReminder:  prefs.sabbathReminder  ?? true,
	}, { merge: true });
}

/**
 * Read saved preferences, falling back to defaults if the doc doesn't exist.
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} token
 * @returns {Promise<{ devotionalHour: number, devotionalMinute: number, sabbathReminder: boolean }>}
 */
async function loadPrefs(db, token) {
	try {
		const snap = await getDoc(doc(db, 'pushSubscriptions', token));
		if (snap.exists()) {
			const d = snap.data();
			return {
				devotionalHour:   typeof d.devotionalHour   === 'number'  ? d.devotionalHour   : DEFAULT_HOUR,
				devotionalMinute: typeof d.devotionalMinute === 'number'  ? d.devotionalMinute : DEFAULT_MINUTE,
				sabbathReminder:  typeof d.sabbathReminder  === 'boolean' ? d.sabbathReminder  : true,
			};
		}
	} catch { /* fall through to defaults */ }
	return { devotionalHour: DEFAULT_HOUR, devotionalMinute: DEFAULT_MINUTE, sabbathReminder: true };
}

// ── FCM registration ──────────────────────────────────────────────────────────

/**
 * Get (or refresh) the FCM token and write preferences to Firestore.
 * @param {import('firebase/messaging').Messaging} messaging
 * @param {import('firebase/firestore').Firestore} db
 * @param {{ devotionalHour?: number, devotionalMinute?: number, sabbathReminder?: boolean }} [prefs]
 * @returns {Promise<string|null>}
 */
async function registerPush(messaging, db, prefs = {}) {
	const swReg = await navigator.serviceWorker.getRegistration('/sw.js');
	if (!swReg) {
		console.warn('[CKSDA Push] Service worker not found.');
		return null;
	}
	try {
		const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
		if (token) await saveToken(db, token, prefs);
		return token || null;
	} catch (err) {
		console.warn('[CKSDA Push] Token registration failed:', err);
		return null;
	}
}

// ── Settings card (shown when already opted in) ───────────────────────────────

/**
 * Populate and reveal the #push-settings-card section on today.html.
 * @param {import('firebase/messaging').Messaging} messaging
 * @param {import('firebase/firestore').Firestore} db
 * @param {string} token
 */
async function initSettingsCard(messaging, db, token) {
	const card = document.getElementById('push-settings-card');
	if (!card) return;

	const prefs         = await loadPrefs(db, token);
	const timeSelect    = /** @type {HTMLSelectElement|null} */(card.querySelector('#push-time-select'));
	const sabbathToggle = /** @type {HTMLInputElement|null}  */(card.querySelector('#push-sabbath-toggle'));
	const saveBtn       = /** @type {HTMLButtonElement|null} */(card.querySelector('#push-settings-save'));
	const feedback      = card.querySelector('.push-settings__feedback');

	if (timeSelect)    timeSelect.innerHTML = buildTimeOptions(prefs.devotionalHour, prefs.devotionalMinute);
	if (sabbathToggle) sabbathToggle.checked = prefs.sabbathReminder;
	card.hidden = false;

	saveBtn?.addEventListener('click', async () => {
		if (!saveBtn) return;
		saveBtn.disabled    = true;
		saveBtn.textContent = 'Saving\u2026';

		const { hour, minute } = parseTimeValue(timeSelect?.value || `${DEFAULT_HOUR}:${DEFAULT_MINUTE}`);
		await registerPush(messaging, db, {
			devotionalHour:   hour,
			devotionalMinute: minute,
			sabbathReminder:  sabbathToggle?.checked ?? true,
		});

		saveBtn.disabled    = false;
		saveBtn.textContent = 'Save preferences';
		if (feedback) {
			feedback.textContent = 'Saved!';
			setTimeout(() => { if (feedback) feedback.textContent = ''; }, 2500);
		}
	});
}

// ── Opt-in banner (shown when permission not yet requested) ───────────────────

/**
 * @param {import('firebase/messaging').Messaging} messaging
 * @param {import('firebase/firestore').Firestore} db
 */
function showOptInBanner(messaging, db) {
	if (localStorage.getItem(DISMISSED_KEY)) return;

	const banner = document.createElement('div');
	banner.id        = 'push-opt-in';
	banner.className = 'push-opt-in';
	banner.setAttribute('role', 'region');
	banner.setAttribute('aria-label', 'Enable push notifications');
	banner.innerHTML = `
		<div class="push-opt-in__top">
			<span class="push-opt-in__icon" aria-hidden="true">&#x1F514;</span>
			<p class="push-opt-in__text">Get the daily devotional as a morning notification.</p>
			<button class="push-opt-in__dismiss" id="push-dismiss-btn" type="button" aria-label="Dismiss">&#x2715;</button>
		</div>
		<div class="push-opt-in__row">
			<label class="push-opt-in__label" for="push-banner-time">Notify me at</label>
			<select class="push-opt-in__select" id="push-banner-time">${buildTimeOptions()}</select>
		</div>
		<div class="push-opt-in__row">
			<label class="push-opt-in__label" for="push-banner-sabbath">
				<input type="checkbox" id="push-banner-sabbath" checked />
				Also remind me 1&thinsp;hr before Sabbath begins
			</label>
		</div>
		<div class="push-opt-in__actions">
			<button class="push-opt-in__enable" id="push-enable-btn" type="button">Enable notifications</button>
		</div>
	`;

	const main = document.getElementById('main-content');
	if (main instanceof HTMLElement) {
		main.prepend(banner);
	} else {
		const footer = document.querySelector('.today-footer');
		if (footer) footer.before(banner);
		else document.body.appendChild(banner);
	}

	const enableBtn     = /** @type {HTMLButtonElement} */(document.getElementById('push-enable-btn'));
	const dismissBtn    = /** @type {HTMLButtonElement} */(document.getElementById('push-dismiss-btn'));
	const timeSelect    = /** @type {HTMLSelectElement} */(document.getElementById('push-banner-time'));
	const sabbathToggle = /** @type {HTMLInputElement}  */(document.getElementById('push-banner-sabbath'));

	enableBtn.addEventListener('click', async () => {
		enableBtn.disabled    = true;
		enableBtn.textContent = 'Enabling\u2026';

		const permission = await Notification.requestPermission();
		localStorage.setItem(DISMISSED_KEY, '1');

		if (permission === 'granted') {
			const { hour, minute } = parseTimeValue(timeSelect.value);
			const token = await registerPush(messaging, db, {
				devotionalHour:   hour,
				devotionalMinute: minute,
				sabbathReminder:  sabbathToggle.checked,
			});
			banner.innerHTML = `
				<div class="push-opt-in__top push-opt-in__top--success">
					<span class="push-opt-in__icon" aria-hidden="true">&#x2705;</span>
					<p class="push-opt-in__text">Notifications enabled! You\u2019ll receive the devotional at the time you chose.</p>
				</div>
			`;
			setTimeout(() => {
				banner.style.opacity    = '0';
				banner.style.transition = 'opacity 0.4s ease';
				setTimeout(() => banner.remove(), 420);
			}, 3500);
			if (token) initSettingsCard(messaging, db, token);
		} else {
			banner.remove();
		}
	});

	dismissBtn.addEventListener('click', () => {
		localStorage.setItem(DISMISSED_KEY, '1');
		banner.remove();
	});
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function initPushNotifications() {
	if (
		!('Notification'  in window) ||
		!('serviceWorker' in navigator) ||
		!('PushManager'   in window)
	) return;

	// Only show push UX inside the installed PWA, not in regular browser tabs.
	if (!isStandalonePwaContext()) return;

	const app       = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
	const messaging = getMessaging(app);
	const db        = getFirestore(app);

	const permission = Notification.permission;

	if (permission === 'granted') {
		// Already opted in — silently refresh the token and show the settings card.
		const token = await registerPush(messaging, db);
		if (token) await initSettingsCard(messaging, db, token);
	} else if (permission === 'default') {
		setTimeout(() => showOptInBanner(messaging, db), 2000);
	}
	// 'denied' → respect the user's choice; do nothing.
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => { initPushNotifications(); });
} else {
	initPushNotifications();
}
