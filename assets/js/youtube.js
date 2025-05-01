/*
	© CKSDA Church
	cksda.church/
*/

//// *********** Livestream YouTube *********** ////
var month = new Date().getUTCMonth();
var daylightSaving;
if (month >= 1 && month <= 9) { // March 1st to November 1st
    daylightSaving = true
} else { // November 1st to March 1st
    daylightSaving = false
}

var hour = new Date().getUTCHours();
if (daylightSaving) {
    hour = hour - 4; // EDT = UTC - 4
} else {
    hour = hour - 5; // EST = UTC - 5
}

var day = new Date().getUTCDay();

// CKSDA Church hours (EM)
if (lang == "en" && (hour >= 11 && hour < 13 && day == 6)) {
    document.getElementById("youtubeLive").innerHTML = `<h3>Watch CKSDA Church</h3>
        <iframe style="width: 100%; height: 22em;" title="CKSDA Church Livestream" frameborder="0" allowfullscreen
        src="https://www.youtube.com/embed/live_stream?channel=UCwWsr1Z3S9SY-DfkIwUMSYQ"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
}
// CKSDA Church hours (KM)
else if (lang == "ko" && ((hour >= 19 && hour <= 20 && day == 5) || (hour >= 9 && hour <= 11 && day == 6))) {
    document.getElementById("youtubeLive").innerHTML = `<h3>Watch CKSDA Church</h3>
        <iframe style="width: 100%; height: 22em;" title="CKSDA Church Livestream" frameborder="0" allowfullscreen
        src="https://www.youtube.com/embed/live_stream?channel=UCwWsr1Z3S9SY-DfkIwUMSYQ"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
}
// Last Week (KM)
else if (lang == "ko") {
    document.getElementById("youtubeLive").innerHTML = `<h3>Watch CKSDA Church</h3>
        <iframe style="width: 100%; height: 22em;" title="YouTube video player" allowfullscreen frameborder="0"
        src="https://www.youtube.com/embed/videoseries?index=1&list=PLIkL0-bPEL8qxyr_fpD0-8ke5zosKG-cF"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
} 
// Last Week (EM)
else {
    document.getElementById("youtubeLive").innerHTML = `<h3>Watch Previous Service</h3>
        <iframe style="width: 100%; height: 22em;" title="YouTube video player" allowfullscreen frameborder="0"
        src="https://www.youtube.com/embed/videoseries?index=1&list=PLIkL0-bPEL8qQUoX4JIONp-RCjgwKQFgx"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
}