// ==UserScript==
// @name           Salesforce Lightning Useful UI Tweaks v2
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*lightning.force\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-lightning-tweaks.user.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-lightning-tweaks.user.js
// @version        1.17
// @grant          GM_addStyle
// @grant          GM_getResourceText
// ==/UserScript==

'use strict';
var style = document.createElement('style');

// Some tuning for developers
var debug = 1;

if (debug) {
    // Measuring page-load time/performance, this will get cleaned up and convered to using the timing API later:
    // https://developer.mozilla.org/en-US/docs/Web/API/User_Timing_API
    document.addEventListener('readystatechange', function() {
        // What did the browser mark as the page status at this stage, and how long
        console.log("DEBUG: Page marked as '" + document.readyState + "' after " + performance.now()/1000 + " seconds");
    });
    document.addEventListener('DOMContentLoaded', function() {
        // How long did it take the DOM to load in the browser's context
        console.log("DEBUG: DOMContentLoaded took " + performance.now()/1000 + " seconds");
    }, false);

    // Add EPT timing to individual case pages (the most-complex Lightning assets)
    // https://trailhead.salesforce.com/en/content/learn/modules/lightning-experience-performance-optimization/measure-lightning-experience-performance-and-experience-page-time-ept
    if (window.location.href.match(/\/view$/)) {
        const sf_ept = new URLSearchParams(window.location.search);
        sf_ept.set('eptVisible', '1');
        window.location.href.append = sf_ept;
    }
}

let mutation_target = document.body;
let mutation_config = mutation_target,
    options = {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true
    },
    observer = new MutationObserver(mutation_callback);

function mutation_callback(mutations) {
    for (let mutation of mutations) {
        // console.log("DEBUG: ", mutation.target.className);
        if (mutation.target.className === 'slds-checkbox') { startup_items(); };
        continue;
    }
}

observer.observe(mutation_config, options);

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
    minimize_natter();
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
        if (nval.endsWith(status)) {
            node.classList.add(`status-wo${cls}`);
            break;
        } else if (nval.includes('/' | '-')) {
            var iso_date = nval.replace(/.*(\d{4}[/-]\d{2}[/-]\d{2})\,\s(\d+?:\d+?)\s[ap]\.m\./, '$1 $2');
        }
    }
}


function check_lpu() {
    // Yes, it's literally this long
    document.querySelectorAll('div[class*="slds-table--edit_container slds-is-relative  inlineEdit--disabled"] > table > tbody > tr > td').forEach((node) => {
        colorize_case_list(node);
    });
}

function minimize_natter() {
    // window.scrollTo(0, 0);
    document.querySelector('button[title="Minimize"]').click();
    // document.querySelector('[class*="oneUtilityBarPanel DOCKED"]').className = "oneUtilityBarPanel MINIMIZED"
}

function startup_items () {
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
    minimize_natter();
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
.external{background-color:#ff0;display:block;margin:-.5em;padding-left:.5em;}
.internal{background-color:#90ee90;display:block;margin:-.5em;padding-left:.5em;}
body {font-family: "Ubuntu", san-serif; font-size: 15px !important; }
tbody tr:nth-child(odd) { background-color: #f5faff !important; }
`;

// Add the injected stylesheet to the bottom of the page's <head> tag
document.head.appendChild(style);

let disconnect = () =>{
    observer.disconnect();
}


