// ==UserScript==
// @name           Salesforce Useful Tweaks
// @namespace      http://salesforce.com/
// @description    Style and tweak Salesforce to be more productive for Engineers and Support
// @include        /^https?://.*.salesforce\.com/.*$/
// @grant          GM_getValue
// @grant          GM_setValue
// @author         setuid@gmail.com
// @version        1.0
// ==/UserScript==

document.styleSheets[0].insertRule('div#cas15_ileinner { font:medium !important; padding:1em; color:black; background-color: lightgreen;border:1px solid #cecece;font:medium monospace;', 0);
document.styleSheets[0].insertRule('.noStandardTab td.dataCell { word-wrap:break-word;font:medium monospace !important;', 1);

var els1 = document.querySelectorAll('.noStandardTab .dataRow');
for (var i = 0, l = els1.length; i < l; i++) {
  var el1 = els1[i];
  el1.innerHTML = el1.innerHTML.replace(/(Created By:.*)/, '<span style="background-color:lightgreen;display:block;">$1</span>');
  el1.innerHTML = el1.innerHTML.replace(/(Created By: .+ \(portal\).*<\/b>)/gi, '<div style="background-color: yellow; display: block;">$1</div><\/b>');
  el1.innerHTML = el1.innerHTML.replace(/New Attachment added: ([^()]+) \((https?:\/\/[.a-z0-9A-Z]+\/.+)\)/gi, '<strong style="color: red;">IMPORTANT New Attachment added</strong>: <a style="color:blue;" href="$2">$1</a>');
  el1.innerHTML = el1.innerHTML.replace(/(?=(https?:\/{2}[.a-z0-9A-Z%=\~\+\/&\:\?\-#]+))\1(?!['"]|<\/a>)+/gi, '<a style="color:blue;" href="$&">$&</a>');
  // el.innerHTML = el.innerHTML.replace(/(github|chef|preseed)/gi, '<a style="color:blue;" href="http://www.google.com/?q=$&" title="Search Google for $&..." target="_top">$&</a>');
}

var els2 = document.querySelectorAll('.individualPalette .lookupHoverDetail .lookupHoverDetailOverridable .tabHover');
for (var j = 0, m = els2.length; j < m; j++) {
  var el2 = els2[j];
  el2.innerHTML = el2.innerHTML.replace(/(Case)/, '<span style="background-color:lightgreen;display:block;">Foobar! $1</span>');
}

var els3 = document.querySelectorAll('.noStandardTab .dataRow.even');
for (var k = 0, n = els3.length; k < n; k++) {
  var el3 = els3[k];
  el3.innerHTML = el3.innerHTML.replace(/<td class="\s+dataCell\s+"/gi, '<td class=" dataCell " style="border:1px solid #cecece; background-color: #f0f0f5;"');
}
