// ==UserScript==
// @name           Salesforce Useful UI Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*.salesforce\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @version        2.14
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
var attachments = getElementByXpath("/html/body//a[contains(text(),'Google Docs & Attachments')]/@href")

// Hacky, but checks for CVE references in the case summary, re-links them as below
document.querySelectorAll('#cas15_ileinner').forEach(node => {
	node.innerHTML = node.innerHTML.replace(/cve-(\d{4})-(\b\d{4,9}\b)/gi,
		'<span title="Search for CVE-$1-$2"><a style="color:blue;" href="' + u_cvesearch + '$1/CVE-$1-$2.html" target="_blank">CVE-$1-$2</a></span>')
});

var me = document.getElementsByTagName('span')
me = me[1].title.replace(/(\w+)\s.*/, '$1')

document.querySelectorAll('.noStandardTab .dataRow').forEach(node => {
	node.innerHTML = node.innerHTML.replace(/(Created By:.*)/,
		'<span class="techops">$1</span>')

	node.innerHTML = node.innerHTML.replace(/(Created By: .+ \(portal\).*<\/b>)/gi,
		'<div class="portaluser">$1</div><\/b>')

    // Special handling for attachments in case comments
	node.innerHTML = node.innerHTML.replace(/\-New Attachment added: ([^()]+)/gi,
		'&#128206; <span style="color:red;">IMPORTANT New Attachment added</span>: <a href="' + attachments + '">$1</a>')

    // These will dynamically link in any references to CVEs to their requisite search URLs
	node.innerHTML = node.innerHTML.replace(/cve-(\d{4})-(\b\d{4,9}\b)/gi,
		'<span title="Search for CVE-$1-$2"><a style="color:blue;" href="' +
		u_cvesearch +
		'$1/CVE-$1-$2.html" target="_blank">CVE-$1-$2</a></span>')

    // Attempt to turn anything that looks like a URL in a case comment, into a clickable link
    node.innerHTML = node.innerHTML.replace(/(?=(https?:\/{2}[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?))\1(?!['"]|<\/a>)+/gi,
		'<a style="color:blue;" href="$&">$&</a>')

	// This is brittle, it should be: getElementByXpath("//*[contains(text(),'Make Public')]/following::td[1]")
	// I don't like it, I'll fix it later.
	node.innerHTML = node.innerHTML.replace(/<a href(.*) title="Make Public(.*?)<td class="\s+dataCell\s+">(.*)/gi,
		'<a href $1 title="Make Public $2<td class="dataCell" id="private"><span class="watermark">private comment</span>$3')
});

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

var style = document.createElement('style');
style.innerHTML = `
#private{background-color:#fff2e6;}
#tam{background-color:#f1f1f1;border:1px solid #d3d3d3;border-radius:0 0 10px 10px;position:fixed;text-align:center;z-index:9;}
#tbox_header{background-color:#4287f5;color:#fff;cursor:move;z-index:10;}
#toolbox{-moz-column-width:160px;column-width:160px;font-weight:400 0;margin:1em;text-align:left;}
.close{cursor:pointer;position:absolute;right:1%;top:10%;transform:translate(0%,-50%);}
.noStandardTab td.dataCell{font:8pt monospace!important;word-wrap:break-word;}
.noStandardTab tr.dataRow.even td.dataCell:nth-of-type(2){background:#f0f0f5;border:1px solid #cecece;}
.portaluser{background-color:#FF0;display:block;margin:-.5em;padding-left:.5em;}
.techops{background-color:#90EE90;display:block;margin:-.5em;padding-left:.5em;}
.urgent{animation:urgent .7s infinite;}
.watermark{color:red;font-size:1em;left:1.2em;opacity:0.5;position:absolute;vertical-align:bottom;z-index:1000;}
div #cas15_ileinner{background-color:#90EE90;border:1px solid #cecece;color:#000;font:8pt monospace !important;padding:1em;}
@keyframes urgent{
  0%{color:#f00;}
 49%{color:transparent;}
 50%{color:transparent;}
 99%{color:transparent;}
 100%{color:#000;}
}`;
document.head.appendChild(style);

var techops_toolbox = (`
 <div id="tam">
    <div id="tbox_header">` + me + `'s Toolbox (drag)<span id='close' class='close'>✖</span></div>
    <p id="toolbox">` + toolbox + `</p>
    </div>
 </div>
`);

var append_toolbox = document.getElementsByClassName('efdvJumpLinkBody')
append_toolbox[0].innerHTML += techops_toolbox

// This is needed to create the draggable toolbox around the page
dragElement(document.getElementById('tam'));

window.onload = function () {
	document.getElementById("close").onclick = function () {
		return this.parentNode.parentNode.parentNode.removeChild(this.parentNode.parentNode)
	}
};

// This prevents mis-clicks on objects like "Make Public" and "Close Case" without a popup warning
//     $(document).on("click", "a", function (t) {
//         t.preventDefault();
//         var n = $(this).attr("href");
//         n.startsWith("http") || (n = document.baseURI + n), confirm("Do you want to visit the following link?\n\n" + n) ? location.href = n : t.preventDefault()
//     });

function dragElement(n) {
	var t = 0,
		o = 0,
		u = 0,
		l = 0;

	function e(e) {
		(e = e || window.event).preventDefault(); u = e.clientX; l = e.clientY; document.onmouseup = m; document.onmousemove = d
	}

	function d(e) {
		(e = e || window.event).preventDefault(); t = u - e.clientX; o = l - e.clientY; u = e.clientX; l = e.clientY; n.style.top = n.offsetTop - o + "px"; n.style.left = n.offsetLeft - t + "px"
	}

	function m() {
		document.onmouseup = null; document.onmousemove = null
	}
	document.getElementById(n.id + "header") ? document.getElementById(n.id + "header").onmousedown = e : n.onmousedown = e
}

