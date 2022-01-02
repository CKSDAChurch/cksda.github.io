/*
	© CKSDA Church
	cksda.church/
*/

//// *********** Livesteam Youtube *********** ////
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

if ((hour >= 19 && hour <= 20 && day == 5) || (hour >= 9 && hour <= 12 && day == 6)) { // CKSDA Church hours
    document.getElementById("youtubeLive").innerHTML = `<h3>Watch CKSDA Church</h3>
        <iframe style="width: 100%; height: 22em;" title="CKSDA Church Livestream" frameborder="0" allowfullscreen
        src="https://www.youtube.com/embed/live_stream?channel=UCwWsr1Z3S9SY-DfkIwUMSYQ"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
// } else { // CKSDA RSVP
    // document.getElementById("youtubeLive").innerHTML = `<h3>RSVP for this week's service</h3>
    // <p>Signup open at 11am each Thursday, so be sure to make your reservation early!<br />
    //     Please remember to only RSVP for yourself, your siblings or immediate family.</p>
    // <ul class="actions special">
    //     <li><a href="https://docs.google.com/forms/d/e/1FAIpQLSfncXJnaXpuyveEdghfwcwDFSAtEaNN7lES-4lFiRy8O33hEQ/viewform" class="button" target="_blank">RSVP</a></li>
    // </ul>`;
// }
} else {
    document.getElementById("youtubeLive").innerHTML = `<h3>Watch Previous Service</h3>
        <iframe style="width: 100%; height: 22em;" title="YouTube video player" allowfullscreen frameborder="0"
        src="https://www.youtube.com/embed/videoseries?index=0&list=PLIkL0-bPEL8qQUoX4JIONp-RCjgwKQFgx"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
}


//// *********** Show the last n videos *********** ////
// 1. The <iframe> (and video player) will replace this <div> tag.
// <div id="player"></div>

// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player) after the API code downloads.
var player, player2, player3;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        videoId: 'wyswv1J8kAM',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    player2 = new YT.Player('player2', {
        videoId: 'QffWImBqfuc',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    player3 = new YT.Player('player3', {
        videoId: 'LN-4AfzdCNg',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    // event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000);
        done = true;
    }
}
function stopVideo() {
    player.stopVideo();
    player2.stopVideo();
    player3.stopVideo();
}