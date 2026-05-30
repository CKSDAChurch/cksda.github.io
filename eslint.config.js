const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
	{
		files: ['eslint.config.js', 'playwright.config.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'commonjs',
			globals: {
				...globals.node
			}
		}
	},
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
		files: ['assets/js/**/*.js', 'tests/**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'script',
			globals: {
				...globals.browser,
				...globals.node,
				breakpoints: 'readonly',
				gtag: 'readonly',
				YT: 'readonly',
				lang: 'readonly'
			}
		},
		rules: {
			'no-var': 'off',
			'prefer-const': 'off',
			'no-useless-escape': 'off',
			'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }]
		}
	},
	{
		files: ['assets/js/newsletter.js'],
		languageOptions: {
			globals: {
				getNextScheduledVideoFromPlaylist: 'readonly',
				getLatestVideoFromPlaylist: 'readonly'
			}
		}
	}
];
