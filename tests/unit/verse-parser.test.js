// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseVerseAndReference, BIBLE_BOOK_PATTERN } from '../../assets/js/verse-utils.js';

describe('BIBLE_BOOK_PATTERN', () => {
	it('is a non-empty string', () => {
		assert.strictEqual(typeof BIBLE_BOOK_PATTERN, 'string');
		assert.ok(BIBLE_BOOK_PATTERN.length > 0);
	});

	it('matches a canonical book name', () => {
		const re = new RegExp(BIBLE_BOOK_PATTERN, 'i');
		assert.match('Genesis', re);
		assert.match('Revelation', re);
		assert.match('1 Corinthians', re);
	});
});

describe('parseVerseAndReference', () => {
	it('returns null for falsy input', () => {
		assert.strictEqual(parseVerseAndReference(null), null);
		assert.strictEqual(parseVerseAndReference(undefined), null);
		assert.strictEqual(parseVerseAndReference(''), null);
	});

	it('returns null when no Bible reference is found', () => {
		assert.strictEqual(parseVerseAndReference('No book name here at all.'), null);
	});

	it('parses a simple verse and reference', () => {
		const result = parseVerseAndReference('For God so loved the world. John 3:16');
		assert.ok(result !== null);
		assert.strictEqual(result.reference, 'John 3:16');
		assert.ok(result.text.includes('For God so loved the world'));
	});

	it('wraps verse text in double quotes with a trailing period', () => {
		const result = parseVerseAndReference('Trust in the Lord. Proverbs 3:5');
		assert.ok(result !== null);
		assert.ok(result.text.startsWith('"'));
		assert.ok(result.text.endsWith('."'));
	});

	it('picks the last reference when multiple are present', () => {
		const result = parseVerseAndReference('See also Genesis 1:1 and then consider Romans 8:28');
		assert.ok(result !== null);
		assert.strictEqual(result.reference, 'Romans 8:28');
	});

	it('handles a range reference with an en-dash', () => {
		const result = parseVerseAndReference('He is risen. Mark 16:6\u20137');
		assert.ok(result !== null);
		assert.ok(result.reference.startsWith('Mark 16:6'));
	});

	it('handles a range reference with a hyphen', () => {
		const result = parseVerseAndReference('Grace and peace. Ephesians 1:2-3');
		assert.ok(result !== null);
		assert.ok(result.reference.startsWith('Ephesians 1:2'));
	});
});
