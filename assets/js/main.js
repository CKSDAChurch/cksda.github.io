/*
	© CKSDA Church
	cksda.church/
*/

(function ($) {

	var $window = $(window),
		$body = $('body');

	// Breakpoints.
	breakpoints({
		wide: ['1281px', '1680px'],
		normal: ['981px', '1280px'],
		narrow: ['841px', '980px'],
		narrower: ['737px', '840px'],
		mobile: ['481px', '736px'],
		mobilep: [null, '480px']
	});

	// Play initial animations on page load.
	$window.on('load', function () {
		window.setTimeout(function () {
			$body.removeClass('is-preload');
		}, 100);
	});

})(jQuery);

//// LANGUAGE SPECIFIC INFO ////
let json;
let lang = navigator.language;
if (lang.startsWith("ko")) lang = "ko";
else if (lang.startsWith("es")) lang = "es";
else lang = "en";
let langJson = "./assets/langStrings/" + lang + ".json";

const getJson = async () => {
	const response = await fetch(langJson);
	const data = await response.json();
	json = data;
	return data;
};

(async () => {
	await getJson();

	//// ADDING HEADER ////
	var logo = "<img src=\"./images/logo-light.png\"/>";
	var title = json._title;
	var subtitle = json._subtitle;

	var calendarUrl = json.menuItems.calendarURL;
	var collegeUrl = json.menuItems.collegeURL;
	var connectionCardUrl = json.menuItems.connectionCardURL;
	var homeUrl = json.menuItems.homeURL;
	var epochUrl = json.menuItems.epochURL;
	var musicUrl = json.menuItems.musicMinistryURL;
	var pathfindersUrl = json.menuItems.pathfindersURL;

	var urlList = `<a href="` + homeUrl + `">` + json.menuItems.home + `</a> |
<a href="`+ connectionCardUrl + `">` + json.menuItems.connectionCard + `</a> |
<a href="`+ calendarUrl + `">` + json.menuItems.calendar + `</a> |
<a href="`+ collegeUrl + `">` + json.menuItems.college + `</a> |
<a href="`+ musicUrl + `">` + json.menuItems.musicMinistry + `</a> |
<a href="`+ pathfindersUrl + `">` + json.menuItems.pathfinders + `</a> |
<a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank">`+ json.menuItems.adventistGiving + `</a>`

	var url = window.location.href
	//// CALENDER PAGE ////
	if (url.endsWith(calendarUrl) || url.endsWith(calendarUrl.substring(0, (calendarUrl.length - 5)))) {
		title = json.pageTitles.calendarTitle;
		subtitle = json.pageTitles.calendarSubtitle;
		urlList = urlList.replace(`<a href="` + calendarUrl + `">` + json.menuItems.calendar + `</a> |`, "");

		document.getElementById("browserTitle").innerHTML = json.calendarPage.browserTitle;
		document.getElementById("calFSMsg").innerHTML = json.calendarPage.calFSMsg;
	}
	//// COLLEGE PAGE ////
	else if (url.endsWith(collegeUrl) || url.endsWith(collegeUrl.substring(0, (collegeUrl.length - 5)))) {
		title = json.pageTitles.collegeTitle;
		subtitle = "";
		urlList = urlList.replace(`<a href="` + collegeUrl + `">` + json.menuItems.college + `</a> |`, "");

		document.getElementById("browserTitle").innerHTML = json.collegePage.browserTitle;
		document.getElementById("importantLinksTitle").innerHTML = json.collegePage.importantLinksTitle;
		document.getElementById("link1").innerHTML = json.collegePage.link1;
		document.getElementById("link2").innerHTML = json.collegePage.link2;
		document.getElementById("eventsTitle").innerHTML = json.collegePage.eventsTitle;
		document.getElementById("event1").innerHTML = json.collegePage.event1;
		document.getElementById("event2").innerHTML = json.collegePage.event2;
		document.getElementById("socialMediaTitle").innerHTML = json.collegePage.socialMediaTitle;
	}
	//// CONNECTION PAGE ////
	else if (url.endsWith(connectionCardUrl) || url.endsWith(connectionCardUrl.substring(0, (connectionCardUrl.length - 5)))) {
		document.getElementById("browserTitle").innerHTML = json.connectionPage.browserTitle;
	}
	//// MUSIC PAGE ////
	else if (url.endsWith(musicUrl) || url.endsWith(musicUrl.substring(0, (musicUrl.length - 5)))) {
		title = json.pageTitles.musicMinistryTitle;
		subtitle = "";
		urlList = urlList.replace(`<a href="` + musicUrl + `">` + json.menuItems.musicMinistry + `</a> |`, "");

		document.getElementById("browserTitle").innerHTML = json.musicPage.browserTitle;
		document.getElementById("socialMediaTitle").innerHTML = json.musicPage.socialMediaTitle;
	}
	//// PATHFINDERS PAGE ////
	else if (url.endsWith(pathfindersUrl) || url.endsWith(pathfindersUrl.substring(0, (pathfindersUrl.length - 5)))) {
		title = json.pageTitles.pathfindersTitle;
		subtitle = "";
		urlList = urlList.replace(`<a href="` + pathfindersUrl + `">` + json.menuItems.pathfinders + `</a> |`, "");

		document.getElementById("browserTitle").innerHTML = json.pathfindersPage.browserTitle;
		document.getElementById("getReadyTitle").innerHTML = json.pathfindersPage.getReadyTitle;
		document.getElementById("whoTitle").innerHTML = json.pathfindersPage.whoTitle;
		document.getElementById("whatTitle").innerHTML = json.pathfindersPage.whatTitle;
		document.getElementById("registrationTitle").innerHTML = json.pathfindersPage.registrationTitle;
		document.getElementById("openingTitle").innerHTML = json.pathfindersPage.openingTitle;
		document.getElementById("contactUsTitle").innerHTML = json.pathfindersPage.contactUsTitle;
		document.getElementById("socialMediaTitle").innerHTML = json.pathfindersPage.socialMediaTitle;
	}
	//// EPOCH PAGE ////
	else if (url.endsWith(epochUrl) || url.endsWith(epochUrl.substring(0, (epochUrl.length - 5)))) {
		title = json.pageTitles.epochTitle;
		subtitle = json.pageTitles.epochSubtitle;

		document.getElementById("browserTitle").innerHTML = json.epochPage.browserTitle;
	}
	//// INDEX PAGE ////
	else {
		urlList = urlList.replace(`<a href="` + homeUrl + `">` + json.menuItems.home + `</a> |`, "");

		document.getElementById("browserTitle").innerHTML = json.indexPage.browserTitle;
		document.getElementById("missionParagraph").innerHTML = json.indexPage.missionParagraph;
		document.getElementById("titheTitle").innerHTML = json.indexPage.titheTitle;
		document.getElementById("titheParagraph1").innerHTML = json.indexPage.titheParagraph1;
		document.getElementById("titheParagraph2").innerHTML = json.indexPage.titheParagraph2;
	}

	var header = `<span class="logo icon">` + logo + `</span>
	<p>`+ urlList + `</p>
	<h1>`+ title + `</h1>
	<p>` + subtitle + `</p>`;

	document.getElementById("header").innerHTML = header;


	//// ADDING FOOTER ////
	var pastorsTitle = json.footer.pastorsTitle;
	var headPastor = json.footer.headPastor;
	var headPastorTitle = json.footer.headPastorTitle;
	var assistantPastor = json.footer.assistantPastor;
	var assistantPastorTitle = json.footer.assistantPastorTitle;
	var worshipServicesTitle = json.footer.worshipServicesTitle;
	var korean = json.footer.korean;
	var english = json.footer.english;
	var ssTitle = json.footer.ssTitle;
	var wsTitle = json.footer.wsTitle;
	var enSStime = json.footer.enSStime;
	var enWStime = json.footer.enWStime;
	var koSStime = json.footer.koSStime;
	var koWStime = json.footer.koWStime;
	var mailingAddressTitle = json.footer.mailingAddressTitle;
	var mailingAddress = json.footer.mailingAddress;
	var phoneTitle = json.footer.phoneTitle;
	var phone = json.footer.phone;
	var websiteTitle = json.footer.websiteTitle;
	var copyright = json.footer.copyright;
	var advWebsiteTitle = json.footer.advWebsiteTitle;

	var footer = `<div class="container medium">
	<header class="major last"><h2>`+ pastorsTitle + `</h2></header>
	
	<p><strong>`+ headPastorTitle + `</strong>:<br />` + headPastor + `</p>
	<p><strong>`+ assistantPastorTitle + `</strong>:<br />` + assistantPastor + `</p>
	
	<header class="major last"><h2>`+ worshipServicesTitle + `</h2></header>
	<div class="WorshipServices">
		<div class="WorshipChild">
			<h4>`+ korean + `</h4>
			<p><strong>`+ ssTitle + `</strong><br />` + koSStime + `<br />
			<strong>`+ wsTitle + `</strong><br />` + koWStime + `</p>
		</div>
		<div class="WorshipChild">
			<h4>`+ english + `</h4>
			<p><strong>`+ ssTitle + `</strong><br />` + enSStime + `<br />
			<strong>`+ wsTitle + `</strong><br />` + enWStime + `</p>
		</div>
	</div>

	<header class="major last"><h2>`+ mailingAddressTitle + `</h2></header>
	<p>`+ mailingAddress + `<br />
	<strong>`+ phoneTitle + `</strong>: ` + phone + `<br />
	<strong>`+ websiteTitle + `</strong>: <a href="https://cksda.church">cksda.church</a></p>
	
	<ul class="icons">
	<li><a href="https://youtube.com/@CKSDAChurch" class="icon brands fa-youtube" target="_blank"><span class="label">YouTube</span></a></li>
	<li><a href="https://instagram.com/CKSDAChurch" class="icon brands fa-instagram" target="_blank"><span class="label">Instagram</span></a></li>
	<li><a href="https://twitter.com/CKSDAChurch" class="icon brands fa-twitter" target="_blank"><span class="label">Twitter</span></a></li>
	<li><a href="https://fb.com/CKSDAChurch" class="icon brands fa-facebook-f" target="_blank"><span class="label">Facebook</span></a></li>
	</ul>
	
	<ul class="copyright">
	<li>`+ copyright + `</li>
	<li><a href="http://adventist.org">`+ advWebsiteTitle + `</a></li>
	</ul>
	</div>`;

	document.getElementById("footer").innerHTML = footer;
})();