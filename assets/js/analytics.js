// @ts-check

var analyticsConfig = window.CKSDA_ANALYTICS || {};
	var GA_TRACKING_ID = analyticsConfig.gaTrackingId || 'G-LK9DNYP0NB';
	var CLARITY_ID = analyticsConfig.clarityId || 'hik5wt3z51';

	window.CKSDA_ANALYTICS = {
		gaTrackingId: GA_TRACKING_ID,
		clarityId: CLARITY_ID
	};

	window.dataLayer = window.dataLayer || [];
	window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

	window.gtag('consent', 'default', {
		'analytics_storage': 'denied',
		'ad_storage': 'denied',
		'ad_user_data': 'denied',
		'ad_personalization': 'denied',
		'wait_for_update': 500
	});

	window.gtag('js', new Date());
	window.gtag('config', GA_TRACKING_ID);

	if (!document.querySelector('script[data-cksda-ga]')) {
		var script = document.createElement('script');
		script.async = true;
		script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_TRACKING_ID);
		script.setAttribute('data-cksda-ga', 'true');
		document.head.appendChild(script);
	}

// Send GA4 user properties: language, theme preference, and PWA install state
function updateGaUserProperties() {
	const lang = document.documentElement.lang || localStorage.getItem('cksda-lang') || (navigator.language || '').split('-')[0] || 'en';
	const themePref = localStorage.getItem('cksda-theme') || document.documentElement.dataset.themePreference || 'system';
	const isPwaInstalled = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
		|| window.navigator.standalone === true
		|| localStorage.getItem('cksda-pwa-installed') === 'true';

	if (typeof gtag === 'function') {
		try {
			window.gtag('set', {
				'user_properties': {
					language: String(lang),
					theme: String(themePref),
					is_pwa_installed: isPwaInstalled ? 'true' : 'false'
				}
			});

			// Ensure future page_view/config hits include the same properties
			window.gtag('config', GA_TRACKING_ID, {
				'user_properties': {
					language: String(lang),
					theme: String(themePref),
					is_pwa_installed: isPwaInstalled ? 'true' : 'false'
				}
			});
		} catch (err) {
			console.warn('analytics: failed to set GA user_properties', err);
		}
	}
}

// Initial population
updateGaUserProperties();

// When the app is installed as a PWA, flag it and refresh user properties
window.addEventListener('appinstalled', () => {
	try { localStorage.setItem('cksda-pwa-installed', 'true'); } catch (_e) {
		// ignore localStorage unavailable
	}
	updateGaUserProperties();
});

// Listen for cross-tab changes to language/theme and update GA properties
window.addEventListener('storage', (ev) => {
	if (!ev.key) return;
	if (ev.key === 'cksda-theme' || ev.key === 'cksda-lang' || ev.key === 'cksda-pwa-installed') {
		updateGaUserProperties();
	}
});
