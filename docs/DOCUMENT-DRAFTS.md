# Editable document drafts

The last step of `start.html` offers deterministic Hebrew drafts for projects whose target market is exactly `il`. It produces text documents, not AI prompts: privacy policy, terms of use and a cancellation/refund policy. An explicit no-sales answer omits the refund document; unknown sales remain unresolved. Banner language does not translate or expand the legal scope of these Hebrew drafts.

## Facts and review

The optional details form collects business identity, data flows, purposes, recipients, countries, retention, actual security, account/content rules and transaction-specific fulfillment/cancellation information. Blank values become named completion markers. No retention period, supplier country, transfer safeguard, security measure, universal cancellation deadline, liability cap or lawyer approval is invented. Some clauses deliberately remain review instructions until a professional establishes their applicability.

The engine uses its own conservative draft text, not the older prompt templates' hardcoded assertions. References for the review checklist include the [Privacy Protection Authority's notification guidance](https://www.gov.il/BlobFolder/legalinfo/duty_to_notify/he/notify13.pdf) and a [government consumer guide](https://www.gov.il/BlobFolder/generalpage/information-olim-consumerism/he/smart-consumerism-he.pdf). They are reference material, not a complete or lawyer-reviewed statement of applicable law. Existing jurisdiction packs remain unsigned. Contract terms, transaction-specific rights and special cases require qualified review; the application never marks a document approved.

## Editing and export

- Editors accept bounded plain text; generated HTML escapes all user text and retains an unreviewed notice outside the editable content.
- HTML files can be opened and printed or saved as PDF through the browser. TXT files permit further editing. No PDF binary is generated automatically.
- A manifest records generator version, source facts, current facts, missing answers, review topics, references and a fixed `unreviewed` status. Manual edits may differ from answers; filling a field is not verification.
- Changing business facts preserves edits and disables standalone export until the user explicitly regenerates. Regeneration asks before replacing documents. The lawyer packet can carry stale drafts with an explicit manifest/README warning.
- Switching away from Israel disables generation/export and omits document content from the lawyer packet, including its project JSON. A separately saved project retains old work so the customer can return to it.
- Guided project JSON includes document state, with a bounded 600KB import and explicit validation. Older projects without document state still load. Private documents and extra business details are never included in the public installable plugin.

## Verification

`node --test tests/documents.test.cjs` checks scope, missing facts, no-sales behavior, escaping and maximum field sizes. After `python scripts/build_site.py`, run `node scripts/test-documents.cjs` to test the actual UI/downloads in Chromium, Firefox and WebKit: edit/resume, ZIP integrity, stale and unsupported-market gates, regeneration cancellation, private-data separation, accessibility and mobile overflow. CI runs both suites alongside existing consent/customizer and WordPress installation checks.

The generator does not scan websites, publish policy pages, certify compliance, sign documents or submit them to a lawyer. Professional review and installation remain separate steps.
