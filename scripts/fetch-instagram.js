// @ts-check
/*
	fetch-instagram.js — Server-side (GitHub Actions) script.

	Build-time fetch for Instagram posts using Meta Graph API business discovery.
	The script aggregates posts from all configured accounts, sorts by recency,
	and writes the latest 12 into assets/data/instagram-feed.json.

	If API credentials are missing or a request fails, the script writes an empty
	feed payload and exits 0 so deploys can continue safely.
*/

import { writeFileSync } from 'node:fs';

const OUTPUT_PATH = 'assets/data/instagram-feed.json';
const DEFAULT_HANDLES = ['cksdachurch', 'ck.sda', 'cksdamusic', 'cksda_ya', 'cksda_youth', 'pioneerspathfinder'];
const MAX_POSTS = 12;
const PER_ACCOUNT_LIMIT = 6;
const GRAPH_VERSION = 'v23.0';

const accountHandles = (process.env.INSTAGRAM_ACCOUNT_HANDLES || DEFAULT_HANDLES.join(','))
	.split(',')
	.map((value) => value.trim().toLowerCase())
	.filter(Boolean);

const accessToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN || '';
const businessAccountId = process.env.INSTAGRAM_GRAPH_BUSINESS_ACCOUNT_ID || '';

const emptyPayload = () => ({
	updatedAt: new Date().toISOString(),
	accounts: accountHandles,
	items: []
});

const writePayload = (payload) => {
	writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const cleanCaption = (caption) => {
	if (!caption) return '';
	return String(caption).replace(/\s+/g, ' ').trim();
};

const toFeedItem = (username, mediaItem) => {
	const imageUrl = mediaItem.media_type === 'VIDEO'
		? (mediaItem.thumbnail_url || mediaItem.media_url || '')
		: (mediaItem.media_url || mediaItem.thumbnail_url || '');

	if (!imageUrl || !mediaItem.permalink) return null;

	return {
		id: mediaItem.id,
		username,
		caption: cleanCaption(mediaItem.caption),
		mediaType: mediaItem.media_type,
		imageUrl,
		permalink: mediaItem.permalink,
		timestamp: mediaItem.timestamp
	};
};

const fetchAccountPosts = async (username) => {
	const fields = `business_discovery.username(${username}){username,media.limit(${PER_ACCOUNT_LIMIT}){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp}}`;
	const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${businessAccountId}`);
	url.searchParams.set('fields', fields);
	url.searchParams.set('access_token', accessToken);

	const response = await fetch(url, {
		headers: { 'User-Agent': 'CKSDA-Instagram-Fetch/1.0' },
		signal: AbortSignal.timeout(15000)
	});

	if (!response.ok) {
		const body = await response.text().catch(() => '');
		throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
	}

	const payload = await response.json();
	const discovery = payload.business_discovery;
	const mediaItems = discovery?.media?.data;
	if (!discovery || !Array.isArray(mediaItems)) return [];

	return mediaItems
		.map((mediaItem) => toFeedItem(discovery.username || username, mediaItem))
		.filter(Boolean);
};

const main = async () => {
	if (!accessToken || !businessAccountId) {
		console.warn('Instagram feed skipped: required secrets are missing. Writing empty feed.');
		writePayload(emptyPayload());
		return;
	}

	const allItems = [];
	for (const handle of accountHandles) {
		try {
			const items = await fetchAccountPosts(handle);
			allItems.push(...items);
			console.log(`Fetched ${items.length} posts for @${handle}`);
		} catch (error) {
			console.warn(`Instagram fetch failed for @${handle}: ${error.message}`);
		}
	}

	allItems.sort((a, b) => {
		const aTime = Date.parse(a.timestamp || '');
		const bTime = Date.parse(b.timestamp || '');
		return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
	});

	const payload = {
		updatedAt: new Date().toISOString(),
		accounts: accountHandles,
		items: allItems.slice(0, MAX_POSTS)
	};

	writePayload(payload);
	console.log(`Instagram feed updated: ${payload.items.length} recent posts saved.`);
};

main().catch((error) => {
	console.warn(`Unexpected Instagram sync failure: ${error.message}`);
	writePayload(emptyPayload());
});
