# Jurisdiction packs

To inspect all source templates before installation, use the [browser catalog](https://ward3107.github.io/web-compliance-prompts/explore.html#catalog). End users do not need Python or a CLI; pack contribution/validation is a developer workflow described in the [main README](../../../README.md#development-and-verification). All packs remain pending legal review.

Coding assistants can read a bundled pack using the optional [MCP server](../../../mcp/README.md) and its `get_jurisdiction` tool. That returns the source YAML and review status; it does not refresh sources, certify legal accuracy or broaden template scope. The browser flow and MCP retain the same unreviewed legal boundaries.

Each `<code>.yaml` file describes **which laws apply in one jurisdiction** —
separately from the `templates/`, which describe **what to build**. The skill
composes them: `template × jurisdiction(s) → filled prompt`.

This split is what lets one `cookie-banner` template serve Israel, the EU and
California without forking it three times.

## Adding a pack

Copy the shape of `eu.yaml`. Required top-level keys:

| Key | Meaning |
|---|---|
| `jurisdiction` | Short code (`il`, `eu`, `us-ca`, `uk`) |
| `name` | Human-readable name |
| `last_reviewed` | ISO date the legal content was last checked |
| `needs_legal_review` | `true` until a qualified lawyer has signed off |
| `frameworks` | List of statutes/standards (see below) |
| `consent_model` | `opt_in` or `opt_out` — drives banner behaviour |
| `rtl` | Whether the primary language is right-to-left |

Each entry in `frameworks` needs at minimum a `name`, what it `governs`, and a
**`citation`** — a URL to the actual statute or standard.

## Rules

1. **No requirement without a citation.** If you cannot link the source, do not
   ship the requirement.
2. **Mark what you have not verified.** Use `verified: false` and, where the
   doubt is specific, a `needs_verification:` note explaining exactly what to
   check. An honest "unverified" is far better than a confident wrong citation.
3. **Date everything.** `last_reviewed` older than 12 months should be treated
   as stale — `scripts/validate.py` warns about this, and a scheduled
   `freshness` workflow runs monthly with `--strict-stale 180`: a pack not
   re-checked within ~6 months fails that run and opens a tracking issue, so a
   re-check becomes a visible task rather than a warning nobody reads.
4. **Record conflicts.** When one jurisdiction's rule contradicts another's,
   add a `conflicts:` entry. Multi-market sites depend on these being surfaced
   rather than silently resolved.
5. **Never widen scope silently.** Adding a jurisdiction means someone will
   ship a site trusting it. Depth beats breadth.

## Status

| Pack | Coverage | Consent | Legal review |
|---|---|---|---|
| `il.yaml` | PPL + Amendment 13, IS 5568, accessibility, spam, contracts | opt-in | ❌ Not yet reviewed |
| `eu.yaml` | GDPR, ePrivacy, EAA / EN 301 549, Web Accessibility Directive | opt-in | ❌ Not yet reviewed |
| `uk.yaml` | UK GDPR, DPA 2018, PECR, Equality Act, PSBAP Regs | opt-in | ❌ Not yet reviewed |
| `us.yaml` | Federal only: CAN-SPAM, COPPA, ADA, Section 508 | opt-out | ❌ Not yet reviewed |
| `us-ca.yaml` | CCPA/CPRA, Global Privacy Control (`extends: us`) | opt-out | ❌ Not yet reviewed |
| `ca.yaml` | PIPEDA, Québec Law 25, BC/AB PIPA, CASL, Accessible Canada Act, AODA | opt-in | ❌ Not yet reviewed |

Planned next: more US states, Brazil (LGPD).

## `extends`

A pack may set `extends: <code>` to layer on top of another — `us-ca.yaml`
extends `us.yaml`, so California loads the federal layer too. `validate.py`
fails if `extends:` or any `conflicts: - with:` names a pack that does not
exist, so a typo cannot silently drop a jurisdiction.

> These packs are structured references, not legal advice. Every pack must be
> reviewed by a lawyer qualified in that jurisdiction before it is relied on.

## Schema and review provenance

Install dependencies with `python -m pip install -r requirements.txt` before
running validation. `schemas/jurisdiction.schema.json` defines the supported
pack shape. Each framework needs its own ID, name, governs list, HTTP(S) source
citation and boolean verification status. Duplicate YAML keys and framework IDs,
invalid dates, unknown fields, missing references and inheritance cycles fail.

`last_reviewed` retains the existing source-content review date; it is not legal
sign-off. Optional `sources_checked_on` records a source check separately.
Changing `needs_legal_review` to false requires an identified `reviewed_by` and
an ISO `legal_reviewed_on` date. Do not advance any review date simply because
structural validation or browser tests pass.
