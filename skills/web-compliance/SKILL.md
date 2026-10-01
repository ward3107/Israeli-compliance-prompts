---
name: web-compliance
description: >
  Generates filled-in, ready-to-paste AI coding prompts for website legal
  compliance in a chosen jurisdiction. Use this skill ANY TIME the user asks
  for a compliance prompt, legal page, cookie banner, accessibility widget,
  privacy policy, freelancer contract, terms of use, refund policy, disclaimer,
  e-commerce checkout, email marketing, GDPR or data-subject-rights layer, or
  client onboarding form — even casually ("give me the cookie banner", "I need
  a privacy policy prompt", "freelancer contract please"). Always ask which
  markets the site serves, then which language, then the variables, then output
  the filled prompt. Also use when the user names a law or market directly —
  Amendment 13, IS 5568, GDPR, ePrivacy, EAA, UK GDPR, PECR, CCPA, CPRA,
  CAN-SPAM, COPPA, ADA, Section 508, Global Privacy Control, PIPEDA, Law 25,
  CASL, AODA, WCAG — or asks whether a site is compliant in Israel, the EU, the
  UK, the US or Canada. Ships jurisdiction packs for Israel (Privacy Protection
  Law Amendment 13 · IS 5568), the EU/EEA (GDPR · ePrivacy · EAA / EN 301 549 ·
  WCAG 2.1 AA), the UK (UK GDPR · DPA 2018 · PECR · Equality Act), the US
  (CAN-SPAM · COPPA · ADA · Section 508 federally; CCPA/CPRA · Global Privacy
  Control for California) and Canada (PIPEDA · Québec Law 25 · CASL · Accessible
  Canada Act · AODA), plus GTM Consent Mode v2 wiring.
---

# Web Compliance — Prompt Generator

Turns a compliance artifact (cookie banner, privacy policy, accessibility
widget…) plus one or more jurisdictions into a fully filled-in prompt, ready to
paste into Cursor, Claude Code or any AI coding assistant.

The design separates two things:

- **`templates/`** — WHAT to build. Jurisdiction-neutral.
- **`jurisdictions/`** — WHICH rules apply, with citations and review dates.

You compose them. One `cookie-banner` template serves Israel, the EU and
California without being forked.

---

## ⚠️ Not legal advice

These prompts and the documents they generate are **templates for informational
purposes only** and do **not** constitute legal advice. Laws change and every
situation differs. Before publishing any policy, contract, disclaimer, or
accessibility statement produced with this skill, have it reviewed by a
qualified lawyer licensed in the relevant jurisdiction. Use at your own risk;
no warranty is provided.

All shipped jurisdiction packs are currently marked `needs_legal_review: true`
— they have not yet been signed off by a lawyer. Say so if the user seems to be
relying on them as authoritative.

---

## Workflow (follow every time)

1. **Identify the artifact** the user wants (match by name or description).
2. **Ask which markets the site serves** — this is the jurisdiction question and
   it comes FIRST, because it changes the legal requirements, not just wording.
   Offer: Israel / EU-EEA / UK / United States (ask which states) / Canada
   (ask which province) / a combination. If they name a market with no pack yet
   (Australia, Brazil, or a US state other than California), say plainly there is
   no pack, that you can still generate the artifact using the closest pack, and
   that a local lawyer must review it.
3. **Ask for the output language** — Hebrew / Arabic / English / Russian.
4. **Ask for the variables** for that artifact (see below). All at once, grouped
   naturally. Mark optional fields as (optional).
5. **Read the template** from `templates/` and the pack(s) from
   `jurisdictions/`.
6. **Compose and output** — replace every `[BRACKET]`, set `[JURISDICTIONS]` to
   the chosen markets, and fill `== LANGUAGE ==`. Fold in the requirements from
   each selected pack.
   - If two packs **conflict**, do NOT silently pick one. Apply the stricter
     rule and surface the conflict — each pack lists known conflicts under
     `conflicts:`.
   - Cite the governing law by name in the generated output, so whoever reviews
     it can check the source.

---

## Artifact Directory

| Artifact | Template |
|---|---|
| 🍪 Cookie Banner (Consent Mode v2) | `templates/cookie-banner.md` |
| 📄 Privacy Policy | `templates/privacy-policy.md` |
| ♿ Accessibility Widget | `templates/accessibility-widget.md` |
| 🌐 Full-Site Accessibility Baseline | `templates/accessibility-baseline.md` |
| 📋 Accessibility Statement | `templates/accessibility-statement.md` |
| 📜 Freelancer Contract | `templates/freelancer-contract.md` |
| 📜 Terms of Use | `templates/terms-of-use.md` |
| 💳 Refund & Cancellation Policy | `templates/refund-policy.md` |
| ⚠️ Disclaimer | `templates/disclaimer.md` |
| 🛒 E-Commerce Checkout | `templates/ecommerce-checkout.md` |
| 📧 Email Marketing | `templates/email-marketing.md` |
| 🇪🇺 Data Subject Rights layer | `templates/data-subject-rights.md` |
| 📋 Client Onboarding Questionnaire | `templates/client-onboarding.md` |

## Jurisdiction Packs

| Pack | Covers | Consent model |
|---|---|---|
| `jurisdictions/il.yaml` | Privacy Protection Law + Amendment 13, IS 5568 (WCAG 2.0 AA), accessibility, spam, contracts | opt-in |
| `jurisdictions/eu.yaml` | GDPR, ePrivacy Art. 5(3), EAA / EN 301 549 (WCAG 2.1 AA), Web Accessibility Directive | opt-in |
| `jurisdictions/uk.yaml` | UK GDPR + DPA 2018, PECR (cookies + marketing, incl. soft opt-in), Equality Act, public-sector accessibility regs | opt-in |
| `jurisdictions/us.yaml` | Federal layer only: CAN-SPAM, COPPA, ADA, Section 508 | opt-out |
| `jurisdictions/us-ca.yaml` | CCPA/CPRA, Global Privacy Control, CPPA — `extends: us` | opt-out |
| `jurisdictions/ca.yaml` | PIPEDA, Québec Law 25, BC/AB PIPA, CASL, Accessible Canada Act, AODA | opt-in |

Things to get right when several apply:

- **The cookie banner comes from ePrivacy / PECR, not the GDPR.** GDPR (and UK
  GDPR) supplies the definition of valid consent; ePrivacy Art. 5(3) in the EU
  and PECR Reg. 6 in the UK are what require prior consent before any device
  storage — localStorage and fingerprinting included, not just cookies.
- **Consent models are opposite across markets.** EU / UK / Israel are opt-in
  (consent before storage). US states are opt-out (a "Do Not Sell or Share"
  control). Geo-detect and serve each visitor their own model. Never apply the
  US opt-out model globally — that breaches ePrivacy and PECR.
- **UK diverges from the EU on cookies since the DUAA 2025.** From 5 Feb 2026,
  PECR exempts low-risk storage — first-party analytics and appearance/display
  preferences — from prior consent for UK visitors, so a UK-only site can run a
  lighter banner than an EU one. The exemption does NOT cover advertising or any
  analytics that feeds ad targeting; that still needs opt-in. Apply it per
  region, never to EU visitors, and keep consent when analytics might feed ads.
- **Honour Global Privacy Control wherever US state law applies.** It is a code
  requirement (`navigator.globalPrivacyControl`), not policy text, and it
  applies even on a site that otherwise runs an opt-in banner.
- **Email consent differs sharply.** CAN-SPAM permits sending until opt-out;
  EU / UK / Israel require prior opt-in. One list spanning them must be opt-in.
- **Build accessibility to WCAG 2.2 AA.** The statutory floors differ (IS 5568
  is 2.0 AA; the EAA and UK public-sector regs require EN 301 549 → 2.1 AA), but
  2.2 AA is a superset of 2.1 which is a superset of 2.0, so building to 2.2 AA
  satisfies every pack. 2.2 (W3C Rec, Oct 2023) is the current version; default
  to it unless a client serves Israel only and wants the minimum.
- **`us.yaml` alone is never "US compliant".** There is no general federal
  privacy law; consumer rights come from state packs. If the user names a state
  with no pack, say so plainly rather than implying coverage.

---

## Variables Per Prompt

### Cookie Banner
- Framework (HTML/CSS/JS or React)
- Website name
- Privacy policy URL
- Contact email
- Brand primary color (#HEX)
- Uses Google Analytics 4? (YES/NO)
- Uses Google Ads? (YES/NO)
- Uses Facebook/Meta Pixel? (YES/NO)
- Uses Mailchimp or email marketing? (YES/NO)
- GTM Container ID (or "not using GTM")

### Privacy Policy
- Framework
- Business/website name
- Business type (e.g. freelance web dev / e-commerce / portfolio)
- Owner full name
- Business address (street, city, Israel)
- Privacy contact email
- Website URL
- Hosting provider + country (e.g. GoDaddy / USA)
- Tools used — YES/NO for each: Google Analytics 4, Google Ads, Facebook Pixel, GTM, Mailchimp, WhatsApp Business, Contact form
- Brand primary color

### Accessibility Widget
No variables needed — the widget auto-detects brand color from the page.
Just ask for language and output the prompt as-is.

### Full Site WCAG Baseline
- Framework
- Primary language of the site (Hebrew / Arabic / English / Russian)
- Main colors: background #HEX / text #HEX / links #HEX / buttons #HEX

### Accessibility Statement
- Framework
- Website name
- Business owner / coordinator name
- Coordinator email
- Coordinator phone (optional)
- Website URL
- Last accessibility review date
- Brand primary color

### Freelancer Contract
- Contractor full name (the freelancer's name)
- Contractor address
- Tax ID / ת.ז
- Contractor business type (עוסק פטור or עוסק מורשה)
- Client business name
- Client address
- Client tax ID
- Client contact person (name + title)
- Project description (what website/app)
- Estimated delivery (weeks)
- Number of revision rounds included
- Total fee (₪)
- Payment method (Bank transfer / Bit / PayPal)
- Start date (or "within 5 days of deposit")
- Your city (for jurisdiction clause)
- Hourly rate for additional work (₪/hour)

### Terms of Use
- Framework
- Business/website name
- Business type
- Owner full name
- Business address
- Contact email
- Website URL
- Brand primary color
- Sells products or services? (YES/NO)
- Allows user accounts/registration? (YES/NO)
- Allows user-generated content? (YES/NO)

### Refund & Cancellation Policy
- Framework
- Business/website name
- Business type (freelance services / digital products / physical goods / SaaS)
- Owner full name
- Contact email
- Website URL
- Brand primary color
- Physical goods? (YES/NO)
- Digital downloads? (YES/NO)
- Software/SaaS subscriptions? (YES/NO)
- Freelance/service-based work? (YES/NO)

### Disclaimer
- Framework
- Business/website name
- Owner full name
- Contact email
- Brand primary color
- General information/blog content? (YES/NO)
- Health or medical content? (YES/NO)
- Legal information? (YES/NO)
- Financial or investment content? (YES/NO)
- Coaching / personal development? (YES/NO)
- Affiliate links or sponsored content? (YES/NO)
- AI-generated content on site? (YES/NO)

### E-Commerce Compliance
- Framework
- Shop name
- Products sold (physical / digital / services / subscriptions)
- Payment processor (Stripe / PayPlus / CardCom / Tranzila / other)
- Brand primary color
- Contact email

### Email Marketing
- Framework
- Email platform (Mailchimp / ActiveCampaign / Sendinblue / other)
- Website name
- Contact email
- Brand primary color
- Newsletter? (YES/NO)
- Promotional offers? (YES/NO)
- Product updates? (YES/NO)
- Has EU subscribers? (YES/NO)

### GDPR Notice Layer
- Framework
- Website name
- Shows EU prices or EU-language content? (YES/NO)
- Ships to EU? (YES/NO)
- Privacy contact email
- Brand primary color
- Existing privacy policy URL
- Cookie banner already built (Prompt 1 done)? (YES/NO)

### Client Onboarding Questionnaire
- Your name
- Your email
- Your website URL
- Brand color for the form (#HEX)

---

## Output Format

After collecting all answers, output the filled prompt like this:

```
---
## 🍪 Cookie Banner Prompt — Ready to paste into Cursor AI

[full filled prompt text here]

---
✅ Verification Checklist:
[checklist from the reference file]
```

Always include the verification checklist at the end so the user can check the output.
