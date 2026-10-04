# 🍪 Cookie Consent widget

Want to preview and install without a terminal? [Explore the designs](https://ward3107.github.io/web-compliance-prompts/explore.html) → [download a configured package](https://ward3107.github.io/web-compliance-prompts/start.html). The generated universal installer needs only four local files and creates the preferences button automatically. WordPress is optional. This widget has **zero runtime dependencies**.

Prefer working with a coding assistant? The optional [local MCP server](../../mcp/README.md) prepares the same canonical runtime files and shared installer as text, without writing to your site. It requires Node.js 22+; the installed browser widget still has no runtime dependencies. The [connection page](https://ward3107.github.io/web-compliance-prompts/connect.html) generates the editor configuration.

Security: policy links are validated at the widget boundary, not merely HTML-escaped. Unsafe links are omitted. Generated packages default to `region: 'auto'`; explicit opt-out regions in the API below require verified visitor context and applicability. Integrate consent before trackers execute. Read [SECURITY.md](../../SECURITY.md) for deployment limits.

A **drop-in, framework-agnostic cookie-consent banner** — vanilla JS + CSS, no
build step, no dependencies, no network calls. It's the runnable counterpart to
the `cookie-banner` prompt template: instead of generating code, you paste these
two files in.

> ## ⚠️ Not legal advice
> This is a **template implementation**, not a compliance guarantee. Have a
> qualified lawyer in each market review it, and confirm your region detection,
> before relying on it. See the repo's
> [legal-review guide](../../docs/GUIDED-SETUP.md#material-limits) section.

## What it does

- **Google Tag Manager Consent Mode v2** — pushes `consent: default` (all
  denied) and `consent: update` on the user's choice, plus a
  `cookie_consent_update` dataLayer event for tag triggers.
- **Honours Global Privacy Control** — if `navigator.globalPrivacyControl` is
  true, marketing / sale-sharing is denied automatically (no click needed) and
  the marketing toggle is disabled and labelled. Required by California and a
  growing list of US states.
- **Geo-aware model** — opt-in (EU / UK / Israel: nothing non-essential until
  the user agrees) vs opt-out (US, California: a "Do Not Sell or Share" control).
- **UK first-party-analytics exemption** — under the DUAA 2025 (PECR from
  5 Feb 2026), a UK visitor's first-party analytics runs without prior consent;
  marketing still requires opt-in. Disabled by default; explicitly enable with `ukFirstPartyAnalyticsExempt: true` only after verifying the exemption conditions for your implementation.
- **Granular categories** — Necessary (locked on), Analytics, Marketing, each
  with a plain-language description.
- **4 languages + RTL** — English, Hebrew, Arabic, Russian, auto-detected from
  `navigator.language`, with full right-to-left mirroring for Hebrew/Arabic.
- **Accessible** — `role="dialog"`, keyboard operable, visible focus rings,
  Escape collapses the panel, WCAG 2.2 target sizes (≥ 44px).
- **Persistence** — the choice is stored in `localStorage` (versioned, 12-month
  expiry); returning visitors don't see the banner again until it expires. A region change or invalid saved data prompts a fresh choice. GPC overrides saved marketing consent.

## Install

Copy `cookie-consent.css` and `cookie-consent.js` into your project, then:

```html
<link rel="stylesheet" href="/path/to/cookie-consent.css">
<script src="/path/to/cookie-consent.js"></script>
<script>
  CookieConsent.init({
    gtmId: 'GTM-XXXXXXX',            // optional — injects the Consent Mode default
    region: 'eu',                    // 'eu' | 'uk' | 'il' | 'us' | 'us-ca' | 'auto'
    language: 'auto',                // 'en' | 'he' | 'ar' | 'ru' | 'auto'
    privacyPolicyUrl: '/privacy',
    brandColor: '#2563eb',
    onChange: function (consent) {
      // consent = { analytics: bool, marketing: bool }
    }
  });
</script>
```

Put the `<script>` **before** GTM loads so the Consent Mode default lands first.

### Region detection

The widget does **not** geolocate — that needs a server or geo-IP service, which
a static script can't do reliably. Pass `region` from your own detection (e.g.
an edge/CDN geo header, or a server-rendered value). If you pass `region: 'auto'`
or omit it, the widget defaults to the **strictest** model (opt-in) so you never
accidentally under-protect a visitor. For a multi-market site, detect per request
and pass the matching region.

## Options

| Option | Type | Default | Notes |
|---|---|---|---|
| `gtmId` | string | — | If set, pushes the Consent Mode `default` state. |
| `region` | string | `'auto'` | `eu`/`uk`/`il` → opt-in; `us`/`us-ca` → opt-out; `auto` → strictest (opt-in). |
| `language` | string | `'auto'` | `en`/`he`/`ar`/`ru`, or auto-detect. |
| `privacyPolicyUrl` | string | — | Adds a privacy-policy link. |
| `brandColor` | string | `#2563eb` | Primary button / accent color. |
| `ukFirstPartyAnalyticsExempt` | bool | `false` | UK-only: explicitly enable after verifying that your analytics implementation meets the exemption conditions. |
| `onChange` | function | — | Called with `{analytics, marketing}` whenever consent is set. |

## Methods

- `CookieConsent.init(config)` — set up and (if needed) show the banner.
- `CookieConsent.show()` — re-open the banner, e.g. from a "Cookie settings"
  footer link:
  ```html
  <a href="#" onclick="CookieConsent.show();return false">Cookie settings</a>
  ```

## Wiring your tags

The widget only manages **consent signals** — it does not load GA4 or the Meta
pixel for you. In GTM, gate your tags on Consent Mode (analytics tags require
`analytics_storage`, ad tags require `ad_storage`) or trigger them on the
`cookie_consent_update` dataLayer event. Outside GTM, read the `onChange`
callback and load tags yourself only when the matching flag is true.

## Try it

Open [`demo.html`](demo.html) in a browser — pick a region and language, click
**Load banner**, and watch the `dataLayer` log react to your choices.

## Scope & limits

- One banner, three categories (necessary / analytics / marketing). If you need
  more granular vendor-level control, extend the `row()` calls and the consent
  mapping.
- No consent-logging backend — the choice lives in the visitor's `localStorage`.
  If your jurisdiction requires you to *record* consent server-side (some
  interpretations of GDPR accountability and Québec Law 25 do), add a POST in
  `onChange`.
- Region is caller-supplied (see above).

## Behavior checks

Run `node --test tests/cookie-consent.test.cjs` from the repository root (Node.js 22 or later). The same tests run on pull requests. They exercise consent logic and DOM interactions using a small test double; they do not replace real-browser, screen-reader, or network-tracking checks.

**Integration change:** `onChange` now receives the denied state on a first opt-in visit. Existing `dataLayer` integrations also receive the default denied signal without needing a `gtmId` option. Configure tags before loading them; a consent signal alone does not block third-party requests.

## Actual tool descriptions and page language

Default descriptions are generic: they do not assume GA4 or promise anonymity.
Supply the actual tools, data and recipients in the chosen language:

```js
CookieConsent.init({
  region: 'eu',
  language: 'en',
  categoryDescriptions: {
    en: {
      necessary: 'Session storage for sign-in; see our privacy policy.',
      analytics: 'Our chosen analytics provider measures page views.',
      marketing: 'Our advertising provider measures campaigns.'
    }
  }
});
```

These are example descriptions, not facts about your business. Values are
escaped before rendering. `language: 'auto'` prefers a supported page `lang`
attribute, then the browser language. Explicit language configuration wins.
When storage is blocked, reopening settings retains the current in-memory choice;
a new visit requires another choice. The panel scrolls within short viewports and
respects bottom safe-area padding.

Run `npm ci --ignore-scripts`, `npx playwright install chromium firefox webkit`
and `npm run test:browser` for the real-browser suite. It includes automated axe
checks and synthetic tracker requests; verify the real integration separately.
# Customizer and isolated previews

The public `builder.html` lets clients preview and download a themed copy, selected draft prompts and the full source toolkit. Load `theme.css` after the canonical widget stylesheet. The generated installation dispatches `compliance:consent`; site-specific integrations must use the category values to gate actual tracking requests.

`storageKey` optionally sets a separate consent record (default: `cc_consent_v1`). The customizer iframe uses `cc_customizer_preview`, so preview choices never overwrite the main demo's choices.

`autoFocus: false` disables automatic initial/return focus for embedded live previews. Default installations keep the existing keyboard focus behavior. Interactive category controls remain keyboard accessible in previews.


### Custom banner copy

`textOverrides` accepts plain-text overrides keyed by language (`he`, `en`, `ar`, `ru`). The supported fields are `title` (160 characters), `body` (1000), and `acceptAll`, `rejectAll`, `customize`, `save`, `privacy` (60 each). Empty or invalid overrides fall back to the original translation. HTML is escaped. Category meanings, direction and privacy-signal notices are not overridden. Copy changes do not change the actions performed by the buttons.

```js
CookieConsent.init({
  language: 'en', region: 'auto', privacyPolicyUrl: '/privacy',
  textOverrides: { en: { title: 'Your privacy choices', acceptAll: 'Accept all cookies' } }
});
```

The guided and advanced download pages include this editor, 12 design presets, custom colors/fonts, three button shapes, three button sizes and four body-text sizes. Adapted copy requires review against actual site behavior; changing a label does not establish legal compliance.
