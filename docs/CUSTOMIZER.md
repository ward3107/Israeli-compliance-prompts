# Advanced client customizer

For a first visit, use [the no-install preview](https://ward3107.github.io/web-compliance-prompts/explore.html) and [guided installation](GUIDED-SETUP.md). The advanced ZIP contains private project details and all source files: upload only runtime assets. Both guided and advanced installation exports now use `region: auto` (opt-in); chosen business markets never establish visitor location.

The browser runtime has no third-party libraries. The portable studio supports this builder without a server; its catalog is embedded at build time.

Open [the builder](https://ward3107.github.io/web-compliance-prompts/builder.html) to theme the runnable cookie banner and export a project package. No account, backend or external assets are required. Project facts remain in browser memory until downloaded; the preview stores only its own consent choice in `cc_customizer_preview`.

Supported controls: three presets, button/background/text colors, contrast validation (4.5 minimum for text), font family, radius, top/bottom/corner placement, mobile preview, four output languages, six market packs and the Israel/EU overlay. The primary button text automatically uses black or white for contrast. Multiple markets use conservative opt-in without claiming automatic location detection. UK exemptions remain disabled.

The selected artifact list follows the generator's current scope gates. Required fields are derived from the canonical templates. No flag is assumed to be YES or NO: the client must choose the actual tool usage. Unsupported drafts are disabled and cannot remain selected after a market change. All thirteen original templates are still included as source material, alongside their packs and scope-enforcing generator.

The ZIP contains:

- `cookie-consent.js`, `cookie-consent.css`, `theme.css`, `install.js` and `demo.html` for the runnable banner.
- `project-profile.json`, `consent-config.json` and `manifest.json` for reuse and review.
- `drafts/` with the selected filled implementation prompts, inherited packs, primary sources and conflicts.
- `toolkit/` with the original skill, templates, packs, widget, schemas, Python generator, tests, examples, source site and MIT license.
- `START-HERE.md` with installation and integration instructions, including React/Next.js guidance.

Load canonical CSS first and theme CSS second. Installation emits a `compliance:consent` custom event and loads no trackers. Consumers must implement real tracking gates, withdrawal handling and reliable regional selection. Accessibility prompts and legal drafts require implementation and qualified review; they are not additional installed widgets or finalized policies. The toolkit is web source, not a Chrome extension or a native mobile SDK.

## Development verification

Run `python scripts/build_site.py`, then `node scripts/test-builder.cjs` after installing Python requirements, npm dependencies and Playwright browsers. The test downloads a real ZIP in Chromium, Firefox and WebKit; Python's standard `zipfile` checks every CRC, extracts it and the bundled generator regenerates a prompt. Tests also execute the extracted widget, check scope changes, isolated preview consent, Arabic output, automated accessibility and a 360px viewport. CI runs this in addition to existing consent and generator checks.
