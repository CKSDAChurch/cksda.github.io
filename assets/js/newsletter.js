// @ts-check
/*
	© CKSDA Church
	cksda.church/
*/

import { getLatestVideoFromPlaylist, getNextScheduledVideoFromPlaylist } from './youtube.js';
import { parseVerseAndReference } from './verse-utils.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const TIME_ZONE = 'America/New_York';
const LOCATION = { lat: 35.055464, lng: -85.0710314 };
const DEVOTIONAL_BASE_URL = 'https://whiteestate.org/devotional/ohc/';
const EM_PLAYLIST = 'PLIkL0-bPEL8qQUoX4JIONp-RCjgwKQFgx';

// ─── DOM Elements ─────────────────────────────────────────────────────────────

const els = {
	sabbathLabel: document.getElementById('sabbath-label'),
	sabbathDate: document.getElementById('sabbath-date'),
	fridaySunset: document.getElementById('friday-sunset'),
	saturdaySunset: document.getElementById('saturday-sunset'),
	verseText: document.getElementById('verse-text'),
	verseLink: /** @type {HTMLAnchorElement | null} */(document.getElementById('verse-link')),
	devotionalLink: /** @type {HTMLAnchorElement | null} */(document.getElementById('devotional-link')),
	sermonSpeaker: document.getElementById('sermon-speaker'),
	sermonLine: document.getElementById('sermon-line'),
	livestreamLink: /** @type {HTMLAnchorElement | null} */(document.getElementById('livestream-link')),
	givingLink: document.getElementById('giving-link')
};

// ─── Date / Time Utilities ────────────────────────────────────────────────────

/** @param {number | string} value */
const pad2 = (value) => String(value).padStart(2, '0');

// Returns an object of named date parts (year, month, day, weekday) in the given timezone.
/** @param {Date} date @param {string} timeZone @returns {Record<string, string>} */
const zonedParts = (date, timeZone) => {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short'
	});

	return formatter.formatToParts(date).reduce((parts, part) => {
		if (part.type !== 'literal') parts[part.type] = part.value;
		return parts;
	}, /** @type {Record<string, string>} */({}));
};

// Builds a UTC noon Date from {year, month, day} zoned parts — avoids DST drift.
/** @param {Record<string, string>} parts */
const makeDateFromZonedParts = (parts) => new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12));

/** @param {Date} date */
const formatDate = (date) => new Intl.DateTimeFormat('en-US', {
	timeZone: TIME_ZONE,
	month: 'long',
	day: 'numeric',
	year: 'numeric'
}).format(date).toUpperCase();

/** @param {Date} date */
const formatTime = (date) => new Intl.DateTimeFormat('en-US', {
	timeZone: TIME_ZONE,
	hour: 'numeric',
	minute: '2-digit',
	hour12: true
}).format(date).replace(/\s/g, ' ');

// Returns value with ordinal suffix, e.g. 3 → "3RD".
/** @param {number} value */
const ordinal = (value) => {
	const suffixes = ['TH', 'ST', 'ND', 'RD'];
	const remainder100 = value % 100;
	return `${value}${suffixes[(remainder100 - 20) % 10] || suffixes[remainder100] || suffixes[0]}`;
};

/** @param {Date} date */
const isSaturdayInTimeZone = (date) => zonedParts(date, TIME_ZONE).weekday === 'Sat';

// Counts how many Saturdays fall on or before `day` in the given month/year.
/** @param {number} year @param {number} month @param {number} day */
const countSaturdaysThrough = (year, month, day) => {
	let count = 0;
	for (let d = 1; d <= day; d++) {
		if (isSaturdayInTimeZone(new Date(Date.UTC(year, month - 1, d, 12)))) count++;
	}
	return count;
};

// Returns the last Saturday of a given month (UTC noon). Used to find quarter start dates.
/** @param {number} year @param {number} month */
const getLastSaturdayOf = (year, month) => {
	const lastDay = new Date(Date.UTC(year, month, 0, 12));
	const weekdayMap = /** @type {Record<string, number>} */({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
	const daysBack = ((weekdayMap[zonedParts(lastDay, TIME_ZONE).weekday] ?? 0) - 6 + 7) % 7;
	return new Date(lastDay.getTime() - daysBack * 24 * 60 * 60 * 1000);
};

// Returns the upcoming Saturday with its ordinal label ("3RD SABBATH") and formatted date.
const getUpcomingSabbathDate = () => {
	const now = new Date();
	const parts = zonedParts(now, TIME_ZONE);
	const current = makeDateFromZonedParts(parts);
	const weekdayMap = /** @type {Record<string, number>} */({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
	const daysUntilSaturday = (6 - (weekdayMap[parts.weekday] ?? 0) + 7) % 7;
	const sabbathDate = new Date(current.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
	const sabbathParts = zonedParts(sabbathDate, TIME_ZONE);
	const sabbathOrdinal = countSaturdaysThrough(Number(sabbathParts.year), Number(sabbathParts.month), Number(sabbathParts.day));

	return {
		date: sabbathDate,
		label: `${ordinal(sabbathOrdinal)} SABBATH`,
		formattedDate: formatDate(sabbathDate)
	};
};

// ─── Sabbath School Lessons ───────────────────────────────────────────────────

// Returns the Adventech quarterly code (e.g. "2026-03") for a given Sabbath date.
// Quarter transitions happen on the last Saturday of March, June, September, and December.
/** @param {Date} sabbathDate */
const getSabbathSchoolQuarterCode = (sabbathDate) => {
	const year = Number(zonedParts(sabbathDate, TIME_ZONE).year);
	const t = sabbathDate.getTime();
	if (t >= getLastSaturdayOf(year, 12).getTime()) return `${year + 1}-01`;
	if (t >= getLastSaturdayOf(year, 9).getTime())  return `${year}-04`;
	if (t >= getLastSaturdayOf(year, 6).getTime())  return `${year}-03`;
	if (t >= getLastSaturdayOf(year, 3).getTime())  return `${year}-02`;
	return `${year}-01`;
};

// Updates every `.lessons-grid a[href]` to point to the current quarter, week, and day.
// Adult lessons start the week on Saturday (Sat=1…Fri=7); child lessons start on Sunday (Sun=1…Sat=7).
// Adult URLs have the quarter code immediately followed by a slash; child URLs use a dash-suffix.
// Some child lesson types omit the day segment; those are left as /week only.
/** @param {Date} sabbathDate */
const updateLessonLinks = (sabbathDate) => {
	const quarterCode = getSabbathSchoolQuarterCode(sabbathDate);
	const [qyStr, qnStr] = quarterCode.split('-');
	const qYear = parseInt(qyStr, 10);
	const qNum  = parseInt(qnStr, 10);
	const qTransitions = /** @type {Record<number, [number, number]>} */({ 1: [qYear - 1, 12], 2: [qYear, 3], 3: [qYear, 6], 4: [qYear, 9] });
	const [qy, qm] = qTransitions[qNum];
	const quarterStart = getLastSaturdayOf(qy, qm);

	const todayParts = zonedParts(new Date(), TIME_ZONE);
	const todayDate = makeDateFromZonedParts(todayParts);

	// Adult: week starts Saturday; roll back to last Saturday for week number.
	const adultDayMap = /** @type {Record<string, number>} */({ Sat: 1, Sun: 2, Mon: 3, Tue: 4, Wed: 5, Thu: 6, Fri: 7 });
	const adultDay = adultDayMap[todayParts.weekday] ?? 1;
	const saturdayOffsets = /** @type {Record<string, number>} */({ Sat: 0, Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6 });
	const lastSaturday = new Date(todayDate.getTime() - (saturdayOffsets[todayParts.weekday] ?? 0) * 24 * 60 * 60 * 1000);
	const weekNum = Math.round((lastSaturday.getTime() - quarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

	// Child: week starts Sunday; count Sundays since the first Sunday of the quarter.
	const childDayMap = /** @type {Record<string, number>} */({ Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6, Sat: 7 });
	const childDay = childDayMap[todayParts.weekday] ?? 1;
	const firstSunday = new Date(quarterStart.getTime() + 24 * 60 * 60 * 1000);
	const sundayOffsets = /** @type {Record<string, number>} */({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
	const childSunday = new Date(todayDate.getTime() - (sundayOffsets[todayParts.weekday] ?? 0) * 24 * 60 * 60 * 1000);
	const childWeekNum = Math.round((childSunday.getTime() - firstSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

	(/** @type {NodeListOf<HTMLAnchorElement>} */(document.querySelectorAll('.lessons-grid a[href]'))).forEach((link) => {
		const isAdult = /\/\d{4}-0[1-4]\//.test(link.href);
		const wk     = isAdult ? weekNum : childWeekNum;
		const dayNum = isAdult ? adultDay : childDay;

		let href = link.href.replace(/\d{4}-0[1-4]/g, quarterCode);
		// Replace trailing /week or /week/day with recomputed values.
		href = href.replace(/\/\d{1,2}(\/\d{1,2})?$/, (/** @type {string} */_,  /** @type {string | undefined} */dayPart) =>
			dayPart !== undefined ? `/${pad2(wk)}/${pad2(dayNum)}` : `/${pad2(wk)}`
		);
		link.href = href;
	});
};

// ─── Sunset / Sabbath Times ───────────────────────────────────────────────────

// Fetches the sunset time for a YYYY-MM-DD date string from the sunrise-sunset.org API.
/** @param {string} dateString */
const fetchSunset = async (dateString) => {
	const response = await fetch(
		`https://api.sunrise-sunset.org/json?lat=${LOCATION.lat}&lng=${LOCATION.lng}&date=${dateString}&formatted=0&tzid=${encodeURIComponent(TIME_ZONE)}`
	);
	if (!response.ok) throw new Error(`Sunset API request failed for ${dateString}`);
	const payload = await response.json();
	if (payload.status !== 'OK' || !payload.results?.sunset) {
		throw new Error(`Sunset API returned an unexpected response for ${dateString}`);
	}
	return formatTime(new Date(payload.results.sunset));
};

// ─── Verse of the Day ─────────────────────────────────────────────────────────

// Returns the verse/reference already rendered in the HTML, or a hardcoded default.
const getHtmlFallbackVerseEntry = () => {
	const reference = els.verseLink?.textContent.trim() ?? '';
	const text = els.verseText?.textContent.trim() ?? '';
	if (reference && text) return { reference, text };
	return {
		reference: 'Song of Solomon 2:11-12',
		text: '"For, lo, the winter is past, the rain is over and gone; the flowers appear on the earth; the time of the singing of birds is come, and the voice of the turtle is heard in our land."'
	};
};

const getWhiteEstateDevotionalUrl = (date = new Date()) => {
	const parts = zonedParts(date, TIME_ZONE);
	return `${DEVOTIONAL_BASE_URL}${parts.month}_${parts.day}/`;
};

// Fetches today's verse from the White Estate devotional page. Only works locally — CORS-blocked in production.
const fetchWhiteEstateVerseOfDay = async () => {
	const devotionalUrl = getWhiteEstateDevotionalUrl();
	const response = await fetch(devotionalUrl);
	if (!response.ok) throw new Error(`White Estate request failed with ${response.status}`);
	const html = await response.text();
	const doc = new DOMParser().parseFromString(html, 'text/html');
	const parsed = parseVerseAndReference(doc.querySelector('p.devotionaltext')?.textContent ?? '');
	if (!parsed) throw new Error('Unable to parse White Estate scripture block');
	return { ...parsed, devotionalUrl };
};

/** @param {string} reference */
const getBibleGatewayUrl = (reference) =>
	`https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NKJV`;

const updateVerseOfDay = async () => {
	let verseEntry;
	let devotionalUrl = getWhiteEstateDevotionalUrl();
	// In production the HTML is pre-patched at deploy time; skip the fetch to avoid CORS errors.
	const { hostname } = window.location;
	const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
	if (isLocal) {
		try {
			const dailyVerse = await fetchWhiteEstateVerseOfDay();
			verseEntry = { reference: dailyVerse.reference, text: dailyVerse.text };
			devotionalUrl = dailyVerse.devotionalUrl;
		} catch (error) {
			console.warn('White Estate verse fetch failed, using HTML/default fallback:', error);
			verseEntry = getHtmlFallbackVerseEntry();
		}
	} else {
		verseEntry = getHtmlFallbackVerseEntry();
	}

	if (els.verseLink) {
		els.verseLink.textContent = verseEntry.reference;
		els.verseLink.href = getBibleGatewayUrl(verseEntry.reference);
	}
	if (els.devotionalLink) els.devotionalLink.href = devotionalUrl;
	if (els.verseText) els.verseText.textContent = verseEntry.text;
};

// ─── Sermon Speaker ───────────────────────────────────────────────────────────

/** @param {string | null | undefined} rawUrl */
const getYoutubeVideoId = (rawUrl) => {
	if (!rawUrl) return null;
	try {
		const url = new URL(rawUrl);
		if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || null;
		if (url.pathname.startsWith('/watch')) return url.searchParams.get('v');
		if (url.pathname.startsWith('/live/')) return url.pathname.split('/')[2] || null;
	} catch (_) {
		return null;
	}
	return null;
};

// Attempts to extract a speaker name from a YouTube video title using pattern matching.
/** @param {string | null | undefined} title */
const extractSpeakerFromTitle = (title) => {
	if (!title) return null;

	/** @param {string | null | undefined} candidate */
	const isLikelyPersonName = (candidate) => {
		if (!candidate) return false;
		const words = candidate.trim().split(/\s+/).map((/** @type {string} */w) => w.replace(/[.'-]/g, '')).filter(Boolean);
		if (words.length < 2 || words.length > 3) return false;
		const blocked = new Set([
			'sabbath', 'worship', 'service', 'live', 'church', 'combined', 'joint', 'program',
			'pathfinder', 'high', 'school', 'christmas', 'special', 'message', 'sermon', 'speaker',
			'korean', 'english', 'collegedale', 'cksda', 'km', 'em', 'adventist', 'seventh', 'day'
		]);
		return words.every((/** @type {string} */w) => !blocked.has(w.toLowerCase()) && /^[A-Za-z][A-Za-z]+$/.test(w));
	};

	/** @param {string | null | undefined} speaker */
	const normalizeSpeaker = (speaker) => {
		if (!speaker) return null;
		const trimmed = speaker.replace(/\s+/g, ' ').trim().replace(/[\-|,:;\s]+$/, '');
		const words = trimmed.split(/\s+/).filter(Boolean);
		if (words.length >= 3 && /^(pastor|pr\.?)$/i.test(words[0])) {
			const first = words[1].replace(/[.,;:-]+$/g, '');
			const last  = words[2].replace(/[.,;:-]+$/g, '');
			if (first && last) return `Pr. ${first} ${last}`;
		}
		if (words.length === 2) {
			const first = words[0].replace(/[.,;:-]+$/g, '');
			const last  = words[1].replace(/[.,;:-]+$/g, '');
			if (first && last) return `${first} ${last}`;
		}
		return trimmed.replace(/^Pr\s+/i, 'Pr. ');
	};

	const patterns = [
		/(?:speaker|speaking|sermon(?:\s+by)?|message(?:\s+by)?)\s*[:\-]\s*([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,4})/i,
		/[-\u2013\u2014]\s*(Pr\.?\s+[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,3})\b/,
		/[-\u2013\u2014]\s*([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,3})\b/,
		/\b(Dr\.?\s+[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,3})\b/,
		/\b(Pastor\s+[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,3})\b/,
		/\b(Pr\.?\s+[A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){0,3})\b/
	];

	for (const pattern of patterns) {
		const match = title.match(pattern);
		if (match?.[1]) return normalizeSpeaker(match[1]);
	}

	const standaloneNamePattern = /(?:^|[|:\-\u2013\u2014\u2022]\s*)([A-Z][A-Za-z'.-]+(?:\s+[A-Z][A-Za-z'.-]+){1,2})(?=\s*(?:[|:\-\u2013\u2014\u2022]|$))/g;
	for (const match of title.matchAll(standaloneNamePattern)) {
		if (isLikelyPersonName(match[1])) return normalizeSpeaker(match[1]);
	}

	return null;
};

// Returns 'combined', 'special-no-speaker', or 'normal' based on the video title.
/** @param {string | null | undefined} title */
const classifySermonTitle = (title) => {
	if (!title) return 'normal';
	const lower = title.toLowerCase();
	if (/(combined|joint)\s+worship/.test(lower) || (lower.includes('km') && lower.includes('em') && lower.includes('worship'))) return 'combined';
	if (/(christmas|high school\s+worship|pathfinder|dedicat|program\b)/.test(lower)) return 'special-no-speaker';
	return 'normal';
};

// Finds this week's EM service video and updates the sermon speaker and livestream link.
const updateSermonSpeakerFromYoutube = async () => {
	if (!els.sermonSpeaker || !els.livestreamLink) return;

	const sabbathParts = zonedParts(getUpcomingSabbathDate().date, TIME_ZONE);
	const targetDateStr = `${sabbathParts.year}-${pad2(sabbathParts.month)}-${pad2(sabbathParts.day)}`;

	// Try to get the next scheduled (upcoming/live) video first.
	let videoId = await getNextScheduledVideoFromPlaylist(EM_PLAYLIST, /** @type {null} */(/** @type {unknown} */(targetDateStr))).catch(() => null);
	if (videoId) els.livestreamLink.href = `https://www.youtube.com/watch?v=${videoId}`;

	// If today IS the target Sabbath and service is already over, fall back to the latest published video.
	if (!videoId) {
		const nowParts = zonedParts(new Date(), TIME_ZONE);
		const todayStr = `${nowParts.year}-${pad2(nowParts.month)}-${pad2(nowParts.day)}`;
		if (targetDateStr === todayStr) {
			videoId = await getLatestVideoFromPlaylist(EM_PLAYLIST).catch(() => null);
			if (videoId) els.livestreamLink.href = `https://www.youtube.com/watch?v=${videoId}`;
		}
	}

	// Final fallback: use the video ID already in the hardcoded link.
	if (!videoId) videoId = getYoutubeVideoId(els.livestreamLink.href);
	if (!videoId) return;

	try {
		const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
		const response = await fetch(oembedUrl);
		if (!response.ok) throw new Error(`YouTube oEmbed request failed with ${response.status}`);
		const { title } = await response.json();
		const sermonType = classifySermonTitle(title);

		if (sermonType === 'combined' && els.sermonLine) {
			els.sermonLine.textContent = 'This week is Combined KM / EM Worship beginning at 11am';
			return;
		}
		if (sermonType === 'special-no-speaker' && els.sermonLine) {
			els.sermonLine.textContent = 'This week is a special worship service beginning at 11am';
			return;
		}
		const speaker = extractSpeakerFromTitle(title);
		if (speaker) els.sermonSpeaker.textContent = speaker;
	} catch (error) {
		console.warn('Sermon speaker auto-fill failed, using fallback speaker text:', error);
	}
};

// ─── Kitchen Duty ─────────────────────────────────────────────────────────────

// Updates the dishwashing / food-service roster based on which Sabbath of the month it is.
/** @param {Date} sabbathDate */
const updateKitchenDuty = (sabbathDate) => {
	const titleEl = document.getElementById('duty-title');
	const scheduleEl = document.getElementById('duty-schedule');
	if (!titleEl || !scheduleEl) return;

	const parts = zonedParts(sabbathDate, TIME_ZONE);
	const month = Number(parts.month);
	const weekNum = countSaturdaysThrough(Number(parts.year), month, Number(parts.day));
	const isSummer = month >= 5 && month <= 8; // May–August

	titleEl.textContent = isSummer ? 'Summer Dishwashing Duty' : 'Food Service / Dishwashing Duty';

	const schedule = isSummer
		? ['High School', 'Collegiate', 'Young Adults', 'EM Adults', 'Gaon']
		: ['Freshmen', 'Sophomores', 'Juniors', 'Seniors', 'Young Adults'];

	scheduleEl.innerHTML = schedule.map((group, i) => {
		const isCurrent = (i + 1) === weekNum;
		return `<li class="duty-row${isCurrent ? ' duty-row--active' : ''}"><span class="duty-week">Week ${i + 1}</span><span class="duty-group">${group}</span></li>`;
	}).join('');

	const ridesSection = document.getElementById('rides-section');
	if (ridesSection) ridesSection.hidden = isSummer;
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const trackEvent = (/** @type {string} */eventName, params = {}) => {
	// gtag is injected by the Google Analytics script tag.
	if (typeof /** @type {any} */(window).gtag === 'function') /** @type {any} */(window).gtag('event', eventName, params);
};

const attachAnalyticsEvents = () => {
	els.livestreamLink?.addEventListener('click', () => trackEvent('select_content', { content_type: 'livestream', item_id: 'em_main_service' }));
	els.givingLink?.addEventListener('click', () => trackEvent('select_content', { content_type: 'giving', item_id: 'adventist_giving' }));
	els.devotionalLink?.addEventListener('click', () => trackEvent('select_content', { content_type: 'devotional', item_id: 'ohc_daily' }));
	(/** @type {NodeListOf<HTMLAnchorElement>} */(document.querySelectorAll('a[href*="youtube.com"][href*="live"]'))).forEach((link) => {
		if (link.id !== 'livestream-link') {
			link.addEventListener('click', () => trackEvent('select_content', { content_type: 'livestream', item_id: link.href }));
		}
	});
};

// ─── Init ─────────────────────────────────────────────────────────────────────

const applyStaticFallbacks = () => {
	if (els.sabbathLabel) els.sabbathLabel.textContent = 'SABBATH';
	if (els.devotionalLink) els.devotionalLink.href = getWhiteEstateDevotionalUrl();
};

const init = async () => {
	let sabbathDate;
	try {
		const sabbath = getUpcomingSabbathDate();
		sabbathDate = sabbath.date;
		const friday = new Date(sabbath.date.getTime() - 24 * 60 * 60 * 1000);
		const fridayParts = zonedParts(friday, TIME_ZONE);
		const saturdayParts = zonedParts(sabbath.date, TIME_ZONE);

		const [fridaySunsetTime, saturdaySunsetTime] = await Promise.all([
			fetchSunset(`${fridayParts.year}-${pad2(fridayParts.month)}-${pad2(fridayParts.day)}`),
			fetchSunset(`${saturdayParts.year}-${pad2(saturdayParts.month)}-${pad2(saturdayParts.day)}`)
		]);

		if (els.sabbathLabel)   els.sabbathLabel.textContent   = sabbath.label;
		if (els.sabbathDate)    els.sabbathDate.textContent    = sabbath.formattedDate;
		if (els.fridaySunset)   els.fridaySunset.textContent   = fridaySunsetTime;
		if (els.saturdaySunset) els.saturdaySunset.textContent = saturdaySunsetTime;
	} catch (error) {
		console.error('Newsletter automation failed:', error);
		applyStaticFallbacks();
	}

	updateKitchenDuty(sabbathDate || new Date());
	updateLessonLinks(sabbathDate || new Date());
	await updateVerseOfDay();
	await updateSermonSpeakerFromYoutube();
	attachAnalyticsEvents();
};

init();
