import js from '@eslint/js';
import globals from 'globals';

export default [
	{
		ignores: [
			'assets/js/*.min.js',
			'assets/css/*.min.css',
			'playwright-report/**',
			'test-results/**',
			'node_modules/**'
		]
	},
	js.configs.recommended,
	{
		// Config files and build scripts — ESM (Node, package.json "type":"module")
		files: ['eslint.config.js', 'scripts/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.node
			}
		}
	},
	{
		// Classic (non-module) browser scripts: loaded as plain <script> or var-based
		files: ['assets/js/analytics.js', 'assets/js/consent.js', 'sw.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'script',
			globals: {
				...globals.browser,
				gtag: 'readonly',
				YT: 'readonly'
			}
		},
		rules: {
			'no-var': 'off',
			'prefer-const': 'off',
			'no-useless-escape': 'off',
			'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }]
		}
	},
	{
		// ES module source files — bundled by esbuild, loaded via <script type="module">
		files: [
			'assets/js/main.js',
			'assets/js/newsletter.js',
			'assets/js/youtube.js',
			'assets/js/page-config.js',
			'assets/js/lang-utils.js',
			'assets/js/verse-utils.js',
			'assets/js/calendar-events.js',
			'assets/js/web-vitals.js',
			'assets/js/daily.js',
			'assets/js/fcm-push.js'
		],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.browser,
				gtag: 'readonly',
				YT: 'readonly',
				__YOUTUBE_API_KEY__: 'readonly',
				__CALENDAR_API_KEY__: 'readonly'
			}
		},
		rules: {
			'no-var': 'off',
			'prefer-const': 'off',
			'no-useless-escape': 'off',
			'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }]
		}
	},
	{
		// Firebase Cloud Functions — ESM (Node 18+, has fetch + console built-in)
		files: ['functions/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.node,
				fetch: 'readonly'
			}
		}
	},
	{
		// Unit tests — ESM (node:test runner)
		files: ['tests/unit/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.node
			}
		}
	},
	{
		// Playwright spec files — ESM
		files: ['tests/*.spec.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				...globals.node,
				...globals.browser
			}
		}
	},
	{
		// Playwright config — CJS (.cjs)
		files: ['playwright.config.cjs'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'commonjs',
			globals: {
				...globals.node
			}
		}
	}
];
