/* Shared browser/MCP installer. No dependencies, filesystem access or network. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ToolkitInstall=factory();})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var labels={he:'הגדרות עוגיות',ar:'إعدادات ملفات الارتباط',en:'Cookie preferences',ru:'Настройки файлов cookie'};
  function policy(value){
    if(typeof value!=='string'||!value||value.length>500||/[\\\s<>\u0000-\u001f\u007f]/.test(value))return false;
    if(/^\/(?!\/)/.test(value))return true;
    try{var url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password;}catch(e){return false;}
  }
  function script(config){
    if(!config||!Object.hasOwn(labels,config.language)||!policy(config.privacyPolicyUrl)||!/^#[0-9a-f]{6}$/i.test(config.brandColor))throw new Error('Invalid banner configuration');
    var safe={region:'auto',language:config.language,privacyPolicyUrl:config.privacyPolicyUrl,brandColor:config.brandColor,ukFirstPartyAnalyticsExempt:false};
    if(config.textOverrides)safe.textOverrides=config.textOverrides;
    var serialized=JSON.stringify(safe,null,2).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
    return '(function(){"use strict";if(window.__wctInstalled)return;window.__wctInstalled=true;CookieConsent.init(Object.assign('+serialized+', {onChange:function(consent){window.dispatchEvent(new CustomEvent("compliance:consent",{detail:consent}));}}));var button=document.getElementById("wct-preferences");if(!button){button=document.createElement("button");button.id="wct-preferences";button.type="button";button.className="wct-preferences";document.body.appendChild(button);}button.textContent='+JSON.stringify(labels[config.language])+';button.setAttribute("aria-label",button.textContent);button.addEventListener("click",function(){CookieConsent.show();});})();\n';
  }
  function snippet(){return '<link rel="stylesheet" href="/web-compliance/cookie-consent.css">\n<link rel="stylesheet" href="/web-compliance/theme.css">\n<script defer src="/web-compliance/cookie-consent.js"></script>\n<script defer src="/web-compliance/install.js"></script>';}
  function preview(language){
    if(!Object.hasOwn(labels,language))throw new Error('Invalid language');
    return '<!doctype html><html lang="'+language+'" dir="'+(['he','ar'].includes(language)?'rtl':'ltr')+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>Cookie banner preview</title><link rel="stylesheet" href="cookie-consent.css"><link rel="stylesheet" href="theme.css"><body><h1>Cookie banner preview</h1><p>Local preview only. No trackers are loaded. The privacy link opens your configured policy.</p><script src="cookie-consent.js"></script><script src="install.js"></script></body></html>';
  }
  return {script:script,snippet:snippet,preview:preview,validPolicy:policy};
});
