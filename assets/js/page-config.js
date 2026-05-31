/*
	© CKSDA Church
	cksda.church/
*/

const buildPageConfig = (helpers) => {
	const { pageMatches } = helpers;

	return {
		calendar: {
			match: (urls) => pageMatches(urls.calendarURL),
			title: (json) => json.pageTitles.calendarTitle,
			subtitle: (json) => json.pageTitles.calendarSubtitle,
			init: (json) => ({
				browserTitle: json.calendarPage.browserTitle
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
				titheParagraph2: json.indexPage.titheParagraph2,
				serviceTimes: (() => {
					const f = json.footer;
					const fmt = new Intl.DateTimeFormat(json._lang || 'en', { hour: 'numeric', minute: '2-digit' });
					const fmtRange = (range) => {
						const [start, end] = range.split('-').map(p => {
							const [h, m] = p.trim().split(':').map(Number);
							return fmt.format(new Date(2000, 0, 1, h, m));
						});
						return `${start} \u2013 ${end}`;
					};
					return `
						<h2 class="service-times__heading">${f.worshipServicesTitle}</h2>
						<div class="service-times__grid">
							<div class="service-times__card">
								<h3>${f.korean}</h3>
								<p><strong>${f.ssTitle}</strong><br>${fmtRange(f.koSStime)}</p>
								<p><strong>${f.wsTitle}</strong><br>${fmtRange(f.koWStime)}</p>
							</div>
							<div class="service-times__card">
								<h3>${f.english}</h3>
								<p><strong>${f.ssTitle}</strong><br>${fmtRange(f.enSStime)}</p>
								<p><strong>${f.wsTitle}</strong><br>${fmtRange(f.enWStime)}</p>
							</div>
						</div>
						<p class="service-times__note"><a href="calendar.html">${json.calendarPage ? json.calendarPage.browserTitle.split('|')[0].trim() : 'View full calendar'} &rarr;</a></p>
					`;
				})()
			})
		}
	};
};

window.buildPageConfig = buildPageConfig;
