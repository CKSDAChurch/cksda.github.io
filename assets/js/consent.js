// @ts-check

var CONSENT_KEY = 'cksdaConsent';
	var analyticsConfig = window.CKSDA_ANALYTICS || {};
	var CLARITY_ID = analyticsConfig.clarityId || 'hik5wt3z51';

	function loadClarity() {
		(function (c, l, a, r, i, t, y) {
			c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
			t = l.createElement(r);
			t.async = 1;
			t.src = 'https://www.clarity.ms/tag/' + i;
			y = l.getElementsByTagName(r)[0];
			y.parentNode.insertBefore(t, y);
		})(window, document, 'clarity', 'script', CLARITY_ID);
	}

	function grantConsent() {
		if (typeof gtag === 'function') {
			gtag('consent', 'update', {
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
		if (banner) { banner.parentNode.removeChild(banner); }
	}

	function showBanner() {
		// Banner styles live in main.css (parsed once at load time).
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

		document.getElementById('cksda-consent-accept').addEventListener('click', function () {
			localStorage.setItem(CONSENT_KEY, 'granted');
			grantConsent();
			removeBanner();
		});

		document.getElementById('cksda-consent-decline').addEventListener('click', function () {
			localStorage.setItem(CONSENT_KEY, 'denied');
			removeBanner();
		});
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
