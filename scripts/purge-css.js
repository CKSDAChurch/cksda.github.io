/**
 * scripts/purge-css.js
 *
 * Lightweight CSS dead-rule eliminator — no external dependencies.
 * Removes CSS rules whose selectors contain ONLY class names that do not
 * appear anywhere in the supplied content files. Conservative by design:
 *   - All @-rules (including their nested content) are kept as-is.
 *   - Any rule that has a non-class component in any selector is kept.
 *   - Multi-selector rules are kept if ANY selector is "safe" to keep.
 *   - Dynamically-injected class names are covered by scanning JS sources.
 *
 * Usage (called from build.js after esbuild):
 *   import { purgeFile } from './purge-css.js';
 *   await purgeFile('assets/css/main.min.css', ['index.html', ...allHtml]);
 */

import fs from 'fs';

/** @param {string} html  @returns {Set<string>} */
function extractTokens(html) {
	const tokens = new Set();
	// class="foo bar baz", className="x y", classList.add("y"), 'data-x', etc.
	const patterns = [
		/class\s*=\s*['"`]([^'"`]+)['"`]/g,
		/className\s*=\s*['"`]([^'"`]+)['"`]/g,
		/classList\.(?:add|remove|toggle|replace|contains)\s*\(\s*['"`]([^'"`]+)['"`]/g,
		/['"`]\s*([\w-][\w-]*)\s*['"`]/g,   // any quoted identifier (broad safelist)
	];
	for (const re of patterns) {
		for (const m of html.matchAll(re)) {
			m[1].split(/\s+/).forEach(t => t && tokens.add(t));
		}
	}
	return tokens;
}

/**
 * Advance index past the end of a CSS block starting at `start`
 * (where `css[start]` must be `{`).  Handles nested braces and strings.
 * @param {string} css
 * @param {number} start  Index of the opening `{`
 * @returns {number}  Index just after the closing `}`
 */
function skipBlock(css, start) {
	let depth = 0;
	let inStr = false;
	let strCh = '';
	for (let i = start; i < css.length; i++) {
		const c = css[i];
		if (inStr) {
			if (c === strCh && css[i - 1] !== '\\') inStr = false;
			continue;
		}
		if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
		if (c === '{') depth++;
		else if (c === '}') { if (--depth === 0) return i + 1; }
	}
	return css.length;
}

/**
 * Return true when selector does NOT need to be dropped.
 * We keep a selector (and therefore its rule) if:
 *   - it contains any non-class component (element, ID, pseudo, attribute, *)
 *   - OR any of its class names appear in usedTokens
 * @param {string} sel
 * @param {Set<string>} usedTokens
 */
function selectorIsUsed(sel, usedTokens) {
	// Strip pseudo-classes/elements and attribute selectors for analysis
	const stripped = sel.replace(/::?[\w-]+(\([^)]*\))?/g, '')
	                     .replace(/\[[^\]]*\]/g, '')
	                     .trim();
	// If anything other than classes and whitespace/combinators remains → keep
	if (/[a-zA-Z*#]/.test(stripped.replace(/\.[\w-]+/g, ''))) return true;
	// Extract class names and check against used tokens
	const classes = [...stripped.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
	if (!classes.length) return true;   // no class at all — keep
	return classes.some(c => usedTokens.has(c));
}

/**
 * Remove CSS rules whose selectors are entirely composed of unknown classes.
 * Preserves all @-rules and their nested blocks verbatim.
 * @param {string} css
 * @param {Set<string>} usedTokens
 * @returns {{ css: string, removed: number }}
 */
export function purge(css, usedTokens) {
	let out = '';
	let i = 0;
	let removed = 0;

	while (i < css.length) {
		// Skip leading whitespace
		const wsStart = i;
		while (i < css.length && /\s/.test(css[i])) i++;
		if (i >= css.length) { out += css.slice(wsStart); break; }
		out += css.slice(wsStart, i);

		// @-rule — keep verbatim
		if (css[i] === '@') {
			const semi = css.indexOf(';', i);
			const brace = css.indexOf('{', i);
			if (semi !== -1 && (brace === -1 || semi < brace)) {
				out += css.slice(i, semi + 1);
				i = semi + 1;
			} else if (brace !== -1) {
				const end = skipBlock(css, brace);
				out += css.slice(i, end);
				i = end;
			} else {
				out += css.slice(i);
				break;
			}
			continue;
		}

		// Regular rule: read selector up to `{`
		const braceIdx = css.indexOf('{', i);
		if (braceIdx === -1) { out += css.slice(i); break; }

		const selector = css.slice(i, braceIdx).trim();
		const blockEnd = skipBlock(css, braceIdx);
		const fullRule = css.slice(i, blockEnd);

		// Multi-selector: keep if ANY individual selector is used
		const selectors = selector.split(',').map(s => s.trim());
		const keep = selectors.some(s => selectorIsUsed(s, usedTokens));

		if (keep) {
			out += fullRule;
		} else {
			removed++;
		}
		i = blockEnd;
	}

	return { css: out, removed };
}

/**
 * Read content files, build token set, purge the given CSS file in place.
 * @param {string} cssFile   Path to the minified CSS file to purge.
 * @param {string[]} contentFiles  HTML/JS files whose tokens should be whitelisted.
 */
export async function purgeFile(cssFile, contentFiles) {
	const usedTokens = new Set();
	for (const f of contentFiles) {
		if (!fs.existsSync(f)) continue;
		extractTokens(fs.readFileSync(f, 'utf8')).forEach(t => usedTokens.add(t));
	}

	const original = fs.readFileSync(cssFile, 'utf8');
	const { css: purged, removed } = purge(original, usedTokens);

	if (removed > 0) {
		fs.writeFileSync(cssFile, purged, 'utf8');
		const saved = original.length - purged.length;
		console.log(`  Purged ${cssFile}: -${removed} rules, -${saved} bytes`);
	} else {
		console.log(`  Purged ${cssFile}: nothing removed`);
	}
}
