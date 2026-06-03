// @ts-check
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectLanguage } from '../../assets/js/lang-utils.js';

describe('detectLanguage', () => {
	it('returns stored lang when it is a valid known code', () => {
		assert.strictEqual(detectLanguage('en', 'ko-KR'), 'en');
		assert.strictEqual(detectLanguage('ko', 'en-US'), 'ko');
		assert.strictEqual(detectLanguage('es', 'en-US'), 'es');
	});

	it('ignores stored lang when it is not a valid code', () => {
		assert.strictEqual(detectLanguage('fr', 'en-US'), 'en');
		assert.strictEqual(detectLanguage(null, 'en-US'), 'en');
	});

	it('detects Korean from navigator.language when no stored pref', () => {
		assert.strictEqual(detectLanguage(null, 'ko-KR'), 'ko');
		assert.strictEqual(detectLanguage(null, 'ko'), 'ko');
	});

	it('detects Spanish from navigator.language when no stored pref', () => {
		assert.strictEqual(detectLanguage(null, 'es-ES'), 'es');
		assert.strictEqual(detectLanguage(null, 'es-MX'), 'es');
	});

	it('falls back to English for an unrecognised navigator.language', () => {
		assert.strictEqual(detectLanguage(null, 'fr-FR'), 'en');
		assert.strictEqual(detectLanguage(null, 'zh-CN'), 'en');
	});

	it('handles English navigator.language variants', () => {
		assert.strictEqual(detectLanguage(null, 'en'), 'en');
		assert.strictEqual(detectLanguage(null, 'en-GB'), 'en');
		assert.strictEqual(detectLanguage(null, 'en-AU'), 'en');
	});
});
