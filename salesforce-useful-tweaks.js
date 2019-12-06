// ==UserScript==
// @name           Salesforce Useful UI Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*.salesforce\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @version        2.11
// @require        https://code.jquery.com/jquery-3.4.1.js
// @grant          GM_addStyle
// ==/UserScript==

// Query selectors by XPath
function getElementByXpath(path) {
	var xpath_fragment = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	if (xpath_fragment) return xpath_fragment.textContent;
	else return "";
}

var c_cvesearch = "https://cve.mitre.org/cgi-bin/cvename.cgi?name=cve-";
var u_cvesearch = "https://people.canonical.com/~ubuntu-security/cve/";

// Hacky, but checks for CVE references in the case summary, re-links them as below
document.querySelectorAll('#cas15_ileinner').forEach(node => {
	node.innerHTML = node.innerHTML.replace(/cve-(\d{4})-(\b\d{4,9}\b)/gi,
		'<span title="Search for CVE-$1-$2"><a style="color:blue;" href="' + u_cvesearch + '$1/CVE-$1-$2.html" target="_blank">CVE-$1-$2</a></span>')
});

document.querySelectorAll('.noStandardTab .dataRow').forEach(node => {
	node.innerHTML = node.innerHTML.replace(/(Created By:.*)/,
		'<span class="techops">$1</span>')

	node.innerHTML = node.innerHTML.replace(/(Created By: .+ \(portal\).*<\/b>)/gi,
		'<div class="portaluser">$1</div><\/b>')

    // Special handling for attachments in case comments
	node.innerHTML = node.innerHTML.replace(/New Attachment added: ([^()]+) \((https?:\/\/[.a-z0-9A-Z]+\/.+)\)/gi,
		'<strong style="color: red;">IMPORTANT New Attachment added</strong>: <a style="color:blue;" href="$2">$1</a>')

    // These will dynamically link in any references to CVEs to their requisite search URLs
	node.innerHTML = node.innerHTML.replace(/cve-(\d{4})-(\b\d{4,9}\b)/gi,
		'<span title="Search for CVE-$1-$2"><a style="color:blue;" href="' +
		u_cvesearch +
		'$1/CVE-$1-$2.html" target="_blank">CVE-$1-$2</a></span>')

    // Attempt to turn anything that looks like a URL in a case comment, into a clickable link
	node.innerHTML = node.innerHTML.replace(/(?=(https?:\/{2}[.a-z0-9A-Z%=\~\+\/&\:\?\-#]+))\1(?!['"]|<\/a>)+/gi,
		'<a style="color:blue;" href="$&">$&</a>')

	// This is brittle, it should be: getElementByXpath("//*[contains(text(),'Make Public')]/following::td[1]")
	// I don't like it, I'll fix it later.
	node.innerHTML = node.innerHTML.replace(/<a href(.*) title="Make Public(.*?)<td class="\s+dataCell\s+">(.*)/gi,
		'<a href $1 title="Make Public $2<td class="dataCell" id="private"><span class="watermark">private comment</span>$3')
});

// This needs a rethink, if [1] is undefined
var me = $('span')[1].title.replace(/(\w+)\s.*/, '$1')

var toolbox = ''
var sev_level = getElementByXpath("//*[contains(text(),'Severity Level')]/following::div[1]").replace(/.*L(\d+).*/, 'L$1')
if (sev_level) {
	// Add some urgency to the L1 level cases
	sev_level.includes('L1') ? sev_level = `<span class="urgent">` + sev_level + `</span>` : sev_level
	toolbox += `Severity: <strong>` + sev_level.trim() + `</strong><br />`
}

var customer = getElementByXpath("//*[contains(text(),'Customer')]/following::a[2]")
if (customer) {
	toolbox += `Customer user: <strong>` + customer.trim() + `</strong><br />`
}

var case_owner = getElementByXpath("//*[contains(text(),'Case Owner')]/following::td[1]")
if (case_owner) {
	toolbox += `Case owner: <strong>` + case_owner.trim() + `</strong><br />`
}

var acct_tam = getElementByXpath("//*[contains(text(),'Technical Account Manager')]/preceding::th[1]").replace(/User:(.*?)/, '$1')
if (acct_tam) {
	toolbox += `TAM: <strong>` + acct_tam.trim() + `</strong><br />`
}

var acct_dse = getElementByXpath("//*[contains(text(),'Dedicated')]/preceding::th[1]").replace(/User:(.*?)/, '$1')
if (acct_dse) {
	toolbox += `DSE: <strong>` + acct_dse.trim() + `</strong>`
}

$(".efdvJumpLinkBody").append(`
<style>
#tam{position:fixed;border-radius:0 0 10px 10px;z-index:9;background-color:#f1f1f1;border:1px solid #d3d3d3;text-align:center}
#tbox_header{cursor:move;z-index:10;background-color:#4287f5;color:#fff}
#toolbox{text-align:left;margin:1em;font-weight:400 -webkit-column-width:160px;-moz-column-width:160px;column-width:160px;}
#private{background-color:#fff2e6;}
div #cas15_ileinner{font:8pt !important;padding:1em;color:black;background-color:lightgreen;border:1px solid #cecece;font:8pt monospace;}
.noStandardTab tr.dataRow.even td.dataCell:nth-of-type(2){background:#f0f0f5;border:1px solid #cecece;}
.noStandardTab td.dataCell{word-wrap:break-word;font:8pt monospace !important;}
.techops{background-color:lightgreen;display:block;margin:-.5em;padding-left:.5em;}
.portaluser{background-color:yellow;display:block;margin:-.5em;padding-left:.5em;}
.close{cursor:pointer;position:absolute;top:10%;right:1%;transform:translate(0%, -50%);}
.urgent{animation:urgent 0.7s infinite;}
@keyframes urgent{0%{color:#f00;}
 49%{color:transparent;}
 50%{color:transparent;}
 99%{color:transparent;}
 100%{color:#000;}
}
.watermark{position:absolute;vertical-align:bottom;color:#f00;opacity:0.5;font-size:1em;left:1.2em;z-index:1000;}
</style>
<div id="tam">
   <div id="tbox_header">` + me + `'s Toolbox (drag)<span id='close' class='close'>✖</span></div>
   <p id="toolbox">` + toolbox + `</p>
</div>
</div>
`);

// This is needed to create the draggable toolbox around the page
dragElement(document.getElementById("tam"));

window.onload = function () {
	document.getElementById("close").onclick = function () {
		return this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode), !1
	}
};

function dragElement(e) {
	var n = 0,
		t = 0,
		o = 0,
		u = 0;

	function l(e) {
		(e = e || window.event).preventDefault(), o = e.clientX, u = e.clientY, document.onmouseup = m, document.onmousemove = d
	}

	function d(l) {
		(l = l || window.event).preventDefault(), n = o - l.clientX, t = u - l.clientY, o = l.clientX, u = l.clientY, e.style.top = e.offsetTop - t + "px", e.style.left = e.offsetLeft - n + "px"
	}

	function m() {
		document.onmouseup = null, document.onmousemove = null
	}
	document.getElementById(e.id + "header") ? document.getElementById(e.id + "header").onmousedown = l : e.onmousedown = l
}
