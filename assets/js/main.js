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

var url = window.location.href

//// ADDING HEADER ////

var header = `<!-- <span class="logo icon fa-paper-plane"></span> -->
<span class="logo icon">
	<img src="./images/logo-light.png"/>
</span>`
if (url.endsWith("calendar.html") || url.endsWith("calendar")) {
	header += `<p>
	<a href="./index.html">Home</a> |
	<a href="./connection.html">Connection Card</a> |
	<a href="./college.html">College</a> |
	<a href="./music.html">Music Ministry</a> |
	<a href="./pathfinders.html">Pathfinders</a> |
    <a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank">AdventistGiving</a>
</p>
<h1>CKSDA Church Calendar</h1>
<p>If you know of an event that hasn't been added to the church calendar, please contact clerk@cksda.church with the details.</p>`
} else if (url.endsWith("college.html") || url.endsWith("college")) {
	header += `<p>
	<a href="./index.html">Home</a> |
	<a href="./connection.html">Connection Card</a> |
	<a href="./calendar.html">Calendar</a> |
	<a href="./music.html">Music Ministry</a> |
	<a href="./pathfinders.html">Pathfinders</a> |
    <a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank">AdventistGiving</a>
	</p>
	<h1>CKSDA Church Collegiate Ministry</h1>`
} else if (url.endsWith("music.html") || url.endsWith("music")) {
	header += `<p>
		<a href="./index.html">Home</a> |
		<a href="./connection.html">Connection Card</a> |
		<a href="./calendar.html">Calendar</a> |
		<a href="./college.html">College</a> |
		<a href="./pathfinders.html">Pathfinders</a> |
		<a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank">AdventistGiving</a>
	</p>
	<h1>CKSDA Church Music Ministry</h1>`
} else if (url.endsWith("pathfinders.html") || url.endsWith("pathfinders")) {
	header += `<p>
	<a href="./index.html">Home</a> |
	<a href="./connection.html">Connection Card</a> |
	<a href="./calendar.html">Calendar</a> |
	<a href="./college.html">College</a> |
	<a href="./music.html">Music Ministry</a> |
    <a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank">AdventistGiving</a>
	</p>
	<h1>Pioneers Pathfinders Club</h1>`
} else if (url.endsWith("epoch.html") || url.endsWith("epoch")) {
	header += `<p>
	<a href="./index.html">Home</a> |
	<a href="./connection.html">Connection Card</a> |
	<a href="./calendar.html">Calendar</a> |
	<a href="./college.html">College</a> |
	<a href="./music.html">Music Ministry</a> |
	<a href="./pathfinders.html">Pathfinders</a> |
    <a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank">AdventistGiving</a>
	</p>
	<h1>CKSDA Church Epoch</h1>
	<p>Some memories from our yearly epoch</p>`
} else {
	header += `<p>
	<a href="./connection.html">Connection Card</a> |
	<a href="./calendar.html">Calendar</a> |
	<a href="./college.html">College</a> |
	<a href="./music.html">Music Ministry</a> |
	<a href="./pathfinders.html">Pathfinders</a> |
    <a href="https://adventistgiving.org/#/org/ANTFHH/envelope/start" target="_blank">AdventistGiving</a>
</p>
	<h1>Collegedale Korean SDA Church</h1>
<p>To share the everlasting gospel while providing an environment were we can all grow together in the Grace of God; <br />in doing so prepare our community for the eminent return of our Lord and Savior Jesus Christ.</p>`
}

document.getElementById("header").innerHTML = header



//// ADDING FOOTER ////

var footer = `<div class="container medium">
	<header class="major last">
		<h2>Pastor</h2>
	</header>

	<p><strong>Head Pastor</strong>:<br />
		Kangwon Yang</p>
	<p><strong>Assistant Pastor</strong>:<br />
		Tony Dennis</p>

	<header class="major last">
		<h2>WORSHIP SERVICES</h2>
	</header>
	<div class="WorshipServices">
		<div class="WorshipChild">
			<h4>English</h4>
			<p><strong>Sabbath School</strong><br />
				10:00AM - 11:15AM<br />

				<strong>Worship Service</strong><br />
				11:30AM - 1:00PM
			</p>
		</div>
		<div class="WorshipChild">
			<h4>Korean</h4>
			<p><strong>Sabbath School</strong><br />
				09:30AM - 10:30AM<br />

				<strong>Worship Service</strong><br />
				10:30AM - 11:15PM
			</p>
		</div>
	</div>

	<header class="major last">
		<h2>MAILING ADDRESS</h2>
	</header>
	<p>4717 Ooltewah Ringgold Rd<br />
		Ooltewah, TN 37363<br />
	<strong>Phone</strong>: (423) 453-3004<br />
	<strong>Website</strong>: <a href="https://cksda.church">cksda.church</a></p>

	<ul class="icons">
		<li><a href="https://youtube.com/@CKSDAChurch" class="icon brands fa-youtube" target="_blank"><span class="label">YouTube</span></a></li>
		<li><a href="https://instagram.com/CKSDAChurch" class="icon brands fa-instagram" target="_blank"><span class="label">Instagram</span></a></li>
		<li><a href="https://twitter.com/CKSDAChurch" class="icon brands fa-twitter" target="_blank"><span class="label">Twitter</span></a></li>
		<li><a href="https://fb.com/CKSDAChurch" class="icon brands fa-facebook-f" target="_blank"><span class="label">Facebook</span></a></li>
	</ul>

	<ul class="copyright">
		<li>&copy; Collegedale Korean Seventh-Day Adventist Church</li>
		<li><a href="http://adventist.org">Seventh-Day Adventist Church Official Website</a></li>
	</ul>
</div>`

document.getElementById("footer").innerHTML = footer