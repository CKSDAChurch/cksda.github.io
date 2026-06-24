// @ts-check
/*
	© CKSDA Church
	cksda.church/
*/

import { buildPageConfig } from './page-config.js';
import { detectLanguage } from './lang-utils.js';

// Animate on load
window.addEventListener('load', () => {
	setTimeout(() => document.body.classList.remove('is-preload'), 100);
});

// ============ LANGUAGE & UTILITY ============
const LANG = detectLanguage(localStorage.getItem('cksda-lang'), navigator.language);

// Global lang variable for use by other scripts (e.g., youtube.js)
/** @type {any} */(window).lang = LANG;

// Update <html lang> to match detected language
document.documentElement.lang = LANG;

const CURRENT_PAGE = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

const LANG_PATH = `./assets/langStrings/${LANG}.json`;

const THEME_STORAGE_KEY = 'cksda-theme';

const getThemePreference = () => {
	const saved = localStorage.getItem(THEME_STORAGE_KEY);
	if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
	return 'system';
};

/** @param {'system' | 'light' | 'dark'} preference */
const applyThemePreference = (preference) => {
	const root = document.documentElement;
	root.classList.remove('theme-light', 'theme-dark');
	let resolved = preference;
	if (preference === 'system') {
		resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	root.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
	root.dataset.themePreference = preference;
	/** @type {any} */(window).cksdaTheme = resolved;
};

applyThemePreference(getThemePreference());

// Cache for DOM elements
const domCache = new Map();
/** @param {string} id */
const el = (id) => {
	if (!domCache.has(id)) domCache.set(id, document.getElementById(id));
	return domCache.get(id);
};

/**
 * @param {string} id
 * @param {string} html
 */
const setHtml = (id, html) => {
	const element = el(id);
	if (element) element.innerHTML = html;
};

/** @param {string} url @returns {boolean} */
const pageMatches = (url) => {
	let normalized = url.toLowerCase().replace(/\.html$/, '');
	// Handle root path
	if (normalized === '/') normalized = 'index';
	return CURRENT_PAGE === normalized || CURRENT_PAGE === `${normalized}.html`;
};

/**
 * Format a "HH:MM-HH:MM" time range string using Intl.DateTimeFormat for the active locale.
 * @param {string} range - e.g. "10:00-11:00"
 * @returns {string} - locale-formatted range, e.g. "10:00 AM – 11:00 AM" or "10:00 – 11:00"
 */
const formatServiceTimeRange = (range) => {
	const fmt = new Intl.DateTimeFormat(LANG, { hour: 'numeric', minute: '2-digit' });
	const [start, end] = range.split('-').map(part => {
		const [h, m] = part.trim().split(':').map(Number);
		const d = new Date(2000, 0, 1, h, m);
		return fmt.format(d);
	});
	return `${start} – ${end}`;
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const DAILY_TIME_ZONE = 'America/New_York';

/** @param {Date} date @param {string} timeZone @returns {Record<string, string>} */
const dailyZonedParts = (date, timeZone) => {
	const formatter = new Intl.DateTimeFormat('en-US', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		weekday: 'short'
	});

	return formatter.formatToParts(date).reduce((parts, part) => {
		if (part.type !== 'literal') parts[part.type] = part.value;
		return parts;
	}, /** @type {Record<string, string>} */({}));
};

const getTodayDisplayDate = () => {
	const parts = dailyZonedParts(new Date(), DAILY_TIME_ZONE);
	const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 12));
	return new Intl.DateTimeFormat('en-US', {
		timeZone: DAILY_TIME_ZONE,
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	}).format(date);
};

const initDailyTopBar = async () => {
	if (!document.body) return;

	// Render the bar immediately so there's no layout shift waiting for the JSON.
	const bar = document.createElement('section');
	bar.id = 'daily-bar';
	bar.setAttribute('aria-label', 'Today quick link');
	bar.innerHTML = `
		<div class="daily-bar__inner">
			<span id="daily-bar-label" class="daily-bar__label">Today</span>
			<span id="daily-bar-date" class="daily-bar__date">${getTodayDisplayDate()}</span>
			<a class="daily-bar__today" href="today.html">Open today page →</a>
		</div>
	`;

	document.body.prepend(bar);
	document.body.classList.add('has-daily-bar');

	const syncDailyBarOffset = () => {
		document.documentElement.style.setProperty('--daily-bar-offset', `${bar.offsetHeight}px`);
	};
	syncDailyBarOffset();
	window.addEventListener('resize', syncDailyBarOffset, { passive: true });

	const labelEl = document.getElementById('daily-bar-label');
	const ctaEl = /** @type {HTMLAnchorElement | null} */(bar.querySelector('.daily-bar__today'));

	// Determine if it is currently Sabbath using the server-computed UTC timestamps.
	// Sabbath = Friday sunset → Saturday sunset (all in actual wall-clock time).
	let isSabbath = false;
	try {
		const response = await fetch('/assets/data/devotional-today.json');
		if (response.ok) {
			const data = await response.json();
			if (data.sabbathStartUtc && data.sabbathEndUtc) {
				const now = Date.now();
				isSabbath = now >= new Date(data.sabbathStartUtc).getTime()
					&& now < new Date(data.sabbathEndUtc).getTime();
			}
		}
	} catch (_e) {
		// Fallback: use calendar weekday when JSON is unavailable.
		isSabbath = dailyZonedParts(new Date(), DAILY_TIME_ZONE).weekday === 'Sat';
	}

	if (isSabbath && labelEl) labelEl.textContent = 'Happy Sabbath';

	// ── TEMPORARY: remove after June 28, 2026 ────────────────────────────────
	// During ECKCM camp meeting (June 20–28, 2026), redirect all visitors to the camp newspaper.
	const todayParts = dailyZonedParts(new Date(), DAILY_TIME_ZONE);
	const isEckcmPeriod = Number(todayParts.year) === 2026
		&& Number(todayParts.month) === 6
		&& Number(todayParts.day) >= 20
		&& Number(todayParts.day) <= 28;

	if (isEckcmPeriod) {
		if (labelEl) labelEl.textContent = 'ECKCM';
		if (ctaEl) {
			ctaEl.textContent = LANG === 'ko' ? '캠프 소식 →' : 'Camp Newspaper →';
			ctaEl.href = 'eckcm.html';
			ctaEl.removeAttribute('target');
			ctaEl.removeAttribute('rel');
		}
		return;
	}
	// ── END TEMPORARY ─────────────────────────────────────────────────────────

	const applySabbathCta = () => {
		if (!ctaEl) return;
		if (!isSabbath) {
			ctaEl.textContent = 'Open today page →';
			ctaEl.href = 'today.html';
			ctaEl.removeAttribute('target');
			ctaEl.removeAttribute('rel');
			return;
		}

		const liveFrame = /** @type {HTMLIFrameElement | null} */(document.querySelector('#youtubeLive iframe[src*="live_stream"]'));
		if (liveFrame) {
			ctaEl.textContent = 'Watch livestream →';
			ctaEl.href = 'https://www.youtube.com/@CKSDAChurch/live';
			ctaEl.target = '_blank';
			ctaEl.rel = 'noopener noreferrer';
		} else {
			ctaEl.textContent = 'Open today page →';
			ctaEl.href = 'today.html';
			ctaEl.removeAttribute('target');
			ctaEl.removeAttribute('rel');
		}
	};

	applySabbathCta();
	const youtubeSlot = document.getElementById('youtubeLive');
	if (youtubeSlot && isSabbath) {
		const observer = new MutationObserver(() => applySabbathCta());
		observer.observe(youtubeSlot, { childList: true, subtree: true, attributes: true });
	}
};

/** @param {Document | Element} [root] */
function maskClarityPII(root = document) {
	try {
		const selector = 'input, textarea, [contenteditable]';
		root.querySelectorAll(selector).forEach(el => {
			if (!(el instanceof HTMLElement)) return;
			const tag = el.tagName.toLowerCase();
			if (tag === 'input') {
				const t = (el.getAttribute('type') || '').toLowerCase();
				// skip types that aren't user text entry
				if (['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image', 'hidden'].includes(t)) return;
			}
			// Mark as masked for Microsoft Clarity
			el.setAttribute('data-clarity-mask', 'true');
		});
	} catch (_e) {
		// Non-critical
	}
}

window.addEventListener('load', () => {
	maskClarityPII();
	// Observe for dynamically added inputs (e.g., async forms)
	try {
		const obs = new MutationObserver(mutations => {
			for (const m of mutations) {
				for (const node of m.addedNodes) {
					if (!(node instanceof Element)) continue;
					maskClarityPII(node);
				}
			}
		});
		obs.observe(document.body, { childList: true, subtree: true });
	} catch (_e) {
		// ignore
	}
});

const initViewTransitions = () => {
	if (!document.startViewTransition) return;
	document.addEventListener('click', (event) => {
		const link = /** @type {Element | null} */(event.target)?.closest('a');
		if (!link) return;
		if (link.target && link.target !== '_self') return;
		if (link.hasAttribute('download')) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

		const href = link.getAttribute('href') || '';
		if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

		const nextUrl = new URL(link.href, window.location.href);
		if (nextUrl.origin !== window.location.origin) return;

		event.preventDefault();
		document.startViewTransition(() => {
			window.location.href = nextUrl.href;
		});
	});
};

const initThemeToggle = () => {
	const btn = document.getElementById('theme-toggle');
	if (!btn) return;

	const labels = {
		system: 'Theme: System',
		light: 'Theme: Light',
		dark: 'Theme: Dark'
	};

	const render = () => {
		const pref = getThemePreference();
		btn.dataset.theme = pref;
		btn.setAttribute('aria-label', labels[pref]);
		btn.title = labels[pref];
		btn.textContent = pref === 'system' ? '◐' : pref === 'light' ? '☀' : '☾';
	};

	btn.addEventListener('click', () => {
		const current = getThemePreference();
		const next = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
		localStorage.setItem(THEME_STORAGE_KEY, next);
		applyThemePreference(next);
		render();
	});

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
		if (getThemePreference() === 'system') {
			applyThemePreference('system');
			render();
		}
	});

	render();
};

/** @type {AbortController|null} */
let langFetchController = null;

const loadLanguageFile = async () => {
	if (langFetchController) langFetchController.abort();
	langFetchController = new AbortController();
	const response = await fetch(LANG_PATH, { signal: langFetchController.signal });
	if (!response.ok) throw new Error(`Failed to load ${LANG_PATH}`);
	return response.json();
};

// ============ PAGE CONFIGURATION ============
const PAGE_CONFIG = buildPageConfig({ pageMatches });

/** @param {any} urls */
const findPageConfig = (urls) => {
	for (const [, config] of Object.entries(PAGE_CONFIG)) {
		if (config.match(urls)) return config;
	}
	return PAGE_CONFIG.index;
};

const buildLangSwitcher = (extraClass = '') => {
	const langLabels = /** @type {Record<string, string>} */({ en: 'EN', ko: '한', es: 'ES' });
	const langNames = /** @type {Record<string, string>} */({ en: 'English', ko: '한국어', es: 'Español' });
	const className = ['lang-switcher', extraClass].filter(Boolean).join(' ');
	return `<div class="${className}" role="navigation" aria-label="Language selection">
	${['en', 'ko', 'es'].map(l =>
		`<button class="lang-btn${LANG === l ? ' lang-btn--active' : ''}" data-lang="${l}" aria-current="${LANG === l}" aria-label="${langNames[l]}">${langLabels[l]}</button>`
	).join('')}
	<button class="lang-btn lang-btn--theme" id="theme-toggle" type="button" aria-label="Theme: System" title="Theme: System">◐</button>
	</div>`;
};

// ============ HEADER/FOOTER BUILDERS ============

/** @type {Record<string, {name:string, role:string, bio:string, contact:string, img:string}>} */
const PASTOR_BIOS = {
	yang: {
		name: 'Pastor Kangwon Yang',
		role: 'Head Pastor',
		bio: 'Born and raised in South Korea, Pastor Yang has served as a Seventh-day Adventist pastor since 2003. He holds a master of divinity from Andrews University and has led our congregation since 2022. His favourite verse is Daniel 12:3 — "Those who are wise shall shine like the brightness of the firmament."',
		contact: 'pastor@cksda.church',
		img: 'assets/images/pastor-yang.jpg',
	},
	jeon: {
		name: 'Pastor Daniel Jeon',
		role: 'Associate Pastor',
		bio: 'Born in Colorado, Pastor Jeon holds a master of divinity from Andrews University and has been pastoring since 2015 across the U.S., Canada, and Australia. Fluent in English and Korean, he joined our church in 2024. His favourite verse is John 17:3 \u2014 \u201cAnd this is eternal life, that they may know You, the only true God, and Jesus Christ whom You have sent.\u201d',
		contact: 'associatepastor@cksda.church',
		img: 'assets/images/pastor-jeon.jpg',
	},
};
/**
 * @param {any} json
 * @param {string} title
 * @param {string} subtitle
 */
const buildHeader = (json, title, subtitle) => {
	const { menuItems } = json;
	const { 
		calendarURL: cal, 
		childrenMinistriesURL: children, 
		collegiateMinistryURL: collegiate,
		homeURL: home, 
		musicMinistriesURL: music, 
		newsletterURL: newsletter,
		pathfindersURL: pathfinders, 
		personalMinistriesURL: personal, 
		youngAdultMinistryURL: young 
	} = menuItems;

	const ministryPages = [
		{ url: children, label: menuItems.childrenMinistries, external: false },
		{ url: collegiate, label: menuItems.collegiateMinistry, external: true },
		{ url: music, label: menuItems.musicMinistries, external: false },
		{ url: pathfinders, label: menuItems.pathfinders, external: false },
		{ url: personal, label: menuItems.personalMinistries, external: false },
		{ url: young, label: menuItems.youngAdultMinistry, external: false }
	].filter(item => !pageMatches(item.url))
	 .map(item => `<div class="ministryPage"><a href="${item.url}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${item.label}</a></div>`)
	 .join('\n	');

	const homeLink = pageMatches(home) ? '' : `<a href="${home}">${menuItems.home}</a> |`;
	const calendarLink = pageMatches(cal) ? '' : `<a href="${cal}">${menuItems.calendar}</a> |`;
	const newsletterLink = pageMatches(newsletter) ? '' : `<a href="${newsletter}">${menuItems.newsletter}</a> |`;
	const ministriesDiv = ministryPages ? `<div id="ministries">${menuItems.ministries}<div class="ministryPages">${ministryPages}</div></div>` : '';

	let urlList = `${homeLink}
	${calendarLink}
	${newsletterLink}
	${ministriesDiv} |
	<a href="https://directory.cksda.church" target="_blank" rel="noopener">${menuItems.directory}</a> |
	<a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank" rel="noopener">${menuItems.adventistGiving}</a>`;

	// Clean up extra pipes
	urlList = urlList.replace(/\s*\|\s*\|/g, ' |').replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '');

	return `<a class="skip-to-content" href="#main">Skip to main content</a>
	<span class="logo icon"><img src="./assets/images/logo-light.png" alt="Collegedale Korean SDA Church logo"/></span>
	<div class="url-list">${urlList}</div>
	<h1>${title}</h1>
	<p>${subtitle}</p>`;
};

/** @param {string} address @returns {string} */
const getPreferredMapsUrl = (address) => {
	const encodedAddress = encodeURIComponent(address);
	const ua = navigator.userAgent || '';
	const isAppleMobile = /iPhone|iPad|iPod/i.test(ua)
		|| (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

	if (isAppleMobile) {
		return `https://maps.apple.com/?q=${encodedAddress}`;
	}

	return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};

/** @param {any} json */
const buildFooter = (json) => {
	const { footer } = json;
	const fullAddress = `${footer.mailingAddressLine1}, ${footer.mailingAddressLine2}`;
	const directionsUrl = getPreferredMapsUrl(fullAddress);
	const showFooterWorshipServices = !pageMatches('index.html');
	const socialLinks = [
		{ href: "https://x.com/CKSDAChurch", icon: "fa-x-twitter", label: "𝕏" },
		{ href: "https://youtube.com/@CKSDAChurch", icon: "fa-youtube", label: "YouTube" },
		{ href: "https://instagram.com/CKSDAChurch", icon: "fa-instagram", label: "Instagram" },
		{ href: "https://fb.com/CKSDAChurch1990", icon: "fa-facebook-f", label: "Facebook" },
		{ href: "https://linkedin.com/company/cksdachurch", icon: "fa-linkedin", label: "LinkedIn" }
	];

	const socials = socialLinks.map(link => 
		`<li><a href="${link.href}" class="icon brands ${link.icon}" target="_blank" rel="noopener noreferrer" aria-label="${link.label} (opens in new tab)"><span class="label" aria-hidden="true">${link.label}</span></a></li>`
	).join('\n	');

	const worshipServicesSection = showFooterWorshipServices ? `
	<header class="major last"><h2>${footer.worshipServicesTitle}</h2></header>
	<div class="footer-section-tiles footer-section-tiles--worship WorshipServices">
		<article class="footer-tile WorshipChild">
			<h4 class="footer-tile__title">${footer.korean}</h4>
			<dl class="footer-service-schedule">
				<div class="footer-service-schedule__item">
					<dt class="footer-service-schedule__label">${footer.vespersTitle}</dt>
					<dd class="footer-service-schedule__time">${formatServiceTimeRange(footer.koVespersTime)}</dd>
				</div>
				<div class="footer-service-schedule__item">
					<dt class="footer-service-schedule__label">${footer.ssTitle}</dt>
					<dd class="footer-service-schedule__time">${formatServiceTimeRange(footer.koSStime)}</dd>
				</div>
				<div class="footer-service-schedule__item">
					<dt class="footer-service-schedule__label">${footer.wsTitle}</dt>
					<dd class="footer-service-schedule__time">${formatServiceTimeRange(footer.koWStime)}</dd>
				</div>
			</dl>
		</article>
		<article class="footer-tile WorshipChild">
			<h4 class="footer-tile__title">${footer.english}</h4>
			<dl class="footer-service-schedule">
				<div class="footer-service-schedule__item">
					<dt class="footer-service-schedule__label">${footer.ssTitle}</dt>
					<dd class="footer-service-schedule__time">${formatServiceTimeRange(footer.enSStime)}</dd>
				</div>
				<div class="footer-service-schedule__item">
					<dt class="footer-service-schedule__label">${footer.wsTitle}</dt>
					<dd class="footer-service-schedule__time">${formatServiceTimeRange(footer.enWStime)}</dd>
				</div>
			</dl>
		</article>
	</div>
` : '';

	return `<div class="container medium">
	<header class="major last"><h2>${footer.pastorsTitle}</h2></header>
	<div class="footer-section-tiles footer-section-tiles--pastors">
		<button class="footer-tile footer-tile--pastor" data-pastor="yang" aria-haspopup="dialog">
			<img class="footer-tile__photo" src="${PASTOR_BIOS.yang.img}" alt="" loading="lazy">
			<h4 class="footer-tile__title">${footer.headPastorTitle}</h4>
			<p class="footer-tile__value">${footer.headPastor}</p>
			<span class="footer-tile__cue" aria-hidden="true">View bio &rsaquo;</span>
		</button>
		<button class="footer-tile footer-tile--pastor" data-pastor="jeon" aria-haspopup="dialog">
			<img class="footer-tile__photo" src="${PASTOR_BIOS.jeon.img}" alt="" loading="lazy">
			<h4 class="footer-tile__title">${footer.associatePastorTitle}</h4>
			<p class="footer-tile__value">${footer.associatePastor}</p>
			<span class="footer-tile__cue" aria-hidden="true">View bio &rsaquo;</span>
		</button>
	</div>
	<dialog id="pastor-bio-dialog" aria-modal="true" aria-labelledby="pastor-bio-name">
		<button class="pastor-bio-close" aria-label="Close">&times;</button>
		<div class="leader-card leader-card--dialog">
			<div class="leader-card__avatar" aria-hidden="true"><i class="fa fa-user-circle"></i></div>
			<h3 id="pastor-bio-name" class="leader-card__name"></h3>
			<p class="leader-card__role"></p>
			<p class="leader-card__bio"></p>
			<p class="leader-card__contact"></p>
		</div>
	</dialog>

	${worshipServicesSection}

	<header class="major last"><h2>${footer.mailingAddressTitle}</h2></header>
	<div class="footer-section-tiles footer-section-tiles--address">
		<address class="footer-contact footer-tile" aria-label="${footer.mailingAddressTitle}">
			<div class="footer-contact__group">
				<p class="footer-contact__label">${footer.addressTitle || footer.mailingAddressTitle}</p>
				<p class="footer-contact__line"><a href="${directionsUrl}" target="_blank" rel="noopener noreferrer">${footer.mailingAddressLine1}</a></p>
				<p class="footer-contact__line"><a href="${directionsUrl}" target="_blank" rel="noopener noreferrer">${footer.mailingAddressLine2}</a></p>
			</div>
			<div class="footer-contact__group">
				<p class="footer-contact__label">${footer.phoneTitle}</p>
				<p class="footer-contact__line"><a href="tel:+14234533004">${footer.phone}</a></p>
			</div>
		</address>
	</div>
	
	<ul class="icons">
	${socials}
	</ul>

	<p class="copyright footer-copyright">${footer.copyright}</p>

	<ul class="copyright">
	<li><a href="http://adventist.org">${footer.advWebsiteTitle}</a></li>
	<li><a href="/privacy.html">Privacy Policy</a></li>
	</ul>

	${buildLangSwitcher()}
	</div>`;
};

// ============ PASTOR BIO DIALOG ============

const initPastorBios = () => {
	const dialog = /** @type {HTMLDialogElement|null} */ (document.getElementById('pastor-bio-dialog'));
	if (!dialog) return;
	const nameEl = dialog.querySelector('.leader-card__name');
	const roleEl = dialog.querySelector('.leader-card__role');
	const bioEl = dialog.querySelector('.leader-card__bio');
	const contactEl = dialog.querySelector('.leader-card__contact');

	const avatarEl = dialog.querySelector('.leader-card__avatar');

	document.querySelectorAll('[data-pastor]').forEach(btn => {
		btn.addEventListener('click', () => {
			const key = /** @type {HTMLElement} */ (btn).dataset.pastor ?? '';
			const bio = PASTOR_BIOS[key];
			if (!bio || !nameEl || !roleEl || !bioEl || !contactEl) return;
			if (avatarEl) {
				avatarEl.innerHTML = bio.img
					? `<img src="${bio.img}" alt="${bio.name}" loading="lazy">`
					: '<i class="fa fa-user-circle"></i>';
			}
			nameEl.textContent = bio.name;
			roleEl.textContent = bio.role;
			bioEl.textContent = bio.bio;
			contactEl.innerHTML = `<a href="mailto:${bio.contact}">${bio.contact}</a>`;
			dialog.showModal();
		});
	});

	dialog.querySelector('.pastor-bio-close')?.addEventListener('click', () => dialog.close());
	// Click on backdrop closes
	dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
};

// ============ INITIALIZATION ============

(async () => {
	try {
		const json = await loadLanguageFile();
		const urls = json.menuItems;

		// Find and execute page-specific config
		const pageConfig = findPageConfig(urls);
		const pageData = pageConfig.init(json);
		Object.entries(pageData).forEach(([id, html]) => setHtml(id, html));

		// Get page title/subtitle
		const title = pageConfig.title(json) || json._title;
		const subtitle = pageConfig.subtitle(json) ?? json._subtitle;

		// Render header and footer
		setHtml("header", buildHeader(json, title, subtitle));
		setHtml("footer", buildFooter(json));
		await initDailyTopBar();
		initViewTransitions();

		// ── Language switcher click handler ────────────────────────────────
		document.querySelectorAll('.lang-btn').forEach(btn => {
			if (btn.id === 'theme-toggle') return;
			btn.addEventListener('click', () => {
			const lang = /** @type {HTMLElement} */(btn).dataset.lang;
				if (lang && lang !== LANG) {
					localStorage.setItem('cksda-lang', lang);
					window.location.reload();
				}
			});
		});
		initThemeToggle();
		initPastorBios();

		// ── Back-to-top button ─────────────────────────────────────────────
		const backBtn = document.createElement('button');
		backBtn.id = 'back-to-top';
		backBtn.setAttribute('aria-label', 'Back to top');
		backBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 6l-7 7 1.4 1.4L11 9.8V18h2V9.8l4.6 4.6L19 13z"/></svg>';
		document.body.appendChild(backBtn);
		// Scroll-driven CSS handles visibility in supporting browsers;
		// fall back to a JS scroll listener where it isn't supported.
		if (!CSS.supports('animation-timeline: scroll()')) {
			window.addEventListener('scroll', () => {
				const pastHalf = window.scrollY > window.innerHeight * 0.5;
				const nearBottom = (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - backBtn.offsetHeight * 2);
				backBtn.classList.toggle('visible', pastHalf && !nearBottom);
			}, { passive: true });
		}
		backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }));

		// ── Outbound link tracking ────────────────────────────────────────
		/** @returns {((...args: any[]) => void) | undefined} */
		const getGtag = () => /** @type {any} */(globalThis).gtag;
		document.addEventListener('click', (event) => {
			const link = /** @type {HTMLAnchorElement | null} */(/** @type {Element | null} */(event.target)?.closest('a[target="_blank"]') ?? null);
			const _gtag = getGtag();
			if (link && _gtag) {
				try {
					const url = new URL(link.href);
					_gtag('event', 'click', {
						event_category: 'outbound',
						event_label: url.hostname,
						link_domain: url.hostname,
						link_url: link.href
					});

					// Conversion funnel: AdventistGiving clicks
					if (url.hostname && url.hostname.indexOf('adventistgiving.org') !== -1) {
						_gtag('event', 'open_adventist_giving', {
							event_category: 'conversion',
							event_label: link.href,
							link_url: link.href
						});
					}
				} catch (_e) {
					// Skip invalid URLs
				}
			}
		}, { passive: true });

		// ── Conversion funnel clicks (mailto / tel) ─────────────────────────
		document.addEventListener('click', (event) => {
			const link = /** @type {HTMLAnchorElement | null} */(event.target)?.closest('a[href^="mailto:"] , a[href^="tel:"]');
			const _gtag = getGtag();
			if (!link || !_gtag) return;
			try {
				const href = link.getAttribute('href');
				if (!href) return;
				if (href.startsWith('mailto:')) {
					const email = href.slice(7);
					_gtag('event', 'open_contact_email', {
						event_category: 'conversion',
						event_label: email
					});
				} else if (href.startsWith('tel:')) {
					const number = href.slice(4);
					_gtag('event', 'start_call', {
						event_category: 'conversion',
						event_label: number
					});
					// If this matches the prayer hotline number, emit a specific event
					const normalized = number.replace(/[^+0-9]/g, '');
					if (normalized === '+14234533004' || normalized === '14234533004') {
						_gtag('event', 'start_prayer_hotline', {
							event_category: 'conversion',
							event_label: number
						});
					}
				}
			} catch (_e) {
				// ignore
			}
		}, { passive: true });

		// ── Scroll-depth tracking ─────────────────────────────────────────
		const scrollDepthThresholds = new Set();
		window.addEventListener('scroll', () => {
			const _gtag = getGtag();
			if (!_gtag) return;
			const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
			if (scrollHeight <= 0) return; // Page isn't scrollable
			const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
			[25, 50, 75, 100].forEach(threshold => {
				if (scrollPercent >= threshold && !scrollDepthThresholds.has(threshold)) {
					scrollDepthThresholds.add(threshold);
					_gtag('event', 'scroll', {
						event_category: 'engagement',
						event_label: `${threshold}%`,
						scroll_depth: threshold,
						page_title: document.title
					});
				}
			});
		}, { passive: true });

	} catch (err) {
		console.error('Failed to initialize page:', err);
	}
})();

// ============ SERVICE WORKER ============
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(err =>
			console.warn('Service worker registration failed:', err)
		);
	});
}

// ============ INSTALL PROMPT ============
// Capture beforeinstallprompt and show a small dismissible banner on the
// second visit for browsers that support the event (Chromium-based).
// Does nothing on iOS / Firefox where the event is not fired.
(function initInstallPrompt() {
	// Skip if already running as an installed PWA.
	const isInstalled = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
		|| /** @type {any} */(navigator).standalone === true;
	if (isInstalled) return;

	// Skip if the user previously dismissed the banner.
	try { if (localStorage.getItem('cksda-install-dismissed') === 'true') return; } catch (_e) { return; }

	// Track visit count — only show on the 2nd+ visit to avoid startling new visitors.
	let visitCount = 0;
	try {
		visitCount = (parseInt(localStorage.getItem('cksda-visit-count') || '0', 10) || 0) + 1;
		localStorage.setItem('cksda-visit-count', String(visitCount));
	} catch (_e) { return; }

	/** @type {{ prompt: () => void, userChoice: Promise<{outcome: string}> } | null} */
	let deferredPrompt = null;

	window.addEventListener('beforeinstallprompt', (event) => {
		event.preventDefault();
		deferredPrompt = /** @type {any} */(event);

		if (visitCount < 2) return; // Don't show on the very first visit.

		const banner = document.createElement('div');
		banner.id = 'install-banner';
		banner.setAttribute('role', 'complementary');
		banner.setAttribute('aria-label', 'Install the church app');
		banner.innerHTML = `
			<div class="install-banner__inner">
				<span class="install-banner__text">&#128242;&nbsp; Install the CKSDA Church app for quick access</span>
				<button class="install-banner__btn" id="install-banner-btn">Install</button>
				<button class="install-banner__dismiss" id="install-banner-dismiss" aria-label="Dismiss install prompt">&#x2715;</button>
			</div>
		`;
		document.body.appendChild(banner);

		// Trigger CSS slide-up transition on the next two frames.
		requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('is-visible')));

		document.getElementById('install-banner-btn')?.addEventListener('click', () => {
			if (!deferredPrompt) return;
			deferredPrompt.prompt();
			deferredPrompt.userChoice.then((choiceResult) => {
				if (choiceResult.outcome === 'accepted') {
					try { localStorage.setItem('cksda-pwa-installed', 'true'); } catch (_e) { /* storage unavailable */ }
				}
				deferredPrompt = null;
				banner.remove();
			});
		});

		document.getElementById('install-banner-dismiss')?.addEventListener('click', () => {
			try { localStorage.setItem('cksda-install-dismissed', 'true'); } catch (_e) { /* storage unavailable */ }
			banner.classList.remove('is-visible');
			setTimeout(() => banner.remove(), 300);
		});
	});
})();