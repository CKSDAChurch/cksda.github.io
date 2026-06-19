/*
	© CKSDA Church
	cksda.church/

	Firebase Cloud Functions — push notification delivery.

	scheduleDevotionalPush
	  Runs every 15 minutes. Queries pushSubscriptions for subscribers whose
	  preferred Eastern-time slot matches the current 15-minute window, then
	  sends them today's devotional verse as a push notification.

	scheduleSabbathReminder
	  Runs every 15 minutes. When the current time falls in the 50–65 minute
	  window before sabbathStartUtc (from the live devotional JSON), sends a
	  "Sabbath begins in 1 hour" push to all opted-in subscribers. A Firestore
	  sentinel prevents double-sending within the same day.
*/

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp();

const SITE_URL = 'https://cksda.church';
const ICON_URL = `${SITE_URL}/assets/images/icon-light-192.png`;
const BATCH_SIZE = 500;

// ── Shared helpers ────────────────────────────────────────────────────────────

/** @returns {{ hour: number, minute: number, year: string, month: string, day: string }} */
function getEasternTimeParts(now = new Date()) {
	const fmt = new Intl.DateTimeFormat('en-US', {
		timeZone: 'America/New_York',
		year: 'numeric', month: '2-digit', day: '2-digit',
		hour: '2-digit', minute: '2-digit', hour12: false,
	});
	const parts = fmt.formatToParts(now).reduce((acc, p) => {
		if (p.type !== 'literal') acc[p.type] = p.value;
		return acc;
	}, {});
	return {
		hour:   parseInt(parts.hour,   10),
		minute: parseInt(parts.minute, 10),
		year:   parts.year,
		month:  parts.month,
		day:    parts.day,
	};
}

async function fetchDevotional() {
	const res = await fetch(`${SITE_URL}/assets/data/devotional-today.json`);
	if (!res.ok) throw new Error(`Devotional fetch failed: ${res.status}`);
	return res.json();
}

/**
 * Send FCM data-only messages in batches of 500.
 * Returns stale tokens to be cleaned up.
 * @param {string[]} tokens
 * @param {Record<string, string>} data
 */
async function sendToTokens(tokens, data) {
	const messaging = getMessaging();
	let successCount = 0;
	const staleTokens = [];

	for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
		const batch = tokens.slice(i, i + BATCH_SIZE);
		const res = await messaging.sendEachForMulticast({
			tokens: batch,
			data,
			webpush: { headers: { Urgency: 'normal', TTL: '86400' } },
		});
		successCount += res.successCount;
		res.responses.forEach((r, idx) => {
			if (!r.success && r.error) {
				const code = r.error.code || '';
				if (
					code === 'messaging/registration-token-not-registered' ||
					code === 'messaging/invalid-registration-token'
				) staleTokens.push(batch[idx]);
			}
		});
	}
	return { successCount, staleTokens };
}

async function pruneStaleTokens(db, tokens) {
	if (!tokens.length) return;
	const batch = db.batch();
	tokens.forEach(t => batch.delete(db.collection('pushSubscriptions').doc(t)));
	await batch.commit();
	console.log(`Pruned ${tokens.length} stale token(s).`);
}

// ── Devotional push ───────────────────────────────────────────────────────────

export const scheduleDevotionalPush = onSchedule('every 15 minutes', async () => {
	const db  = getFirestore();
	const now = new Date();
	const et  = getEasternTimeParts(now);

	// Floor current minute to the nearest 15-minute slot.
	// e.g. 6:37 → slot 6:30;  6:52 → slot 6:45
	const slotHour   = et.hour;
	const slotMinute = Math.floor(et.minute / 15) * 15;

	const snap = await db.collection('pushSubscriptions')
		.where('devotionalHour',   '==', slotHour)
		.where('devotionalMinute', '==', slotMinute)
		.get();

	if (snap.empty) {
		console.log(`[devotional] No subscribers for slot ${slotHour}:${String(slotMinute).padStart(2, '0')} ET.`);
		return;
	}

	let devotional;
	try { devotional = await fetchDevotional(); }
	catch (err) {
		console.error('[devotional] Failed to fetch devotional:', err);
		return;
	}

	const verse     = String(devotional.verse     || '').replace(/[\u201c\u201d]/g, '"').trim();
	const reference = String(devotional.reference || '').trim();
	if (!verse || !reference) {
		console.warn('[devotional] Devotional JSON missing verse/reference. Skipping.');
		return;
	}

	const MAX_BODY  = 120;
	const bodyVerse = verse.length > MAX_BODY
		? verse.slice(0, MAX_BODY).replace(/\s+\S*$/, '') + '\u2026'
		: verse;

	const tokens = snap.docs.map(d => d.id);
	const { successCount, staleTokens } = await sendToTokens(tokens, {
		title: 'CKSDA Daily Devotional',
		body:  `${bodyVerse} \u2014 ${reference}`,
		url:   `${SITE_URL}/today.html`,
		icon:  ICON_URL,
	});

	console.log(`[devotional] Slot ${slotHour}:${String(slotMinute).padStart(2, '0')} ET — sent ${successCount}/${tokens.length}.`);
	await pruneStaleTokens(db, staleTokens);
});

// ── Sabbath reminder ──────────────────────────────────────────────────────────

export const scheduleSabbathReminder = onSchedule('every 15 minutes', async () => {
	const db  = getFirestore();
	const now = new Date();

	let devotional;
	try { devotional = await fetchDevotional(); }
	catch { return; }

	if (!devotional.sabbathStartUtc) return;

	const sabbathStart    = new Date(devotional.sabbathStartUtc);
	const minutesUntil    = (sabbathStart.getTime() - now.getTime()) / 60000;

	// Only fire in the 50–65 minute window before Sabbath begins.
	if (minutesUntil < 50 || minutesUntil > 65) return;

	// Deduplication: only send once per calendar day (Eastern).
	const et = getEasternTimeParts(now);
	const easternDate = `${et.year}-${et.month}-${et.day}`;
	const stateRef  = db.doc('dailyState/sabbathReminder');
	const stateSnap = await stateRef.get();
	if (stateSnap.exists() && stateSnap.data().sentDate === easternDate) return;

	// Mark as sent before sending to prevent duplicate runs in the same window.
	await stateRef.set({ sentDate: easternDate });

	const snap = await db.collection('pushSubscriptions')
		.where('sabbathReminder', '==', true)
		.get();

	if (snap.empty) {
		console.log('[sabbath] No subscribers opted in to Sabbath reminders.');
		return;
	}

	// Format Sabbath start time in Eastern for the notification body.
	const se   = getEasternTimeParts(sabbathStart);
	const h    = se.hour;
	const m    = String(se.minute).padStart(2, '0');
	const ampm = h < 12 ? 'AM' : 'PM';
	const dh   = h === 0 ? 12 : h > 12 ? h - 12 : h;
	const sabbathTimeStr = `${dh}:${m} ${ampm}`;

	const tokens = snap.docs.map(d => d.id);
	const { successCount, staleTokens } = await sendToTokens(tokens, {
		title: 'Sabbath begins soon \uD83D\uDD6F\uFE0F',
		body:  `Sabbath starts at ${sabbathTimeStr} ET tonight. Shabbat Shalom!`,
		url:   `${SITE_URL}/today.html`,
		icon:  ICON_URL,
	});

	console.log(`[sabbath] Sent ${successCount}/${tokens.length}.`);
	await pruneStaleTokens(db, staleTokens);
});
