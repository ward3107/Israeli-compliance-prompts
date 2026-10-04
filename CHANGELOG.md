# Changelog

## 2.7.0 — Guided experience and local MCP

- The homepage now opens the working preview. Added a shared responsive design, compact theme/language controls, a persistent next step and progressive detail sections. Kept the regional developer demo at `demo.html`.
- Simplified the four-step wizard with explicit next actions, contextual help, an unknown platform default and a direct way to fix incomplete installation details. Downloading and installing are explained separately.
- Added an optional Node built-ins-only stdio MCP server with four read-only tools, a portable downloadable ZIP, Claude Code plugin integration and a browser configuration generator for compatible editors. No network, workspace writes or shell commands are exposed.
- Browser and MCP exports share the installer generator. Added protocol, malicious-input, packaged-server and configuration-download checks; both ZIPs have SHA-256 checksums.
- Updated every README, setup guidance and security boundaries. Normal customer use remains browser-only with zero third-party runtime dependencies.


## Unreleased — dependency maintenance

- Consolidated the nine initial dependency proposals, retaining immutable GitHub Action pins.
- Migrated Python inputs/lock to the standard requirements.in/requirements.txt layout so Dependabot updates hashes and versions together.
- Added fail-closed lock and installed-version checks, including stale-lock regression coverage.
- Grouped weekly version updates and security updates per ecosystem; limited regular update PRs to one per ecosystem.
- Added a pre-merge Pages packaging smoke test. Runtime dependencies remain zero.

## 2.6.0 — Preview first, portable installation and security hardening

- Added a complete no-details preview: 12 designs, four banner languages, mobile/desktop preview, three sample documents and all 13 template sources.
- Added a double-clickable offline studio and SHA-256 checksum; no runtime dependencies, CDN, account or local server.
- Added a universal four-file installer, copyable embed instructions, offline banner preview and automatic preferences button. Retained the WordPress adapter.
- Fixed executable policy URLs in the widget, inherited translation names, advanced-builder market-based opt-out defaults and custom storage fallback.
- Hardened ZIP paths/limits, preview messages, public distribution allowlisting, CSP and CI permissions/action pins. Added dependency audits, CodeQL and Dependabot configuration; Pages follows a successful main browser run.
- Reworked English/Hebrew READMEs and installation/security documentation. Legal-review status and legal source dates were not advanced.


## 2.5.0

- Add browser-local, editable Hebrew privacy, terms and refund drafts for Israel-only projects.
- Preserve unknown facts; omit refunds when no sales are declared; avoid invented retention periods, blanket cancellation terms or legal approvals.
- Export print-ready HTML/TXT and a review manifest, include drafts in lawyer packets, keep them out of installable plugins.
- Save/resume edits, detect changed facts, confirm destructive regeneration and gate unsupported markets.
- Add pure-engine and three-browser document-flow verification to CI.


## 2.4.0

- Add a shared 12-preset gallery and guided color, radius and font controls.
- Add per-language banner/action copy editing, reset, button shape/size and text-size controls to both download flows.
- Preserve customization in exported runtime and saved guided projects, with legacy project support and contrast checks.
- Explain all 13 toolkit templates and distinguish installed components from implementation prompts.
- Verify plain-text escaping, presets, sizing, saved-state compatibility and browser regressions.


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
