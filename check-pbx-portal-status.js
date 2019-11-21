// ==UserScript==
// @name         Check PBX Portal Status
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Verify that you have an active websocket session to the PBX portal
// @author       David A. Desrosiers (david.desrosiers@canonical.com)
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @match        https://*.uc-support.canonical.com/reach/portal/dashboard*
// @grant        none
// ==/UserScript==

var alert_sent = 0

setTimeout(function() { var timer_variable = setInterval(monitor_page, 30000); }, 6000);

// Snipped from https://curtistimson.co.uk/post/js/create-a-flashing-tab-notification-page-title/
! function(t, n) {
    t.pageTitleNotification = function() {
        var e = {
            currentTitle: null,
            interval: null
        };
        return {
            on: function(i, l) {
                e.interval || (e.currentTitle = n.title,
                    e.interval = t.setInterval(function() {
                    n.title = e.currentTitle === n.title ? i : e.currentTitle
                }, l || 1e3))
            },
            off: function() {
                t.clearInterval(e.interval), e.interval = null,
                    n.title = e.currentTitle
            }
        }
    }()
}(window, document);

function monitor_page () {
    var agent_name = document.getElementsByClassName("profile-name")[0].innerHTML;
    var agent_status = document.getElementById("profile-stat1").innerHTML;

    // Just some debug while profiling the timer
    var now_hours = new Date().getHours() + '';
    var now_minutes = new Date().getMinutes() + '';
    var now_seconds = new Date().getSeconds() + '';
    var time_now = now_hours + ":" + now_minutes + "." + now_seconds;
    // End debug, remove this block if you don't need console messages
    // console.log ('[' + time_now + '] Status was: ' + agent_status + '\nAlert sent:' + alert_sent);
    if (agent_status != 'idle' && alert_sent == 0) {
        var alert_message = agent_name + ": You are no longer active on the PBX, please verify status.";
        alert(alert_message)
        pageTitleNotification.on(alert_message, 500);
        ++alert_sent;
    // Make sure we handle all non-released conditions that could occur
    } else if (agent_status == 'idle' || agent_status == 'pre-call' || agent_status == 'pre-session outbound') {
        pageTitleNotification.off()
        alert_sent = 0;
    }
}
