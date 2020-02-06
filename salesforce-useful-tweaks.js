// ==UserScript==
// @name           Salesforce Useful UI Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*.salesforce\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require        https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js
// @version        2.36
// @grant          GM_addStyle
// ==/UserScript==

var u_cvesearch = "https://people.canonical.com/~ubuntu-security/cve/";

var attachments = getElementByXpath("/html/body//a[contains(text(),'Files')]/@href");
var case_attachments = []

var style = document.createElement('style');
var profile_details = document.querySelectorAll('.efhpLabeledFieldValue > a');

var new_timecard = document.querySelector('input[value="New time card"]').getAttribute('onclick');
var new_timecard_match = new_timecard.match(/this.form.action = (.*?['"]([^'"]*)['"])/);
var new_timecard_msg = document.domain + new_timecard_match[2];

var toolbox = ''
var tbox_header = ''
var sev_level = getElementByXpath("//*[contains(text(),'Severity Level')]/following::div[1]").replace(/.*L(\d+).*/, 'L$1')

var customer = getElementByXpath("//*[contains(text(),'Customer')]/following::a[2]")
if (customer) {
	toolbox += `Customer user: <strong>${customer.trim()}</strong><br />`
}

var case_owner = getElementByXpath("//*[contains(text(),'Case Owner')]/following::td[1]")
if (case_owner) {
	toolbox += `Case owner: <strong>${case_owner.trim()}</strong><br />`
}

var acct_tam = getElementByXpath("//*[contains(text(),'Technical Account Manager')]/preceding::th[1]").replace(/User:(.*?)/, '$1')
if (acct_tam) {
	toolbox += `TAM: <strong>${acct_tam.trim()}</strong><br />`
}

var acct_dse = getElementByXpath("//*[contains(text(),'Dedicated')]/preceding::th[1]").replace(/User:(.*?)/, '$1')
if (acct_dse) {
	toolbox += `DSE: <strong>${acct_dse.trim()}</strong>`
}

// Query selectors by XPath
function getElementByXpath(path) {
	var xpath_fragment = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	if (xpath_fragment) return xpath_fragment.textContent;
	else return "";
}

// Hacky, but checks for CVE references in the case summary, re-links them as below
document.querySelectorAll('#cas15_ileinner').forEach(node => {
	node.innerHTML = node.innerHTML.replace(/(?:[^\/])(cve-\d{4}-\d{4,7})/gim,
		'<span title="Search for $1">&nbsp;<a style="color:blue;" href="' + u_cvesearch + '$1.html" target="_blank">$1</a></span>')
});

document.querySelectorAll('.noStandardTab .dataRow').forEach(node => {
    // Build an array of all attachments linked in the case comments
    if (node.innerHTML.match(/<br>https?:\/\/files.support.*\/files/gim)) {
        let match = node.innerHTML.match(/https?:\/([-a-zA-Z0-9()@:%_\+.~#?&\;//=]*)?/gim);
        if (match) {
            case_attachments.push.apply(case_attachments, match);
        }
    }
    case_attachments.sort()

    node.innerHTML = node.innerHTML.replace(/(Created By:.*)/,
		'<span class="techops">$1</span>')

	node.innerHTML = node.innerHTML.replace(/(Created By: .+ \(portal\).*<\/b>)/gi,
		'<div class="portaluser">$1</div><\/b>')

    // Special handling for attachments in case comments
	node.innerHTML = node.innerHTML.replace(/\-New Attachment added: ([^()]+)/gi,
		`&#128206; <span style="color:red;">IMPORTANT New Attachment added</span>: <a href="${attachments}">$1</a>`)

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
#tbox_header{color:#fff;cursor:move;z-index:10;}
#toolbox{-moz-column-width:160px;column-width:160px;font-weight:400 0;margin:1em;text-align:left;}
#tools{background-color:#f1f1f1;border:1px solid #d3d3d3;border-radius:0 0 10px 10px;position:fixed;text-align:center;z-index:9;}
.close{cursor:pointer;position:absolute;right:1%;top:4px;transform:translate(0%,-50%);}
.collapsible {display: none;}
.content {display: none;overflow: hidden;}
.efdvJumpLinkBody li {overflow-wrap:break-word;font-size:0.9em;}
.efdvJumpLinkBody ul a {margin:0;padding:0.2em;}
.efdvJumpLinkTitle a{all:unset;color:gray;float:right;text-decoration:none;}
.efdvJumpLinkTitle{font-weight:bold;text-align:center;color:#00f;width:100%;}
.efdvJumpLink{position:fixed;z-index:8;border:1px solid #000;background-color:#ddeef4;border-radius:5px;box-shadow: 5px 5px #ccc;left:3em;width:150px}
.noStandardTab td.dataCell{font:8pt monospace!important;word-wrap:break-word;}
.noStandardTab tr.dataRow.even td.dataCell:nth-of-type(2){background:#f0f0f5;border:1px solid #cecece;}
.portaluser{background-color:#ff0;display:block;margin:-.5em;padding-left:.5em;}
.tbox_call, .tbox_time{margin:0;text-align: left;}
.tbox_call::before{margin-left:.5em;content:"\uD83D\uDCDE ";}
.tbox_time::before{margin-left:.5em;content:"\u23F0 ";}
.techops{background-color:#90ee90;display:block;margin:-.5em;padding-left:.5em;}
.uploads{overflow-x:hidden;overflow-y:auto;max-height:600px;}
.urgent{animation:urgent .7s infinite;}
.watermark{color:red;font-size:1em;left:1.2em;opacity:0.5;position:absolute;vertical-align:bottom;z-index:1000;}
div #cas15_ileinner{background-color:#90ee90;border:1px solid #cecece;color:#000;font:8pt monospace !important;padding:1em;}
div.listRelatedObject.caseBlock div.bPageBlock.brandSecondaryBrd.secondaryPalette table.list tr.even {background: #f0f0f0;}
hr {border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0));}
@keyframes urgent{
  0%{color:#f00;}
 49%{color:transparent;}
 50%{color:transparent;}
 99%{color:transparent;}
 100%{color:#000;}

`;

if (sev_level) {
	// Add some urgency to the L1 level cases
	sev_level.includes('L1') ? sev_level = `<span class="urgent">${sev_level}</span>` : sev_level
	sev_level.includes('L1') ? tbox_header = '#f00' : tbox_header = '#4287f5'
    sev_level.includes('L1') ? style.innerHTML += '.efdvJumpLink{border:2px solid #f00;border-radius:10px;}' : ''
	toolbox += `Severity: <strong>${sev_level.trim()}</strong><br />`
}

if (document.getElementsByClassName('efdvJumpLinkBody').length > 0) {
    var log_call = document.querySelector('input[value="Log a Call"]').getAttribute('onclick');
    var log_call_match = log_call.match(/navigateToUrl(.*?['"]([^'"]*)['"])/);
    var log_call_msg = document.domain + log_call_match[2]

    var related_list_box = document.querySelectorAll('.efdvJumpLinkBody');
    var related_list_items = document.querySelectorAll('.efdvJumpLinkBody > ul');

    document.querySelectorAll('.efdvJumpLinkTitle')[0].insertAdjacentHTML('afterbegin', '<a id="top" title="Jump to top" href="#">&#9650;</a><a id="end" title="Jump to bottom" href="#footer">&#9660;</a>')
    document.getElementsByClassName('sfdcBody')[0].insertAdjacentHTML('beforeend', '<footer id="footer">testing</footer>')

    related_list_items[0].insertAdjacentHTML('beforebegin', `<br />${toolbox}<hr />`)

    if (case_attachments.length > 0) {
        var my_html = `<div class="collapsible"><hr />Uploaded files... (${case_attachments.length})</div>`
        if (case_attachments.length > 10) {
            my_html += `<div class="content uploads" style="display:none;">`;
        } else {
            my_html += `<div class="content uploads">`
        }
    }

    case_attachments.forEach((link, index) => {
        my_html += `<li><a href="${link}" title="${link}" target="_blank">&#128193; ${link.split('/').slice(-1)[0]} (${index})</a></li>`;
        index++
    });

    my_html += `
    </div><hr /><li><a class="tbox_call" title="All calls must be logged separately from time cards" href="https://${log_call_msg}" target="_blank">Log a Call</a></li>
    <li><a title="Add a new time card. Must be done by EOD!" class="tbox_time" href="https://${new_timecard_msg}" target="_blank">New time card</a></li>`

    related_list_items[0].insertAdjacentHTML('beforeend', my_html)

} else { // Non-case-related page rendering
    style.innerHTML += `#tools{border:1px solid #ccc;}#toolbox{-moz-column-width:200px;column-width:200px;}`
}

document.head.appendChild(style);


// This creates the accordion for the attachments section
var coll = document.getElementsByClassName("collapsible");
var i;
for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.display === "block") {
        content.style.display = "none";
      } else {
        content.style.display = "block";
      }
    });
  }

// This is needed to create the draggable toolbox around the page
const qsa = (selector, parent = document) => parent.querySelectorAll(selector)
qsa('[id^="efJumpLink"]').forEach(element => { dragElement(document.getElementById(element.id)); })

function dragElement(n){var t=0,o=0,u=0,l=0;function e(e){(e=e||window.event).preventDefault();u=e.clientX;l=e.clientY;document.onmouseup=m;document.onmousemove=d}
function d(e){(e=e||window.event).preventDefault();t=u-e.clientX;o=l-e.clientY;u=e.clientX;l=e.clientY;n.style.top=n.offsetTop-o+"px";n.style.left=n.offsetLeft-t+"px"}
function m(){document.onmouseup=null;document.onmousemove=null}
document.getElementById(n.id+"header")?document.getElementById(n.id+"header").onmousedown=e:n.onmousedown=e}