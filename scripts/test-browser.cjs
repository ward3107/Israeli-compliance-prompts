// Real-browser checks with synthetic trackers; no production accounts or requests.
const { chromium, firefox, webkit } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const root = path.resolve(__dirname, '..');
const out = path.resolve(process.env.BROWSER_REPORT_DIR || path.join(root, 'test-results'));
fs.mkdirSync(out, { recursive: true });
const assets = {
  '/': ['tests/browser-fixture.html', 'text/html'],
  '/cookie-consent.js': ['widgets/cookie-consent/cookie-consent.js', 'text/javascript'],
  '/cookie-consent.css': ['widgets/cookie-consent/cookie-consent.css', 'text/css'],
  '/site/': ['docs/site/index.html', 'text/html'],
  '/site/site.css': ['docs/site/site.css', 'text/css'],
  '/site/site.js': ['docs/site/site.js', 'text/javascript'],
  '/site/privacy.html': ['docs/site/privacy.html', 'text/html'],
  '/site/cookie-consent.js': ['widgets/cookie-consent/cookie-consent.js', 'text/javascript'],
  '/site/cookie-consent.css': ['widgets/cookie-consent/cookie-consent.css', 'text/css'],
};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname.endsWith('-event')) { res.writeHead(204); res.end(); return; }
  const asset = assets[pathname];
  if (!asset) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8' });
  res.end(fs.readFileSync(path.join(root, asset[0])));
});
const results = [];
async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
      const browser = await engine.launch({ headless: true });
      try {
        async function scenario(label, run, { gpc = false, viewport = { width: 1280, height: 800 } } = {}) {
          const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
          await context.addInitScript(value => Object.defineProperty(navigator, 'globalPrivacyControl', { value, configurable: true }), gpc);
          const page = await context.newPage();
          const events = [], errors = [];
          page.on('request', request => { if (request.url().endsWith('-event')) events.push(request.url().split('/').pop()); });
          page.on('pageerror', error => errors.push(error.message));
          try {
            await run(page, events);
            assert.deepEqual(errors, [], 'no page errors');
            results.push({ engine: name, scenario: label, passed: true });
            console.log(`PASS ${name}: ${label}`);
          } catch (error) {
            results.push({ engine: name, scenario: label, passed: false, error: error.message });
            await page.screenshot({ path: path.join(out, `${name}-${label.replace(/[^a-z0-9]+/gi, '-')}-failure.png`), fullPage: true });
            throw error;
          } finally { await context.close(); }
        }
        await scenario('opt-in tracking, reject, accept and withdrawal', async (page, events) => {
          await page.goto(base);
          await page.waitForTimeout(150);
          assert.deepEqual(events, [], 'no synthetic trackers before consent');
          await page.locator('[data-cc="reject"]').click();
          await page.reload();
          assert.equal(await page.locator('.cc-root').count(), 0);
          assert.deepEqual(events, [], 'saved rejection sends no trackers');
          await page.locator('#settings').click();
          await page.locator('[data-cc="accept"]').click();
          await page.waitForTimeout(150);
          assert.ok(events.includes('analytics-event') && events.includes('marketing-event'));
          await page.locator('#settings').click();
          await page.locator('[data-cc="reject"]').click();
          events.length = 0;
          await page.reload();
          await page.waitForTimeout(150);
          assert.deepEqual(events, [], 'withdrawal blocks trackers on next visit');
        });
        await scenario('GPC overrides saved marketing and persists opt-out', async (page, events) => {
          await page.goto(`${base}/?region=us-ca`);
          assert.ok(!events.includes('marketing-event'));
          await page.evaluate(() => localStorage.setItem('cc_consent_v1', JSON.stringify({ version: '1.0', region: 'us-ca', expires: Date.now() + 60000, analytics: true, marketing: true })));
          events.length = 0;
          await page.reload();
          await page.waitForTimeout(150);
          assert.ok(!events.includes('marketing-event'), 'saved grant cannot override GPC');
          await page.locator('#settings').click();
          assert.equal(await page.locator('#cc-marketing').isDisabled(), true);
          await page.locator('[data-cc="optout"]').click();
          assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cc_consent_v1')).marketing), false);
        }, { gpc: true });
        await scenario('region change requires a new opt-in choice', async (page, events) => {
          await page.goto(`${base}/?region=us-ca`);
          await page.evaluate(() => localStorage.setItem('cc_consent_v1', JSON.stringify({ version: '1.0', region: 'us-ca', expires: Date.now() + 60000, analytics: true, marketing: true })));
          events.length = 0;
          await page.goto(`${base}/?region=eu`);
          await page.waitForTimeout(150);
          assert.deepEqual(events, []);
          assert.equal(await page.locator('[data-cc="reject"]').count(), 1);
        });
        await scenario('UK analytics exemption is explicit', async (page, events) => {
          await page.goto(`${base}/?region=uk`);
          await page.waitForTimeout(150);
          assert.deepEqual(events, []);
          await page.goto(`${base}/?region=uk&ukExempt=true`);
          await page.waitForTimeout(150);
          assert.deepEqual(events, ['analytics-event']);
        });
        await scenario('page language and custom tool descriptions', async page => {
          await page.goto(base);
          await page.evaluate(() => {
            document.documentElement.lang = 'he';
            CookieConsent.init({ region: 'eu', language: 'auto', categoryDescriptions: { he: { analytics: 'Example provider - no Google Analytics assumption' } } });
          });
          assert.equal(await page.locator('.cc-root').getAttribute('lang'), 'he');
          await page.locator('[data-cc="toggle"]').click();
          assert.ok((await page.locator('#cc-panel').innerText()).includes('Example provider'));
        });
        await scenario('public demo mobile and desktop', async page => {
          await page.goto(`${base}/site/`);
          await page.evaluate(axe);
          let audit = await page.evaluate(() => axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
          assert.deepEqual(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.failureSummary) })), []);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          await page.screenshot({ path: path.join(out, `${name}-demo-mobile.png`), fullPage: true });
          await page.locator('#language').selectOption('he');
          await page.locator('#try').click();
          assert.equal(await page.locator('.cc-root').getAttribute('dir'), 'rtl');
          await page.locator('[data-cc="reject"]').click();
          await page.locator('#reset').click();
          assert.equal(await page.evaluate(() => localStorage.getItem('cc_consent_v1')), null);
          await page.setViewportSize({ width: 1280, height: 900 });
          await page.screenshot({ path: path.join(out, `${name}-demo-desktop.png`), fullPage: true });
        }, { viewport: { width: 320, height: 700 } });
        for (const language of ['en', 'he', 'ar', 'ru']) {
          await scenario(`${language} mobile keyboard and accessibility`, async page => {
            await page.goto(`${base}/?language=${language}`);
            assert.equal(await page.locator('.cc-root').getAttribute('dir'), ['he', 'ar'].includes(language) ? 'rtl' : 'ltr');
            assert.equal(await page.locator('.cc-root').getAttribute('lang'), language);
            await page.locator('[data-cc="toggle"]').focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('#cc-analytics').evaluate(el => el === document.activeElement), true);
            await page.keyboard.press('Space');
            assert.equal(await page.locator('#cc-analytics').isChecked(), true);
            await page.keyboard.press('Escape');
            assert.equal(await page.locator('#cc-panel').isVisible(), false);
            assert.equal(await page.locator('[data-cc="toggle"]').evaluate(el => el === document.activeElement), true);
            await page.keyboard.press('Enter');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            await page.evaluate(axe);
            const audit = await page.evaluate(() => axe.run('.cc-root', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } }));
            assert.deepEqual(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.failureSummary) })), [], 'automated accessibility checks');
            const save = page.locator('.cc-save');
            await save.focus();
            // Firefox may paint the focus-triggered scroll on the next frame.
            await page.waitForFunction(() => {
              const box = document.querySelector('.cc-save').getBoundingClientRect();
              return box.top >= 0 && box.bottom <= innerHeight + 1;
            }, null, { timeout: 2000 });
            const box = await save.boundingBox();
            assert.ok(box.y >= 0 && box.y + box.height <= 568 + 1, 'save button remains reachable in short viewport');
            await page.screenshot({ path: path.join(out, `${name}-${language}-mobile.png`) });
          }, { viewport: { width: 320, height: 568 } });
        }
      } finally { await browser.close(); }
    }
  } finally {
    server.close();
    fs.writeFileSync(path.join(out, 'browser-report.json'), JSON.stringify({ syntheticTrackers: true, results }, null, 2));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
