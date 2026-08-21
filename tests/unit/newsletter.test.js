// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatSermonLine, extractSpeakerFromTitle } from '../../assets/js/newsletter.js';

describe('newsletter helper utilities', () => {
	it('formats a sermon line using speaker only when title is missing', () => {
		const result = formatSermonLine('Pastor Yang', null, '11:20am');
		assert.strictEqual(result, 'Pastor Yang will be sharing a message with us, starting at 11:20am.');
	});

	it('formats a sermon line using title and speaker when both are present', () => {
		const result = formatSermonLine('Pastor Yang', 'A Special Message', '11:20am');
		assert.strictEqual(result, 'Pastor Yang will be sharing a message with us titled "A Special Message", starting at 11:20am.');
	});

	it('extracts the speaker from a title containing only a name', () => {
		const result = extractSpeakerFromTitle('Pastor Yang');
		assert.strictEqual(result, 'Pastor Yang');
	});
});
