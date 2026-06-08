// @ts-check
/*
	© CKSDA Church
	cksda.church/

	daily.js — Populates the dedicated today.html page.

	Reads devotional-today.json (written nightly by fetch-daily-data.js),
	computes current Sabbath School lesson links, and displays stored
	Friday/Saturday sunset times for a daily dashboard experience.
*/

import { getLatestVideoFromPlaylist, getNextScheduledVideoFromPlaylist } from './youtube.js';

const TIME_ZONE = 'America/New_York';
const DEVOTIONAL_DATA_PATH = 'assets/data/devotional-today.json';

// ─── Config ───────────────────────────────────────────────────────────────────

const EM_PLAYLIST = 'PLIkL0-bPEL8qQUoX4JIONp-RCjgwKQFgx';
// KM playlist: update today-km-video-link href in today.html once a KM playlist ID is available.

const CALENDAR_TODAY_PATH = 'assets/data/calendar-today.json';

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=35.055464&longitude=-85.0710314&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=America%2FNew_York';

/** @param {number} code */
const weatherEmoji = (code) => {
	if (code === 0)                      return '☀️';
	if (code <= 2)                       return '🌤️';
	if (code === 3)                      return '☁️';
	if (code <= 48)                      return '🌫️';
	if (code <= 67)                      return '🌧️';
	if (code <= 77)                      return '❄️';
	if (code <= 82)                      return '🌦️';
	return '⛈️';
};

const showCountdownChip = () => {
	const chipEl = document.getElementById('today-sabbath-chip');
	const chipsEl = chipEl?.parentElement;
	if (chipEl instanceof HTMLElement) chipEl.hidden = false;
	if (chipsEl instanceof HTMLElement) chipsEl.hidden = false;
};

const setCountdownUnavailable = () => {
	const chipEl = document.getElementById('today-sabbath-chip');
	const chipsEl = chipEl?.parentElement;
	if (chipEl instanceof HTMLElement) chipEl.hidden = true;
	if (chipsEl instanceof HTMLElement) chipsEl.hidden = true;
};

// ─── Date / Time Utilities ────────────────────────────────────────────────────

/** @param {number | string} value */
const pad2 = (value) => String(value).padStart(2, '0');

/** @param {Date} date @param {string} timeZone @returns {Record<string, string>} */
const zonedParts = (date, timeZone) => {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short',
	});
	return formatter.formatToParts(date).reduce((parts, part) => {
		if (part.type !== 'literal') parts[part.type] = part.value;
		return parts;
	}, /** @type {Record<string, string>} */({}));
};

/** @param {Record<string, string>} parts */
const makeDateFromZonedParts = (parts) =>
	new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12));

// Returns the last Saturday of a given month (UTC noon).
/** @param {number} year @param {number} month */
const getLastSaturdayOf = (year, month) => {
	const lastDay = new Date(Date.UTC(year, month, 0, 12));
	const weekdayMap = /** @type {Record<string, number>} */({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
	const daysBack = ((weekdayMap[zonedParts(lastDay, TIME_ZONE).weekday] ?? 0) - 6 + 7) % 7;
	return new Date(lastDay.getTime() - daysBack * 24 * 60 * 60 * 1000);
};

// Returns the Adventech quarterly code (e.g. "2026-03") for a given Sabbath date.
// Quarter transitions happen on the last Saturday of March, June, September, and December.
/** @param {Date} date */
const getSabbathSchoolQuarterCode = (date) => {
	const year = Number(zonedParts(date, TIME_ZONE).year);
	const t = date.getTime();
	if (t >= getLastSaturdayOf(year, 12).getTime()) return `${year + 1}-01`;
	if (t >= getLastSaturdayOf(year, 9).getTime())  return `${year}-04`;
	if (t >= getLastSaturdayOf(year, 6).getTime())  return `${year}-03`;
	if (t >= getLastSaturdayOf(year, 3).getTime())  return `${year}-02`;
	return `${year}-01`;
};

const getTodayLessonPosition = () => {
	const todayParts = zonedParts(new Date(), TIME_ZONE);
	const todayDate = makeDateFromZonedParts(todayParts);
	const weekdayMap = /** @type {Record<string, number>} */({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });

	// Upcoming Saturday — used for the quarter code.
	const daysUntilSaturday = (6 - (weekdayMap[todayParts.weekday] ?? 0) + 7) % 7;
	const upcomingSaturday = new Date(todayDate.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
	const quarterCode = getSabbathSchoolQuarterCode(upcomingSaturday);

	// Last Saturday — used for the week number within the quarter.
	const saturdayOffsets = /** @type {Record<string, number>} */({ Sat: 0, Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6 });
	const lastSaturday = new Date(todayDate.getTime() - (saturdayOffsets[todayParts.weekday] ?? 0) * 24 * 60 * 60 * 1000);

	// Resolve quarter start date.
	const [qyStr, qnStr] = quarterCode.split('-');
	const qYear = parseInt(qyStr, 10);
	const qNum  = parseInt(qnStr, 10);
	const qTransitions = /** @type {Record<number, [number, number]>} */({ 1: [qYear - 1, 12], 2: [qYear, 3], 3: [qYear, 6], 4: [qYear, 9] });
	const [qy, qm] = qTransitions[qNum];
	const quarterStart = getLastSaturdayOf(qy, qm);

	const weekNum = Math.round((lastSaturday.getTime() - quarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
	const adultDayMap = /** @type {Record<string, number>} */({ Sat: 1, Sun: 2, Mon: 3, Tue: 4, Wed: 5, Thu: 6, Fri: 7 });
	const dayNum = adultDayMap[todayParts.weekday] ?? 1;

	const childDayMap = /** @type {Record<string, number>} */({ Sun: 1, Mon: 2, Wed: 4, Tue: 3, Thu: 5, Fri: 6, Sat: 7 });
	const childDay = childDayMap[todayParts.weekday] ?? 1;
	const firstSunday = new Date(quarterStart.getTime() + 24 * 60 * 60 * 1000);
	const sundayOffsets = /** @type {Record<string, number>} */({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
	const childSunday = new Date(todayDate.getTime() - (sundayOffsets[todayParts.weekday] ?? 0) * 24 * 60 * 60 * 1000);
	const childWeekNum = Math.round((childSunday.getTime() - firstSunday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

	return {
		quarterCode,
		weekNum,
		dayNum,
		childWeekNum,
		childDay,
	};
};

// ─── Calendar: Today's Events ────────────────────────────────────────────────

/**
 * Reads calendar-today.json (written at build time by fetch-daily-data.js)
 * and renders any events for today — no API key needed at runtime.
 */
const loadTodayEvents = async () => {
	try {
		const res = await fetch(CALENDAR_TODAY_PATH);
		if (!res.ok) return;
		const data = await res.json();
		const events = /** @type {Array<{summary:string,isAllDay:boolean,startDateTime:string|null,endDateTime:string|null,location:string|null}>} */ (data.events || []);
		if (!events.length) return;

		const section = document.getElementById('today-events');
		const list = document.getElementById('today-events-list');
		if (!(section instanceof HTMLElement) || !(list instanceof HTMLElement)) return;

		const dtf = new Intl.DateTimeFormat('en-US', {
			timeZone: TIME_ZONE,
			hour: 'numeric',
			minute: '2-digit',
		});

		list.innerHTML = events.map(ev => {
			let timeLabel = 'All day';
			if (!ev.isAllDay && ev.startDateTime) {
				const start = new Date(ev.startDateTime);
				const end = ev.endDateTime ? new Date(ev.endDateTime) : null;
				timeLabel = end ? `${dtf.format(start)} \u2013 ${dtf.format(end)}` : dtf.format(start);
			}
			const loc = ev.location ? `<span class="today-event__loc">${ev.location}</span>` : '';
			return `<li class="today-event"><span class="today-event__time">${timeLabel}</span><span class="today-event__title">${ev.summary || 'Event'}</span>${loc}</li>`;
		}).join('');

		section.hidden = false;
	} catch (err) {
		console.warn('[daily] Could not load today\'s events:', err);
	}
};

// ─── Init ─────────────────────────────────────────────────────────────────────

const init = async () => {
	if (!document.getElementById('today-devotional')) return;

	// ── Header date display ───────────────────────────────────────────────────
	const dateDisplayEl = document.getElementById('today-date-display');
	if (dateDisplayEl) {
		const parts = zonedParts(new Date(), TIME_ZONE);
		const date = makeDateFromZonedParts(parts);
		dateDisplayEl.textContent = new Intl.DateTimeFormat('en-US', {
			timeZone: TIME_ZONE,
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		}).format(date);
	}

	// ── Devotional ────────────────────────────────────────────────────────────
	try {
		const response = await fetch(DEVOTIONAL_DATA_PATH);
		if (response.ok) {
			const data = await response.json();
			const verseEl        = document.getElementById('today-verse-text');
			const verseLink      = /** @type {HTMLAnchorElement | null} */(document.getElementById('today-verse-link'));
			const devotionalLink = /** @type {HTMLAnchorElement | null} */(document.getElementById('today-devotional-link'));
			const bgUrl = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(data.reference)}&version=NKJV`;
			if (verseEl)        verseEl.textContent = data.verse;
			if (verseLink)      { verseLink.textContent = data.reference; verseLink.href = bgUrl; }
			if (devotionalLink) devotionalLink.href = data.devotionalUrl;

			// ── Sabbath countdown ─────────────────────────────────────────────
			const countdownEl = document.getElementById('today-sabbath-countdown');
			const chipEl      = document.getElementById('today-sabbath-chip');
			if (countdownEl && data.sabbathStartUtc && data.sabbathEndUtc) {
				showCountdownChip();
				const startMs = new Date(data.sabbathStartUtc).getTime();
				const endMs   = new Date(data.sabbathEndUtc).getTime();

				const tick = () => {
					const now = Date.now();
					if (now >= startMs && now < endMs) {
						// Currently Sabbath
						const remaining = endMs - now;
						const h = Math.floor(remaining / 3600000);
						const m = Math.floor((remaining % 3600000) / 60000);
						const s = Math.floor((remaining % 60000) / 1000);
						countdownEl.textContent = h > 0
							? `Happy Sabbath \u2022 ends in ${h}h ${m}m`
							: `Happy Sabbath \u2022 ends in ${m}m ${s}s`;
						if (chipEl) chipEl.setAttribute('title', 'Sabbath is currently active');
					} else if (now < startMs) {
						// Counting down to Sabbath
						const diff = startMs - now;
						const d = Math.floor(diff / 86400000);
						const h = Math.floor((diff % 86400000) / 3600000);
						const m = Math.floor((diff % 3600000) / 60000);
						const s = Math.floor((diff % 60000) / 1000);
						if (d > 0) {
							countdownEl.textContent = `Sabbath in ${d}d ${h}h ${m}m`;
						} else if (h > 0) {
							countdownEl.textContent = `Sabbath in ${h}h ${m}m`;
						} else {
							countdownEl.textContent = `Sabbath in ${m}m ${s}s`;
						}
					} else {
						// Sabbath just ended (Saturday evening before midnight refresh)
						countdownEl.textContent = 'Good Sabbath! See you next week \u2665';
						return; // no need to keep ticking
					}
				};

				tick();
				setInterval(tick, 1000);
			} else {
				setCountdownUnavailable();
			}

			// ── Sunset chip (Friday or Saturday) ─────────────────────────────
			const todayWeekday = zonedParts(new Date(), TIME_ZONE).weekday;
			const sunsetEl   = document.getElementById('today-sunset-time');
			const sunsetChip = document.getElementById('today-sunset-chip');
			const sunsetTime = todayWeekday === 'Fri' ? data.fridaySunset
				: todayWeekday === 'Sat' ? data.saturdaySunset
				: null;
			if (sunsetTime && sunsetEl && sunsetChip instanceof HTMLElement) {
				sunsetEl.textContent = `Sunset ${sunsetTime}`;
				sunsetChip.hidden = false;
			}

			// ── Happy Sabbath section ─────────────────────────────────────────
			const sabbathSection = document.getElementById('today-sabbath-section');
			if (sabbathSection instanceof HTMLElement && data.sabbathStartUtc && data.sabbathEndUtc) {
				const now    = Date.now();
				const startMs = new Date(data.sabbathStartUtc).getTime();
				const endMs   = new Date(data.sabbathEndUtc).getTime();
				if (now >= startMs && now < endMs) {
					sabbathSection.hidden = false;
					// Try to find today's specific EM video; fall back to playlist link.
					try {
						const nowParts  = zonedParts(new Date(), TIME_ZONE);
						const todayStr  = `${nowParts.year}-${pad2(nowParts.month)}-${pad2(nowParts.day)}`;
						let emVideoId   = await getNextScheduledVideoFromPlaylist(EM_PLAYLIST, /** @type {null} */(/** @type {unknown} */(todayStr))).catch(() => null);
						if (!emVideoId) emVideoId = await getLatestVideoFromPlaylist(EM_PLAYLIST).catch(() => null);
						const emLink = /** @type {HTMLAnchorElement | null} */(document.getElementById('today-em-video-link'));
						if (emLink && emVideoId) emLink.href = `https://www.youtube.com/watch?v=${emVideoId}`;
					} catch (err) {
						console.warn('Could not fetch EM video for Sabbath section:', err);
					}
				}
			}
		} else {
			setCountdownUnavailable();
		}
	} catch (err) {
		setCountdownUnavailable();
		console.warn('Could not load devotional-today.json:', err);
	}

	// ── Sabbath School lesson links ───────────────────────────────────────────
	try {
		const { quarterCode, weekNum, dayNum, childWeekNum, childDay } = getTodayLessonPosition();
		const wk = pad2(weekNum);
		const dy = pad2(dayNum);
		const cwk = pad2(childWeekNum);
		const cdy = pad2(childDay);

		const links = [
			['today-lesson-em', `https://sabbath-school.adventech.io/en/${quarterCode}/${wk}/${dy}`],
			['today-lesson-km', `https://sabbath-school.adventech.io/ko/${quarterCode}/${wk}/${dy}`],
			['today-lesson-collegiate', `https://sabbath-school.adventech.io/resources/en/ss/${quarterCode}-cq/${wk}/${dy}`],
			['today-lesson-highschool', `https://sabbath-school.adventech.io/en/${quarterCode}-cc/${cwk}`],
			['today-lesson-earliteen', `https://sabbath-school.adventech.io/en/${quarterCode}-rt/${cwk}`],
			['today-lesson-juniors', `https://sabbath-school.adventech.io/en/${quarterCode}-pp/${cwk}`],
			['today-lesson-primary', `https://sabbath-school.adventech.io/resources/en/aij/${quarterCode}-pr/${cwk}/${cdy}`],
			['today-lesson-cradleroll', `https://sabbath-school.adventech.io/resources/en/aij/${quarterCode}-kd/${cwk}/${cdy}`],
		];

		links.forEach(([id, href]) => {
			const el = /** @type {HTMLAnchorElement | null} */(document.getElementById(id));
			if (el) el.href = href;
		});
	} catch (err) {
		console.warn('Could not compute lesson links:', err);
	}

	// ── Weather ───────────────────────────────────────────────────────────────
	try {
		const resp = await fetch(WEATHER_URL);
		if (resp.ok) {
			const weather = await resp.json();
			const temp    = Math.round(weather.current?.temperature_2m ?? 0);
			const code    = weather.current?.weathercode ?? 0;
			const iconEl  = document.getElementById('today-weather-icon');
			const tempEl  = document.getElementById('today-weather-temp');
			const chipEl  = document.getElementById('today-weather-chip');
			if (iconEl) iconEl.textContent = weatherEmoji(code);
			if (tempEl) tempEl.textContent = `${temp}°F`;
			if (chipEl instanceof HTMLElement) chipEl.hidden = false;
		}
	} catch (err) {
		console.warn('Could not load weather:', err);
	}

	// ── Today's calendar events ───────────────────────────────────────────────
	await loadTodayEvents();

};

init();
