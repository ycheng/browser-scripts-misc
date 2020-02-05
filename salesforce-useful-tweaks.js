// ==UserScript==
// @name           Salesforce Useful UI Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*.salesforce\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @version        2.28
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
var attachments = getElementByXpath("/html/body//a[contains(text(),'Files')]/@href");
var style = document.createElement('style');
var profile_details = document.querySelectorAll('.efhpLabeledFieldValue > a')

// alert(profile_details[0])

// Hacky, but checks for CVE references in the case summary, re-links them as below
document.querySelectorAll('#cas15_ileinner').forEach(node => {
	node.innerHTML = node.innerHTML.replace(/(?:[^\/])(cve-\d{4}-\d{4,7})/gim,
		'<span title="Search for $1">&nbsp;<a style="color:blue;" href="' + u_cvesearch + '$1.html" target="_blank">$1</a></span>')
});

// document.getElementByXpath("/html/body//td[contains(text(),'files.support')]").forEach(node => {
// 	 alert(node)
// });

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

    // Attempt to turn anything that looks like a URL in a case comment, into a clickable link
    node.innerHTML = node.innerHTML.replace(/(?=(https?:\/{2}[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\;//=]*)?))\1(?!['"]|<\/a>)+/gim,
		'<a style="color:blue;" href="$&">$&</a>')

    // These will dynamically link in any references to CVEs to their requisite search URLs
	node.innerHTML = node.innerHTML.replace(/(?:[^\/])(cve-\d{4}-\d{4,7})/gim,
		'<span title="Search for $1">&nbsp;<a style="color:blue;" href="' +
		u_cvesearch +
		'$1.html" target="_blank">$1</a></span>')

	// This is brittle, it should be: getElementByXpath("//*[contains(text(),'Make Public')]/following::td[1]")
	// I don't like it, I'll fix it later.
	node.innerHTML = node.innerHTML.replace(/<a href(.*) title="Make Public(.*?)<td class="\s+dataCell\s+">(.*)/gi,
		'<a href $1 title="Make Public $2<td class="dataCell" id="private"><span class="watermark">private comment</span>$3')

});

style.innerHTML += `
#private{background-color:#fff2e6;}
#tools{background-color:#f1f1f1;border:1px solid #d3d3d3;border-radius:0 0 10px 10px;position:fixed;text-align:center;z-index:9;}
#tbox_header{color:#fff;cursor:move;z-index:10;}
#toolbox{-moz-column-width:160px;column-width:160px;font-weight:400 0;margin:1em;text-align:left;}
.efdvJumpLink{position:fixed;z-index:8;border:1px solid #000;background-color:#ddeef4;border-radius:5px;box-shadow: 5px 10px #ccc;left:3em;width:150px;}
.efdvJumpLinkTitle{font-weight:bold;text-align:center;color:#00f;width:100%;}
.close{cursor:pointer;position:absolute;right:1%;top:4px;transform:translate(0%,-50%);}
.noStandardTab td.dataCell{font:8pt monospace!important;word-wrap:break-word;}
.noStandardTab tr.dataRow.even td.dataCell:nth-of-type(2){background:#f0f0f5;border:1px solid #cecece;}
div.listRelatedObject.caseBlock div.bPageBlock.brandSecondaryBrd.secondaryPalette table.list tr.even {background: #f0f0f0;}
.portaluser{background-color:#ff0;display:block;margin:-.5em;padding-left:.5em;}
.techops{background-color:#90ee90;display:block;margin:-.5em;padding-left:.5em;}
.urgent{animation:urgent .7s infinite;}
.watermark{color:red;font-size:1em;left:1.2em;opacity:0.5;position:absolute;vertical-align:bottom;z-index:1000;}
div #cas15_ileinner{background-color:#90ee90;border:1px solid #cecece;color:#000;font:8pt monospace !important;padding:1em;}
hr {border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));}
.tbox_call, .tbox_time{margin:0;text-align: left;}
.tbox_call::before{margin-left:.5em;content:"\u260E ";}
.tbox_time::before{margin-left:.5em;content:"\u23F1 ";}
@keyframes urgent{
  0%{color:#f00;}
 49%{color:transparent;}
 50%{color:transparent;}
 99%{color:transparent;}
 100%{color:#000;}
`;

var toolbox = ''
var tbox_header = ''
var sev_level = getElementByXpath("//*[contains(text(),'Severity Level')]/following::div[1]").replace(/.*L(\d+).*/, 'L$1')
if (sev_level) {
	// Add some urgency to the L1 level cases
	sev_level.includes('L1') ? sev_level = `<span class="urgent">` + sev_level + `</span>` : sev_level
	sev_level.includes('L1') ? tbox_header = '#f00' : tbox_header = '#4287f5'
    sev_level.includes('L1') ? style.innerHTML += '.efdvJumpLink{border:2px solid #f00;border-radius:10px;}' : ''
    // style.innerHTML += `#tbox_header{background: ` + tbox_header + `;}`
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

var append_toolbox = ''
var new_timecard = document.querySelector('input[value="New time card"]').getAttribute('onclick')
var new_timecard_match = new_timecard.match(/this.form.action = (.*?['"]([^'"]*)['"])/);
var new_timecard_msg = document.domain + new_timecard_match[2]

if (document.getElementsByClassName('efdvJumpLinkBody').length > 0) {
    var log_call = document.querySelector('input[value="Log a Call"]').getAttribute('onclick')
    var log_call_match = log_call.match(/navigateToUrl(.*?['"]([^'"]*)['"])/);
    var log_call_msg = document.domain + log_call_match[2]
    var related_lists = document.querySelectorAll('.efdvJumpLinkBody > ul')

    related_lists[0].insertAdjacentHTML('beforeend', '<hr /><li><a class="tbox_call" title="All calls must be logged separately from time cards" href="https://' + log_call_msg + '">Log a Call</a></li>');
    related_lists[0].insertAdjacentHTML('beforeend', '<li><a title="Add a new time card. Must be done by EOD!" class="tbox_time" href="https://' + new_timecard_msg + '">New time card</a></li>');
    // toolbox += '<hr /> <a href="https://' + log_call_msg + '" title="All calls must be logged separately from timecards">Log a Call</a>'
    append_toolbox = document.getElementsByClassName('efdvJumpLinkBody')
    related_lists[0].insertAdjacentHTML('beforebegin', '<br />' + toolbox + '<hr />')
} else { // Non-case-related page rendering
    append_toolbox = document.getElementsByClassName('thumbnailTable')
    style.innerHTML += `#tools{border:1px solid #ccc;}#toolbox{-moz-column-width:200px;column-width:200px;}`
}

// toolbox += ' <a href="https://' + new_timecard_msg + '"  title="Enter a new timecard on this case">New time card</a>'

document.head.appendChild(style);

var techops_toolbox = (`
 <div id="tools">
   <div id="tbox_header">` + me + `'s Toolbox (drag)<span id="close" class="close">✖</span></div>
     <p id="toolbox">` + toolbox + `</p>
   </div>
 </div>
`);

// append_toolbox[0].outerHTML += techops_toolbox






// append_toolbox[0].outerHTML += techops_toolbox

// This is needed to create the draggable toolbox around the page
dragElement(document.getElementById('tools'));

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

