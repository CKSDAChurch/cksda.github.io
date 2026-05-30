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

const apiKey = process.env.YOUTUBE_API_KEY || '';

if (!apiKey) {
    if (process.env.CI) {
        console.error('Error: YOUTUBE_API_KEY secret is not set.');
        process.exit(1);
    } else {
        console.warn('Warning: YOUTUBE_API_KEY is not set — YouTube API calls will not work in this build.');
    }
}

const cssFiles = ['main', 'lightmode', 'darkmode', 'menu', 'newsletter', 'pathfinders'];
const jsFiles  = ['page-config', 'main', 'analytics', 'consent', 'newsletter'];

async function build() {
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
    ];

    await Promise.all(tasks);
    console.log('Build complete.');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
