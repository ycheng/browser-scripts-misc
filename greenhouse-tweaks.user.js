// ==UserScript==
// @name           Greenhouse Recruiting Tweaks
// @namespace      http://greenhouse.io/
// @description    Tweak the Greenhouse tabular layout to be more obvious when rows expire/near expiry
// @include        /^https?://.*greenhouse\.io/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/greenhouse-tweaks.user.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/greenhouse-tweaks.user.js
// @version        3.07
// ==========================================================================
//
// ==/UserScript==

/*global parse_jobs, a*/
/*eslint no-undef: "error"*/

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
        if (mutation.target.getAttribute("data-provides")) {
            parse_jobs();
        };
        // console.log("DEBUG: ", mutation.target)
        break;
    }
}

observer.observe(mutation_observer_list, options);

// Set an interval to check for page load completion, loop for a small interval, then stop
const setIntervalX = (fn, delay, times) => {
    if (!times) return
    setTimeout(() => {
        fn()
        setIntervalX(fn, delay, times - 1)
    }, delay)
}

// Add styling and various helpful colors/injects to the candidate lists
async function parse_candidates() {
    var candidate_row, candidate_name, candidate_attr, candidate_expiry, candidate_status, candidate_job, candidate_stage = '';
    document.querySelectorAll('p[class="name"]').forEach(async (node) => {
        const re = /.*\/people\/(\d+)\?.*/i;
        const candidate_id = node.innerHTML.match(re)[1];
        const tags = await fetch_candidate_tags(candidate_id)
        node.insertAdjacentHTML('afterend', tags)
    });

    document.querySelectorAll('div[class="job-name"] > a[class="nav-title"]').forEach((node) => {
        var job_title = node.innerText
        document.title = document.title.replace(/(.*)\| Greenhouse/, `$1 | ${job_title}`);
    });

    document.querySelectorAll('img[class="alert"]').forEach(node => {
        let re = new RegExp('(.*) has been in (.*) for more than (.*) days');
        var candidate_state = re.exec(node.getAttribute("title"))
        if (candidate_state !== null) {
            candidate_name = node.closest('.person-info-column > p').innerText;

            candidate_stage = candidate_state[2];
            candidate_expiry = candidate_state[3];
            candidate_status = node.closest('.person-info-column');

            if (candidate_expiry < 14) {
                candidate_status.classList.add('near-expiry');
                candidate_status.nextElementSibling.classList.add('near-expiry');
            } else {
                candidate_status.classList.add('expired');
                candidate_status.nextElementSibling.classList.add('expired');
            }
            if (candidate_expiry.length < 3) {
                var candidate_waiting = node.parentNode.children[0].innerHTML.replace(/(.*)/im,
                    `$1<br /><strong>${candidate_expiry} days</strong> in ${candidate_stage}`);
                node.parentNode.children[0].innerHTML = candidate_waiting
            }
        }
    });

    document.querySelectorAll('div[class="status"] > a').forEach((node) => {
        if (node.innerText.includes('Collect feedback in Application Review')) {
            // This is gross, but seemingly the recommended way of targeting a parent's sibling element
            node.parentElement.parentElement.classList.add('new-candidate');
            node.parentElement.parentElement.previousElementSibling.classList.add('new-candidate');
        }
    });

    document.querySelectorAll('div[class="interview-kit-actions"]').forEach((node) => {

        var job_id = node.closest('table[candidate_hiring_plan]').getAttribute('candidate_hiring_plan');
        node.innerHTML = node.innerHTML.replace(/(Send Email)/, '<i class="fa fa-envelope" title="$1">&nbsp;</i>');
        node.innerHTML = node.innerHTML.replace(/(Select Interview Kit)/, '<i class="fa fa-box" title="$1">&nbsp;</i>');
        insertLinks(node, job_id)
    });
}

// Add styling to the 'alljobs' section
function parse_jobs() {
    document.querySelectorAll('#jobs_table .follow-job').forEach((node) => {
        var job_id = node.pathname.split('/')[2]
        node.innerHTML = node.innerHTML.replace(/Follow/, '<i class="fa fa-user-plus" title="Follow">&nbsp;</i>');
        insertLinks(node, job_id)
    });
}

async function fetch_candidate_tags(candidate_id) {
    var fetch_url = "https://canonical.greenhouse.io/people/" + candidate_id;
    const response = await fetch(fetch_url)
    if (response.status == 200) {
        const html = await response.text()
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // const tags = doc.querySelectorAll('div[class="applied-tag-container"]').map((node) => node.innerText);
        var tags = Array.from(doc.querySelectorAll('div.applied-tag-container'), (node) => node.innerText.trim())
        return tags
    }
}

const insertLinks = (node, job_id) => {
    node.insertAdjacentHTML('beforeend', `<a href="/plans/${job_id}/setup" title="Job Setup"><i class="fa fa-cog">&nbsp;</i></a>` +
                            `<a href="/plans/${job_id}" title="Job Info"><i class="fa fa-info-circle">&nbsp;</i></a>` +
                            `<a href="/plans/${job_id}/jobapp" title="Job Posts"><i class="fa fa-clipboard">&nbsp;</i></a>`)
}

if (window.location.href.match(/\/alljobs$/)) {
    setIntervalX(function() {
        parse_jobs();
    }, 1000, 1);
}

if (window.location.href.match(/\/people.*|plans.*/)) {
    parse_candidates();
}

// Add column sorting to all table cells
const get_cell_val = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

const compare_cell = (idx, asc) => (a, b) => ((v1, v2) =>
    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
)(get_cell_val(asc ? a : b, idx), get_cell_val(asc ? b : a, idx));

document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
    const table = th.closest('table');
    const tbody = table.querySelector('tbody');
    Array.from(tbody.querySelectorAll('tr'))
        .sort(compare_cell(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
        .forEach(tr => tbody.appendChild(tr));
})));


style.innerHTML += `
@import url("https://use.fontawesome.com/releases/v5.13.1/css/all.css");
body {font-family: "Ubuntu", san-serif; font-size: 10px; };
.candidate {line-height: 2em !important;}
.person-info-column p a {font-size: 0.9em !important;}
.interview-kit-actions {line-height: 8px !important; display: block ruby; }
.job-cell .cell-content {white-space: normal !important;}
tbody tr:nth-child(odd) { background-color: #f5faff !important; }
.near-expiry{padding:0; background-color: #fcfcd9 !important;}
.expired{padding:0; background-color: #ffe8e8 !important;}
.new-candidate{background-color:#def3ff !important;}
`;

// Add the injected stylesheet to the bottom of the page's <head> tag
document.head.appendChild(style);

