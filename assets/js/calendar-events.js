// @ts-check
/*
	© CKSDA Church
	cksda.church/

	Fetches upcoming events from the Google Calendar API and renders them
	as a list or month-grid view on calendar.html.

	The API key (__CALENDAR_API_KEY__) is injected at build time via esbuild's
	`define` option (see scripts/build.js). Set CALENDAR_API_KEY in the
	environment before running `npm run build`.
*/

const CALENDAR_API_KEY = __CALENDAR_API_KEY__;
const CALENDAR_ID = 'c_cupfa6741dgvle32pjejeoqog4@group.calendar.google.com';
const MAX_EVENTS = 60;

const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Module state
let allEvents = [];
let currentView = 'list'; // 'list' | 'month'
const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();

// Safely convert a plain-text string to HTML-escaped text
const escapeHtml = (str) => {
	const div = document.createElement('div');
	div.textContent = str;
	return div.innerHTML;
};

// Strip any HTML tags from a string and return plain text
const stripHtml = (html) => {
	const div = document.createElement('div');
	div.innerHTML = html;
	return div.textContent || div.innerText || '';
};

// Parse a Google Calendar date string into a Date object.
// All-day events use "YYYY-MM-DD" (local midnight); timed events use ISO 8601.
const parseDate = (dateStr, isAllDay) => {
	if (isAllDay) {
		const [y, m, d] = dateStr.split('-').map(Number);
		return new Date(y, m - 1, d);
	}
	return new Date(dateStr);
};

const formatEvtTimeRange = (start, end, isAllDay) => {
	if (isAllDay) return 'All day';
	const opts = { hour: 'numeric', minute: '2-digit' };
	const lang = window.lang || navigator.language;
	const startStr = start.toLocaleTimeString(lang, opts);
	const endStr = end ? end.toLocaleTimeString(lang, opts) : null;
	return endStr && startStr !== endStr ? `${startStr} \u2013 ${endStr}` : startStr;
};

const isSameDay = (a, b) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate();

// ── List view ────────────────────────────────────────────────────

const renderEventCard = (event) => {
	const isAllDay = !!event.start.date;
	const start = parseDate(isAllDay ? event.start.date : event.start.dateTime, isAllDay);
	const end = event.end
		? parseDate(event.end.date || event.end.dateTime, !!event.end.date)
		: null;

	const monthAbbr = MONTH_NAMES[start.getMonth()].slice(0, 3).toUpperCase();
	const dayNum = start.getDate();
	const dayAbbr = DAY_NAMES_SHORT[start.getDay()];
	const timeStr = formatEvtTimeRange(start, end, isAllDay);
	const title = escapeHtml(event.summary || 'Untitled Event');

	const locationHtml = event.location
		? `<div class="event-card__meta"><span class="icon solid fa-location-dot" aria-hidden="true"></span> ${escapeHtml(event.location)}</div>`
		: '';

	const rawDesc = event.description ? stripHtml(event.description) : '';
	const descHtml = rawDesc
		? `<p class="event-card__desc">${escapeHtml(rawDesc.length > 220 ? rawDesc.slice(0, 220) + '\u2026' : rawDesc)}</p>`
		: '';

	const linkHtml = event.htmlLink
		? `<a href="${event.htmlLink}" class="event-card__link" target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>`
		: '';

	return `<article class="event-card">
  <div class="event-card__badge" aria-label="${dayAbbr} ${monthAbbr} ${dayNum}">
    <span class="event-card__badge-month">${monthAbbr}</span>
    <span class="event-card__badge-day">${dayNum}</span>
    <span class="event-card__badge-dow">${dayAbbr}</span>
  </div>
  <div class="event-card__body">
    <h3 class="event-card__title">${title}</h3>
    <div class="event-card__meta"><span class="icon solid fa-clock" aria-hidden="true"></span> ${timeStr}</div>
    ${locationHtml}${descHtml}${linkHtml}
  </div>
</article>`;
};

const groupByMonth = (events) => {
	const groups = new Map();
	for (const ev of events) {
		const isAllDay = !!ev.start.date;
		const start = parseDate(isAllDay ? ev.start.date : ev.start.dateTime, isAllDay);
		const key = `${start.getFullYear()}-${start.getMonth()}`;
		if (!groups.has(key)) {
			groups.set(key, {
				label: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`,
				events: []
			});
		}
		groups.get(key).events.push({ ...ev, _start: start });
	}
	return groups;
};

const renderListContent = () => {
	if (!allEvents.length) {
		return '<p class="events-empty">No upcoming events at this time. Check back soon!</p>';
	}
	const groups = groupByMonth(allEvents);
	let html = '';
	for (const [, group] of groups) {
		const cards = group.events.map(renderEventCard).join('');
		html += `<section class="events-month-group">
  <h2 class="events-month-heading">${group.label}</h2>
  <div class="events-list">${cards}</div>
</section>`;
	}
	return html;
};

// ── Month view ────────────────────────────────────────────────────

const renderMonthContent = () => {
	const year = viewYear;
	const month = viewMonth;

	// Index events by day number within this month
	const eventsByDay = new Map();
	for (let i = 0; i < allEvents.length; i++) {
		const ev = allEvents[i];
		const isAllDay = !!ev.start.date;
		const start = parseDate(isAllDay ? ev.start.date : ev.start.dateTime, isAllDay);
		if (start.getFullYear() === year && start.getMonth() === month) {
			const d = start.getDate();
			if (!eventsByDay.has(d)) eventsByDay.set(d, []);
			eventsByDay.get(d).push({ ev, idx: i });
		}
	}

	const firstDow = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();
	const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;

	const dayHeaders = DAY_NAMES_SHORT
		.map(d => `<div class="calendar-grid__header">${d}</div>`)
		.join('');

	let cellsHtml = '';
	for (let i = 0; i < totalCells; i++) {
		let dayNum, isOtherMonth, cellDate;
		if (i < firstDow) {
			dayNum = daysInPrevMonth - firstDow + i + 1;
			isOtherMonth = true;
			cellDate = new Date(year, month - 1, dayNum);
		} else if (i >= firstDow + daysInMonth) {
			dayNum = i - firstDow - daysInMonth + 1;
			isOtherMonth = true;
			cellDate = new Date(year, month + 1, dayNum);
		} else {
			dayNum = i - firstDow + 1;
			isOtherMonth = false;
			cellDate = new Date(year, month, dayNum);
		}

		const isToday = isSameDay(cellDate, today);
		const dayEvents = (!isOtherMonth && eventsByDay.has(dayNum)) ? eventsByDay.get(dayNum) : [];
		const MAX_PILLS = 3;
		const overflow = Math.max(0, dayEvents.length - MAX_PILLS);

		const pills = dayEvents.slice(0, MAX_PILLS).map(({ ev, idx }) => {
			const title = escapeHtml(ev.summary || 'Untitled');
			return `<button class="calendar-grid__pill" data-event-idx="${idx}" title="${title}">${title}</button>`;
		}).join('');

		const overflowEl = overflow
			? `<button class="calendar-grid__overflow" data-switch-list>+${overflow} more</button>`
			: '';

		const cls = [
			'calendar-grid__cell',
			isOtherMonth && 'calendar-grid__cell--other-month',
			isToday && 'calendar-grid__cell--today',
		].filter(Boolean).join(' ');

		cellsHtml += `<div class="${cls}" role="gridcell">
  <span class="calendar-grid__day-num"${isToday ? ' aria-current="date"' : ''}>${dayNum}</span>
  <div class="calendar-grid__events">${pills}${overflowEl}</div>
</div>`;
	}

	const canPrev = !(year === today.getFullYear() && month === today.getMonth());

	return `<div class="calendar-month-nav">
  <button class="calendar-nav-btn" id="cal-prev"${canPrev ? '' : ' disabled'} aria-label="Previous month">&#8249;</button>
  <h2 class="calendar-month-title" aria-live="polite">${MONTH_NAMES[month]} ${year}</h2>
  <button class="calendar-nav-btn" id="cal-next" aria-label="Next month">&#8250;</button>
</div>
<div class="calendar-grid" role="grid" aria-label="${MONTH_NAMES[month]} ${year} calendar">
  ${dayHeaders}
  ${cellsHtml}
</div>`;
};

// ── Popup ────────────────────────────────────────────────────────

const closePopup = () => {
	const p = document.getElementById('event-popup');
	if (p) p.remove();
};

const showEventPopup = (idx) => {
	closePopup();
	const ev = allEvents[idx];
	if (!ev) return;

	const isAllDay = !!ev.start.date;
	const start = parseDate(isAllDay ? ev.start.date : ev.start.dateTime, isAllDay);
	const end = ev.end ? parseDate(ev.end.date || ev.end.dateTime, !!ev.end.date) : null;
	const timeStr = formatEvtTimeRange(start, end, isAllDay);
	const title = escapeHtml(ev.summary || 'Untitled Event');
	const dateLabel = `${DAY_NAMES_LONG[start.getDay()]}, ${MONTH_NAMES[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;

	const locationHtml = ev.location
		? `<div class="event-popup__meta"><span class="icon solid fa-location-dot" aria-hidden="true"></span> ${escapeHtml(ev.location)}</div>`
		: '';

	const rawDesc = ev.description ? stripHtml(ev.description) : '';
	const descHtml = rawDesc
		? `<p class="event-popup__desc">${escapeHtml(rawDesc.length > 300 ? rawDesc.slice(0, 300) + '\u2026' : rawDesc)}</p>`
		: '';

	const linkHtml = ev.htmlLink
		? `<a href="${ev.htmlLink}" class="event-card__link" target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>`
		: '';

	const popup = document.createElement('div');
	popup.id = 'event-popup';
	popup.setAttribute('role', 'dialog');
	popup.setAttribute('aria-modal', 'true');
	popup.setAttribute('aria-label', ev.summary || 'Event details');
	popup.innerHTML = `<div class="event-popup__backdrop"></div>
<div class="event-popup__card" tabindex="-1">
  <button class="event-popup__close" aria-label="Close">&times;</button>
  <p class="event-popup__date">${dateLabel}</p>
  <h3 class="event-popup__title">${title}</h3>
  <div class="event-popup__meta"><span class="icon solid fa-clock" aria-hidden="true"></span> ${timeStr}</div>
  ${locationHtml}${descHtml}${linkHtml}
</div>`;

	document.body.appendChild(popup);
	popup.querySelector('.event-popup__card').focus();
	popup.querySelector('.event-popup__backdrop').addEventListener('click', closePopup);
	popup.querySelector('.event-popup__close').addEventListener('click', closePopup);

	const onKey = (e) => {
		if (e.key === 'Escape') {
			closePopup();
			document.removeEventListener('keydown', onKey);
		}
	};
	document.addEventListener('keydown', onKey);
};

// ── View toggle + wiring ──────────────────────────────────────────

const renderViewToggle = () =>
	`<div class="events-view-toggle" role="group" aria-label="Calendar view">
  <button class="events-view-btn${currentView === 'list' ? ' is-active' : ''}" data-view="list">
    <span class="icon solid fa-list" aria-hidden="true"></span> List
  </button>
  <button class="events-view-btn${currentView === 'month' ? ' is-active' : ''}" data-view="month">
    <span class="icon solid fa-calendar" aria-hidden="true"></span> Month
  </button>
</div>`;

const refresh = () => {
	const container = document.getElementById('events-container');
	if (!container) return;

	const content = currentView === 'list' ? renderListContent() : renderMonthContent();
	container.innerHTML = `${renderViewToggle()}<div class="events-view-content">${content}</div>`;

	// View toggle
	container.querySelectorAll('.events-view-btn').forEach(btn => {
		btn.addEventListener('click', () => {
			if (btn.dataset.view !== currentView) {
				currentView = btn.dataset.view;
				refresh();
			}
		});
	});

	// Month nav
	const prevBtn = container.querySelector('#cal-prev');
	const nextBtn = container.querySelector('#cal-next');
	if (prevBtn) prevBtn.addEventListener('click', () => {
		viewMonth--;
		if (viewMonth < 0) { viewMonth = 11; viewYear--; }
		refresh();
	});
	if (nextBtn) nextBtn.addEventListener('click', () => {
		viewMonth++;
		if (viewMonth > 11) { viewMonth = 0; viewYear++; }
		refresh();
	});

	// Event pill clicks → popup
	container.querySelectorAll('.calendar-grid__pill').forEach(pill => {
		pill.addEventListener('click', () => showEventPopup(Number(pill.dataset.eventIdx)));
	});

	// "+N more" → switch to list view
	container.querySelectorAll('[data-switch-list]').forEach(btn => {
		btn.addEventListener('click', () => {
			currentView = 'list';
			refresh();
		});
	});
};

// ── Initialization ────────────────────────────────────────────────

const renderEvents = (items) => {
	allEvents = items;
	const container = document.getElementById('events-container');
	const loading = document.getElementById('events-loading');
	const summary = document.getElementById('events-summary');
	if (!container || !loading) return;

	loading.hidden = true;

	if (items.length && summary) {
		const groups = groupByMonth(items);
		const count = items.length;
		const monthCount = groups.size;
		const evtWord = count === 1 ? 'event' : 'events';
		const text = monthCount === 1
			? `${count} upcoming ${evtWord} this month`
			: `${count} upcoming ${evtWord} across ${monthCount} months`;
		summary.innerHTML = `<span class="icon solid fa-calendar-days" aria-hidden="true"></span> ${text}`;
		summary.hidden = false;
	}

	container.hidden = false;
	refresh();
};

const showError = (msg) => {
	const loading = document.getElementById('events-loading');
	const errorEl = document.getElementById('events-error');
	if (loading) loading.hidden = true;
	if (errorEl) {
		errorEl.textContent = msg;
		errorEl.hidden = false;
	}
};

const loadEvents = async () => {
	if (!CALENDAR_API_KEY) {
		showError('Calendar events are temporarily unavailable. Please use the full calendar link below.');
		return;
	}

	// Start from the beginning of the current month so the month grid is fully populated
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	const timeMin = encodeURIComponent(monthStart.toISOString());
	const calId = encodeURIComponent(CALENDAR_ID);
	const url =
		`https://www.googleapis.com/calendar/v3/calendars/${calId}/events` +
		`?key=${encodeURIComponent(CALENDAR_API_KEY)}` +
		`&timeMin=${timeMin}` +
		`&maxResults=${MAX_EVENTS}` +
		`&singleEvents=true&orderBy=startTime`;

	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();
		const items = (data.items || []).filter(ev => ev.visibility !== 'private' && ev.visibility !== 'confidential');
		renderEvents(items);
	} catch (err) {
		console.error('[calendar-events]', err);
		showError('Unable to load events right now. Please try the full calendar link below.');
	}
};

document.addEventListener('DOMContentLoaded', loadEvents);

