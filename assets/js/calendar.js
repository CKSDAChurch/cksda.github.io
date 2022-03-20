/*
	© CKSDA Church
	cksda.church/
*/

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function httpGetAsync(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

httpGet("https://www.googleapis.com/calendar/v3/calendars/c_cupfa6741dgvle32pjejeoqog4@group.calendar.google.com/events")
httpGetAsync("https://www.googleapis.com/calendar/v3/calendars/c_cupfa6741dgvle32pjejeoqog4@group.calendar.google.com/events", "")