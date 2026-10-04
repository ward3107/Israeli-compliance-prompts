const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('widgets/cookie-consent/cookie-consent.js', 'utf8');

test('custom copy is escaped, language scoped and keeps rejection behavior', () => {
  const h = setup();
  const textOverrides = { en: { title: '<b>Your choice</b>', rejectAll: 'Only essentials' }, he: { title: 'בחירה' } };
  h.widget.init({ ...h.config, region: 'eu', textOverrides });
  assert.match(h.roots[0].innerHTML, /&lt;b&gt;Your choice&lt;\/b&gt;/);
  assert.match(h.roots[0].innerHTML, /Only essentials/);
  h.click('reject');
  assert.equal(h.saved().analytics, false);
  assert.equal(h.saved().marketing, false);
  h.widget.init({ ...h.config, region: 'eu', language: 'he', textOverrides });h.widget.show();
  assert.equal(h.roots[0].attrs['aria-label'], 'בחירה');
  assert.doesNotMatch(h.roots[0].innerHTML, /Only essentials/);
});

test('blank, oversized and structural text overrides keep original translations', () => {
  const h = setup();
  h.widget.init({ ...h.config, region: 'eu', textOverrides: { en: { title: ' ', body: 'x'.repeat(1001), acceptAll: 7, rejectAll: '', dir: 'rtl', gpcNotice: 'hidden' } } });
  assert.equal(h.roots[0].attrs.dir, 'ltr');
  assert.equal(h.roots[0].attrs['aria-label'], 'We value your privacy');
  assert.match(h.roots[0].innerHTML, /Reject all/);
  assert.match(h.roots[0].innerHTML, /Accept all/);
  assert.doesNotMatch(h.roots[0].innerHTML, /x{1001}/);
});

test('custom preview storage never reads or writes the production consent record', () => {
  const h = setup();
  const records = new Map([['cc_consent_v1', choice(true, true)]]);
  h.window.localStorage.getItem = key => records.get(key) || null;
  h.window.localStorage.setItem = (key, value) => records.set(key, value);
  h.widget.init({ ...h.config, region: 'eu', storageKey: 'cc_customizer_preview' });
  assert.equal(h.changes.at(-1).marketing, false);
  h.click('reject');
  assert.equal(JSON.parse(records.get('cc_customizer_preview')).marketing, false);
  assert.equal(JSON.parse(records.get('cc_consent_v1')).marketing, true);
});

// Exercise the shipped script and its click handlers without external dependencies.
function setup({ gpc = false, stored, blocked = false, language = 'en' } = {}) {
  const changes = [];
  const roots = [];
  let saved;
  const body = {
    appendChild(root) { roots.push(root); root.parentNode = body; },
    removeChild(root) { roots.splice(roots.indexOf(root), 1); root.parentNode = null; }
  };
  const document = {
    body, activeElement: null,
    createElement() {
      const inputs = { '#cc-analytics': { checked: true }, '#cc-marketing': { checked: true } };
      return {
        attrs: {}, style: { setProperty() {} },
        setAttribute(key, value) { this.attrs[key] = value; },
        querySelector(selector) { return inputs[selector] || null; },
        addEventListener(type, handler) { this[type] = handler; }
      };
    }
  };
  const window = {
    navigator: { language, globalPrivacyControl: gpc },
    localStorage: {
      getItem() { if (blocked) throw Error('blocked'); return saved ? JSON.stringify(saved) : stored; },
      setItem(key, value) { if (blocked) throw Error('blocked'); saved = JSON.parse(value); }
    },
    dataLayer: []
  };
  vm.runInNewContext(source, { window, document, URL });
  return {
    widget: window.CookieConsent, window, roots, changes, saved: () => saved,
    config: { onChange(c) { changes.push(c); } },
    click(action) {
      roots[0].click({ target: { closest() { return { getAttribute() { return action; } }; } } });
    }
  };
}
function choice(analytics, marketing, extra = {}) {
  return JSON.stringify({ version: '1.0', region: 'eu', expires: Date.now() + 60000, analytics, marketing, ...extra });
}
test('the public widget rejects executable, credentialed and malformed policy URLs', () => {
  for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,hi', '//evil.example', '/\\evil.example', 'https://user:pass@example.com', 'java\nscript:alert(1)', 'https://example.com/\u0000', {}, 42]) {
    const h = setup();h.widget.init({...h.config, privacyPolicyUrl:url});
    assert.doesNotMatch(h.roots[0].innerHTML, /class="cc-link"/);
  }
  for (const url of ['/privacy', 'privacy.html', 'https://example.com/privacy?a=1&b=2']) {
    const h = setup();h.widget.init({...h.config, privacyPolicyUrl:url});
    assert.match(h.roots[0].innerHTML, /class="cc-link"/);
    assert.doesNotMatch(h.roots[0].innerHTML, /a=1&b=2/);
  }
});
test('prototype names cannot select a translation object', () => {
  for (const language of ['__proto__','constructor','toString']) {
    const h = setup();h.widget.init({...h.config,language});
    assert.equal(h.roots[0].attrs['aria-label'],'We value your privacy');
  }
});
test('oversized stored consent fails closed', () => {
  const h=setup({stored:choice(true,true,{padding:'x'.repeat(5000)})});
  h.widget.init({...h.config,region:'eu'});assert.equal(h.changes.at(-1).analytics,false);
});
test('returning visitor: GPC overrides saved marketing consent', () => {
  const h = setup({ gpc: true, stored: choice(true, true, { region: 'us-ca' }) });
  h.widget.init({ ...h.config, region: 'us-ca' });
  assert.equal(h.changes.at(-1).marketing, false);
  const update = h.window.dataLayer.find(x => x[0] === 'consent' && x[1] === 'update');
  for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(update[2][key], 'denied');
  assert.equal(h.roots.length, 0);
});
test('Do Not Sell button opts out immediately and persists the choice', () => {
  const h = setup();
  h.widget.init({ ...h.config, region: 'us-ca' });
  assert.match(h.roots[0].innerHTML, /data-cc="optout"/);
  h.click('optout');
  assert.equal(h.changes.at(-1).marketing, false);
  assert.equal(h.saved().marketing, false);
  assert.equal(h.saved().analytics, true);
  assert.equal(h.roots.length, 0);
});
test('UK analytics requires explicit exemption configuration', () => {
  for (const flag of [undefined, false, true, 'true']) {
    const h = setup();
    h.widget.init({ ...h.config, region: 'uk', ukFirstPartyAnalyticsExempt: flag });
    assert.equal(h.changes.length, 1);
    assert.equal(h.changes[0].analytics, flag === true);
    assert.equal(h.changes[0].marketing, false);
  }
});
test('UK exemption cannot enable analytics for another region', () => {
  const h = setup();
  h.widget.init({ ...h.config, region: 'eu', ukFirstPartyAnalyticsExempt: true });
  assert.equal(h.changes[0].analytics, false);
});
test('GPC overrides direct consent application and persisted state', () => {
  const h = setup({ gpc: true });
  h.widget.init({ ...h.config, region: 'eu' });
  h.widget._apply({ analytics: true, marketing: true }, true);
  assert.equal(h.saved().marketing, false);
});
test('invalid, expired and unavailable storage do not grant opt-in consent', () => {
  for (const options of [
    { stored: '{' }, { stored: choice(true, true, { expires: 1 }) },
    { stored: choice(true, true, { expires: 'tomorrow' }) },
    { stored: choice(true, true, { version: '0.9' }) }, { blocked: true }
  ]) {
    const h = setup(options);
    h.widget.init({ ...h.config, region: 'eu' });
    assert.equal(h.changes.length, 1);
    assert.equal(h.changes[0].analytics, false);
    assert.equal(h.changes[0].marketing, false);
    assert.match(h.roots[0].innerHTML, /data-cc="reject"/);
  }
});
test('valid saved rejection remains rejected without displaying a banner', () => {
  const h = setup({ stored: choice(false, false) });
  h.widget.init({ ...h.config, region: 'eu' });
  assert.equal(h.changes[0].analytics, false);
  assert.equal(h.changes[0].marketing, false);
  assert.equal(h.roots.length, 0);
});
test('saved consent from another region is not reused', () => {
  const h = setup({ stored: choice(true, true, { region: 'us-ca' }) });
  h.widget.init({ ...h.config, region: 'eu' });
  assert.equal(h.changes[0].marketing, false);
  assert.match(h.roots[0].innerHTML, /data-cc="reject"/);
});
test('malformed saved flags cannot grant consent', () => {
  const h = setup({ stored: choice('false', 'false') });
  h.widget.init({ ...h.config, region: 'eu' });
  assert.equal(h.changes[0].analytics, false);
  assert.equal(h.changes[0].marketing, false);
});
test('existing GTM integration receives denied defaults without gtmId', () => {
  const h = setup();
  h.widget.init({ ...h.config, region: 'eu' });
  assert.equal(h.window.dataLayer[0][1], 'default');
  assert.equal(h.window.dataLayer[0][2].analytics_storage, 'denied');
});
test('show before initialization is harmless', () => {
  const h = setup();
  assert.doesNotThrow(() => h.widget.show());
});
test('repeated initialization replaces the banner', () => {
  const h = setup();
  h.widget.init({ ...h.config, region: 'eu', language: 'en' });
  h.widget.init({ ...h.config, region: 'eu', language: 'he' });
  assert.equal(h.roots.length, 1);
  assert.equal(h.roots[0].attrs.lang, 'he');
  assert.equal(h.roots[0].attrs.dir, 'rtl');
});
test('each language has its correct direction and language attribute', () => {
  for (const [language, direction] of [['en', 'ltr'], ['ru', 'ltr'], ['he', 'rtl'], ['ar', 'rtl']]) {
    const h = setup();
    h.widget.init({ ...h.config, region: 'eu', language });
    assert.equal(h.roots[0].attrs.lang, language);
    assert.equal(h.roots[0].attrs.dir, direction);
  }
});
test('withdrawal through Reject all updates and persists denied consent', () => {
  const h = setup({ stored: choice(true, true) });
  h.widget.init({ ...h.config, region: 'eu' });
  h.widget.show();
  h.click('reject');
  assert.equal(h.saved().analytics, false);
  assert.equal(h.saved().marketing, false);
  assert.equal(h.changes.at(-1).marketing, false);
});
test('blocked storage does not prevent rejecting consent', () => {
  const h = setup({ blocked: true });
  h.widget.init({ ...h.config, region: 'eu' });
  assert.doesNotThrow(() => h.click('reject'));
  assert.equal(h.changes.at(-1).marketing, false);
  assert.equal(h.roots.length, 0);
});
test('unknown region defaults to opt-in', () => {
  const h = setup();
  h.widget.init({ ...h.config, region: 'unknown' });
  assert.equal(h.changes[0].analytics, false);
  assert.equal(h.changes[0].marketing, false);
});

test('custom category descriptions are escaped and do not leak into other instances', () => {
  const h = setup();
  h.widget.init({ ...h.config, region: 'eu', categoryDescriptions: { en: { analytics: '<b>Example analytics</b>' } } });
  assert.match(h.roots[0].innerHTML, /&lt;b&gt;Example analytics&lt;\/b&gt;/);
  h.widget.init({ ...h.config, region: 'eu' });
  assert.doesNotMatch(h.roots[0].innerHTML, /Example analytics/);
});
test('blocked storage retains the current choice when reopening settings', () => {
  const h = setup({ blocked: true });
  h.widget.init({ ...h.config, region: 'eu' });
  h.click('accept');
  h.widget.show();
  assert.match(h.roots[0].innerHTML, /id="cc-analytics" checked/);
  assert.match(h.roots[0].innerHTML, /id="cc-marketing" checked/);
});
