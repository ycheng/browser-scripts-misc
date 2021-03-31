// ==UserScript==
// @name           Salesforce Lightning Useful UI Tweaks v2
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*lightning.force\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-lightning-tweaks.user.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-lightning-tweaks.user.js
// @version        1.11
// @grant          GM_addStyle
// @grant          GM_getResourceText
// ==/UserScript==

'use strict';
var style = document.createElement('style');

let mutation_target = document.body;
let mutation_observer_list = mutation_target,
    options = {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true
    },
    observer = new MutationObserver(mutation_callback);

var intervalX_count = 0;
function mutation_callback(mutations) {
    for (let mutation of mutations) {
        if (mutation.target.className == 'oneConsoleObjectHome') { startup_items(); };
        continue; // break;
    }
}

observer.observe(mutation_observer_list, options);


// Set an interval to check for page load completion, loop for a small interval, then stop
const setIntervalX = (fn, delay, times) => {
    if(!times) return
    setTimeout(() => {
        fn()
        setIntervalX(fn, delay, times-1)
    }, delay)
}


// These run on initial page load, vs. the data reload watched by mutation.observer below
setIntervalX(function () {
    startup_items();
}, 4000, 3);


const case_status_classes = {
    Customer:   'cus',
    Support:    'sup',
    Engineering:'eng',
    Upstream:   'ups',
    Operations: 'ops',
    CPC:        'cpc',
    SRU:        'sru',
    New:        'new',
    Resolved:   'res',
    Expired:    'exp'
};


// Colorize the cases by status
function colorize_case_list(node) {
    var now = new Date();
    var nval = node.innerText;
    for (const [status, cls] of Object.entries(case_status_classes)) {
        if (nval.endsWith("Waiting on " + status)) {
            node.classList.add(`status-wo${cls}`);
            break;
        } else if (nval.includes('/' | '-')) {
            var iso_date = nval.replace(/.*(\d{4}[/-]\d{2}[/-]\d{2})\,\s(\d+?:\d+?)\s[ap]\.m\./, '$1 $2');
            if (now - Date.parse(iso_date.replace(',','')) > 7 * 24 * 60 * 60 * 1000) {
                node.parentElement.parentElement.classList.add('update-now');
            } else if (now - Date.parse(iso_date.replace(',','')) > 3 * 24 * 60 * 60 * 1000) {
                node.parentElement.parentElement.classList.add('update-soon');
            }
        }
    }
}


function check_lpu() {
    // Yes, it's literally this long
    document.querySelectorAll('div[class*="slds-table--edit_container slds-is-relative  inlineEdit--disabled"] > table > tbody > tr> td').forEach((node) => {
        colorize_case_list(node);
    });
}


// Automatically minimize Natterbox panel on page reloads
function startup_items () {
    // window.scrollTo(0, 0);
    document.querySelector('button[title="Minimize"]').click();

    if (startup_items.fired ) return;
    // This needs to be more surgical, will fine-tune in later commits
    document.querySelectorAll('[class*="slds-truncate textUnderline outputLookupLink slds-truncate outputLookupLink"]').forEach((node) => {
        if(node.innerText.endsWith('(portal)')) {
            node.parentNode.classList.add('external')
        } else {
            node.parentNode.classList.add('internal')
        }
    });
    check_lpu();
    // startup_items.fired = true;
}


style.innerHTML += `
/* Case status colors */
.status-wocus{background-color:#9eebcf;}
.status-wosup{background-color:#ffb517;}
.status-woeng{background-color:#fbf1a9;}
.status-woups{background-color:#96ccff;}
.status-woops{background-color:#cdecff;}
.status-wocpc{background-color:#ad99ff;}
.status-wosru{background-color:#ff99e0;}
.status-wonew{background-color:#debe66;}
.status-wores{background-color:#86ff6e;}
.status-woexp{background-color:#afccc7;}
.update-soon {background-color:#feffcf;}
.update-now  {background-color:#ffdfdf;}
.external{background-color:#ff0;display:block;margin:-.5em;padding-left:.5em;}
.internal{background-color:#90ee90;display:block;margin:-.5em;padding-left:.5em;}
@import url("https://use.fontawesome.com/releases/v5.13.1/css/all.css")
body {font-family: "Ubuntu", san-serif; font-size: 15px !important; }
tbody tr:nth-child(odd) { background-color: #f5faff !important; }
`;

// Add the injected stylesheet to the bottom of the page's <head> tag
document.head.appendChild(style);
