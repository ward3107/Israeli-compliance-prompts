(function () {
  'use strict';
  var status = document.getElementById('state');
  function reset() {
    try { localStorage.removeItem('cc_consent_v1'); } catch (e) { /* private mode */ }
    if (CookieConsent._root) CookieConsent._destroy();
    status.textContent = 'Saved demo choice cleared. Choose “Try the banner” to begin again.';
  }
  document.getElementById('reset').addEventListener('click', reset);
  document.getElementById('try').addEventListener('click', function () {
    CookieConsent.init({
      region: document.getElementById('region').value,
      language: document.getElementById('language').value,
      ukFirstPartyAnalyticsExempt: document.getElementById('uk-exempt').checked,
      privacyPolicyUrl: 'privacy.html',
      brandColor: '#145f78',
      onChange: function (consent) {
        status.textContent = 'Analytics: ' + (consent.analytics ? 'allowed' : 'off') + '. Marketing: ' + (consent.marketing ? 'allowed' : 'off') + '.';
      }
    });
    CookieConsent.show();
  });
})();
