(function () {
  'use strict';
  window.addEventListener('message', function (event) {
    if (!(location.protocol==='file:'?event.origin==='null'||event.origin==='file://':event.origin===location.origin) || event.source !== parent || !event.data || event.data.type !== 'compliance-preview') return;
    var config = event.data.config;
    if (!config || typeof config !== 'object' || Array.isArray(config) ||
        typeof event.data.css !== 'string' || event.data.css.length > 16000 ||
        /@import|url\s*\(|[<>]/i.test(event.data.css) ||
        (event.data.name !== undefined && (typeof event.data.name !== 'string' || event.data.name.length > 2000))) return;
    document.getElementById('sample-name').textContent = event.data.name || 'כאן מתחיל המותג שלכם.';
    document.getElementById('custom-style').textContent = event.data.css;
    // Preview storage never overwrites the site's real consent storage.
    CookieConsent.init(Object.assign({}, config, { storageKey: 'cc_customizer_preview', autoFocus: false, privacyPolicyUrl: 'privacy.html' }));
    CookieConsent.show();
  });
  parent.postMessage({ type: 'compliance-preview-ready' }, location.protocol==='file:'?'*':location.origin);
})();
