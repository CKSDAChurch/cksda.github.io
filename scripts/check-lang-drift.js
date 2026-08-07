// @ts-check
/*
	© CKSDA Church
	cksda.church/

	check-lang-drift.js — CI script.

	Compares the key structure of assets/langStrings/es.json and ko.json against
	the canonical assets/langStrings/en.json, and fails (non-zero exit) if any
	keys are missing or extra. Catches broken translations before they ship.
*/

import { readFileSync } from 'fs';

const LANG_DIR = 'assets/langStrings';
const BASE_LANG = 'en';
const COMPARE_LANGS = ['es', 'ko'];

/** @param {string} lang */
const readLangFile = (lang) => JSON.parse(readFileSync(`${LANG_DIR}/${lang}.json`, 'utf8'));

// Recursively collects dot-notated leaf key paths from a nested translation object.
/** @param {Record<string, unknown>} obj @param {string} prefix @returns {Set<string>} */
const collectKeys = (obj, prefix = '') => {
	const keys = new Set();
	for (const [key, value] of Object.entries(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (value && typeof value === 'object' && !Array.isArray(value)) {
			for (const nested of collectKeys(/** @type {Record<string, unknown>} */(value), path)) keys.add(nested);
		} else {
			keys.add(path);
		}
	}
	return keys;
};

const baseKeys = collectKeys(readLangFile(BASE_LANG));
let hasDrift = false;

for (const lang of COMPARE_LANGS) {
	const langKeys = collectKeys(readLangFile(lang));
	const missing = [...baseKeys].filter((key) => !langKeys.has(key));
	const extra = [...langKeys].filter((key) => !baseKeys.has(key));

	if (missing.length === 0 && extra.length === 0) {
		console.log(`✓ ${lang}.json matches ${BASE_LANG}.json key structure.`);
		continue;
	}

	hasDrift = true;
	console.error(`✗ ${lang}.json has key drift from ${BASE_LANG}.json:`);
	if (missing.length) console.error(`  Missing keys: ${missing.join(', ')}`);
	if (extra.length) console.error(`  Extra keys: ${extra.join(', ')}`);
}

if (hasDrift) {
	console.error('\nTranslation drift detected — update the language JSON files so their key structure matches.');
	process.exit(1);
}

console.log('\nAll language files match key structure.');
