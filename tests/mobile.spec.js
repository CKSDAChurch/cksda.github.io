// @ts-check
import { test, expect } from '@playwright/test';

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

// ─── Clarity PII Masking ───────────────────────────────────────────────────────

test.describe('clarity pii masking', () => {
	test('maskClarityPII() applies data-clarity-mask to input elements', async ({ page }) => {
		await page.goto('/');
		// Call the masking function directly to verify it works
		const masked = await page.evaluate(() => {
			// Create a test input if none exist
			const testInput = document.createElement('input');
			testInput.type = 'text';
			testInput.id = 'test-clarity-input';
			document.body.appendChild(testInput);
			
			// Call the mask function that main.js defines
			if (typeof window.maskClarityPII === 'function') {
				window.maskClarityPII();
				return testInput.getAttribute('data-clarity-mask') === 'true';
			}
			return false;
		});
		expect(masked, 'maskClarityPII() should apply data-clarity-mask to inputs').toBe(true);
	});

	test('dynamically added inputs are masked by mutation observer', async ({ page }) => {
		await page.goto('/');
		// Wait a moment for the mutation observer to be set up
		await page.waitForTimeout(500);
		
		const masked = await page.evaluate(async () => {
			return new Promise(resolve => {
				const input = document.createElement('input');
				input.type = 'email';
				input.id = 'test-dynamic-input';
				document.body.appendChild(input);
				
				// Give the mutation observer a moment to catch it
				setTimeout(() => {
					const hasMask = input.getAttribute('data-clarity-mask') === 'true';
					resolve(hasMask);
				}, 100);
			});
		});
		expect(masked, 'dynamically added input should be masked by observer').toBe(true);
	});

	test('password and other sensitive inputs are masked', async ({ page }) => {
		await page.goto('/');
		const masked = await page.evaluate(() => {
			const inputs = [
				{ type: 'password', id: 'pwd-1' },
				{ type: 'email',    id: 'eml-1' },
				{ type: 'text',     id: 'txt-1' },
				{ type: 'search',   id: 'srch-1' },
				{ type: 'tel',      id: 'tel-1' },
				{ type: 'url',      id: 'url-1' },
			];
			
			inputs.forEach(spec => {
				const inp = document.createElement('input');
				inp.type = spec.type;
				inp.id = spec.id;
				document.body.appendChild(inp);
			});
			
			if (typeof window.maskClarityPII === 'function') {
				window.maskClarityPII();
			}
			
			// Check that text-like inputs are masked
			return inputs.map(spec => ({
				id: spec.id,
				masked: document.getElementById(spec.id)?.getAttribute('data-clarity-mask') === 'true'
			}));
		});
		
		// All should be masked
		masked.forEach(item => {
			expect(item.masked, `${item.id} should be masked`).toBe(true);
		});
	});

	test('button and non-text inputs are NOT masked', async ({ page }) => {
		await page.goto('/');
		const results = await page.evaluate(() => {
			const inputs = [
				{ type: 'button', id: 'btn-1' },
				{ type: 'submit', id: 'sub-1' },
				{ type: 'checkbox', id: 'chk-1' },
				{ type: 'radio', id: 'rad-1' },
				{ type: 'file', id: 'fil-1' },
			];
			
			inputs.forEach(spec => {
				const inp = document.createElement('input');
				inp.type = spec.type;
				inp.id = spec.id;
				document.body.appendChild(inp);
			});
			
			if (typeof window.maskClarityPII === 'function') {
				window.maskClarityPII();
			}
			
			return inputs.map(spec => ({
				id: spec.id,
				hasMask: document.getElementById(spec.id)?.getAttribute('data-clarity-mask') !== null
			}));
		});
		
		// None should have the mask attribute
		results.forEach(item => {
			expect(item.hasMask, `${item.id} should NOT be masked`).toBe(false);
		});
	});
});
