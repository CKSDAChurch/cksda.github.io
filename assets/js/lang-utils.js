// @ts-check
/*
	© CKSDA Church
	cksda.church/
*/

/**
 * Detect the UI language from the stored preference and navigator.language.
 * Pure function — no browser side effects; safe to import in Node.js unit tests.
 *
 * @param {string|null} stored - Value from localStorage('cksda-lang'), or null.
 * @param {string} navigatorLang - Value of navigator.language.
 * @returns {'en'|'ko'|'es'}
 */
export const detectLanguage = (stored, navigatorLang) => {
	if (stored === 'ko' || stored === 'es' || stored === 'en') return stored;
	if (navigatorLang.startsWith('ko')) return 'ko';
	if (navigatorLang.startsWith('es')) return 'es';
	if (!navigatorLang.startsWith('en')) console.warn(`[i18n] No translation available for "${navigatorLang}"; falling back to English.`);
	return 'en';
};
