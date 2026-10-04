# Web Compliance Prompts

**See it before installing. Use it without a terminal. Keep the files on your own site.**

[Try it now](https://ward3107.github.io/web-compliance-prompts/) · [Prepare your package](https://ward3107.github.io/web-compliance-prompts/start.html) · [Download the offline studio](https://ward3107.github.io/web-compliance-prompts/web-compliance-studio.zip) · [Connect a coding assistant](https://ward3107.github.io/web-compliance-prompts/connect.html) · [עברית](README.he.md)

A browser toolkit for website builders and their clients: a working cookie-consent banner, 12 design presets, three editable Hebrew document drafts, and 13 implementation prompt templates backed by six jurisdiction packs.

The **banner, browser studio and ZIP exporter have zero third-party runtime dependencies**. They use plain HTML, CSS and JavaScript. No React, npm installation, CDN, account, API key or AI service is required to use the banner or document draft generator. AI prompt templates require an assistant only when you choose to use those prompts.

> **Drafts for review, not legal advice or a compliance guarantee.** Every jurisdiction pack still has `needs_legal_review: true`. The banner communicates consent; it does not automatically block scripts installed by other plugins. Review the documents and test your site's real trackers before publishing.

## Start here — no CLI

1. **Explore:** open the [preview](https://ward3107.github.io/web-compliance-prompts/explore.html). Try the banner, its four languages, desktop/mobile layouts and all 12 designs. Read the three sample documents and every template without entering business details.
2. **Customize:** select “Prepare your package,” answer the short questionnaire and review the design. Your selected preset and banner language carry over.
3. **Download:** choose WordPress or a universal website package. Legal drafts and the private review packet are separate downloads.
4. **Install and verify:** follow the included instructions. Review consent behavior, policy links, accessibility and actual tracking requests on the destination site.

The preview is also the homepage: one link opens a working banner. It has a compact design/language selector, a visible next step, optional detail sections and a mobile layout. The four-step wizard explains the current task, names the next action and provides a direct route back to missing details. “I do not know” is the default platform choice; WordPress is never silently assumed.

The guided interface is currently Hebrew. Banner text supports **Hebrew, Arabic, English and Russian**, including RTL. Changing language does not expand legal coverage.

## Choose an installation route

| Your situation | What you do | What is required |
|---|---|---|
| Just looking | Open the preview and inspect everything | A browser; no installation or details |
| WordPress | Download the configured ZIP → Plugins → Add New → Upload Plugin → Install → Activate | Permission to install plugins; WordPress 6.0+, PHP 7.4+ |
| Static HTML or a custom site | Upload four files and copy `embed.html.txt` | Permission to add local CSS/JavaScript to the site |
| React, Next.js or another framework | Load the four browser files once in the client layout | A developer must connect tracking and handle the site's CSP/lifecycle |
| A hosted website builder | Add the files/snippet through its supported custom-code feature | A plan/platform that permits custom code; no universal one-click integration is claimed |
| Work offline | Download the studio ZIP, extract **all** files, double-click `START-HERE.html` | A current desktop browser; no local server, Python or Node |
| Use an AI coding assistant | Use the [MCP connection guide](https://ward3107.github.io/web-compliance-prompts/connect.html), or copy/export prompts | A compatible stdio MCP client and Node.js 22+ for MCP; no npm packages |

The universal package contains `cookie-consent.js`, `cookie-consent.css`, `theme.css`, `install.js`, a local `preview.html`, `embed.html.txt`, the license and `START-HERE.html`. Upload **only the four runtime files** to `/web-compliance/` and paste:

```html
<link rel="stylesheet" href="/web-compliance/cookie-consent.css">
<link rel="stylesheet" href="/web-compliance/theme.css">
<script defer src="/web-compliance/cookie-consent.js"></script>
<script defer src="/web-compliance/install.js"></script>
```

Change the paths if you use another directory. The generated installer creates a persistent cookie-preferences button automatically. Listen for `compliance:consent` to integrate your trackers; see the [widget integration guide](widgets/cookie-consent/README.md). Ensure consent defaults and tracker blocking run before any tracker, including tags loaded in the head. Installing this snippet alone does not establish that ordering for other code.

To remove the universal integration, remove the snippet and its four files. For WordPress, deactivate and delete the plugin. This does not remove third-party trackers or visitors' existing consent records.

## Independent, portable and private

- The offline studio embeds the public template catalog and works without network access for previewing, editing and exporting. External legal references and GitHub links still need an internet connection.
- No backend, account, telemetry, external font or third-party script is used by the studio. The hosting provider still receives normal requests when you use the online version.
- Business details stay in browser memory until you explicitly export them. Save the project JSON to continue later; closing an unsaved page loses the work.
- Consent preferences use browser storage. The preview uses its own storage key.
- The plugin/universal installer excludes questionnaire answers, contact email and legal drafts. Saved projects and review packets contain private details: keep them private and never upload them to a public site or repository.
- The full-source advanced ZIP also contains your project profile. Upload only its runtime assets, not the whole ZIP.
- [`SHA256SUMS.txt`](https://ward3107.github.io/web-compliance-prompts/SHA256SUMS.txt) lets you compare the offline ZIP against the build's checksum. A checksum from the same host detects corruption; it is **not an independent signature** or proof against a compromised host.

## What is included, and what is not

| Feature | Current behavior |
|---|---|
| Cookie banner | Runnable vanilla JS/CSS; granular analytics/marketing preferences; GPC and consent-mode signals |
| Design studio | 12 presets, editable wording and styles, live preview and contrast check |
| Document generator | Editable Hebrew privacy, terms and refund drafts for Israel-only projects; missing facts remain marked |
| Legal-review packet | Locally generated project facts, open questions, sources and draft documents; never sent automatically |
| Other templates | Implementation prompts, **not automatically installed features** |
| WordPress adapter | Banner, persistent preferences button and administrator settings; no automatic policy-page publishing |
| Production scanning, automatic tracker discovery/blocking, billing, monitoring, lawyer booking | **Not implemented** |
| Legal approval or accessibility certification | **Not provided** |

Generated installation packages start in **opt-in mode for every visitor**, including packages for US/California businesses. A target market is not a visitor's verified location. The standalone widget API retains explicit regional modes for developers who have verified applicability; the [developer demo](https://ward3107.github.io/web-compliance-prompts/demo.html) can simulate those modes.

## All 13 templates

[Read the complete catalog before downloading](https://ward3107.github.io/web-compliance-prompts/explore.html#catalog).

| Template | Output / scope |
|---|---|
| `cookie-banner` | Runnable banner + prompt; all shipped packs |
| `accessibility-baseline` | Implementation prompt; all shipped packs |
| `accessibility-widget` | Implementation prompt; all shipped packs |
| `privacy-policy` | Israel-scoped prompt + Hebrew document draft generator |
| `terms-of-use` | Israel-scoped prompt + Hebrew document draft generator |
| `refund-policy` | Israel-scoped prompt + Hebrew document draft generator |
| `accessibility-statement` | Israel-scoped prompt |
| `disclaimer` | Israel-scoped prompt |
| `ecommerce-checkout` | Israel-scoped prompt |
| `email-marketing` | Israel-scoped prompt |
| `freelancer-contract` | Israel-scoped prompt |
| `client-onboarding` | Israel-scoped prompt |
| `data-subject-rights` | Overlay requiring both Israel and EU packs |

The six packs cover Israel (`il`), EU/EEA (`eu`), UK (`uk`), US federal (`us`), California (`us-ca`, extends `us`) and Canada (`ca`). These are sourced drafting inputs, not blanket certification of all obligations. The US federal pack does not cover every state's privacy law. See [pack scope, sources and review instructions](skills/web-compliance/jurisdictions/README.md).

## Security and maintenance

Read [SECURITY.md](SECURITY.md) for threat boundaries, reporting and deployment controls, and the [2.7.0 verification notes](docs/verification/2.7.0.md) for test evidence and remaining limits.

Controls include URL-scheme validation at the widget boundary, escaped customer text, bounded project import, cross-platform ZIP path validation, an explicit public-file allowlist, a static Content Security Policy, read-only workflow defaults and commit-pinned GitHub Actions. The repository includes regression tests, dependency audits, CodeQL and Dependabot configuration. These measures do not constitute an independent penetration test or guarantee that vulnerabilities cannot exist.

GitHub Pages publication follows a successful **main-branch browser workflow** and builds that exact tested commit. Publication also requires successful validation, dependency and CodeQL checks on that SHA. Enable repository rules to require the `validate`, `browser`, dependency and CodeQL checks before merging. Hosting response headers, branch protection, secret scanning and MFA need account/host configuration; repository files alone cannot enforce them.

## Optional developer workflows

End users do not need the tools below. Node dependencies are development-only (Playwright and axe). The Python builder/generator uses PyYAML and jsonschema and their locked transitive dependencies.

### Optional MCP — local, portable, no npm install

Open the [connection page](https://ward3107.github.io/web-compliance-prompts/connect.html): download/extract the MCP ZIP, select your editor, paste the absolute server-file path and copy the generated configuration. Four tools list templates, read a template, read a jurisdiction pack and prepare banner files as text. The server uses Node built-ins only, reads a fixed set of bundled files and has no network, shell or write operations. It runs independently of Claude, GitHub hosting or a marketplace; the client must support stdio MCP. Your AI provider may receive tool results and supplied facts.

See [MCP setup, protocol support, security and removal](mcp/README.md). End users can keep using the browser studio without Node or an AI service.

### Claude Code plugin

```text
/plugin marketplace add ward3107/web-compliance-prompts
/plugin install web-compliance@web-compliance
```

The plugin includes the local MCP server and requires Node.js 22+ for those tools. Do not add a duplicate standalone server. You can disable it in Claude Code.

Or open any file in `skills/web-compliance/templates/`, fill its placeholders and use it with an assistant. See the [skill](skills/web-compliance/SKILL.md) for composition rules.

### Reusable project profiles

```bash
python -m pip install --require-hashes -r requirements.txt
python scripts/generate.py --list
python scripts/generate.py --describe cookie-banner
python scripts/generate.py --profile project-profile.json --artifact cookie-banner --output generated/cookie-banner.md --manifest generated/cookie-banner.manifest.json
```

Start from the [synthetic example profiles](examples/profiles/). Missing facts or unsupported markets fail explicitly; `--allow-missing` produces a marked incomplete draft. `--date YYYY-MM-DD` makes generation reproducible. The manifest records source hashes, scope, conflicts and pending review. It is not a legal sign-off.

### Development and verification

```bash
python -m pip install --require-hashes -r requirements.txt
npm ci --ignore-scripts
python scripts/validate.py
python -m unittest discover -s tests -p 'test_*.py'
python scripts/build_examples.py --check
npm test
python scripts/build_site.py
npx playwright install --with-deps chromium firefox webkit
npm run test:experience
node scripts/test-builder.cjs
node scripts/test-guided.cjs
node scripts/test-documents.cjs
npm run test:browser
npm audit --audit-level=low
```

See [WordPress QA instructions](docs/GUIDED-SETUP.md#verification) for the disposable integration test. Automated accessibility checks do not replace keyboard/screen-reader review, and synthetic tracker tests do not verify a customer's production tags.

Build output is `generated/site/`; it includes the online studio, offline studio ZIP, separate MCP ZIP and checksums. Review additions to `scripts/public-files.json` when introducing public files. Unlisted local files and symlinks are excluded/rejected, so private files cannot silently enter the distribution through directory scanning.

To update Python build dependencies, edit `requirements.in`, then run `python -m piptools compile --generate-hashes --strip-extras --output-file=requirements.txt requirements.in`. Install with `--require-hashes`, run `python scripts/check_dependencies.py --installed`, audit and test the change. `requirements.txt` is the generated, hash-locked file; do not edit it by hand. CI rejects stale direct pins, missing hashes and a mismatched installed environment. Do not update legal review dates just because a code check passed. The monthly freshness workflow flags packs older than 180 days for a source re-check.

## Documentation

[Guided setup](docs/GUIDED-SETUP.md) · [Advanced builder](docs/CUSTOMIZER.md) · [Document drafts](docs/DOCUMENT-DRAFTS.md) · [Widget API](widgets/cookie-consent/README.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE). No warranty; legal review remains pending.

Dependency maintenance uses one weekly grouped version-update PR per ecosystem (Python, npm and GitHub Actions), with one open version PR per ecosystem. Security fixes are grouped separately and are not delayed by that version-update limit. All updates require passing checks and review; there is no automatic merge. Enable automatic deletion of merged branches in repository settings.
