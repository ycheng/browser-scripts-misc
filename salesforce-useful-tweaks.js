// ==UserScript==
// @name           Salesforce Useful UI Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*.salesforce\.com/.*$/
// @author         setuid@gmail.com
// @version        1.7
// ==/UserScript==

// This first one is for the header/summary of the case
// modify font size and colors however you need for your preferences
document.styleSheets[0].insertRule('div#cas15_ileinner { font:8pt !important; padding:1em; color:black; background-color: lightgreen;border:1px solid #cecece;font:8pt monospace;', 0);

// This modifies each individual row of the case comments
document.styleSheets[0].insertRule('.noStandardTab td.dataCell { word-wrap:break-word;font:8pt monospace !important;', 1);

var els1 = document.querySelectorAll('.noStandardTab .dataRow');
for (var i = 0, l = els1.length; i < l; i++) {
  var el1 = els1[i];

  // Theses will alternate row colors between internal vs. external case comments
  el1.innerHTML = el1.innerHTML.replace(/(Created By:.*)/, '<span style="background-color:lightgreen;display:block;">$1</span>');
  el1.innerHTML = el1.innerHTML.replace(/(Created By: .+ \(portal\).*<\/b>)/gi, '<div style="background-color: yellow; display: block;">$1</div><\/b>');

  // Special handling for attachments inline
  el1.innerHTML = el1.innerHTML.replace(/New Attachment added: ([^()]+) \((https?:\/\/[.a-z0-9A-Z]+\/.+)\)/gi, '<strong style="color: red;">IMPORTANT New Attachment added</strong>: <a style="color:blue;" href="$2">$1</a>');

  // This will hyperlink the keywords off to Google searches for those words
  // Feel free to build up a dict of any you wish to search for, samples below
  // Note: leading spaces in keywords prevent breaking URL linking from the above construct
  el1.innerHTML = el1.innerHTML.replace(/(openstack|Liberty|Mitaka|Newton|Queens|Pike|github|chef|preseed)/gi, '<a style="color:blue;" href="http://www.google.com/search?q=$&" title="Search Google for $&..." target="_blank">$&</a>');

  // Attempt to turn anything that looks like a URL in a case comment, into a clickable link
  el1.innerHTML = el1.innerHTML.replace(/(?=(https?:\/{2}[.a-z0-9A-Z%=\~\+\/&\:\?\-#]+))\1(?!['"]|<\/a>)+/gi, '<a style="color:blue;" href="$&">$&</a>');

}

var els3 = document.querySelectorAll('.noStandardTab .dataRow.even');
for (var k = 0, n = els3.length; k < n; k++) {
  var el3 = els3[k];
  el3.innerHTML = el3.innerHTML.replace(/<td class="\s+dataCell\s+"/gi, '<td class=" dataCell " style="border:1px solid #cecece; background-color: #f0f0f5;"');
}