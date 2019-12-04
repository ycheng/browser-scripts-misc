// ==UserScript==
// @name           Salesforce Useful UI Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*.salesforce\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.js
// @version        2.7
// @require        https://code.jquery.com/jquery-3.4.1.js
// @grant          GM_addStyle
// ==/UserScript==

var c_cvesearch = "https://cve.mitre.org/cgi-bin/cvename.cgi?name=cve-";
var u_cvesearch = "https://people.canonical.com/~ubuntu-security/cve/";

// This first one is for the header/summary of the case
// modify font size and colors however you need for your preferences
document.styleSheets[0].insertRule('div#cas15_ileinner { font:8pt !important; padding:1em; color:black; background-color: lightgreen;border:1px solid #cecece;font:8pt monospace;', 0);

// Hacky, but checks for CVE references in the case summary, re-links them as below
var els2 = document.querySelectorAll('#cas15_ileinner');
for (var r = 0, s = els2.length; r < s; r++) {
    var el2 = els2[r];
    el2.innerHTML = el2.innerHTML.replace(/cve-(\d{4})-(\b\d{4,9}\b)/gi,
                                          '<span title="Search for CVE-$1-$2"><a style="color:blue;" href="'
                                          + u_cvesearch +
                                          '$1/CVE-$1-$2.html" target="_blank">CVE-$1-$2</a></span>');
}

// This modifies each individual row of the case comments
document.styleSheets[0].insertRule('.noStandardTab td.dataCell { word-wrap:break-word;font:8pt monospace !important;', 1);

var els1 = document.querySelectorAll('.noStandardTab .dataRow');
for (var i = 0, l = els1.length; i < l; i++) {
    var el1 = els1[i];

    // Theses will alternate row colors between internal vs. external case comments
    el1.innerHTML = el1.innerHTML.replace(/(Created By:.*)/,
                                          '<span style="background-color:lightgreen;display:block;">$1</span>');
    el1.innerHTML = el1.innerHTML.replace(/(Created By: .+ \(portal\).*<\/b>)/gi,
                                          '<div style="background-color: yellow; display: block;">$1</div><\/b>');

    // Special handling for attachments inline
    el1.innerHTML = el1.innerHTML.replace(/New Attachment added: ([^()]+) \((https?:\/\/[.a-z0-9A-Z]+\/.+)\)/gi,
                                          '<strong style="color: red;">IMPORTANT New Attachment added</strong>: <a style="color:blue;" href="$2">$1</a>');

    // These will dynamically link in any references to CVEs to their requisite search URLs
    el1.innerHTML = el1.innerHTML.replace(/cve-(\d{4})-(\b\d{4,9}\b)/gi,
                                          '<span title="Search for CVE-$1-$2"><a style="color:blue;" href="'
                                          + u_cvesearch +
                                          '$1/CVE-$1-$2.html" target="_blank">CVE-$1-$2</a></span>');

    // Attempt to turn anything that looks like a URL in a case comment, into a clickable link
    el1.innerHTML = el1.innerHTML.replace(/(?=(https?:\/{2}[.a-z0-9A-Z%=\~\+\/&\:\?\-#]+))\1(?!['"]|<\/a>)+/gi,
                                          '<a style="color:blue;" href="$&">$&</a>');
}

var els3 = document.querySelectorAll('.noStandardTab .dataRow.even');
for (var k = 0, n = els3.length; k < n; k++) {
    var el3 = els3[k];
    el3.innerHTML = el3.innerHTML.replace(/<td class="\s+dataCell\s+"/gi,
                                          '<td class=" dataCell " style="border:1px solid #cecece; background-color: #f0f0f5;"');
}

// Query selectors by XPath
function getElementByXpath(path) {
    var foo = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (foo) return foo.textContent;
    else return "";
}

var me = $('span')[1].title.replace(/(\w+)\s.*/, '$1')

var toolbox = ''
var customer = getElementByXpath("//*[contains(text(),'Customer')]/following::a[2]")
if (customer) {
    toolbox += `The Customer user is: <strong>` + customer + `</strong><br />`
}

var case_owner = getElementByXpath("//*[contains(text(),'Case Owner')]/following::td[1]")
if (case_owner) {
    toolbox += `The Case Owner for this account is: <strong>` + case_owner + `</strong><br />`
}

var acct_tam = getElementByXpath("//*[contains(text(),'Technical Account Manager')]/preceding::th[1]").replace(/User:(.*?)/, '$1')
if (acct_tam) {
    toolbox += `The TAM for this account is: <strong>` + acct_tam + `</strong><br />`
}

var acct_dse = getElementByXpath("//*[contains(text(),'Dedicated')]/preceding::th[1]").replace(/User:(.*?)/, '$1')
if (acct_dse) {
    toolbox += `The DSE for this account is: <strong>` + acct_dse + `</strong>`
}

$(".efhpDescription").prepend(`
<style>
#tam {
    position: fixed;
    bottom: 1em;
    left:3em;
    border-radius: 0 0 10px 10px;
    z-index: 9;
    background-color: #f1f1f1;
    border: 1px solid #d3d3d3;
    text-align: center
}

#tbox_header {
    cursor: move;
    z-index: 10;
    background-color: #4287f5;
    color: #fff
}

#toolbox {
    text-align: left;
    margin: 1em;
    font-weight: 400
}

.close {
  cursor: pointer;
  position: absolute;
  top: 10%;
  right: 1%;
  transform: translate(0%, -50%);
}

</style>
<div id="tam">

   <div id="tbox_header">` + me + `'s TechOps Toolbox (drag me)<span id='close' class='close'>&#x2716;</span></div>
   <p id="toolbox">` + toolbox + `</p>
</div>
</div>
`);


// This is needed to create the draggable toolbox around the page
dragElement(document.getElementById("tam"));

window.onload = function() {
    document.getElementById('close').onclick = function() {
        this.parentNode.parentNode.parentNode
            .removeChild(this.parentNode.parentNode);
        return false;
    };
};

function dragElement(elmnt) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}