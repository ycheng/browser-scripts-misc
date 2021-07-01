// ==UserScript==
// @name           Greenhouse Recruiting Tweaks
// @namespace      http://greenhouse.io/
// @description    Tweak the Greenhouse tabular layout to be more obvious when rows expire/near expiry
// @include        /^https?://.*greenhouse\.io/.*$/
// @author         setuid@gmail.com
// @updateUrl      https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/greenhouse-tweaks.user.js
// @downloadUrl    https://raw.githubusercontent.com/desrod/browser-scripts-misc/master/greenhouse-tweaks.user.js
// @version        3.27
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

function match_keypress(selector) {
    if (document.activeElement) {
        return document.activeElement.matches(selector);
    } else {
        return false;
    }
}

function mutation_callback(mutations) {
    for (let mutation of mutations) {
        if (mutation.target.getAttribute("data-provides")) {
            parse_jobs();
        };
        continue;
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

// function random_color(){
//     return "hsl(" + 360 * Math.random() + ',' +
//         (25 + 70 * Math.random()) + '%,' +
//         (85 + 10 * Math.random()) + '%)'
// }

// Add styling and various helpful colors/injects to the candidate lists
async function parse_candidate_list() {
    var candidate_row, candidate_name, candidate_attr, candidate_expiry, candidate_status, candidate_job, candidate_stage = '';
    var url = 'https://canonical.greenhouse.io/people/'
    document.querySelectorAll('p[class="name"]').forEach(async (node) => {
        const re = /.*\/people\/(\d+)\?.*/i;
        const candidate_id = node.innerHTML.match(re)[1];
        const response = await request_page(url + candidate_id);

        // Reach into the candidate's profile, extract the tags and pull them back to the All Candidates list
        var tags = Array.from(response.querySelectorAll('div.applied-tag-container > a'),
                              node => ({ ctagid: node.getAttribute('ctagid'), tag_name: node.innerText.trim() }))

        tags.sort((a, b) => a > b ? -1 : 1)

        tags.forEach(obj => {
            const url = `/people?candidate_tag_id[]=${obj.ctagid}&stage_status_id[]=2`;
            node.insertAdjacentHTML('afterend',`<a class="tag tiny-button" href=${url}` +
                                    `ctagid="${obj.ctagid}">${obj.tag_name}</a>`);
        });
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

// Not a fan of parsing this information in multiple places, but it's not
// stored in the same way under the list of candidates nor their individual
// profile, so.. here we are.
async function parse_candidate_profile() {
    var job_id = document.querySelector('li[class="job-setup-tab"] > a').getAttribute('href').match(/\d+/)[0];
    var url = `https://canonical.greenhouse.io/plans/${job_id}/team`;
    const response = await request_page(url)

    if (window.location.href.match(/.*#activity_feed$/)) {
        document.querySelectorAll('p[class*="ActivityExtras__Text"]').forEach((node) => {
            if (node.innerText.startsWith('Rejected from') || node.innerText.startsWith('Reason:')) {
                node.classList.add(`status-rej`);
            }
        });
    }

    var managers = find_matching_el(response, 'ul[id="hiring_manager"] > li > span').map(e => e.innerText).join("<br>");
    var recruiters = find_matching_el(response, 'ul[id="recruiter"] > li > span').map(e => e.innerText).join("<br>");
    document.querySelectorAll('div[class*="candidate-controls"]').forEach((node) => {


        node.insertAdjacentHTML('afterbegin', `<div class="hiring-team section"><div class="title">Hiring Managers</div>` +
                                `<br /><span style="font-size: 12px;">${managers}</span></div>`)
        node.insertAdjacentHTML('afterbegin', `<div class="recruiter-team section"><div class="title">Recruiters</div>` +
                                `<br /><span style="font-size: 12px;">${recruiters}</span></div>`)

        // Add clickable links to the Candidate Tags on their individual profile page
        var tags = Array.from(document.querySelectorAll('div.applied-tag-container > a'));

        tags.forEach(tag=> {
            const ctagid = tag.getAttribute('ctagid');
            const url = `/people?candidate_tag_id[]=${ctagid}&stage_status_id[]=2`;
            tag.href=url;
        });

    });
}

async function parse_hiring_team() {
    var job_id = document.querySelector('li[class="job-setup-tab"] > a').getAttribute('href').match(/\d+/)[0];
    var url = `https://canonical.greenhouse.io/plans/${job_id}/team`;
    const response = await request_page(url)

    var managers = find_matching_el(response, 'ul[id="hiring_manager"] > li > span').map(e => e.innerText).join("<br>");
    var recruiters = find_matching_el(response, 'ul[id="recruiter"] > li > span').map(e => e.innerText).join("<br>");
}

function find_matching_el(response, selector) { return Array.from(response.querySelectorAll(selector)); }

// Add styling to the 'alljobs' section
function parse_jobs() {
    document.querySelectorAll('#jobs_table .follow-job').forEach((node) => {
        var job_id = node.pathname.split('/')[2]
        node.innerHTML = node.innerHTML.replace(/Follow/, '<i class="fa fa-user-plus" title="Follow">&nbsp;</i>');
        insertLinks(node, job_id)
    });
}

async function request_page(url) {
    const response = await fetch(url)
    if (response.status == 200) {
        const html = await response.text()
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return doc;
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
    parse_candidate_list();
}

// Edit/update Candidate tags, if doing quick review or viewing their profile directly
// The listen events only work if you're not actively typing in a form field
if (window.location.href.match(/.*application_review\?hiring_plan_id=.*|\/people\/\d+\?application_id.*/)) {
    document.addEventListener('keyup', function(event) {
        if (event.key === 't') { // Edit tags for the candidate
            if (!match_keypress('textarea') && !match_keypress('input')) {
                document.querySelector('a[class*="modify-tags"]').click();
                document.getElementById('s2id_autogen1').select();
            }
        }

        if (event.key === 'Escape') { // Save tags or exit if no tags were added
            document.querySelector('a[class*="done-tagging-button"]').click();
            document.activeElement.blur();
        }
    });
}

if (window.location.href.match(/.*\/people\/(\d+).*application_id=(\d+)/)) {
    parse_candidate_profile();
}

if (window.location.href.match(/.*\/sdash\/(\d+)/)) {
    const {href:job_id, innerText:job_title} = document.querySelector('a[class="nav-title"]');
    document.title = document.title.replace(/(.*)\| Greenhouse/, `${job_id.match(/\d+/)[0]} | ${job_title}`);
    parse_hiring_team();
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

var page_height = document.body.scrollHeight;
console.log("DEBUG: ", page_height);
style.innerHTML += `
@import url("https://use.fontawesome.com/releases/v5.13.1/css/all.css");
body {font-family: "Ubuntu", san-serif; font-size: 10px; };
.candidate {line-height: 2em !important;}
.document-container {height: ${page_height}px !important; scroll-y:auto; }
.person-info-column p a {font-size: 0.9em !important;}
.interview-kit-actions {line-height: 8px !important; display: block ruby; }
.job-cell .cell-content .job-title {white-space: normal !important;}
tbody tr:nth-child(odd) { background-color: #f5faff !important; }
.near-expiry{padding:0; background-color: #fcfcd9 !important;}
.expired{padding:0; background-color: #ffe8e8 !important;}
.new-candidate{background-color:#def3ff !important;}
.status-rej{background-color:#ffdbdf !important;}
`;

// Add the injected stylesheet to the bottom of the page's <head> tag
document.head.appendChild(style);

