// ==UserScript==
// @name           Salesforce Lightning Useful UI Tweaks v2
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*lightning.force\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-lightning-tweaks.user.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-lightning-tweaks.user.js
// @version        1.1001
// @grant          GM_addStyle
// @grant          GM_getResourceText
// ==/UserScript==

'use strict';
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
        if (mutation.target.className == 'oneConsoleObjectHome') { minimize_natterbox(); };
        break;
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
    minimize_natterbox();
}, 4000, 5);

// Automatically minimize Natterbox panel on page reloads
function minimize_natterbox () {
    document.querySelector('button[title="Minimize"]').click();
    // var natter_min = document.querySelectorAll('div[class*="slds-is-open"]').classList;
    // natter_min.replace('slds-is-open', 'slds-is-closed');
}

style.innerHTML += `
@import url("https://use.fontawesome.com/releases/v5.13.1/css/all.css")
body {font-family: "Ubuntu", san-serif; font-size: 15px; }
tbody tr:nth-child(odd) { background-color: #f5faff !important; }
`;

// Add the injected stylesheet to the bottom of the page's <head> tag
document.head.appendChild(style);


