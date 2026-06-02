'use strict';
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

const esbuild = require('esbuild');
const sharp = require('sharp');

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

const cssFiles = ['main', 'lightmode', 'darkmode', 'menu', 'newsletter', 'pathfinders'];
const jsFiles  = ['page-config', 'main', 'analytics', 'consent', 'newsletter'];

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
        generateIcon('#3e8391', 'images/logo-light.png', 192, 'images/icon-light-192.png'),
        generateIcon('#3e8391', 'images/logo-light.png', 512, 'images/icon-light-512.png'),
        generateIcon('#042D2D', 'images/logo-light.png', 192, 'images/icon-dark-192.png'),
        generateIcon('#042D2D', 'images/logo-light.png', 512, 'images/icon-dark-512.png'),
    ]);
    console.log('PWA icons generated.');

    const tasks = [
        ...cssFiles.map(name => esbuild.build({
            entryPoints: [`assets/css/${name}.css`],
            minify: true,
            outfile: `assets/css/${name}.min.css`,
        })),
        ...jsFiles.map(name => esbuild.build({
            entryPoints: [`assets/js/${name}.js`],
            minify: true,
            outfile: `assets/js/${name}.min.js`,
        })),
        // youtube.js is built last with the API key injected at the esbuild level.
        // __YOUTUBE_API_KEY__ is a bare identifier in the source; esbuild replaces it
        // with the JSON-stringified key value before the minifier runs.
        esbuild.build({
            entryPoints: ['assets/js/youtube.js'],
            minify: true,
            outfile: 'assets/js/youtube.min.js',
            define: {
                __YOUTUBE_API_KEY__: JSON.stringify(apiKey),
            },
        }),
        // calendar-events.js — __CALENDAR_API_KEY__ is injected the same way.
        esbuild.build({
            entryPoints: ['assets/js/calendar-events.js'],
            minify: true,
            outfile: 'assets/js/calendar-events.min.js',
            define: {
                __CALENDAR_API_KEY__: JSON.stringify(calendarApiKey),
            },
        }),
    ];

    await Promise.all(tasks);
    console.log('Build complete.');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
