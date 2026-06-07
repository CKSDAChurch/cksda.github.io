// @ts-check

const ACCOUNT_HANDLES = [
	'cksdachurch',
	'ck.sda',
	'cksdamusic',
	'cksda_ya',
	'cksda_youth',
	'pioneerspathfinder'
];

const FEED_PATH = 'assets/data/instagram-feed.json';
const MAX_ITEMS = 12;

const formatDate = (isoString) => {
	if (!isoString) return '';
	const date = new Date(isoString);
	if (Number.isNaN(date.getTime())) return '';
	return new Intl.DateTimeFormat(document.documentElement.lang || 'en-US', {
		month: 'short',
		day: 'numeric'
	}).format(date);
};

const createAccountPills = (container) => {
	container.innerHTML = ACCOUNT_HANDLES
		.map((handle) => `<li><a href="https://instagram.com/${handle}" target="_blank" rel="noopener noreferrer">@${handle}</a></li>`)
		.join('');
};

const renderEmptyState = (grid) => {
	grid.innerHTML = '<p class="instagram-feed__empty">Latest photos will appear here once Instagram sync runs.</p>';
};

const sanitizeCaption = (caption) => {
	if (!caption) return 'Instagram post';
	const text = String(caption).replace(/\s+/g, ' ').trim();
	return text.length > 140 ? `${text.slice(0, 137)}...` : text;
};

const renderFeedItems = (grid, items) => {
	const html = items.slice(0, MAX_ITEMS).map((item) => {
		const imageUrl = item.imageUrl || item.media_url || item.thumbnail_url;
		if (!imageUrl || !item.permalink) return '';
		const handle = item.username ? `@${item.username}` : '@instagram';
		const dateText = formatDate(item.timestamp);
		const alt = sanitizeCaption(item.caption || `${handle} post`);
		return `<a class="instagram-feed__card" href="${item.permalink}" target="_blank" rel="noopener noreferrer" aria-label="Open ${handle} Instagram post">
			<img src="${imageUrl}" alt="${alt}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
			<span class="instagram-feed__meta">
				<span class="instagram-feed__handle">${handle}</span>
				<span>${dateText}</span>
			</span>
		</a>`;
	}).filter(Boolean).join('');

	grid.innerHTML = html || '<p class="instagram-feed__empty">No recent Instagram posts were available this time.</p>';
};

const initInstagramFeed = async () => {
	const section = document.getElementById('instagram-feed');
	if (!section) return;

	const accountList = document.getElementById('instagram-feed-accounts');
	const grid = document.getElementById('instagram-feed-grid');
	if (!(accountList instanceof HTMLElement) || !(grid instanceof HTMLElement)) return;

	createAccountPills(accountList);

	try {
		const response = await fetch(FEED_PATH, { cache: 'no-store' });
		if (!response.ok) throw new Error(`Feed request failed with ${response.status}`);
		const payload = await response.json();
		if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
			renderEmptyState(grid);
			return;
		}
		renderFeedItems(grid, payload.items);
	} catch (error) {
		console.warn('Instagram feed unavailable:', error);
		renderEmptyState(grid);
	}
};

window.addEventListener('DOMContentLoaded', () => {
	initInstagramFeed();
});
