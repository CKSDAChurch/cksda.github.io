/*
	© CKSDA Church
	cksda.church/
*/

// Responsive breakpoints
(function ($) {
	breakpoints({
		wide: ['1281px', '1680px'],
		normal: ['981px', '1280px'],
		narrow: ['841px', '980px'],
		narrower: ['737px', '840px'],
		mobile: ['481px', '736px'],
		mobilep: [null, '480px']
	});

	// Animate on load
	$(window).on('load', () => {
		setTimeout(() => $('body').removeClass('is-preload'), 100);
	});
})(jQuery);

// ============ LANGUAGE & UTILITY ============
const LANG = (() => {
	const lang = navigator.language;
	if (lang.startsWith("ko")) return "ko";
	if (lang.startsWith("es")) return "es";
	return "en";
})();

// Global lang variable for use by other scripts (e.g., youtube.js)
window.lang = LANG;

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

const loadLanguageFile = async () => {
	const response = await fetch(LANG_PATH);
	if (!response.ok) throw new Error(`Failed to load ${LANG_PATH}`);
	return response.json();
};

// ============ PAGE CONFIGURATION ============
const PAGE_CONFIG = {
	calendar: {
		match: (urls) => pageMatches(urls.calendarURL),
		title: (json) => json.pageTitles.calendarTitle,
		subtitle: (json) => json.pageTitles.calendarSubtitle,
		init: (json) => ({
			browserTitle: json.calendarPage.browserTitle,
			calFSMsg: `<a href="https://calendar.google.com/calendar/embed?src=c_cupfa6741dgvle32pjejeoqog4%40group.calendar.google.com&ctz=America%2FNew_York">${json.calendarPage.calFSMsg}</a>`
		})
	},
	children: {
		match: (urls) => pageMatches(urls.childrenMinistriesURL),
		title: (json) => json.pageTitles.childrenTitle,
		subtitle: (json) => json.pageTitles.childrenSubtitle,
		init: (json) => ({
			browserTitle: json.childrenPage.browserTitle
		})
	},
	collegiate: {
		match: (urls) => pageMatches(urls.collegiateMinistryURL),
		title: (json) => json.pageTitles.collegiateTitle,
		subtitle: (json) => json.pageTitles.collegiateSubtitle,
		init: (json) => ({
			browserTitle: json.collegiatePage.browserTitle,
			importantLinksTitle: json.collegiatePage.importantLinksTitle,
			link1: `<a href="${json.collegiatePage.link1URL}" target="_blank" rel="noopener noreferrer">${json.collegiatePage.link1}</a>`,
			link2: `<a href="${json.collegiatePage.link2URL}" target="_blank" rel="noopener noreferrer">${json.collegiatePage.link2}</a>`,
			eventsTitle: json.collegiatePage.eventsTitle,
			event1: json.collegiatePage.event1,
			event2: `<a href="${json.collegiatePage.event2URL}" target="_blank" rel="noopener noreferrer">${json.collegiatePage.event2}</a>`,
			socialMediaTitle: json.collegiatePage.socialMediaTitle
		})
	},
	epoch: {
		match: (urls) => pageMatches(urls.epochURL),
		title: (json) => json.pageTitles.epochTitle,
		subtitle: (json) => json.pageTitles.epochSubtitle,
		init: (json) => ({
			browserTitle: json.epochPage.browserTitle
		})
	},
	music: {
		match: (urls) => pageMatches(urls.musicMinistriesURL),
		title: (json) => json.pageTitles.musicMinistriesTitle,
		subtitle: (json) => json.pageTitles.musicMinistriesSubtitle,
		init: (json) => ({
			browserTitle: json.musicMinistriesPage.browserTitle,
			socialMediaTitle: json.musicMinistriesPage.socialMediaTitle
		})
	},
	pathfinders: {
		match: (urls) => pageMatches(urls.pathfindersURL),
		title: (json) => json.pageTitles.pathfindersTitle,
		subtitle: (json) => json.pageTitles.pathfindersSubtitle,
		init: (json) => ({
			browserTitle: json.pathfindersPage.browserTitle,
			getReadyTitle: json.pathfindersPage.getReadyTitle,
			whoTitle: json.pathfindersPage.whoTitle,
			whatTitle: json.pathfindersPage.whatTitle,
			registrationTitle: json.pathfindersPage.registrationTitle,
			openingTitle: json.pathfindersPage.openingTitle,
			contactUsTitle: json.pathfindersPage.contactUsTitle,
			socialMediaTitle: json.pathfindersPage.socialMediaTitle
		})
	},
	personalMinistries: {
		match: (urls) => pageMatches(urls.personalMinistriesURL),
		title: (json) => json.pageTitles.personalMinistriesTitle,
		subtitle: (json) => json.pageTitles.personalMinistriesSubtitle,
		init: (json) => ({
			browserTitle: json.personalMinistriesPage.browserTitle
		})
	},
	youngAdults: {
		match: (urls) => pageMatches(urls.youngAdultMinistryURL),
		title: (json) => json.pageTitles.youngAdultMinistryTitle,
		subtitle: (json) => json.pageTitles.youngAdultMinistrySubtitle,
		init: (json) => ({
			browserTitle: json.youngAdultMinistryPage.browserTitle
		})
	},
	index: {
		match: () => true,
		title: (json) => json._title,
		subtitle: (json) => json._subtitle,
		init: (json) => ({
			browserTitle: json.indexPage.browserTitle,
			missionParagraph: json.indexPage.missionParagraph,
			titheTitle: json.indexPage.titheTitle,
			titheParagraph1: json.indexPage.titheParagraph1.replace(
				'AdventistGiving',
				'<a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank" rel="noopener">AdventistGiving</a>'
			),
			titheParagraph2: json.indexPage.titheParagraph2
		})
	}
};

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
		epochURL: epoch, 
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
			<p><strong>${footer.ssTitle}</strong><br />${footer.koSStime}<br />
			<strong>${footer.wsTitle}</strong><br />${footer.koWStime}</p>
		</div>
		<div class="WorshipChild">
			<h4>${footer.english}</h4>
			<p><strong>${footer.ssTitle}</strong><br />${footer.enSStime}<br />
			<strong>${footer.wsTitle}</strong><br />${footer.enWStime}</p>
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