# Security policy

## Scope and supported version

Security fixes target the latest `main` revision and current 2.6.x distributions. Update existing self-hosted assets after reviewing fixes; an offline copy does not update itself. Zero runtime dependencies reduces supply-chain exposure, but does not make custom code invulnerable.

The trust boundaries are the public browser studio, user-supplied project files, exported ZIP/HTML/JavaScript, the standalone consent widget, the optional WordPress adapter, and the build/publication pipeline. No credential store, payment processing, user accounts or server-side business-data collection is implemented.

## Reporting

Use [GitHub private vulnerability reporting](https://github.com/ward3107/web-compliance-prompts/security/advisories/new) **if enabled**. Otherwise contact the maintainer through a private channel listed on the [maintainer profile](https://github.com/ward3107); a public issue may request a private reporting channel but must not disclose exploit details, secrets or customer data. No response-time SLA or external security certification is claimed.

Include the affected commit/version, a minimal reproduction with synthetic data, browser/platform and impact. Do not scan or attack customer websites without permission.

## Controls implemented in this repository

- Plain HTML/CSS/JavaScript for the studio, ZIP writer and widget; no CDN or runtime package installation. WordPress is an optional adapter. Python/Node packages are build/test tools only.
- HTML escaping or DOM `textContent` for user-controlled content. Policy links are restricted to HTTP(S) or safe relative links at the widget sink; executable schemes, credentials, backslashes and control characters are rejected.
- Imported project JSON has size, type, enum and field limits. Data is never evaluated as code. Preview messages validate sender window, origin, shape and stylesheet bounds. Local `file:` previews use a wildcard target origin only because file origins are opaque; receiver window identity and the browser's opaque file origin (`null` or `file://`) are checked.
- Generated packages default to opt-in even for a US-targeting business. Saved consent is validated, region-scoped and bounded. GPC overrides marketing consent. This is not a defense against other malicious JavaScript already running on the customer's origin.
- ZIP paths reject POSIX/Windows traversal, drive paths, control characters, duplicate case aliases and reserved device names. Archive entry/file/aggregate size limits apply.
- Public builds read a reviewed allowlist (`scripts/public-files.json`) rather than recursively including local files. Unlisted pack/template inputs and unexpected existing output files fail the build before publication. Symlinks cannot redirect publication reads or existing output writes. The portable ZIP includes only known public site assets; customer exports remain separate.
- Built site pages have a meta Content Security Policy: no inline/eval scripts, no external script/connect/frame resources, no object embeds, base URL changes or form submission. The portable build permits `file:` preview frames (never network frames). Inline styles remain allowed for the design editor; CSP is defense in depth, not sanitization.
- WordPress settings use the Settings API, its nonce protection and `manage_options`. There are no custom public write endpoints, uploaded executable templates or remote script downloads. The host WordPress/PHP installation and other plugins are outside this review.
- GitHub workflows have scoped permissions, timeouts, commit-pinned actions and checkout credentials disabled. npm uses the lockfile and `--ignore-scripts`; Python build dependencies have a hash-locked transitive set. CodeQL (JavaScript/Python), dependency audits and Dependabot updates supplement regression tests.
- Pages publishes only after the main-branch browser workflow succeeds, and checks out its exact tested SHA. Do not run untrusted PR code with production credentials. Publication additionally waits for the validation, dependency and CodeQL checks and refuses stale main commits. Make these required merge checks through repository settings too.

## Owner and hosting controls

Configure branch protection/rulesets, required checks, private vulnerability reporting, secret scanning/push protection where available, and MFA for maintainers. These settings are not proven enabled by the existence of workflow files.

GitHub Pages meta CSP **cannot** enforce `frame-ancestors`, HSTS, `X-Content-Type-Options` or `Permissions-Policy` response headers. On a host supporting headers, serve HTTPS and configure these explicitly; use `frame-ancestors 'self'` to allow the studio's own preview frames. Set appropriate MIME types and review the complete CSP against your site's scripts. Never overwrite the whole customer's CSP just to accommodate this widget. Sources: [MDN CSP guidance](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSP), [meta limitation for frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

Restrict production admin access, keep PHP/WordPress updated and isolate development credentials. WordPress nonces are not authorization: [WordPress security guidance](https://developer.wordpress.org/apis/security/nonces/). Action pinning reduces mutable-tag risk but still requires review and updates: [GitHub secure-use guidance](https://docs.github.com/en/actions/reference/security/secure-use).

## Material residual risks

- Same-origin scripts, extensions, a compromised host or a compromised release can read/alter page data and consent. The toolkit does not prevent this.
- Existing trackers are not automatically blocked. Integrate and verify real network requests before consent, after rejection, after withdrawal and with GPC. The generated footer/deferred installer cannot retroactively stop scripts executed earlier.
- Offline project/review files are not encrypted; protect them as business data. Never upload the full advanced export or legal packet to public hosting.
- SHA-256 alongside the download detects mismatched/corrupt bytes, not a coordinated host compromise. There is no independent signature or reproducible-build attestation.
- Static analysis, dependency scans and automated browser tests are not a full penetration test, manual accessibility certification or legal review. Unreviewed jurisdiction packs remain unreviewed.
