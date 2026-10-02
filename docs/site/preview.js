(function () {
  'use strict';
  window.addEventListener('message', function (event) {
    if (event.origin !== location.origin || event.source !== parent || !event.data || event.data.type !== 'compliance-preview') return;
    var config = event.data.config;
    document.getElementById('sample-name').textContent = event.data.name || 'כאן מתחיל המותג שלכם.';
    document.getElementById('custom-style').textContent = event.data.css;
    // Preview storage never overwrites the site's real consent storage.
    CookieConsent.init(Object.assign({}, config, { storageKey: 'cc_customizer_preview', autoFocus: false, privacyPolicyUrl: 'privacy.html' }));
    CookieConsent.show();
  });
  parent.postMessage({ type: 'compliance-preview-ready' }, location.origin);
})();
