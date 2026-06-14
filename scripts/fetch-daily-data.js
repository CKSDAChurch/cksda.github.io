// @ts-check
/*
	© CKSDA Church
	cksda.church/

	fetch-daily-data.js — Server-side (GitHub Actions) script.

	Fetches today's Our High Calling devotional from whiteestate.org (no CORS
	restrictions on the Actions runner), parses the verse text and reference,
	then:
	  1. Patches newsletter.html in place so the static HTML already shows the
	     correct verse before JavaScript runs.
	  2. Writes assets/data/devotional-today.json so the homepage (and any other
	     page) can read the same data from a single source of truth.

	Always exits 0: a fetch or parse failure leaves the hardcoded HTML fallback
	intact and still lets the deployment proceed.
*/

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { parseVerseAndReference } from '../assets/js/verse-utils.js';

const TIME_ZONE = 'America/New_York';
const LOCATION = { lat: 35.055464, lng: -85.0710314 };

const pad2 = (value) => String(value).padStart(2, '0');

const zonedParts = (date, timeZone) => new Intl.DateTimeFormat('en-US', {
	timeZone,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	weekday: 'short',
}).formatToParts(date).reduce((parts, part) => {
	if (part.type !== 'literal') parts[part.type] = part.value;
	return parts;
}, {});

const makeDateFromZonedParts = (parts) =>
	new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12));

const formatTime = (date) => new Intl.DateTimeFormat('en-US', {
	timeZone: TIME_ZONE,
	hour: 'numeric',
	minute: '2-digit',
	hour12: true,
}).format(date);

// Returns the YYYY-MM-DD strings for the CURRENT Sabbath window.
// On Saturday, Sabbath started yesterday (Friday) — look back 1 day rather than forward.
// On all other days, use the upcoming Friday and Saturday.
const getSabbathWindowDates = () => {
	const todayParts = zonedParts(new Date(), TIME_ZONE);
	const todayDate = makeDateFromZonedParts(todayParts);
	const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
	const weekday = weekdayMap[todayParts.weekday] ?? 0;
	const daysToFriday = weekday === 6 ? -1 : (5 - weekday + 7) % 7;
	const daysToSaturday = weekday === 6 ? 0 : (6 - weekday + 7) % 7;
	const makeDateStr = (offset) => {
		const d = new Date(todayDate.getTime() + offset * 24 * 60 * 60 * 1000);
		const p = zonedParts(d, TIME_ZONE);
		return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
	};
	return { fridayDate: makeDateStr(daysToFriday), saturdayDate: makeDateStr(daysToSaturday) };
};

// Returns both the display-formatted time string and the raw UTC ISO timestamp.
/** @param {string} dateString */
const fetchSunsetData = async (dateString) => {
	const response = await fetch(
		`https://api.sunrise-sunset.org/json?lat=${LOCATION.lat}&lng=${LOCATION.lng}&date=${dateString}&formatted=0&tzid=${encodeURIComponent(TIME_ZONE)}`,
		{ signal: AbortSignal.timeout(15000) }
	);
	if (!response.ok) throw new Error(`Sunset API HTTP ${response.status}`);
	const payload = await response.json();
	if (payload.status !== 'OK' || !payload.results?.sunset) {
		throw new Error(`Sunset API unexpected payload for ${dateString}`);
	}
	return {
		formatted: formatTime(new Date(payload.results.sunset)),
		utc: /** @type {string} */(payload.results.sunset),
	};
};

const getTodayKey = () => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: TIME_ZONE,
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(new Date()).reduce((acc, p) => {
		acc[p.type] = p.value;
		return acc;
	}, {});
	return `${parts.month}_${parts.day}`;
};

const decodeHtmlEntities = (str) =>
	str
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#8220;/g, '\u201c')
		.replace(/&#8221;/g, '\u201d')
		.replace(/&#8216;/g, '\u2018')
		.replace(/&#8217;/g, '\u2019')
		.replace(/&#8212;/g, '\u2014')
		.replace(/&#8211;/g, '\u2013')
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/&[a-zA-Z]+;/g, ' ');

const getBibleGatewayUrl = (reference) =>
	`https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NKJV`;

const main = async () => {
	const dateKey = getTodayKey();
	const devotionalUrl = `https://whiteestate.org/devotional/ohc/${dateKey}/`;
	console.log(`Fetching OHC devotional for ${dateKey} from ${devotionalUrl}`);

	let pageHtml;
	try {
		const response = await fetch(devotionalUrl, {
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CKSDA-build/1.0)' },
			signal: AbortSignal.timeout(15000),
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		pageHtml = await response.text();
	} catch (err) {
		console.warn(`Warning: Could not fetch OHC page (${err.message}). Keeping HTML fallback.`);
		return;
	}

	// Extract the devotional paragraph — class attribute may be first or among others.
	const blockMatch = pageHtml.match(/<p[^>]*class="[^"]*devotionaltext[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
	if (!blockMatch) {
		console.warn('Warning: Could not find devotionaltext element. Keeping HTML fallback.');
		return;
	}

	const rawText = decodeHtmlEntities(blockMatch[1].replace(/<[^>]+>/g, ' '));
	const parsed = parseVerseAndReference(rawText);
	if (!parsed) {
		console.warn('Warning: Could not parse verse from devotional text. Keeping HTML fallback.');
		return;
	}

	console.log(`Parsed: ${parsed.reference}`);
	console.log(`Text:   ${parsed.text.slice(0, 80)}…`);

	const bgUrl = getBibleGatewayUrl(parsed.reference);
	let newsletterHtml = readFileSync('newsletter.html', 'utf8');

	// Replace the verse body text.
	newsletterHtml = newsletterHtml.replace(
		/(id="verse-text">)[^<]*/,
		(_, prefix) => `${prefix}${parsed.text}`
	);

	// Replace verse-link href and visible reference text in a single pass.
	newsletterHtml = newsletterHtml.replace(
		/(<a id="verse-link")([^>]*)(>)[^<]*/,
		(_, open, attrs, close) => {
			const newAttrs = attrs.replace(/href="[^"]*"/, `href="${bgUrl}"`);
			return `${open}${newAttrs}${close}${parsed.reference}`;
		}
	);

	writeFileSync('newsletter.html', newsletterHtml, 'utf8');
	console.log(`newsletter.html patched successfully.`);

	let fridaySunset = null;
	let saturdaySunset = null;
	let sabbathStartUtc = null;
	let sabbathEndUtc = null;
	try {
		const { fridayDate, saturdayDate } = getSabbathWindowDates();
		const [fridayData, saturdayData] = await Promise.all([
			fetchSunsetData(fridayDate),
			fetchSunsetData(saturdayDate),
		]);
		fridaySunset = fridayData.formatted;
		saturdaySunset = saturdayData.formatted;
		sabbathStartUtc = fridayData.utc;
		sabbathEndUtc = saturdayData.utc;
	} catch (err) {
		console.warn(`Warning: Could not fetch sunset times (${err.message}).`);
	}

	// Write the single-source-of-truth JSON so the homepage and other pages
	// can display the same devotional data without re-fetching from White Estate.
	const devotionalJson = JSON.stringify({
		verse: parsed.text,
		reference: parsed.reference,
		devotionalUrl,
		date: dateKey,
		fridaySunset,
		saturdaySunset,
		sabbathStartUtc,
		sabbathEndUtc,
	}, null, 2);
	mkdirSync('assets/data', { recursive: true });
	writeFileSync('assets/data/devotional-today.json', devotionalJson + '\n', 'utf8');
	console.log(`assets/data/devotional-today.json written.`);
};

main().catch((err) => {
	// Unexpected runtime error — log but still exit 0 to keep deployment alive.
	console.error('Unexpected error in fetch-devotional:', err);
});
