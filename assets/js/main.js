/*
	© CKSDA Church
	cksda.church/
*/

// Responsive breakpoints
breakpoints({
	wide: ['1281px', '1680px'],
	normal: ['981px', '1280px'],
	narrow: ['841px', '980px'],
	narrower: ['737px', '840px'],
	mobile: ['481px', '736px'],
	mobilep: [null, '480px']
});

// Animate on load
window.addEventListener('load', () => {
	setTimeout(() => document.body.classList.remove('is-preload'), 100);
});

// ============ LANGUAGE & UTILITY ============
const LANG = (() => {
	const lang = navigator.language;
	if (lang.startsWith("ko")) return "ko";
	if (lang.startsWith("es")) return "es";
	if (!lang.startsWith("en")) console.warn(`[i18n] No translation available for "${lang}"; falling back to English.`);
	return "en";
})();

// Global lang variable for use by other scripts (e.g., youtube.js)
window.lang = LANG;

// Update <html lang> to match detected language
document.documentElement.lang = LANG;

const CURRENT_PAGE = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

const LANG_PATH = `./assets/langStrings/${LANG}.json`;

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
const formatTimeRange = (range) => {
	const fmt = new Intl.DateTimeFormat(LANG, { hour: 'numeric', minute: '2-digit' });
	const [start, end] = range.split('-').map(part => {
		const [h, m] = part.trim().split(':').map(Number);
		const d = new Date(2000, 0, 1, h, m);
		return fmt.format(d);
	});
	return `${start} – ${end}`;
};

const loadLanguageFile = async () => {
	const response = await fetch(LANG_PATH);
	if (!response.ok) throw new Error(`Failed to load ${LANG_PATH}`);
	return response.json();
};

// ============ PAGE CONFIGURATION ============
const PAGE_CONFIG = typeof window.buildPageConfig === 'function'
	? window.buildPageConfig({ pageMatches })
	: { index: { match: () => true, title: (json) => json._title, subtitle: (json) => json._subtitle, init: () => ({}) } };

const findPageConfig = (urls) => {
	for (const [, config] of Object.entries(PAGE_CONFIG)) {
		if (config.match(urls)) return config;
	}
	return PAGE_CONFIG.index;
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
	const ministriesDiv = ministryPages ? `<div id="ministries">${menuItems.ministries}<div class="ministryPages">${ministryPages}</div></div>` : '';

	let urlList = `${homeLink}
	${calendarLink}
	${ministriesDiv} |
	<a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank" rel="noopener">${menuItems.adventistGiving}</a>`;

	// Clean up extra pipes
	urlList = urlList.replace(/\s*\|\s*\|/g, ' |').replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '');

	return `<a class="skip-to-content" href="#main">Skip to main content</a>
	<span class="logo icon"><img src="./images/logo-light.png" alt="Collegedale Korean SDA Church logo"/></span>
	<div class="url-list">${urlList}</div>
	<h1>${title}</h1>
	<p>${subtitle}</p>`;
};

const buildFooter = (json) => {
	const { footer } = json;
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

	return `<div class="container medium">
	<header class="major last"><h2>${footer.pastorsTitle}</h2></header>
	
	<p><strong>${footer.headPastorTitle}</strong>:<br />${footer.headPastor}</p>
	<p><strong>${footer.associatePastorTitle}</strong>:<br />${footer.associatePastor}</p>

	<header class="major last"><h2>${footer.worshipServicesTitle}</h2></header>
	<div class="WorshipServices">
		<div class="WorshipChild">
			<h4>${footer.korean}</h4>
			<p><strong>${footer.ssTitle}</strong><br />${formatTimeRange(footer.koSStime)}<br />
			<strong>${footer.wsTitle}</strong><br />${formatTimeRange(footer.koWStime)}</p>
		</div>
		<div class="WorshipChild">
			<h4>${footer.english}</h4>
			<p><strong>${footer.ssTitle}</strong><br />${formatTimeRange(footer.enSStime)}<br />
			<strong>${footer.wsTitle}</strong><br />${formatTimeRange(footer.enWStime)}</p>
		</div>
	</div>

	<header class="major last"><h2>${footer.mailingAddressTitle}</h2></header>
	<p>${footer.mailingAddressLine1}<br />${footer.mailingAddressLine2}<br />
	<strong>${footer.phoneTitle}</strong>: ${footer.phone}<br />
	<strong>${footer.websiteTitle}</strong>: <a href="https://cksda.church">cksda.church</a></p>
	
	<ul class="icons">
	${socials}
	</ul>
	
	<ul class="copyright">
	<li>${footer.copyright}</li>
	<li><a href="http://adventist.org">${footer.advWebsiteTitle}</a></li>
	<li><a href="/privacy.html">Privacy Policy</a></li>
	</ul>
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
		const subtitle = pageConfig.subtitle(json) || json._subtitle;

		// Render header and footer
		setHtml("header", buildHeader(json, title, subtitle));
		setHtml("footer", buildFooter(json));
	} catch (err) {
		console.error("Failed to initialize page:", err);
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