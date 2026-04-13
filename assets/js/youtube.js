/*
	© CKSDA Church
	cksda.church/
*/

// YouTube Data API Key - DO NOT commit an actual key to version control.
// Replace this placeholder with a restricted API key during deployment.
const YOUTUBE_API_KEY = 'REPLACE_WITH_YOUR_API_KEY';

//// *********** Helper function to get latest PUBLISHED video from playlist (excluding scheduled) *********** ////
async function getLatestVideoFromPlaylist(playlistId) {
    try {
        // Test the API key first with a simple call
        const testResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=id&id=UCwWsr1Z3S9SY-DfkIwUMSYQ&key=${YOUTUBE_API_KEY}`
        );
        const testData = await testResponse.json();
        
        if (testData.error) {
            console.error('YouTube API key test failed:', testData.error);
            return null;
        }
        
        // Fetch multiple videos from the playlist to filter through
        const playlistResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&order=date&maxResults=50`
        );
        const playlistData = await playlistResponse.json();
        
        if (playlistData.error) {
            console.error('YouTube API Error fetching playlist:', playlistData.error);
            return null;
        }
        
        if (!playlistData.items || playlistData.items.length === 0) {
            console.warn('No items in playlist');
            return null;
        }

        // Extract video IDs and fetch their detailed status
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');
        
        const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=status,liveStreamingDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const detailsData = await detailsResponse.json();

        if (detailsData.error) {
            console.error('YouTube API Error fetching video details:', detailsData.error);
            return null;
        }

        if (!detailsData.items) {
            console.warn('No video details found');
            return null;
        }

        // Filter for videos that are either:
        // 1. Currently live, OR
        // 2. Already published/processed (not scheduled to premiere)
        const now = new Date();
        
        const publishedVideos = detailsData.items.filter(video => {
            const status = video.status;
            const liveDetails = video.liveStreamingDetails;
            const publishedAt = new Date(video.snippet.publishedAt);
            const broadcastContent = video.snippet.liveBroadcastContent;

            const isLiveNow = liveDetails && liveDetails.actualStartTime && !liveDetails.actualEndTime;
            const isScheduled = broadcastContent === 'upcoming' || (liveDetails && liveDetails.scheduledStartTime && !liveDetails.actualStartTime);
            const isPublishedVideo = status.uploadStatus === 'processed' && publishedAt <= now && broadcastContent !== 'upcoming';

            if (isLiveNow) {
                return true;
            }

            if (isScheduled) {
                return false;
            }

            if (isPublishedVideo) {
                return true;
            }

            return false;
        });

        console.log(`YouTube: Found ${publishedVideos.length} published videos from ${detailsData.items.length} total`);

        // Sort by published date (newest first) and return the latest
        if (publishedVideos.length > 0) {
            publishedVideos.sort((a, b) => 
                new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
            );
            console.log('YouTube: Returning latest video:', publishedVideos[0].id);
            return publishedVideos[0].id;
        }
        
        console.warn('YouTube: No suitable videos found after filtering');

    } catch (error) {
        console.error('YouTube: Failed to fetch latest video from playlist:', error);
    }
    return null;
}

//// *********** Livestream YouTube *********** ////
var now = new Date();
var hour = now.getHours();
var day = now.getDay();

const youtubeLive = document.getElementById("youtubeLive");
if (youtubeLive) {
    // CKSDA Church hours (EM)
    if (lang == "en" && (hour >= 11 && hour < 13 && day == 6)) {
        youtubeLive.innerHTML = `<h3>Watch CKSDA Church</h3>
            <iframe style="width: 100%; height: 22em;" title="CKSDA Church Livestream" frameborder="0" allowfullscreen
            src="https://www.youtube.com/embed/live_stream?channel=UCwWsr1Z3S9SY-DfkIwUMSYQ"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    }
    // CKSDA Church hours (KM)
    else if (lang == "ko" && ((hour >= 19 && hour <= 20 && day == 5) || (hour >= 9 && hour < 11 && day == 6))) {
        youtubeLive.innerHTML = `<h3>Watch CKSDA Church</h3>
            <iframe style="width: 100%; height: 22em;" title="CKSDA Church Livestream" frameborder="0" allowfullscreen
            src="https://www.youtube.com/embed/live_stream?channel=UCwWsr1Z3S9SY-DfkIwUMSYQ"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    }
    // Last Week (KM)
    else if (lang == "ko") {
        getLatestVideoFromPlaylist('PLIkL0-bPEL8qxyr_fpD0-8ke5zosKG-cF').then(videoId => {
            if (videoId) {
                youtubeLive.innerHTML = `<h3>Watch CKSDA Church</h3>
                    <iframe style="width: 100%; height: 22em;" title="YouTube video player" allowfullscreen frameborder="0"
                    src="https://www.youtube.com/embed/${videoId}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
            } else {
                // Fallback to playlist if API fails
                youtubeLive.innerHTML = `<h3>Watch CKSDA Church</h3>
                    <iframe style="width: 100%; height: 22em;" title="YouTube video player" allowfullscreen frameborder="0"
                    src="https://www.youtube.com/embed/videoseries?index=1&list=PLIkL0-bPEL8qxyr_fpD0-8ke5zosKG-cF"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
            }
        });
    } 
    // Last Week (EM)
    else {
        getLatestVideoFromPlaylist('PLIkL0-bPEL8qQUoX4JIONp-RCjgwKQFgx').then(videoId => {
            if (videoId) {
                youtubeLive.innerHTML = `<h3>Watch Previous Service</h3>
                    <iframe style="width: 100%; height: 22em;" title="YouTube video player" allowfullscreen frameborder="0"
                    src="https://www.youtube.com/embed/${videoId}"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
            } else {
                // Fallback to playlist if API fails
                youtubeLive.innerHTML = `<h3>Watch Previous Service</h3>
                    <iframe style="width: 100%; height: 22em;" title="YouTube video player" allowfullscreen frameborder="0"
                    src="https://www.youtube.com/embed/videoseries?index=1&list=PLIkL0-bPEL8qQUoX4JIONp-RCjgwKQFgx"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
            }
        });
    }
}


//// *********** Show the last n videos *********** ////
// 1. The <iframe> (and video player) will replace this <div> tag.
// <div id="player"></div>

// 2. Load the IFrame Player API code asynchronously only when player placeholders exist.
var player, player2, player3;
var playerIds = ['player', 'player2', 'player3'];
var hasPlayerEmbed = playerIds.some(function(id) {
    return document.getElementById(id) !== null;
});

if (hasPlayerEmbed) {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// 3. This function creates an <iframe> (and YouTube player) after the API code downloads.
function onYouTubeIframeAPIReady() {
    if (document.getElementById('player')) {
        player = new YT.Player('player', {
            videoId: 'wyswv1J8kAM',
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
    if (document.getElementById('player2')) {
        player2 = new YT.Player('player2', {
            videoId: 'QffWImBqfuc',
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
    if (document.getElementById('player3')) {
        player3 = new YT.Player('player3', {
            videoId: 'LN-4AfzdCNg',
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    }
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