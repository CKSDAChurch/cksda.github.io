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
window.lang = LANG;

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

const applyThemePreference = (preference) => {
	const root = document.documentElement;
	root.classList.remove('theme-light', 'theme-dark');
	let resolved = preference;
	if (preference === 'system') {
		resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}
	root.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
	root.dataset.themePreference = preference;
	window.cksdaTheme = resolved;
};

applyThemePreference(getThemePreference());

// Cache for DOM elements
const domCache = new Map();
const el = (id) => {
	if (!domCache.has(id)) domCache.set(id, document.getElementById(id));
	return domCache.get(id);
};

const setHtml = (id, html) => {
	const element = el(id);
	if (element) element.innerHTML = html;
};

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

const initViewTransitions = () => {
	if (!document.startViewTransition) return;
	document.addEventListener('click', (event) => {
		const link = event.target.closest('a');
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

const findPageConfig = (urls) => {
	for (const [, config] of Object.entries(PAGE_CONFIG)) {
		if (config.match(urls)) return config;
	}
	return PAGE_CONFIG.index;
};

const buildLangSwitcher = (extraClass = '') => {
	const langLabels = { en: 'EN', ko: '한', es: 'ES' };
	const langNames = { en: 'English', ko: '한국어', es: 'Español' };
	const className = ['lang-switcher', extraClass].filter(Boolean).join(' ');
	return `<div class="${className}" role="navigation" aria-label="Language selection">
	${['en', 'ko', 'es'].map(l =>
		`<button class="lang-btn${LANG === l ? ' lang-btn--active' : ''}" data-lang="${l}" aria-current="${LANG === l}" aria-label="${langNames[l]}">${langLabels[l]}</button>`
	).join('')}
	<button class="lang-btn lang-btn--theme" id="theme-toggle" type="button" aria-label="Theme: System" title="Theme: System">◐</button>
	</div>`;
};

// ============ HEADER/FOOTER BUILDERS ============
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
	<span class="logo icon"><img src="./images/logo-light.png" alt="Collegedale Korean SDA Church logo"/></span>
	<div class="url-list">${urlList}</div>
	<h1>${title}</h1>
	<p>${subtitle}</p>`;
};

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
			<p class="footer-tile__value"><strong>${footer.ssTitle}</strong><br />${formatServiceTimeRange(footer.koSStime)}<br />
			<strong>${footer.wsTitle}</strong><br />${formatServiceTimeRange(footer.koWStime)}</p>
		</article>
		<article class="footer-tile WorshipChild">
			<h4 class="footer-tile__title">${footer.english}</h4>
			<p class="footer-tile__value"><strong>${footer.ssTitle}</strong><br />${formatServiceTimeRange(footer.enSStime)}<br />
			<strong>${footer.wsTitle}</strong><br />${formatServiceTimeRange(footer.enWStime)}</p>
		</article>
	</div>
` : '';

	return `<div class="container medium">
	<header class="major last"><h2>${footer.pastorsTitle}</h2></header>
	<div class="footer-section-tiles footer-section-tiles--pastors">
		<article class="footer-tile footer-tile--pastor">
			<h4 class="footer-tile__title">${footer.headPastorTitle}</h4>
			<p class="footer-tile__value">${footer.headPastor}</p>
		</article>
		<article class="footer-tile footer-tile--pastor">
			<h4 class="footer-tile__title">${footer.associatePastorTitle}</h4>
			<p class="footer-tile__value">${footer.associatePastor}</p>
		</article>
	</div>

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
		initViewTransitions();

		// ── Language switcher click handler ────────────────────────────────
		document.querySelectorAll('.lang-btn').forEach(btn => {
			if (btn.id === 'theme-toggle') return;
			btn.addEventListener('click', () => {
				const lang = btn.dataset.lang;
				if (lang && lang !== LANG) {
					localStorage.setItem('cksda-lang', lang);
					window.location.reload();
				}
			});
		});
		initThemeToggle();

		// ── Back-to-top button ─────────────────────────────────────────────
		const backBtn = document.createElement('button');
		backBtn.id = 'back-to-top';
		backBtn.setAttribute('aria-label', 'Back to top');
		backBtn.innerHTML = '<i class="fa-solid fa-chevron-up" aria-hidden="true"></i>';
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