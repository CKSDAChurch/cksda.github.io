// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
	testDir: './tests',
	reporter: [['html', { open: 'on-failure' }]],
	use: {
		baseURL: 'http://localhost:4321',
		screenshot: 'only-on-failure',
	},
	// Run the same tests at three common phone widths
	projects: [
		{ name: 'iPhone SE',  use: { viewport: { width: 375, height: 667  } } },
		{ name: 'iPhone 14',  use: { viewport: { width: 390, height: 844  } } },
		{ name: 'Pixel 7',    use: { viewport: { width: 412, height: 915  } } },
	],
	webServer: {
		command: 'npx http-server . -p 4321 --cors -c-1 --silent',
		port: 4321,
		reuseExistingServer: true,
		timeout: 10000,
	},
});
