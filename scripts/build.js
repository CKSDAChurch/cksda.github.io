/**
 * Build script — minifies all CSS and JS assets.
 *
 * For youtube.js the API key is injected via esbuild's `define` option so the
 * substitution happens *before* minification.  This means the minified output
 * format never matters; there is no regex patching of already-built files.
 *
 * Usage:
 *   npm run build                          # local dev (no key, YouTube calls will fail)
 *   YOUTUBE_API_KEY=<key> npm run build    # production / CI
 */

import esbuild from 'esbuild';
import sharp from 'sharp';
import fs from 'node:fs';
import { purgeFile } from './purge-css.js';

const apiKey = process.env.YOUTUBE_API_KEY || '';
const calendarApiKey = process.env.CALENDAR_API_KEY || '';

if (!apiKey) {
    if (process.env.CI) {
        console.error('Error: YOUTUBE_API_KEY secret is not set.');
        process.exit(1);
    } else {
        console.warn('Warning: YOUTUBE_API_KEY is not set — YouTube API calls will not work in this build.');
    }
}

if (!calendarApiKey) {
    if (process.env.CI) {
        console.error('Error: CALENDAR_API_KEY secret is not set.');
        process.exit(1);
    } else {
        console.warn('Warning: CALENDAR_API_KEY is not set — calendar events will not load in this build.');
    }
}

// These are bundled standalone (no @import resolution needed).
const cssFiles = ['main', 'lightmode', 'darkmode', 'menu', 'newsletter', 'pathfinders'];
// analytics.js stays as a classic (non-ESM) synchronous script so consent-mode fires early.
const classicJsFiles = ['analytics'];
// consent.js is a deferred ESM module (loaded with type="module" in HTML).
const esmJsFiles = ['consent'];

/**
 * Generate a PWA icon with a solid background colour and the white logo
 * composited on top with maskable-safe padding (15 % each side → 70 % logo).
 *
 * Light icon: newsletter teal   #3e8391 background + white logo
 * Dark  icon: newsletter dark   #042D2D background + white logo
 */
async function generateIcon(bgHex, logoFile, size, outFile) {
    const pad   = Math.round(size * 0.15);
    const inner = size - pad * 2;

    // Parse hex colour → RGBA object for sharp
    const r = parseInt(bgHex.slice(1, 3), 16);
    const g = parseInt(bgHex.slice(3, 5), 16);
    const b = parseInt(bgHex.slice(5, 7), 16);

    const bg   = await sharp({ create: { width: size, height: size, channels: 4, background: { r, g, b, alpha: 1 } } }).png().toBuffer();
    const logo = await sharp(logoFile).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

    await sharp(bg).composite([{ input: logo, gravity: 'centre' }]).png().toFile(outFile);
}

async function build() {
    // Generate adaptive PWA icons — light and dark variants, 192 and 512 px.
    await Promise.all([
        generateIcon('#3e8391', 'assets/images/logo-light.png', 192, 'assets/images/icon-light-192.png'),
        generateIcon('#3e8391', 'assets/images/logo-light.png', 512, 'assets/images/icon-light-512.png'),
        generateIcon('#042D2D', 'assets/images/logo-light.png', 192, 'assets/images/icon-dark-192.png'),
        generateIcon('#042D2D', 'assets/images/logo-light.png', 512, 'assets/images/icon-dark-512.png'),
    ]);
    console.log('PWA icons generated.');

    const tasks = [
        ...cssFiles.map(name => esbuild.build({
            entryPoints: [`assets/css/${name}.css`],
            minify: true,
            outfile: `assets/css/${name}.min.css`,
        })),
        ...classicJsFiles.map(name => esbuild.build({
            entryPoints: [`assets/js/${name}.js`],
            minify: true,
            outfile: `assets/js/${name}.min.js`,
        })),
        ...esmJsFiles.map(name => esbuild.build({
            entryPoints: [`assets/js/${name}.js`],
            minify: true,
            format: 'esm',
            outfile: `assets/js/${name}.min.js`,
        })),
        // main.js bundles page-config.js; output is ESM, loaded via <script type="module">.
        esbuild.build({
            entryPoints: ['assets/js/main.js'],
            bundle: true,
            minify: true,
            format: 'esm',
            outfile: 'assets/js/main.min.js',
        }),
        // youtube.js — standalone ESM bundle for index.html; API key injected at build time.
        esbuild.build({
            entryPoints: ['assets/js/youtube.js'],
            bundle: true,
            minify: true,
            format: 'esm',
            outfile: 'assets/js/youtube.min.js',
            define: {
                __YOUTUBE_API_KEY__: JSON.stringify(apiKey),
            },
        }),
        // newsletter.js bundles youtube.js and verse-utils.js; API key also injected here.
        esbuild.build({
            entryPoints: ['assets/js/newsletter.js'],
            bundle: true,
            minify: true,
            format: 'esm',
            outfile: 'assets/js/newsletter.min.js',
            define: {
                __YOUTUBE_API_KEY__: JSON.stringify(apiKey),
            },
        }),
        // calendar-events.js — __CALENDAR_API_KEY__ is injected the same way.
        esbuild.build({
            entryPoints: ['assets/js/calendar-events.js'],
            bundle: true,
            minify: true,
            format: 'esm',
            outfile: 'assets/js/calendar-events.min.js',
            define: {
                __CALENDAR_API_KEY__: JSON.stringify(calendarApiKey),
            },
        }),
        // web-vitals.js — standalone ESM module; no external imports.
        esbuild.build({
            entryPoints: ['assets/js/web-vitals.js'],
            minify: true,
            format: 'esm',
            outfile: 'assets/js/web-vitals.min.js',
        }),
    ];

    await Promise.all(tasks);

    // ── CSS purge: remove unused class rules per page group ──────────────────
    // All root HTML pages that load shared styles.
    const allHtml = fs.readdirSync('.')
        .filter(file => file.toLowerCase().endsWith('.html'));
    // JS sources that may inject class names dynamically.
    const allJs = [
        'assets/js/main.js', 'assets/js/page-config.js', 'assets/js/consent.js',
        'assets/js/analytics.js', 'assets/js/youtube.js', 'assets/js/calendar-events.js',
    ];
    console.log('Purging unused CSS…');
    await Promise.all([
        // main.min.css — used by all pages
        purgeFile('assets/css/main.min.css',       [...allHtml, ...allJs]),
        // lightmode/darkmode/menu are @imported by main.min.css at runtime
        purgeFile('assets/css/lightmode.min.css',  [...allHtml, ...allJs]),
        purgeFile('assets/css/darkmode.min.css',   [...allHtml, ...allJs]),
        purgeFile('assets/css/menu.min.css',       [...allHtml, ...allJs]),
        // newsletter.min.css — used only by newsletter.html
        purgeFile('assets/css/newsletter.min.css', [
            'newsletter.html',
            'assets/js/newsletter.js', 'assets/js/verse-utils.js', 'assets/js/youtube.js',
        ]),
        // pathfinders.min.css — used only by pathfinders.html
        purgeFile('assets/css/pathfinders.min.css', ['pathfinders.html', ...allJs]),
    ]);

    console.log('Build complete.');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
