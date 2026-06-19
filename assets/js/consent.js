// @ts-check

/** @typedef {{ clarityId?: string }} AnalyticsConfig */
/** @type {Window & { CKSDA_ANALYTICS?: AnalyticsConfig, gtag?: Function }} */
var windowExt = window;

var CONSENT_KEY = 'cksdaConsent';
	var analyticsConfig = (windowExt.CKSDA_ANALYTICS || {});
	var CLARITY_ID = analyticsConfig.clarityId || 'hik5wt3z51';

	function loadClarity() {
		var w = window;
		var d = document;
		var c = 'clarity';
		var s = 'script';
		
		// @ts-ignore - Clarity library dynamic property assignment
		w[c] = w[c] || function() {
			// @ts-ignore
			(w[c].q = w[c].q || []).push(arguments);
		};
		
		// @ts-ignore - createElement returns HTMLElement, but we know it's a script tag
		var t = d.createElement(s);
		// @ts-ignore - async and src exist on script elements
		t.async = true;
		// @ts-ignore
		t.src = 'https://www.clarity.ms/tag/' + CLARITY_ID;
		
		var scripts = d.getElementsByTagName(s);
		if (scripts && scripts.length > 0) {
			var firstScript = scripts[0];
			if (firstScript && firstScript.parentNode) {
				firstScript.parentNode.insertBefore(t, firstScript);
			}
		}
	}

	function grantConsent() {
		if (typeof windowExt.gtag === 'function') {
			windowExt.gtag('consent', 'update', {
				'analytics_storage': 'granted',
				'ad_storage': 'granted',
				'ad_user_data': 'granted',
				'ad_personalization': 'granted'
			});
		}
		loadClarity();
	}

	function removeBanner() {
		var banner = document.getElementById('cookie-consent-banner');
		if (banner && banner.parentNode) { banner.parentNode.removeChild(banner); }
	}

	function ensureBannerStyles() {
		if (document.getElementById('cksda-consent-inline-style')) return;

		var style = document.createElement('style');
		style.id = 'cksda-consent-inline-style';
		style.textContent =
			'#cookie-consent-banner{' +
			'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
			'background:#1a1a1a;color:#e0e0e0;' +
			'padding:0.9rem 1rem calc(0.9rem + env(safe-area-inset-bottom));' +
			'display:flex;align-items:center;flex-wrap:wrap;gap:0.75rem;' +
			'font-size:0.95rem;line-height:1.35;' +
			'box-shadow:0 -2px 10px rgba(0,0,0,0.45);' +
			'}' +
			'#cookie-consent-banner p{margin:0;flex:1 1 16rem;min-width:0;}' +
			'#cookie-consent-banner a{color:#7ec8e3;text-decoration:underline;}' +
			'.cksda-consent-actions{display:flex;gap:0.5rem;flex-wrap:wrap;}' +
			'#cksda-consent-accept,#cksda-consent-decline{' +
			'appearance:none;-webkit-appearance:none;' +
			'border-radius:8px;padding:0.55rem 0.95rem;' +
			'font-size:0.95rem;font-weight:700;line-height:1.2;' +
			'min-height:44px;touch-action:manipulation;cursor:pointer;' +
			'}' +
			'#cksda-consent-accept{border:0;background:#4a90d9;color:#fff;}' +
			'#cksda-consent-decline{border:1px solid #909090;background:transparent;color:#e0e0e0;}' +
			'#cksda-consent-accept:hover,#cksda-consent-accept:focus-visible{background:#357abd;}' +
			'#cksda-consent-decline:hover,#cksda-consent-decline:focus-visible{background:rgba(255,255,255,0.1);}' +
			'@media (max-width: 640px){' +
			'#cookie-consent-banner{align-items:stretch;padding:0.85rem 0.85rem calc(0.95rem + env(safe-area-inset-bottom));}' +
			'.cksda-consent-actions{width:100%;}' +
			'#cksda-consent-accept,#cksda-consent-decline{flex:1 1 9rem;}' +
			'}';

		document.head.appendChild(style);
	}

	function showBanner() {
		ensureBannerStyles();
		var banner = document.createElement('div');
		banner.id = 'cookie-consent-banner';
		banner.setAttribute('role', 'dialog');
		banner.setAttribute('aria-label', 'Cookie consent');
		banner.innerHTML =
			'<p>We use cookies and analytics tools (Google Analytics &amp; Microsoft Clarity) to understand site usage. ' +
			'See our <a href="/privacy.html">Privacy Policy</a> for details.</p>' +
			'<div class="cksda-consent-actions">' +
			'<button id="cksda-consent-accept">Accept</button>' +
			'<button id="cksda-consent-decline">Decline</button>' +
			'</div>';
		document.body.appendChild(banner);

		var acceptBtn = document.getElementById('cksda-consent-accept');
		var declineBtn = document.getElementById('cksda-consent-decline');
		
		if (acceptBtn) {
			acceptBtn.addEventListener('click', function () {
				localStorage.setItem(CONSENT_KEY, 'granted');
				grantConsent();
				removeBanner();
			});
		}

		if (declineBtn) {
			declineBtn.addEventListener('click', function () {
				localStorage.setItem(CONSENT_KEY, 'denied');
				removeBanner();
			});
		}
	}

	var stored = localStorage.getItem(CONSENT_KEY);
	if (stored === 'granted') {
		// Restore consent for returning visitors who already accepted
		grantConsent();
	} else if (stored === null) {
		// First visit — show the consent banner
		// document.body is available since this script loads at end of <body>
		showBanner();
	}
	// If stored === 'denied': consent stays denied, no action needed
