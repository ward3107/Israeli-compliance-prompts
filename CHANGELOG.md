# Changelog

## 2.1.0 — 2026-10-02

- Enforce GPC on restored marketing consent and make Do Not Sell or Share disable marketing directly.
- Make the UK analytics exemption explicitly opt-in in configuration.
- Reject invalid and region-mismatched saved choices; send denied defaults to existing integrations.
- Preserve in-memory settings when storage is unavailable, prefer the page language, and allow escaped, localized descriptions of the actual tracking tools.
- Keep preferences usable in short mobile viewports and improve switch hit areas.
- Validate jurisdiction packs with safe YAML parsing and JSON Schema, including per-framework citations, duplicate keys/IDs, dates, references, inheritance and legal-review provenance.
- Add a profile-based prompt composer with source hashes, inherited packs, conflicts, missing-field errors and explicit legacy drafting scope limits.
- Add synthetic example profiles and reproducible prompts, Hebrew quick start, static live demo and automated Pages publishing.
- Add Node, Python and three-engine browser CI with accessibility checks and synthetic tracker assertions.
- Correct the old Israeli email-marketing law reference and remove the unsupported ten-business-day assertion.

Integration changes: opt-in initialization now calls onChange with denied consent; the UK exemption is disabled by default; source-validation scripts require requirements.txt dependencies. Translation does not expand the legal scope of legacy document templates. Legal review remains pending for all shipped packs.

## 2.2.0

- Client customizer with Hebrew UI, live isolated preview, responsive layouts, presets, colors, contrast guard, font, radius and placement.
- Local ZIP export with themed runnable banner, profile, scope-gated drafts, inherited sources, conflicts and complete toolkit source.
- Required business facts and explicit tracking-tool selections; no business details uploaded.
- Cross-browser download/extraction/runtime/regeneration tests and separate preview consent storage.

## 2.3.0

- Guided four-step client setup with unknown answers, validation and save/resume.
- Uploadable WordPress plugin with private review data excluded, administrator controls and persistent cookie preferences.
- Printable legal-review packet and lawyer guidance throughout delivery; partner and pricing remain unconfigured.
- Real WordPress upload/activation tests plus three-engine guided-flow/download tests.
