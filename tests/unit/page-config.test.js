// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPageConfig } from '../../assets/js/page-config.js';

/**
 * Stub pageMatches — returns true when the current page path ends with the given suffix.
 * @param {string} currentPage - The page filename to simulate (e.g. 'calendar.html').
 */
function makeHelpers(currentPage) {
	return {
		pageMatches: (/** @type {string} */ suffix) => currentPage.endsWith(suffix),
	};
}

describe('buildPageConfig', () => {
	it('returns an object with expected page keys', () => {
		const config = buildPageConfig(makeHelpers('index.html'));
		const expectedKeys = ['calendar', 'children', 'collegiate', 'epoch', 'music',
			'pathfinders', 'personalMinistries', 'youngAdults', 'index'];
		for (const key of expectedKeys) {
			assert.ok(key in config, `Missing page config key: ${key}`);
		}
	});

	it('each page entry has match, title, subtitle, and init functions', () => {
		const config = buildPageConfig(makeHelpers('index.html'));
		for (const [page, entry] of Object.entries(config)) {
			assert.strictEqual(typeof entry.match, 'function', `${page}.match is not a function`);
			assert.strictEqual(typeof entry.title, 'function', `${page}.title is not a function`);
			assert.strictEqual(typeof entry.subtitle, 'function', `${page}.subtitle is not a function`);
			assert.strictEqual(typeof entry.init, 'function', `${page}.init is not a function`);
		}
	});

	it('calendar.match returns true only for calendar page', () => {
		const calendarHelpers = makeHelpers('calendar.html');
		const indexHelpers = makeHelpers('index.html');

		const calendarConfig = buildPageConfig(calendarHelpers);
		const indexConfig = buildPageConfig(indexHelpers);

		// pageMatches stubs: calendar URLs end with 'calendar.html'
		// We pass a dummy urls object where calendarURL ends with 'calendar.html'
		assert.strictEqual(calendarConfig.calendar.match({ calendarURL: 'calendar.html' }), true);
		assert.strictEqual(indexConfig.calendar.match({ calendarURL: 'calendar.html' }), false);
	});

	it('index.match always returns true (catch-all)', () => {
		const config = buildPageConfig(makeHelpers('any-page.html'));
		assert.strictEqual(config.index.match({}), true);
	});
});
