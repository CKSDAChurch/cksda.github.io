// @ts-check
/*
	© CKSDA Church
	cksda.church/

	fetch-devotional.js — Server-side (GitHub Actions) script.

	Fetches today's Our High Calling devotional from whiteestate.org (no CORS
	restrictions on the Actions runner), parses the verse text and reference,
	then patches newsletter.html in place so the static HTML already shows the
	correct verse before JavaScript runs.

	Always exits 0: a fetch or parse failure leaves the hardcoded HTML fallback
	intact and still lets the deployment proceed.
*/

import { readFileSync, writeFileSync } from 'fs';
import { parseVerseAndReference } from '../assets/js/verse-utils.js';

const TIME_ZONE = 'America/New_York';

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
};

main().catch((err) => {
	// Unexpected runtime error — log but still exit 0 to keep deployment alive.
	console.error('Unexpected error in fetch-devotional:', err);
});
