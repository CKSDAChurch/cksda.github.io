(function () {
	'use strict';

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
}());
