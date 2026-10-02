# Guided client setup

The [guided flow](https://ward3107.github.io/web-compliance-prompts/start.html) is the entry point for clients who do not work with source code. The advanced customizer remains available.

## Delivered scope

- Four steps: site details, business questions, banner design, installation and legal review.
- Unknown answers remain unknown in the review packet. A missing privacy-policy URL or unknown target market prevents installation export, while still allowing a legal-review packet.
- The WordPress download contains a real uploadable plugin with canonical consent code, selected styles, a persistent preferences button, an administrator-only enable/disable setting and legal-review guidance. Other platforms receive a package for an installer.
- Business answers and the private contact email are excluded from the installable plugin. They are only included in the separate, explicitly downloaded project and lawyer packet.
- The review packet includes a printable Hebrew HTML summary, open questions, proposed review topics, source packs and the project file. It is never sent automatically.
- Save/resume uses a versioned JSON file with bounded, explicit field validation. No account or server storage is required.
- Legal review is visible in navigation, final delivery, exported instructions and WordPress administration. No lawyer, quote, appointment or signature is invented.

## Material limits

This version does not scan an entered URL, inspect a client's production trackers, generate finalized legal policies, sell a subscription, book a lawyer or assert that installation happened. Status labels remain pending for production and legal checks. All visitor consent starts in opt-in mode because a business's target markets do not establish each visitor's location. Existing trackers must be integrated separately using `compliance:consent`.

No automatic policy pages are created in WordPress. The uploadable ZIP uses the normal [WordPress installation flow](https://wordpress.org/documentation/article/manage-plugins/), [front-end enqueue hook](https://developer.wordpress.org/reference/functions/wp_enqueue_scripts/) and [Settings API](https://developer.wordpress.org/plugins/settings/settings-api/) for nonce-protected administrator settings. Deactivation removes this plugin's scripts, styles and preferences control from the front end; it does not alter other plugins or user content.

## Verification

Build with `python scripts/build_site.py`, then run `node scripts/test-guided.cjs` for Chromium, Firefox and WebKit. It tests step validation, unknown answers, blocked incomplete exports, unsafe URLs, actual ZIP downloads and CRCs, HTML escaping, privacy of plugin contents, save/resume, malformed imports, accessibility and mobile overflow. Reports are under `test-results/`.

For an actual WordPress installation test, use the disposable Compose project only:

```sh
docker compose -p wct-guided-qa -f tests/wordpress.compose.yml up -d --wait
docker compose -p wct-guided-qa -f tests/wordpress.compose.yml exec -T wordpress php /qa/install.php
node scripts/test-wordpress.cjs
docker compose -p wct-guided-qa -f tests/wordpress.compose.yml down --volumes
```

The QA site is bound to `127.0.0.1:8766`; its database and site files are ephemeral. The test uploads the ZIP produced by the guided browser test, activates it through WordPress, verifies actual front-end controls/theme, settings, deactivation of assets and anonymous access restrictions. Do not reuse these synthetic QA credentials or this Compose configuration for hosting.

## Commercial next steps

Current self-service access has no charge. Prices and checkout are deliberately absent until the offer and costs are approved. A sensible pilot separates the software/installation service from optional professional legal work, with the inclusions, exclusions, support and update period stated before purchase. Establish support cost and partner lawyer terms before claiming any price advantage; no market-lowest price has been researched or promised.

Future work is production scanning and supported tracker integrations, additional platform installers, and a consent-based lawyer referral/booking flow once a partner is engaged. Account storage, billing, automated monitoring and partner details require their own implementation and verification. None of these are represented as currently active.
