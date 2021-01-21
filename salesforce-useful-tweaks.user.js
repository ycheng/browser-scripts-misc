// ==UserScript==
// @name           Salesforce Useful UI Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*my.salesforce\.com/.*$/
// @include        /^https?://.*staging.lightning.force\.com/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.user.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/salesforce-useful-tweaks.user.js
// @require        https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @require        https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js
// @resource       customCSS https://gist.githubusercontent.com/desrod/6c018a76e687b6d64321d9a0fd65c8b1/raw/
// @version        2.130
// @grant          GM_addStyle
// @grant          GM_getResourceText
// ==/UserScript==

'use strict';
var sfuicss = GM_getResourceText ("customCSS");
GM_addStyle (sfuicss);

// This eliminates the page's iframes loading THIS script 3 times
if (window.top != window.self) {
    return;
}

// Try to extract the Community URL to KB articles, link in the Properties box
if ( window.location.href.match(/articles\/.*\/Knowledge\//i) ) {
    var community_url = getElementByXpath("//*[contains(text(),'Community URL')]/following::span[1]");
    var ss_url = community_url.replace(/\/ua\//, '/selfservice/')
    document.getElementsByClassName('panelTitle')[0].insertAdjacentHTML('afterend',
                                    `<hr /><span>
                                     Community URL: <a title="${community_url}" href="${community_url}">${community_url.slice(0,20)}...</a><br />
                                     Self-service URL: <a title="${ss_url}" href="${ss_url}">${ss_url.slice(0,20)}...</a>
                                     </span>`)};

if ( window.location.href.match(/.*\/search\/ui\//i) ) {
    const search_term = document.getElementById("secondSearchText").value.trim();
    const contentElement = document.getElementById('searchBody')
    if (search_term) {
        const replaced = contentElement.innerHTML.replace(new RegExp(search_term, 'gi'), '<mark>$&</mark>');
        contentElement.innerHTML = replaced
    }
};

// Added browser spellcheck support to Article review pages
// var selection = document.querySelector('.htmlDetailElementTable') !== null;
// if (selection) {
//     document.querySelector(".htmlDetailElementTable:not(a)").setAttribute("contenteditable", "true");
//     document.querySelector(".htmlDetailElementTable:not(a)").setAttribute("spellcheck", "true");
// }


var style = document.createElement('style');
var public_url = `https://support.canonical.com/ua/s/case/${window.location.pathname.split('/')[1]}`
var u_cvesearch = "https://people.canonical.com/~ubuntu-security/cve/";
var u_usnsearch = "https://ubuntu.com/security/notices/";

var attachments = getElementByXpath("/html/body//a[contains(text(),'Files')]/@href");

var uploaded_files = []
var case_attachments = []
var pastebin_links = []
var do_search = 0
var highlight = ''
var url = ''

// var profile_details = document.querySelectorAll('.efhpLabeledFieldValue > a');

// Keycodes interrogated here: https://keycode.info/
const KEY_A = 65; // Add to case team
const KEY_B = 66; // (b) Jump to bottom of page
const KEY_E = 69; // (e) to Edit case
const KEY_F = 70; // (f) jump to Files section
const KEY_H = 72; // (h) to Show/Hide private comments
const KEY_L = 76; // (l) to Log a call
const KEY_T = 84; // (t) Create a new Time Card
const KEY_U = 85; // (u) Upload a file to the case

// Remove duplicate entries from the arrays we populate with links
Array.prototype.unique = function() {
  return this.filter(function (value, index, self) {
    return self.indexOf(value) === index;
  });
}

function match_keypress(selector) {
  if (document.activeElement) {
    return document.activeElement.matches(selector);
  } else {
    return false;
  }
}

function listen_keypress(keyCode, handler) {
  window.addEventListener('keydown', function(event) {
    if (event.keyCode !== keyCode) {
      return;
    } else if (event.keyCode !== '17') {
        handler(event);
    }
  });
}

listen_keypress(KEY_A, function(event) {
 if (!match_keypress('textarea')) {
  document.querySelector('input[value="Add Me to Case Team"]').click();
 }
})
listen_keypress(KEY_B, function(event) {
    if (!match_keypress('textarea') && !match_keypress('input')) {
        document.getElementById("footer").scrollIntoView();
    }
})
listen_keypress(KEY_E, function(event) {
    if (!match_keypress('textarea') && !match_keypress('input')) {
        document.querySelector('input[value=" Edit "]').click();
    }
})
listen_keypress(KEY_F, function(event) {
    if (!match_keypress('textarea') && !match_keypress('input')) {
        document.querySelector('[id$="_RelatedFileList_title"]').scrollIntoView();
    }
})
listen_keypress(KEY_H, function(event) {
    if (!match_keypress('textarea') && !match_keypress('input')) {
        toggle();
    }
})
listen_keypress(KEY_L, function(event) {
    if (!match_keypress('textarea') && !match_keypress('input')) {
        document.querySelector('input[value="Log a Call"]').click();
    }
})
listen_keypress(KEY_T, function(event) {
    if (!match_keypress('textarea') && !match_keypress('input')) {
        document.querySelector('input[value="New time card"]').click();
    }
})
listen_keypress(KEY_U, function(event) {
    if (!match_keypress('textarea') && !match_keypress('input')) {
        document.querySelector('input[value="Upload Files"]').click();
    }
})

// For Call Log and Time Card forms, put focus on the 'minutes' input field for easy entry
if (["Log a Call", "Time Card Edit"].some(substring => document.title.includes(substring))) {
// if (document.querySelector('h2.mainTitle').textContent.includes(' Edit')) {
    window.onload = function() {
        document.querySelector('td.last > input').focus();
    }
}

// Get the selected text so we can do fun things with it
function get_highlighted_text(e) {
    var t = ''
    t = (document.all) ? document.selection.createRange().text : document.getSelection();
    highlight = t.toString();
    return false;
}

document.onmouseup = get_highlighted_text;

// if (!document.all) document.captureEvents(Event.MOUSEUP);
function do_search_msg(highlight, engine) {
    return confirm(`WARNING: about to send the text "${highlight}" to ${engine} on the public Internet. Proceed?`)
}

// Translate highighted text on the page
function translate_text(highlight) {
    do_search = do_search_msg(highlight, 'Google Translate');
    if (do_search === true) {
        var w = window,
            o = w.open('http://translate.google.com/translate_t#auto|en|' + highlight, '', 'left=' +
                       ((w.screenX || w.screenLeft) + 10) + ',top=' +
                       ((w.screenY || w.screenTop) + 10) +
                       ',height=620px,width=950px,resizable=1,alwaysRaised=1');
        w.setTimeout(function() {
            o.focus()
        }, 300)
    } else {
        return false;
    }
}

// Search helpers for various upstream services
function search_highlight(highlight, loc) {
    if (loc === 'lp') {
        do_search = do_search_msg(highlight, 'Launchpad');
        url = `https://bugs.launchpad.net/bugs/+bugs?field.searchtext=${highlight}&search=Search+Bug+Reports`;
    }

    if (loc === 'google') {
        do_search = do_search_msg(highlight, 'Google Search');
        url = `https://www.google.com/search?source=hp&q=${highlight}`;
    }

    if (do_search === true) {
        window.open(url, "_blank");
    } else {
        return false;
    }
}

// Add a handler for the 'click' event on the hide/show private comments button
// window.addEventListener("load", ()=> document.querySelector("[btn]").addEventListener("click", toggle, false), false);
// window.addEventListener("load", ()=> document.querySelector("[translate]").addEventListener("click", () => translate_text(highlight), false));
// window.addEventListener("load", ()=> document.querySelector("[launchpad]").addEventListener("click", () => search_highlight(highlight, 'lp'), false));
// window.addEventListener("load", ()=> document.querySelector("[google]").addEventListener("click", () => search_highlight(highlight, 'google'), false));

// Toggle the display of private comments, off/on
function toggle() {
    let x = document.querySelectorAll("[id=\"private\"]");
    x.forEach( v => { v.style.display = v.style.display = ["","none"][+!(v.style.display === "none")]})
}

// Add column sorting to all table cells
const get_cell_val = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

const compare_cell = (idx, asc) => (a, b) => ((v1, v2) =>
 v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
)(get_cell_val(asc ? a : b, idx), get_cell_val(asc ? b : a, idx));

document.querySelectorAll('th[scope="col"]').forEach(th => th.addEventListener('click', (() => {
    const table = th.closest('table');
    const tbody = table.querySelector('tbody');
    Array.from(tbody.querySelectorAll('tr:nth-child(n+2)'))
        .sort(compare_cell(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
        .forEach(tr => tbody.appendChild(tr) );
})));

// Query selectors by XPath
function getElementByXpath(path) {
    var xpath_fragment = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    if (xpath_fragment) return xpath_fragment.textContent;
    else return "";
}

// Build the <li>${link}</li> list for the sidebar from array items
function create_link_list(title, array, slice) {
    var html_string = ''
    array = array.unique();

    if (array.length > 0) {
        html_string += `<hr /><div class="collapsible">${title}... (${array.length})</div>`
        if (array.length > 5) {
            html_string += `<div class="content uploads" style="display:none;">`;
        } else {
            html_string += `<div class="content uploads">`
        }
    }

    array.forEach((link, index) => {
        var raw = ''
        var icon = `<i class="far fa-folder-open"></i>`
        var counter = String(index+1).padStart(3, '0')

        if (link.match(/pastebin/)) {
            raw = `[<a href="${link}plain/" target="_blank">raw</a>]&nbsp;`
            icon = `<i class="far fa-clipboard"></i>`
        }
        html_string += `<li>${icon} [${counter}] ${raw}<a href="${link}" title="${link}"
                            target="_blank">${link.split('/').slice(slice)[0]} </a></li>`;
        index++
        if(array[array.length-1] === link) { html_string += `</div>` }
    });
    return html_string
}

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
        // Check if the table was sorted or dropdown used, then recolor
        if (mutation.target.className == 'listBody') { check_lpu(); case_updates_notifier(); };
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
    check_lpu();
}, 300, 10);


setIntervalX(function () {
    case_updates_notifier();
}, 2000, 1);


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
    var nval = node.innerHTML;
    for (const [status, cls] of Object.entries(case_status_classes)) {
        if (nval.includes(status)) {
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
    var node_class = ['[class*="col-CASES_STATUS"]']
    var lpu = document.querySelectorAll('[class*="x-grid3-col-00ND00000068nKD"]');
    // Check if Last Public Update (lpu) or Last Modified column is visible
    if (lpu.length > 0) {
        node_class.push('[class*="x-grid3-col-00ND00000068nKD"]');
    } else {
        node_class.push('[class*="col-CASES_LAST_UPDATE"]');
    }
    document.querySelectorAll(node_class).forEach(node => {
        colorize_case_list(node);
    });
}

function case_updates_notifier() {
    setIntervalX(function () {
        var cases_needing_update = document.querySelectorAll('[class*="update-now"]').length;
        if (document.getElementById('npu')) { // Needs Public Update (npu)
            var elem = document.getElementById("npu");
            elem.parentNode.removeChild(elem);
        }
        if (cases_needing_update > 0) {
            // Will clean this up later as a more reusable 'pluralize' function, something like:
            // pluralize = (count, noun, suffix = 's') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
            var banner = cases_needing_update + (cases_needing_update > 1 ? ' cases need public updates' : ' case needs a public update')
            document.getElementById('tabBar').insertAdjacentHTML("afterend", '<h3 style="background-color:#ffe940; text-align: center;" id="npu">' + banner + '</h3>');
        }
    }, 1000, 1);
}

var cols = document.evaluate("//th[contains(text(),'Member Role')]", document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
let map = {};
let roles = [];
let role_node = null;

do {
    role_node = cols.iterateNext();
    if (role_node) {
        roles.push(role_node);
    }
} while (role_node);

roles.forEach((thisHeading) => {
    let cellIndex = thisHeading.cellIndex;
    let table = thisHeading.parentNode.parentNode.parentNode;

    table.querySelectorAll('tr td:nth-child(' + (cellIndex + 1) + ')').forEach(function(td) {
        let category = td.innerText.trim();
        let th = td.previousElementSibling;
        let name = th.innerText.trim().replace(/^User: /, '');

        if (!map.hasOwnProperty(category)) {
            map[category] = [];
        }
        map[category].push(name);
    });
});

var sev_level = getElementByXpath("//*[contains(text(),'Severity Level')]/following::div[1]").replace(/.*L(\d+).*/, 'L$1');

var toolbox = ''
var customer_name = getElementByXpath("//*[contains(text(),'Customer')]/following::a[1]");
var customer_contact = getElementByXpath("//*[contains(text(),'Customer')]/following::a[2]").replace(/(\w+).*/, '$1');
if (customer_name) { toolbox += `Customer: <strong>${customer_name.trim()}</strong><br />Contact: <strong>${customer_contact.trim()}</strong><hr />`}

var case_owner = getElementByXpath("//*[contains(text(),'Case Owner')]/following::td[1]");
if (case_owner) { toolbox += `Case owner: <strong>${case_owner.trim()}</strong><br />`}

// var case_comments = getElementByXpath("//a[contains(text(),'Case Comments')]").replace(/.*[\[\(](\d+)[\)\]].*/g, '$1');
var case_asset = getElementByXpath("//*[contains(text(),'Product Service SLA')]/following::td[1]");
var case_subject = getElementByXpath("//*[contains(text(),'Subject')]/following::td[1]");
if (document.title.includes('Case:')) {
    document.title = document.title.replace(/.*(Case: \d+).*/, `$1 - ${sev_level} - ${case_subject}`);
}

var acct_dse = map["Dedicated Services Engineer"]
var acct_tam = map["Technical Account Manager"]
toolbox += (acct_dse||[]).map( value => `DSE: <strong>${value}</strong><br />`).join('')
toolbox += (acct_tam||[]).map( value => `TAM: <strong>${value}</strong><br />`).join('')

// Hacky, but checks for CVE and USN references in the case summary, re-links them as below
document.querySelectorAll('#cas15_ileinner').forEach(node => {
    node.innerHTML = node.innerHTML.replace(/[^\/](cve-\d{4}-\d{4,7})/gim,
        '<span title="Search for $1">&nbsp;<a style="color:blue;" href="' + u_cvesearch + '$1.html" target="_blank">$1</a></span>')

    node.innerHTML = node.innerHTML.replace(/(https:\/\/.*?)(USN-\d{4}-\d{1})/gim,
        '<span title="Search for $2">&nbsp;<a style="color:blue;" href="' + u_usnsearch + '$2" target="_blank">$2</a></span>')
});

// Pull various URL links out of the case comments as we iterate through them
var links_array = []
function push_links(node, uri, links_array) {
    var re = new RegExp(uri, 'gim');
    var results = node.innerHTML.match(re);
    if(results !== null) {
        results.forEach(url => {
            // console.log('DEBUG', url)
            if(url.match(/https?:\/\/([-a-zA-Z0-9()@:%_\+.~#?&\;//=][^]*)?/gim)) {
                links_array.push(url);
            }
        }
                       )
    }
    return links_array
}
// Search the table for active, nearing and expired rows
const check_table_rows = Array.from(
    document.querySelectorAll(`div.assetBlock > div > div > table tbody tr,
                               div.contractBlock > div > div > table tbody tr`), (row) => {
    const dates = row.querySelectorAll('td.DateElement')
    return dates[dates.length - 1] || null;
}).filter(Boolean);
check_table_rows.forEach(el => check_date(el, el.innerText));

function check_date(el, date) {
    var now = Date.now()
    var end_date = Date.parse(date)
    var days_left = (end_date - now) / (24 * 60 * 60 * 1000)
    var expiry = ''

    if (end_date < now - 90) {
        expiry = 'pe'; // past expiration > 90 days
    } else if (end_date < now) {
        expiry = 'ae'; // asset expired > 30 days < 90 days
    } else if (days_left < 30) {
        expiry = 'ane'; // asset near expiration < 30 days
    } else {
        expiry = 'aa'; // asset active > 30 days
    }
    return el.closest("tr").classList.add(expiry);
}

document.querySelectorAll('.dataCell b').forEach((el) => {
    if(el.innerText.includes('portal')) {
        el.classList.add('external')
        el.closest("td").classList.add('formatted')
    } else {
        el.classList.add('internal')
    }
});

var comment_count = document.querySelectorAll('.pbBody .dataRow b').length;

document.querySelectorAll('.noStandardTab .dataRow').forEach(node => {
    // Build an array of all attachments linked in the case comments
    case_attachments = push_links(node, 'https?:\/\/files\.support[^\/\s]+\/files\/[^<\\s]+', case_attachments)
    pastebin_links = push_links(node, 'https?:\/\/pastebin[^\/\s]+[^<\\s\.]+', pastebin_links)

    // Sort the file attachments by name, vs. default sort by newest -> oldest
    // case_attachments.sort()
    node.innerHTML = node.innerHTML.replace(/(Created By:.*)/, `<span id="${comment_count}"><a title="Right-click to link to comment #${comment_count}"
                                            name="#${comment_count}" href="${window.location.href.split('?')[0]}#${comment_count}">
                                            <i class="fas fa-link"></i></a>(${comment_count})&nbsp;$1</span>`)

    // Special handling for attachments in case comments
    node.innerHTML = node.innerHTML.replace(/\-New Attachment added: ([^()]+)/gi,
                                            `&#128206; <span style="color:red;">IMPORTANT New Attachment added</span>: <a href="${attachments}">$1</a>`)

    // These will dynamically link in any references to CVEs to their requisite search URLs
    node.innerHTML = node.innerHTML.replace(/[^\/](cve-\d{4}-\d{4,7})/gim,
                                            '><span title="Search for $1">&nbsp;<a style="color:blue;" href="' +
                                            u_cvesearch +
                                            '$1.html" target="_blank">$1</a></span>')

    node.innerHTML = node.innerHTML.replace(/(https:\/\/.*?)(USN-\d{4}-\d{1})/gim,
                                            '<span title="Search for $2">&nbsp;<a style="color:blue;" href="' +
                                            u_usnsearch + '$2" target="_blank">$2</a></span>')

    // Attempt to turn anything that looks like a URL in a case comment, into a clickable link
    node.innerHTML = node.innerHTML.replace(/(?=(https?:\/{2}[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\;//=]*)?))\1(?!['"]|<\/a>)+/gim,
                                            `<a style="color:blue;" href="$&">$&</a>`)

    // This is brittle, it should be: getElementByXpath("//*[contains(text(),'Make Public')]/following::td[1]")
    // I don't like it, I'll fix it later.
    node.innerHTML = node.innerHTML.replace(/<a href(.*) title="Make Public(.*?)<td class="\s+dataCell\s+">(.*)/gi,
                                            '<a href $1 title="Make Public $2<td class="dataCell" id="private"><span class="watermark">private comment</span>$3')
    comment_count--
});

// Build a list of files uploaded to the case, deploy them into the sidebar
// document.querySelectorAll(`[id*="RelatedFileList_body"] a[title*="Download"`).forEach(node => {
//     // Small feature gap here, only the first 10 attached files are visible, unless AJAX function is run
//     uploaded_files.push(`${node.href}/${node.title.match(/Download - Record \d+ - (.*)/)[1]}`);
// });

// Insert a new class for the Files section
// document.querySelector('[id*="RelatedFileList"]').setAttribute("id", "files_section");

// var is_weekend = ([0,6].indexOf(new Date().getDay()) != -1);
// if (is_weekend === true && case_asset.includes("Standard")) {
//     toolbox += `Weekend: <strong style="color:#f00;">8x5 support</strong><br />`
//     document.getElementsByClassName("efdvJumpLink")[0].style = "border: 2px solid #ff9494; background: repeating-linear-gradient(45deg,#f7f7f7,#f7f7f7 10px,#fff 10px, #fff 20px);"
// }

// if (sev_level) {
//     // Add some urgency to the L1 level cases
//     sev_level.includes('L1') ? sev_level = `<span class="urgent">${sev_level}</span>` : sev_level
//     sev_level.includes('L1') ? document.getElementsByClassName("efdvJumpLink")[0].style = "border:2px solid #f00 !important;border-radius:10px !important;" : ''
//     toolbox += `Severity: <strong>${sev_level.trim()}</strong><br />`

// }

if (document.getElementsByClassName('sidebarCell').length > 0) {
//     var log_call = document.querySelector('input[value="Log a Call"]').getAttribute('onclick');
//     var log_call_match = log_call.match(/navigateToUrl(.*?['"]([^'"]*)['"])/);
//     var log_call_msg = document.domain + log_call_match[2]

//     var related_list_box = document.querySelectorAll('.sidebarModuleBody');
//     var related_list_items = document.querySelectorAll('.sidebarModuleBody > ul');

    // Jump to files
    document.querySelectorAll('.sidebarModuleBody')[0].insertAdjacentHTML('afterend', '<a title="Jump to Files" href="#files_section"><i class="fas fa-file"></i></a>');
//     ,
//        '<li style="text-align: center;"><br />',
//        '<a title="Public URL to case" target="_blank" href="${public_url}"><i class="fas fa-link"></i></a>&nbsp;&nbsp;&nbsp;',
//        '<a translate title="Translate highlighted text" target="_blank"><i class="fa fa-globe-europe fa-lg"></i></a>&nbsp;&nbsp;&nbsp;',
//        '<a launchpad title="Search Launchpad" target="_blank"><i class="fa fa-bug fa-lg"></i></a>&nbsp;&nbsp;&nbsp;',
//        '<a google title="Search Google" target="_blank"><i class="fab fa-google fa-lg"></i></a>&nbsp;&nbsp;&nbsp</li>');

    // Reload active page
    document.querySelectorAll('.sidebarModuleBody')[0].insertAdjacentHTML('afterend', '<a id="refresh" onclick="document.location.reload(true);"><i class="fas fa-sync-alt"></i></a>');

    // Jump to top of the page
    document.querySelectorAll('.sidebarModuleBody')[0].insertAdjacentHTML('afterend', '<a id="top" title="Jump to top" href="#"><i class="fas fa-arrow-up"></i></a>');

    // Jump to bottom of the page
    document.querySelectorAll('.sidebarModuleBody')[0].insertAdjacentHTML('afterend', '<a id="end" title="Jump to bottom" href="#footer"><i class="fas fa-arrow-down"></i></a>');

    document.getElementsByClassName('sfdcBody')[0].insertAdjacentHTML('beforeend', '<footer id="footer"></footer>')

   // related_list_items[0].insertAdjacentHTML('beforebegin', `<br />${toolbox}<hr />`)

//     var new_timecard_link = document.querySelector('input[value="New time card"]').getAttribute('onClick').match(/this.form.action = (.*?['"]([^'"]*)['"])/);
//     if (new_timecard_link) {
//         var new_timecard_msg = document.domain + new_timecard_link[2];
//     }
}

