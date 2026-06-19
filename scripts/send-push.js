#!/usr/bin/env node
/*
	© CKSDA Church
	cksda.church/

	Send FCM push notification to all subscribed devices.

	Reads:
	  - assets/data/devotional-today.json  (verse + reference for notification body)
	  - Firestore collection "pushSubscriptions"  (registered device tokens)

	Requires env var:
	  FIREBASE_SERVICE_ACCOUNT  — full JSON string of the Firebase service-account key

	Exit codes:
	  0  always (missing key / bad JSON / empty subscribers → log + skip gracefully)
	  1  only on unexpected runtime errors
*/

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

// ── Validate env var ──────────────────────────────────────────────────────────

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
	console.warn('[send-push] FIREBASE_SERVICE_ACCOUNT is not set. Skipping push notifications.');
	process.exit(0);
}

let serviceAccount;
try {
	serviceAccount = JSON.parse(serviceAccountJson);
} catch {
	console.warn('[send-push] FIREBASE_SERVICE_ACCOUNT is not valid JSON. Skipping push notifications.');
	process.exit(0);
}

// ── Load today's devotional ───────────────────────────────────────────────────

let verse     = '';
let reference = '';
try {
	const data = JSON.parse(readFileSync('assets/data/devotional-today.json', 'utf8'));
	verse     = String(data.verse     || '').replace(/[\u201c\u201d]/g, '"').trim();
	reference = String(data.reference || '').trim();
} catch {
	console.warn('[send-push] Could not read devotional-today.json. Skipping push notifications.');
	process.exit(0);
}

if (!verse || !reference) {
	console.warn('[send-push] Devotional JSON is missing verse or reference. Skipping push notifications.');
	process.exit(0);
}

// Truncate verse to a readable notification length.
const MAX_BODY    = 120;
const bodyVerse   = verse.length > MAX_BODY
	? verse.slice(0, MAX_BODY).replace(/\s+\S*$/, '') + '\u2026'
	: verse;
const notifBody   = `${bodyVerse} \u2014 ${reference}`;

// ── Firebase Admin init ───────────────────────────────────────────────────────

initializeApp({ credential: cert(serviceAccount) });
const db           = getFirestore();
const fcmMessaging = getMessaging();

// ── Load subscriber tokens ────────────────────────────────────────────────────

const snapshot = await db.collection('pushSubscriptions').get();
if (snapshot.empty) {
	console.log('[send-push] No push subscribers. Nothing to send.');
	process.exit(0);
}

const tokens = snapshot.docs.map(d => d.id);
console.log(`[send-push] Sending push to ${tokens.length} subscriber(s)\u2026`);

// ── Send in batches (FCM multicast limit = 500) ───────────────────────────────

const BATCH_SIZE  = 500;
let successCount  = 0;
let failureCount  = 0;
const staleTokens = [];

for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
	const batch    = tokens.slice(i, i + BATCH_SIZE);
	const response = await fcmMessaging.sendEachForMulticast({
		tokens: batch,
		// Use the "data" payload so our SW push handler controls the notification.
		data: {
			title: 'CKSDA Daily Devotional',
			body:  notifBody,
			url:   'https://cksda.church/today.html',
			icon:  'https://cksda.church/assets/images/icon-light-192.png',
		},
		webpush: {
			headers: {
				Urgency: 'normal',
				TTL:     '86400',   // 24 h — keep in FCM queue if device is offline
			},
		},
	});

	successCount += response.successCount;
	failureCount += response.failureCount;

	// Collect tokens that FCM says are no longer valid.
	response.responses.forEach((resp, idx) => {
		if (!resp.success && resp.error) {
			const code = resp.error.code || '';
			if (
				code === 'messaging/registration-token-not-registered' ||
				code === 'messaging/invalid-registration-token'
			) {
				staleTokens.push(batch[idx]);
			}
		}
	});
}

console.log(`[send-push] Results: ${successCount} sent, ${failureCount} failed.`);

// ── Remove stale tokens from Firestore ───────────────────────────────────────

if (staleTokens.length > 0) {
	console.log(`[send-push] Removing ${staleTokens.length} stale token(s) from Firestore\u2026`);
	const writeBatch = db.batch();
	staleTokens.forEach(token =>
		writeBatch.delete(db.collection('pushSubscriptions').doc(token))
	);
	await writeBatch.commit();
	console.log('[send-push] Stale tokens removed.');
}
