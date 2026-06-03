// @ts-check
/*
	© CKSDA Church
	cksda.church/
*/

/**
 * Regex alternation of every canonical Bible book name.
 * Used by parseVerseAndReference to locate book + chapter:verse patterns.
 */
export const BIBLE_BOOK_PATTERN = '(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\\s*Samuel|2\\s*Samuel|1\\s*Kings|2\\s*Kings|1\\s*Chronicles|2\\s*Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song\\s+of\\s+Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\\s*Corinthians|2\\s*Corinthians|Galatians|Ephesians|Philippians|Colossians|1\\s*Thessalonians|2\\s*Thessalonians|1\\s*Timothy|2\\s*Timothy|Titus|Philemon|Hebrews|James|1\\s*Peter|2\\s*Peter|1\\s*John|2\\s*John|3\\s*John|Jude|Revelation)';

/**
 * Parse a Bible reference and verse text from raw devotional paragraph text.
 * The last Bible citation in the text is treated as the reference; everything
 * before it (trimmed) becomes the verse body.
 *
 * @param {string|null|undefined} rawText - Raw paragraph text from the devotional page.
 * @returns {{ reference: string, text: string }|null} Parsed entry or null if no match found.
 */
export const parseVerseAndReference = (rawText) => {
	if (!rawText) return null;

	const clean = rawText.replace(/\s+/g, ' ').trim();
	const refRegex = new RegExp(`${BIBLE_BOOK_PATTERN}\\s+\\d{1,3}:\\d{1,3}(?:[-\u2013]\\d{1,3})?`, 'gi');
	const matches = [...clean.matchAll(refRegex)];
	if (!matches.length) return null;

	const lastMatch = matches[matches.length - 1];
	const reference = lastMatch[0].replace(/\s+/g, ' ').trim();
	const verseText = clean.slice(0, lastMatch.index).trim().replace(/[\s.]+$/, '');

	if (!verseText || !reference) return null;

	return {
		reference,
		text: `"${verseText}."`
	};
};
