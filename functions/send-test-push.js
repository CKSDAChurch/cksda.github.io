#!/usr/bin/env node
/*
	send-test-push.js — Send a test push notification to devices marked testDevice: true.

	Only targets Firestore docs where testDevice === true, so it never reaches
	real subscribers. Safe to run at any time during development.

	Requires env var:
	  FIREBASE_SERVICE_ACCOUNT  — full JSON string of the Firebase service-account key

	Usage:
	  node scripts/send-test-push.js
	  node scripts/send-test-push.js --title "Custom title" --body "Custom body"
*/

import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag) => {
	const i = args.indexOf(flag);
	return i !== -1 ? args[i + 1] : null;
};

const title = getArg('--title') || '🛠 CKSDA Test Notification';
const body  = getArg('--body')  || `Test sent at ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' })} ET`;

// ── Validate env var ──────────────────────────────────────────────────────────

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
	console.error('[send-test-push] FIREBASE_SERVICE_ACCOUNT is not set.');
	console.error('  Set it with: $env:FIREBASE_SERVICE_ACCOUNT = (Get-Content path/to/key.json -Raw)');
	process.exit(1);
}

let serviceAccount;
try {
	serviceAccount = JSON.parse(serviceAccountJson);
} catch {
	console.error('[send-test-push] FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
	process.exit(1);
}

// ── Init Firebase ─────────────────────────────────────────────────────────────

initializeApp({ credential: cert(serviceAccount) });
const db           = getFirestore();
const fcmMessaging = getMessaging();

// ── Load test device tokens ───────────────────────────────────────────────────

const snapshot = await db.collection('pushSubscriptions')
	.where('testDevice', '==', true)
	.get();

if (snapshot.empty) {
	console.log('[send-test-push] No documents with testDevice: true found in pushSubscriptions.');
	console.log('  Add the field in Firebase Console → Firestore → pushSubscriptions → your doc → Add field → testDevice (boolean) = true');
	process.exit(0);
}

const tokens = snapshot.docs.map(d => d.id);
console.log(`[send-test-push] Found ${tokens.length} test device(s). Sending...`);

// ── Send ──────────────────────────────────────────────────────────────────────

const message = {
	notification: { title, body },
	data: {
		title,
		body,
		url: 'https://cksda.church/today.html',
	},
	webpush: {
		notification: {
			title,
			body,
			icon: 'https://cksda.church/assets/images/icon-light-192.png',
			badge: 'https://cksda.church/assets/images/favicon.png',
		},
		fcmOptions: { link: 'https://cksda.church/today.html' },
	},
	tokens,
};

try {
	const response = await fcmMessaging.sendEachForMulticast(message)
		.catch(() => fcmMessaging.sendMulticast(message));
	console.log(`[send-test-push] ✅ ${response.successCount}/${tokens.length} delivered.`);

	response.responses.forEach((r, i) => {
		const token = tokens[i].slice(0, 20) + '…';
		if (r.success) {
			console.log(`  ✓ ${token}`);
		} else {
			console.warn(`  ✗ ${token} — ${r.error?.message}`);
		}
	});
} catch (err) {
	console.error('[send-test-push] Send failed:', err);
	process.exit(1);
}
