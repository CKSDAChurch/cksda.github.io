// @ts-check
/*
	© CKSDA Church
	cksda.church/
*/

// YouTube Data API Key — injected at build time by scripts/build.js via esbuild `define`.
// __YOUTUBE_API_KEY__ is replaced with the real key before minification; never commit a real key here.
const YOUTUBE_API_KEY = __YOUTUBE_API_KEY__;

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

        // Filter using liveStreamingDetails directly — more reliable than liveBroadcastContent,
        // which can return 'none' for scheduled streams depending on the broadcast tool used.
        //
        // Broadcast video (has liveStreamingDetails):
        //   - Include if actualStartTime is set (currently live or already completed)
        //   - Exclude if no actualStartTime (not yet started — future scheduled stream)
        // Regular video upload (no liveStreamingDetails):
        //   - Include if processed, public, and not future-scheduled via publishAt
        const now = new Date();

        const publishedVideos = detailsData.items.filter(video => {
            const status = video.status;
            const liveDetails = video.liveStreamingDetails;
            const publishedAt = new Date(video.snippet.publishedAt);

            if (liveDetails) {
                // Broadcast video: only include if it has actually started
                return !!liveDetails.actualStartTime;
            } else {
                // Regular upload: must be processed, publicly visible, and not future-scheduled
                return status.uploadStatus === 'processed'
                    && publishedAt <= now
                    && status.privacyStatus === 'public'
                    && !(status.publishAt && new Date(status.publishAt) > now);
            }
        });

        console.log(`YouTube: Found ${publishedVideos.length} published videos from ${detailsData.items.length} total`);

        // Sort by the real broadcast start time (or publishedAt for regular uploads), newest first.
        // Using actualStartTime rather than publishedAt ensures the sort reflects service date,
        // not upload/creation date (which can differ when streams are created weeks in advance).
        if (publishedVideos.length > 0) {
            publishedVideos.sort((a, b) => {
                const aTime = new Date(a.liveStreamingDetails?.actualStartTime || a.snippet.publishedAt);
                const bTime = new Date(b.liveStreamingDetails?.actualStartTime || b.snippet.publishedAt);
                return bTime - aTime;
            });
            console.log('YouTube: Returning latest video:', publishedVideos[0].id);
            return publishedVideos[0].id;
        }
        
        console.warn('YouTube: No suitable videos found after filtering');

    } catch (error) {
        console.error('YouTube: Failed to fetch latest video from playlist:', error);
    }
    return null;
}

//// *********** Helper function to get next UPCOMING/SCHEDULED video from playlist *********** ////
async function getNextScheduledVideoFromPlaylist(playlistId, targetDate = null) {
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

        // Fetch recent playlist items (includes scheduled future items)
        const playlistResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&maxResults=50`
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

        // Filter using liveStreamingDetails directly rather than liveBroadcastContent.
        // Currently live: actualStartTime set, no actualEndTime.
        // Scheduled (not yet started): scheduledStartTime set, no actualStartTime.
        const upcomingVideos = detailsData.items.filter(video => {
            const liveDetails = video.liveStreamingDetails;
            if (!liveDetails) return false;
            // Currently airing live — always include
            if (liveDetails.actualStartTime && !liveDetails.actualEndTime) return true;
            // Scheduled future broadcast: has a scheduled start but hasn't begun yet
            if (liveDetails.scheduledStartTime && !liveDetails.actualStartTime) {
                // When a target date (YYYY-MM-DD) is provided, only match videos scheduled on that date.
                // YouTube returns scheduledStartTime as a UTC ISO string; mid-day services are UTC same-day.
                if (targetDate && !liveDetails.scheduledStartTime.startsWith(targetDate)) return false;
                return true;
            }
            return false;
        });

        console.log(`YouTube: Found ${upcomingVideos.length} upcoming/live videos from ${detailsData.items.length} total`);

        if (upcomingVideos.length === 0) {
            console.warn('YouTube: No upcoming scheduled videos found in playlist');
            return null;
        }

        // Live now takes priority; among scheduled, return the soonest
        upcomingVideos.sort((a, b) => {
            const aLive = !!(a.liveStreamingDetails?.actualStartTime && !a.liveStreamingDetails?.actualEndTime);
            const bLive = !!(b.liveStreamingDetails?.actualStartTime && !b.liveStreamingDetails?.actualEndTime);
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;
            const aTime = new Date(a.liveStreamingDetails?.scheduledStartTime || 0);
            const bTime = new Date(b.liveStreamingDetails?.scheduledStartTime || 0);
            return aTime - bTime;
        });

        console.log('YouTube: Returning next upcoming video:', upcomingVideos[0].id);
        return upcomingVideos[0].id;

    } catch (error) {
        console.error('YouTube: Failed to fetch next scheduled video from playlist:', error);
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
    if (window.lang == "en" && (hour >= 11 && hour < 13 && day == 6)) {
        youtubeLive.innerHTML = `<h3>Watch CKSDA Church</h3>
            <iframe style="width: 100%; height: 22em;" title="CKSDA Church Livestream" frameborder="0" allowfullscreen
            src="https://www.youtube.com/embed/live_stream?channel=UCwWsr1Z3S9SY-DfkIwUMSYQ"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    }
    // CKSDA Church hours (KM)
    else if (window.lang == "ko" && ((hour >= 19 && hour <= 20 && day == 5) || (hour >= 9 && hour < 11 && day == 6))) {
        youtubeLive.innerHTML = `<h3>Watch CKSDA Church</h3>
            <iframe style="width: 100%; height: 22em;" title="CKSDA Church Livestream" frameborder="0" allowfullscreen
            src="https://www.youtube.com/embed/live_stream?channel=UCwWsr1Z3S9SY-DfkIwUMSYQ"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    }
    // Last Week (KM)
    else if (window.lang == "ko") {
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
// Must be assigned to window so the YouTube IFrame API (a non-module external script) can call it.
window.onYouTubeIframeAPIReady = function() {
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

export { getLatestVideoFromPlaylist, getNextScheduledVideoFromPlaylist };
