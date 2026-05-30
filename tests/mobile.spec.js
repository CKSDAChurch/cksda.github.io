// @ts-check
const { test, expect } = require('@playwright/test');

// Helper: wait for main.js to inject the header nav
async function waitForHeader(page) {
	await page.waitForSelector('#header .url-list', { timeout: 5000 });
}

// Helper: wait for main.js to inject the footer
async function waitForFooter(page) {
	await page.waitForSelector('#footer ul.icons', { timeout: 5000 });
}

// ─── Shared: no horizontal scroll ─────────────────────────────────────────────

const ALL_PAGES = [
	{ label: 'index',        path: '/'                      },
	{ label: 'calendar',     path: '/calendar.html'         },
	{ label: 'epoch',        path: '/epoch.html'            },
	{ label: 'music',        path: '/music.html'            },
	{ label: 'pathfinders',  path: '/pathfinders.html'      },
];

for (const { label, path } of ALL_PAGES) {
	test(`${label} - no horizontal scroll`, async ({ page }) => {
		await page.goto(path);
		const overflow = await page.evaluate(
			() => document.body.scrollWidth > window.innerWidth
		);
		expect(overflow, 'page scrolls horizontally').toBe(false);
	});
}

// ─── Touch targets ─────────────────────────────────────────────────────────────
// These only apply at ≤736 px; all three configured viewports are ≤412 px so
// the touch-target media query is always active here.

test.describe('touch targets', () => {
	test('nav links are ≥44 px tall', async ({ page }) => {
		await page.goto('/');
		await waitForHeader(page);
		// Only check visible top-level nav links; dropdown items are display:none
		// on mobile (they're only shown on hover/focus) so exclude them.
		const links = page.locator('#header .url-list a').filter({ visible: true });
		const count = await links.count();
		expect(count, 'expected at least one visible nav link').toBeGreaterThan(0);
		for (let i = 0; i < count; i++) {
			const box = await links.nth(i).boundingBox();
			expect(box, `nav link ${i} must be visible`).not.toBeNull();
			expect(box?.height, `nav link ${i} height`).toBeGreaterThanOrEqual(44);
		}
	});

	test('footer social icons are ≥44 px', async ({ page }) => {
		await page.goto('/');
		await waitForFooter(page);
		const icons = page.locator('#footer ul.icons li a');
		const count = await icons.count();
		expect(count, 'expected at least one social icon').toBeGreaterThan(0);
		for (let i = 0; i < count; i++) {
			const box = await icons.nth(i).boundingBox();
			expect(box?.width,  `social icon ${i} width` ).toBeGreaterThanOrEqual(44);
			expect(box?.height, `social icon ${i} height`).toBeGreaterThanOrEqual(44);
		}
	});
});

// ─── Calendar ──────────────────────────────────────────────────────────────────

test.describe('calendar', () => {
	test('uses .calendar-wrapper and not a fixed <embed>', async ({ page }) => {
		await page.goto('/calendar.html');
		// Old pattern: <embed ...> — should be gone
		await expect(page.locator('embed')).toHaveCount(0);
		// New pattern: .calendar-wrapper > iframe
		await expect(page.locator('.calendar-wrapper')).toHaveCount(1);
		await expect(page.locator('.calendar-wrapper iframe')).toHaveCount(1);
	});

	test('calendar wrapper fills viewport width', async ({ page }) => {
		await page.goto('/calendar.html');
		const box = await page.locator('.calendar-wrapper').boundingBox();
		const vw  = page.viewportSize().width;
		// Allow up to 2 × 1em (≈32 px) of horizontal padding/margin
		expect(box?.width, 'calendar wrapper width').toBeGreaterThanOrEqual(vw - 32);
	});
});

// ─── Epoch ─────────────────────────────────────────────────────────────────────

test.describe('epoch', () => {
	test('uses .video-wrapper and .video-aspect classes (not inline styles)', async ({ page }) => {
		await page.goto('/epoch.html');
		await expect(page.locator('.video-wrapper')).toHaveCount(2);
		await expect(page.locator('.video-aspect')).toHaveCount(2);
		await expect(page.locator('.video-aspect iframe')).toHaveCount(2);
	});

	test('epoch iframes have no inline style attribute', async ({ page }) => {
		await page.goto('/epoch.html');
		const iframes = page.locator('.video-aspect iframe');
		const count   = await iframes.count();
		for (let i = 0; i < count; i++) {
			const style = await iframes.nth(i).getAttribute('style');
			expect(style, `iframe ${i} should not have inline style`).toBeNull();
		}
	});

	test('fallback captions use .video-caption class', async ({ page }) => {
		await page.goto('/epoch.html');
		await expect(page.locator('p.video-caption')).toHaveCount(2);
	});
});

// ─── Music ─────────────────────────────────────────────────────────────────────

test.describe('music', () => {
	test('YouTube iframes use .yt-embed (not inline height)', async ({ page }) => {
		await page.goto('/music.html');
		await expect(page.locator('iframe.yt-embed')).toHaveCount(5);
	});

	test('YouTube iframes have no inline style attribute', async ({ page }) => {
		await page.goto('/music.html');
		const iframes = page.locator('iframe.yt-embed');
		const count   = await iframes.count();
		for (let i = 0; i < count; i++) {
			const style = await iframes.nth(i).getAttribute('style');
			expect(style, `iframe ${i} should not have inline style`).toBeNull();
		}
	});

	test('YouTube embeds maintain 16:9 aspect ratio', async ({ page }) => {
		await page.goto('/music.html');
		const iframes = page.locator('iframe.yt-embed');
		const count   = await iframes.count();
		for (let i = 0; i < count; i++) {
			const box = await iframes.nth(i).boundingBox();
			if (!box || box.width === 0) continue;
			// 16:9 = 1.777…  Allow ±5 % tolerance
			const ratio = box.width / box.height;
			expect(ratio, `iframe ${i} aspect ratio`).toBeGreaterThan(1.68);
			expect(ratio, `iframe ${i} aspect ratio`).toBeLessThan(1.87);
		}
	});
});
