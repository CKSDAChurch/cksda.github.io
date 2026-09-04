// @ts-check
/*
	© CKSDA Church
	cksda.church/

	fetch-ss-teachers.js — Server-side (GitHub Actions) script.

	Fetches the current week's assigned teacher for each kids' Sabbath School
	class (High School and below) from the "CKSDA Children's Ministries
	Schedule" Google Sheet (published CSV export, one tab per class), then
	writes assets/data/ss-teachers.json so newsletter.html can display who is
	teaching this week.

	Always exits 0: a fetch or parse failure just leaves that class's teacher
	name blank (hidden in the UI) and still lets the deployment proceed.
*/

import { mkdirSync, writeFileSync } from 'fs';

const TIME_ZONE = 'America/New_York';
const SPREADSHEET_ID = '151RgpHar0CCaaaY1TgzTvT68XBrY5vNho1qWZIQOV2I';

// One tab per kids' class in the spreadsheet, keyed to match the
// `lesson-teacher-*` element IDs in newsletter.html.
const CLASSES = [
	{ key: 'highschool', gid: '233334797' },
	{ key: 'earliteen', gid: '1104657050' },
	{ key: 'juniors', gid: '321012027' },
	{ key: 'primary', gid: '830676631' },
	{ key: 'cradleroll', gid: '0' },
];

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

// Returns the upcoming Saturday (or today, if today is Saturday) — matches the
// same "current Sabbath" the newsletter page itself displays.
const getUpcomingSaturday = () => {
	const parts = zonedParts(new Date(), TIME_ZONE);
	const current = makeDateFromZonedParts(parts);
	const weekdayMap = /** @type {Record<string, number>} */({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 });
	const daysUntilSaturday = (6 - (weekdayMap[parts.weekday] ?? 0) + 7) % 7;
	return new Date(current.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
};

// Minimal CSV line parser — handles quoted fields (including escaped "" quotes).
/** @param {string} line @returns {string[]} */
const parseCsvLine = (line) => {
	const cells = [];
	let cur = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (line[i + 1] === '"') { cur += '"'; i++; }
				else inQuotes = false;
			} else cur += ch;
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ',') {
			cells.push(cur);
			cur = '';
		} else {
			cur += ch;
		}
	}
	cells.push(cur);
	return cells;
};

// Sheet layout is: Month, Date, Organiser, Teacher, ...
// Month/Date are only filled on the first row of each group (merged cells),
// so blank Month cells carry forward the most recent value.
/** @param {string} csvText @param {string} monthAbbrev @param {string} dayNum @returns {string} */
const findTeacherForDate = (csvText, monthAbbrev, dayNum) => {
	const rows = csvText.split(/\r?\n/).filter((/** @type {string} */ line) => line.length > 0).map(parseCsvLine);
	let currentMonth = '';
	for (let i = 1; i < rows.length; i++) {
		const row = rows[i];
		const month = (row[0] || '').trim();
		if (month) currentMonth = month;
		const date = (row[1] || '').trim();
		if (!date) continue; // blank separator row between months
		if (currentMonth === monthAbbrev && date === dayNum) return (row[3] || '').trim();
	}
	return '';
};

const main = async () => {
	const sabbath = getUpcomingSaturday();
	const sabbathParts = zonedParts(sabbath, TIME_ZONE);
	const monthAbbrev = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, month: 'short' }).format(sabbath);
	const dayNum = String(Number(sabbathParts.day));
	const isoDate = `${sabbathParts.year}-${sabbathParts.month}-${sabbathParts.day}`;

	console.log(`Fetching SS teacher schedule for ${monthAbbrev} ${dayNum} (${isoDate})`);

	const classes = /** @type {Record<string, string>} */({});
	for (const { key, gid } of CLASSES) {
		try {
			const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
			const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const csvText = await response.text();
			classes[key] = findTeacherForDate(csvText, monthAbbrev, dayNum);
			console.log(`  ${key}: ${classes[key] || '(none scheduled)'}`);
		} catch (err) {
			const error = /** @type {Error} */(err);
			console.warn(`Warning: Could not fetch/parse ${key} schedule (${error.message}).`);
			classes[key] = '';
		}
	}

	const json = JSON.stringify({ date: isoDate, classes }, null, 2);
	mkdirSync('assets/data', { recursive: true });
	writeFileSync('assets/data/ss-teachers.json', json + '\n', 'utf8');
	console.log('assets/data/ss-teachers.json written.');
};

main().catch((err) => {
	// Unexpected runtime error — log but still exit 0 to keep deployment alive.
	console.error('Unexpected error in fetch-ss-teachers:', err);
});
