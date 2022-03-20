/*
	© CKSDA Church
	cksda.church/
*/

var year = new Date().getFullYear();
var month = new Date().getMonth();
var day = new Date().getDate();
var thisWeekBulletin = ""

month = month < 10 ? "0" + (month + 1) : (month + 1);
day = day < 10 ? "0" + day : day;

thisWeekBulletin = year + "-" + month + "-" + day

var urlLogin = "https://cksdachurch-my.sharepoint.com/:f:/g/personal/av_cksda_church/En4W1hiuoBJIhhympgivAkwB8VTlYbf4MIwb7jM9aTO2Sw?e=cjgZGH"
var urlDir = `https://cksdachurch-my.sharepoint.com/personal/av_cksda_church/Documents/bulletins/en/2022/${thisWeekBulletin}.pdf`

// window.open(urlLogin, '_blank')//.focus();
document.getElementById("bulletin").innerHTML = `<embed src="./assets/bulletins/2022-01-01.pdf" style="margin: 0 5%;" width="90%" height="600px" />`
// document.getElementById("bulletin").innerHTML = `<meta http-equiv="refresh" content="0; url=${urlDir}" />`
// document.getElementById("bulletin").innerHTML = `<meta http-equiv="refresh" content="3; url=https://cksdachurch-my.sharepoint.com/personal/av_cksda_church/Documents/bulletins/en/2022/${thisWeekBulletin}.pdf" />`

// if new bulletin exists, use it
// otherwise use last weeks