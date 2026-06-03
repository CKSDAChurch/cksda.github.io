// @ts-check
/*
	Web Vitals → GA4 reporter
	Measures LCP, CLS, INP, TTFB, and FCP via native PerformanceObserver APIs
	and sends each metric to GA4 once the page is hidden or unloaded.
	Relies on window.gtag (set up by analytics.js); if consent is denied GA4
	will silently discard the events — no extra consent check needed here.
*/

/**
 * GA4 Core Web Vitals thresholds (milliseconds, except CLS which is unitless).
 * @type {Record<string, [number, number]>}
 */
const THRESHOLDS = {
	LCP:  [2500, 4000],
	CLS:  [0.1,  0.25],
	INP:  [200,  500],
	TTFB: [800,  1800],
	FCP:  [1800, 3000],
};

/**
 * @param {string} name
 * @param {number} value
 * @returns {'good'|'needs-improvement'|'poor'}
 */
const getRating = (name, value) => {
	const [good, poor] = THRESHOLDS[name] || [0, 0];
	return value <= good ? 'good' : value <= poor ? 'needs-improvement' : 'poor';
};

/**
 * Send one metric to GA4.
 * @param {string} name  Metric name (e.g. 'LCP')
 * @param {number} value Raw value in ms (CLS in ms × 1000)
 */
const send = (name, value) => {
	if (typeof window.gtag !== 'function') return;
	const rounded = Math.round(name === 'CLS' ? value * 1000 : value);
	window.gtag('event', name, {
		value:          rounded,
		metric_rating:  getRating(name, value),
		non_interaction: true,
	});
};

// ── TTFB ─────────────────────────────────────────────────────────────────────
// Available immediately after load from the navigation timing entry.
const reportTTFB = () => {
	/** @type {PerformanceNavigationTiming[]} */
	const entries = /** @type {any} */ (performance.getEntriesByType('navigation'));
	if (!entries.length) return;
	const nav = entries[0];
	// responseStart is relative to the time origin (navigation start).
	if (nav.responseStart > 0) send('TTFB', nav.responseStart);
};

// ── FCP ──────────────────────────────────────────────────────────────────────
const reportFCP = () => {
	if (!('PerformanceObserver' in window)) return;
	try {
		const po = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				if (entry.name === 'first-contentful-paint') {
					send('FCP', entry.startTime);
					po.disconnect();
				}
			}
		});
		po.observe({ type: 'paint', buffered: true });
	} catch (_) { /* not supported */ }
};

// ── LCP ──────────────────────────────────────────────────────────────────────
// LCP can be updated many times; report the latest value at page hide.
const reportLCP = () => {
	if (!('PerformanceObserver' in window)) return;
	let lcpValue = 0;
	try {
		const po = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const last = entries[entries.length - 1];
			if (last) lcpValue = last.startTime;
		});
		po.observe({ type: 'largest-contentful-paint', buffered: true });
		const report = () => {
			if (lcpValue > 0) send('LCP', lcpValue);
			po.disconnect();
		};
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') report();
		}, { once: true });
		document.addEventListener('pagehide', report, { once: true });
	} catch (_) { /* not supported */ }
};

// ── CLS ──────────────────────────────────────────────────────────────────────
// Uses the windowed CLS approach: sessions separated by >1 s gaps; report max.
const reportCLS = () => {
	if (!('PerformanceObserver' in window)) return;
	let maxCLS = 0;
	let windowCLS = 0;
	let prevTime = 0;
	try {
		const po = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const e = /** @type {any} */ (entry);
				if (e.hadRecentInput) continue;
				if (prevTime && e.startTime - prevTime > 1000) windowCLS = 0;
				windowCLS += e.value;
				prevTime = e.startTime;
				if (windowCLS > maxCLS) maxCLS = windowCLS;
			}
		});
		po.observe({ type: 'layout-shift', buffered: true });
		const report = () => {
			send('CLS', maxCLS);
			po.disconnect();
		};
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') report();
		}, { once: true });
		document.addEventListener('pagehide', report, { once: true });
	} catch (_) { /* not supported */ }
};

// ── INP ──────────────────────────────────────────────────────────────────────
// Approximates INP as the 98th-percentile event duration.
const reportINP = () => {
	if (!('PerformanceObserver' in window)) return;
	/** @type {number[]} */
	const durations = [];
	try {
		const po = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const e = /** @type {any} */ (entry);
				// Only count pointer/keyboard interactions (excludes scroll noise).
				if (['pointerdown', 'pointerup', 'click', 'keydown', 'keyup'].includes(e.name)) {
					durations.push(e.duration);
				}
			}
		});
		po.observe({ type: 'event', durationThreshold: 40, buffered: true });
		const report = () => {
			if (!durations.length) return;
			durations.sort((a, b) => a - b);
			const idx = Math.min(Math.floor(durations.length * 0.98), durations.length - 1);
			send('INP', durations[idx]);
			po.disconnect();
		};
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') report();
		}, { once: true });
		document.addEventListener('pagehide', report, { once: true });
	} catch (_) { /* not supported */ }
};

// ── Bootstrap ────────────────────────────────────────────────────────────────
const init = () => {
	reportTTFB();
	reportFCP();
	reportLCP();
	reportCLS();
	reportINP();
};

if (document.readyState === 'complete') {
	init();
} else {
	window.addEventListener('load', init);
}
