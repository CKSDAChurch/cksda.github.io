// @ts-check
/*
	© CKSDA Church
	cksda.church/
*/

import { getLatestVideoFromPlaylist, getNextScheduledVideoFromPlaylist } from './youtube.js';
import { parseVerseAndReference } from './verse-utils.js';

const TIME_ZONE = 'America/New_York';
	const LOCATION = {
		lat: 35.055464,
		lng: -85.0710314
	};

	const els = {
		sabbathLabel: document.getElementById('sabbath-label'),
		sabbathDate: document.getElementById('sabbath-date'),
		fridaySunset: document.getElementById('friday-sunset'),
		saturdaySunset: document.getElementById('saturday-sunset'),
		verseText: document.getElementById('verse-text'),
		verseLink: document.getElementById('verse-link'),
		devotionalLink: document.getElementById('devotional-link'),
		sermonSpeaker: document.getElementById('sermon-speaker'),
		sermonLine: document.getElementById('sermon-line'),
		livestreamLink: document.getElementById('livestream-link'),
		givingLink: document.getElementById('giving-link')
	};

	const DEVOTIONAL_BASE_URL = 'https://whiteestate.org/devotional/ohc/';

	const pad2 = (value) => String(value).padStart(2, '0');

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
		}, {});
	};

	const makeDateFromZonedParts = (parts) => new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12));

	const formatDate = (date) => new Intl.DateTimeFormat('en-US', {
			timeZone: TIME_ZONE,
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		}).format(date).toUpperCase();

	const formatTime = (date) => new Intl.DateTimeFormat('en-US', {
			timeZone: TIME_ZONE,
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date).replace(/\s/g, ' ');

	const ordinal = (value) => {
		const suffixes = ['TH', 'ST', 'ND', 'RD'];
		const remainder100 = value % 100;
		return `${value}${suffixes[(remainder100 - 20) % 10] || suffixes[remainder100] || suffixes[0]}`;
	};

	const isSaturdayInTimeZone = (date) => zonedParts(date, TIME_ZONE).weekday === 'Sat';

	const countSaturdaysThrough = (year, month, day) => {
		let count = 0;
		for (let currentDay = 1; currentDay <= day; currentDay += 1) {
			const candidate = new Date(Date.UTC(year, month - 1, currentDay, 12));
			if (isSaturdayInTimeZone(candidate)) count += 1;
		}
		return count;
	};


	const getHtmlFallbackVerseEntry = () => {
		const reference = els.verseLink ? els.verseLink.textContent.trim() : '';
		const text = els.verseText ? els.verseText.textContent.trim() : '';
		if (reference && text) return { reference, text };

		return {
			reference: 'Song of Solomon 2:11-12',
			text: '"For, lo, the winter is past, the rain is over and gone; the flowers appear on the earth; the time of the singing of birds is come, and the voice of the turtle is heard in our land."'
		};
	};

	const getDateKeyForTimeZone = (date = new Date()) => {
		const parts = zonedParts(date, TIME_ZONE);
		return `${parts.month}_${parts.day}`;
	};

	const getWhiteEstateDevotionalUrl = (date = new Date()) => `${DEVOTIONAL_BASE_URL}${getDateKeyForTimeZone(date)}/`;

	const fetchWhiteEstateVerseOfDay = async () => {
		const devotionalUrl = getWhiteEstateDevotionalUrl();
		const response = await fetch(devotionalUrl);
		if (!response.ok) throw new Error(`White Estate request failed with ${response.status}`);

		const html = await response.text();
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const scriptureNode = doc.querySelector('p.devotionaltext');
		const parsed = parseVerseAndReference(scriptureNode ? scriptureNode.textContent : '');

		if (!parsed) throw new Error('Unable to parse White Estate scripture block');

		return {
			...parsed,
			devotionalUrl
		};
	};

	const getBibleGatewayUrl = (reference) => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(reference)}&version=NKJV`;

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

	const extractSpeakerFromTitle = (title) => {
		if (!title) return null;

		const normalizeSpeaker = (speaker) => {
			if (!speaker) return null;
			const trimmed = speaker.replace(/\s+/g, ' ').trim().replace(/[\-|,:;\s]+$/, '');
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
			if (match && match[1]) return normalizeSpeaker(match[1]);
		}

		return null;
	};

	const classifySermonTitle = (title) => {
		if (!title) return 'normal';

		const lower = title.toLowerCase();
		const isCombinedWorship = /(combined|joint)\s+worship/.test(lower) || (lower.includes('km') && lower.includes('em') && lower.includes('worship'));
		if (isCombinedWorship) return 'combined';

		const isNoSpeakerService = /(christmas|high school\s+worship|pathfinder|dedicat|program\b)/.test(lower);
		if (isNoSpeakerService) return 'special-no-speaker';

		return 'normal';
	};

	const updateSermonSpeakerFromYoutube = async () => {
		if (!els.sermonSpeaker || !els.livestreamLink) return;
		const sermonLine = els.sermonLine;

		// Auto-find the NEXT UPCOMING EM service video for this week's Sabbath only.
		// targetDateStr pins the lookup to the upcoming Saturday so a video scheduled for
		// a future week doesn't appear until Sunday (when the "upcoming sabbath" rolls over).
		const EM_PLAYLIST = 'PLIkL0-bPEL8qQUoX4JIONp-RCjgwKQFgx';
		const sabbathParts = zonedParts(getUpcomingSabbathDate().date, TIME_ZONE);
		const targetDateStr = `${sabbathParts.year}-${pad2(sabbathParts.month)}-${pad2(sabbathParts.day)}`;
		let videoId = await getNextScheduledVideoFromPlaylist(EM_PLAYLIST, targetDateStr).catch(() => null);
		if (videoId) {
			els.livestreamLink.href = `https://www.youtube.com/watch?v=${videoId}`;
		}

		// If the target Sabbath is TODAY and no upcoming/live video was found (service already ended),
		// fall back to the most recently published video from the playlist — that's today's service.
		// This keeps the speaker name correct on Sabbath afternoon without waiting for midnight.
		if (!videoId) {
			const nowParts = zonedParts(new Date(), TIME_ZONE);
			const todayStr = `${nowParts.year}-${pad2(nowParts.month)}-${pad2(nowParts.day)}`;
			if (targetDateStr === todayStr) {
				videoId = await getLatestVideoFromPlaylist(EM_PLAYLIST).catch(() => null);
				if (videoId) {
					els.livestreamLink.href = `https://www.youtube.com/watch?v=${videoId}`;
				}
			}
		}

		// Fall back to the ID in the hardcoded link
		if (!videoId) videoId = getYoutubeVideoId(els.livestreamLink.href);
		if (!videoId) return;

		try {
			const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
			const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
			const response = await fetch(oembedUrl);
			if (!response.ok) throw new Error(`YouTube oEmbed request failed with ${response.status}`);

			const payload = await response.json();
			const sermonType = classifySermonTitle(payload.title);

			if (sermonType === 'combined' && sermonLine) {
				sermonLine.textContent = 'This week is Combined KM / EM Worship beginning at 11am';
				return;
			}

			if (sermonType === 'special-no-speaker' && sermonLine) {
				sermonLine.textContent = 'This week is a special worship service beginning at 11am';
				return;
			}

			const speaker = extractSpeakerFromTitle(payload.title);
			if (speaker) els.sermonSpeaker.textContent = speaker;
		} catch (error) {
			console.warn('Sermon speaker auto-fill failed, using fallback speaker text:', error);
		}
	};

	const getUpcomingSabbathDate = () => {
		const now = new Date();
		const parts = zonedParts(now, TIME_ZONE);
		const current = makeDateFromZonedParts(parts);
		const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
		const currentDay = weekdayMap[parts.weekday] ?? 0;
		const daysUntilSaturday = (6 - currentDay + 7) % 7;
		const sabbathDate = new Date(current.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
		const sabbathParts = zonedParts(sabbathDate, TIME_ZONE);
		const sabbathYear = Number(sabbathParts.year);
		const sabbathMonth = Number(sabbathParts.month);
		const sabbathDay = Number(sabbathParts.day);
		const sabbathOrdinal = countSaturdaysThrough(sabbathYear, sabbathMonth, sabbathDay);

		return {
			date: sabbathDate,
			label: `${ordinal(sabbathOrdinal)} SABBATH`,
			formattedDate: formatDate(sabbathDate)
		};
	};

	const fetchSunset = async (dateString) => {
		const response = await fetch(`https://api.sunrise-sunset.org/json?lat=${LOCATION.lat}&lng=${LOCATION.lng}&date=${dateString}&formatted=0&tzid=${encodeURIComponent(TIME_ZONE)}`);
		if (!response.ok) throw new Error(`Sunset API request failed for ${dateString}`);

		const payload = await response.json();
		if (payload.status !== 'OK' || !payload.results || !payload.results.sunset) {
			throw new Error(`Sunset API returned an unexpected response for ${dateString}`);
		}

		return formatTime(new Date(payload.results.sunset));
	};

	const applyStaticFallbacks = () => {
		if (els.sabbathLabel) els.sabbathLabel.textContent = 'SABBATH';
		if (els.devotionalLink) els.devotionalLink.href = getWhiteEstateDevotionalUrl();
	};

	const updateVerseOfDay = async () => {
		let verseEntry;
		let devotionalUrl = getWhiteEstateDevotionalUrl();

		try {
			const dailyVerse = await fetchWhiteEstateVerseOfDay();
			verseEntry = { reference: dailyVerse.reference, text: dailyVerse.text };
			devotionalUrl = dailyVerse.devotionalUrl;
		} catch (error) {
			console.warn('White Estate verse fetch failed, using HTML/default fallback:', error);
			try {
				verseEntry = getHtmlFallbackVerseEntry();
			} catch (_) {
				verseEntry = getHtmlFallbackVerseEntry();
			}
		}

		const verseLinkUrl = getBibleGatewayUrl(verseEntry.reference);

		if (els.verseLink) {
			els.verseLink.textContent = verseEntry.reference;
			els.verseLink.href = verseLinkUrl;
		}

		if (els.devotionalLink) {
			els.devotionalLink.href = devotionalUrl;
		}

		if (els.verseText) els.verseText.textContent = verseEntry.text;
	};

	const trackEvent = (eventName, params = {}) => {
		if (typeof gtag === 'function') gtag('event', eventName, params);
	};

	const attachAnalyticsEvents = () => {
		const livestream = els.livestreamLink;
		if (livestream) {
			livestream.addEventListener('click', () => {
				trackEvent('select_content', {
					content_type: 'livestream',
					item_id: 'em_main_service'
				});
			});
		}

		const giving = els.givingLink;
		if (giving) {
			giving.addEventListener('click', () => {
				trackEvent('select_content', {
					content_type: 'giving',
					item_id: 'adventist_giving'
				});
			});
		}

		document.querySelectorAll('a[href*="youtube.com"][href*="live"]').forEach((link) => {
			if (link.id !== 'livestream-link') {
				link.addEventListener('click', () => {
					trackEvent('select_content', {
						content_type: 'livestream',
						item_id: link.href
					});
				});
			}
		});

		const devotional = els.devotionalLink;
		if (devotional) {
			devotional.addEventListener('click', () => {
				trackEvent('select_content', {
					content_type: 'devotional',
					item_id: 'ohc_daily'
				});
			});
		}
	};

	// Returns a Date for the last Saturday of a given month/year (at noon UTC).
	// This is used to find the transition Sabbath between Sabbath School quarters:
	//   Q1 starts last Saturday of December (previous year)
	//   Q2 starts last Saturday of March
	//   Q3 starts last Saturday of June
	//   Q4 starts last Saturday of September
	const getLastSaturdayOf = (year, month) => {
		const lastDay = new Date(Date.UTC(year, month, 0, 12));
		const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
		const lastDayOfWeek = weekdayMap[zonedParts(lastDay, TIME_ZONE).weekday] ?? 0;
		const daysBack = (lastDayOfWeek - 6 + 7) % 7;
		return new Date(lastDay.getTime() - daysBack * 24 * 60 * 60 * 1000);
	};

	// Returns the Adventech quarterly code (e.g. "2026-03") for the given Sabbath date.
	const getSabbathSchoolQuarterCode = (sabbathDate) => {
		const parts = zonedParts(sabbathDate, TIME_ZONE);
		const year = Number(parts.year);
		const t = sabbathDate.getTime();
		if (t >= getLastSaturdayOf(year, 12).getTime()) return `${year + 1}-01`;
		if (t >= getLastSaturdayOf(year, 9).getTime())  return `${year}-04`;
		if (t >= getLastSaturdayOf(year, 6).getTime())  return `${year}-03`;
		if (t >= getLastSaturdayOf(year, 3).getTime())  return `${year}-02`;
		return `${year}-01`;
	};

	// Rewrites every lesson-tile href so the YYYY-QQ, week, and day segments all
	// reflect the current quarter/week and today's day within the lesson week.
	//
	// Adult lessons (EM / Young Adults) number days starting from Sabbath:
	//   Sat=01  Sun=02  Mon=03  Tue=04  Wed=05  Thu=06  Fri=07
	//
	// Children/collegiate lessons number days starting from Sunday:
	//   Sun=01  Mon=02  Tue=03  Wed=04  Thu=05  Fri=06  Sat=07
	//
	// Adult URLs have the quarter code immediately followed by a slash,
	// e.g. /en/2026-02/10/03 — child URLs append a dash-suffix first,
	// e.g. /en/2026-02-cc/10 or /resources/en/ss/2026-02-cq/10/02.
	// Some child lesson types (High School, Earliteen, Juniors) omit the day
	// segment entirely; those are left as /week only.
	const updateLessonLinks = (sabbathDate) => {
		const quarterCode = getSabbathSchoolQuarterCode(sabbathDate);

		// Compute week number within the quarter (1-indexed).
		const [qyStr, qnStr] = quarterCode.split('-');
		const qYear = parseInt(qyStr, 10);
		const qNum  = parseInt(qnStr, 10);
		const qTransitions = { 1: [qYear - 1, 12], 2: [qYear, 3], 3: [qYear, 6], 4: [qYear, 9] };
		const [qy, qm] = qTransitions[qNum];
		const quarterStart = getLastSaturdayOf(qy, qm);

		// Compute day numbers based on today's day of week (not the sabbath).
		const todayParts = zonedParts(new Date(), TIME_ZONE);
		const todayDate = makeDateFromZonedParts(todayParts);
		const adultDayMap = { Sat: 1, Sun: 2, Mon: 3, Tue: 4, Wed: 5, Thu: 6, Fri: 7 };
		const adultDay = adultDayMap[todayParts.weekday] ?? 1;

		// Adult week number: roll back to the most recent Saturday (adult week start),
		// then count from quarterStart. On Sunday the upcoming sabbathDate is next week,
		// so we must NOT use it here.
		const saturdayOffsets = { Sat: 0, Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6 };
		const daysBackToSaturday = saturdayOffsets[todayParts.weekday] ?? 0;
		const lastSaturday = new Date(todayDate.getTime() - daysBackToSaturday * 24 * 60 * 60 * 1000);
		const weekNum = Math.round((lastSaturday.getTime() - quarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

		// Child lessons run Sunday (day 1) → Saturday (day 7).
		// Saturday is the LAST day of the child week, not the start of the next one.
		const childDayMap = { Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6, Sat: 7 };
		const childRefParts = todayParts;

		// Week number for child lessons: count how many Sundays since the first
		// Sunday of the quarter (= quarterStart + 1 day).
		const firstSunday = new Date(quarterStart.getTime() + 24 * 60 * 60 * 1000);
		const sundayOffsets = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
		const daysBackToSunday = sundayOffsets[childRefParts.weekday] ?? 0;
		const childSunday = new Date(todayDate.getTime() - daysBackToSunday * 24 * 60 * 60 * 1000);
		const childWeekNum = Math.round((childSunday.getTime() - firstSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
		const childDay = childDayMap[childRefParts.weekday] ?? 1;

		document.querySelectorAll('.lessons-grid a[href]').forEach((link) => {
			// Detect adult vs child by whether the quarter code is immediately followed
			// by a slash (adult) or a dash-suffix (child).
			const isAdult = /\/\d{4}-0[1-4]\//.test(link.href);
			const wk     = isAdult ? weekNum : childWeekNum;
			const dayNum = isAdult ? adultDay : childDay;

			// Update quarter code (handles plain quarter and quarter+suffix alike).
			let href = link.href.replace(/\d{4}-0[1-4]/g, quarterCode);

			// Replace trailing /week or /week/day with recomputed values.
			href = href.replace(/\/\d{1,2}(\/\d{1,2})?$/, (_, dayPart) =>
				dayPart !== undefined
					? `/${pad2(wk)}/${pad2(dayNum)}`
					: `/${pad2(wk)}`
			);

			link.href = href;
		});
	};

	const updateKitchenDuty = (sabbathDate) => {
		const titleEl = document.getElementById('duty-title');
		const scheduleEl = document.getElementById('duty-schedule');
		if (!titleEl || !scheduleEl) return;

		const parts = zonedParts(sabbathDate, TIME_ZONE);
		const month = Number(parts.month);
		const day = Number(parts.day);
		const year = Number(parts.year);
		const weekNum = countSaturdaysThrough(year, month, day);

		// Summer: May–August; School year: September–April
		const isSummer = month >= 5 && month <= 8;

		titleEl.textContent = isSummer
			? 'Summer Dishwashing Duty'
			: 'Food Service / Dishwashing Duty';

		const schedule = isSummer
			? ['High School', 'Collegiate', 'Young Adults', 'EM Adults', 'Gaon']
			: ['Freshmen', 'Sophomores', 'Juniors', 'Seniors', 'Young Adults'];

		scheduleEl.innerHTML = schedule.map((group, i) => {
			const num = i + 1;
			const isCurrent = num === weekNum;
			return `<li class="duty-row${isCurrent ? ' duty-row--active' : ''}"><span class="duty-week">Week ${num}</span><span class="duty-group">${group}</span></li>`;
		}).join('');

		const ridesSection = document.getElementById('rides-section');
		if (ridesSection) ridesSection.hidden = isSummer;
	};

	const init = async () => {
		let sabbathDate;
		try {
			const sabbath = getUpcomingSabbathDate();
			sabbathDate = sabbath.date;
			const friday = new Date(sabbath.date.getTime() - 24 * 60 * 60 * 1000);
			const fridayParts = zonedParts(friday, TIME_ZONE);
			const fridayDateString = `${fridayParts.year}-${pad2(fridayParts.month)}-${pad2(fridayParts.day)}`;
			const saturdayParts = zonedParts(sabbath.date, TIME_ZONE);
			const saturdayDateString = `${saturdayParts.year}-${pad2(saturdayParts.month)}-${pad2(saturdayParts.day)}`;

			const [fridaySunset, saturdaySunset] = await Promise.all([
				fetchSunset(fridayDateString),
				fetchSunset(saturdayDateString)
			]);

			if (els.sabbathLabel) els.sabbathLabel.textContent = sabbath.label;
			if (els.sabbathDate) els.sabbathDate.textContent = sabbath.formattedDate;
			if (els.fridaySunset) els.fridaySunset.textContent = fridaySunset;
			if (els.saturdaySunset) els.saturdaySunset.textContent = saturdaySunset;
		} catch (error) {
			console.error('Newsletter automation failed:', error);
			applyStaticFallbacks();
		}

		updateKitchenDuty(sabbathDate || new Date());	updateLessonLinks(sabbathDate || new Date());		await updateVerseOfDay();
		await updateSermonSpeakerFromYoutube();
		attachAnalyticsEvents();
	};

	init();
