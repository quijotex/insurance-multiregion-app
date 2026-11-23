# Implementation Plan: US-03 – Summary and payment

**Branch**: `004-us-03-summary-payment` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md) (Approved Gate 1)

**Status**: Approved (Gate 2) — 2026-11-22

**Artifacts**: [research.md](research.md) · [data-model.md](data-model.md) · [contracts/](contracts/) · [quickstart.md](quickstart.md) · [ADR 0006](../../docs/adr/0006-simulated-payment-and-receipt.md) · [ADR 0007](../../docs/adr/0007-rich-text-terms-without-html.md)

## Summary

**Strapi.**
- Country gains `termsAndConditions` (`blocks` rich text); FormField gains `maskedInSummary` (boolean).
- Seed: different fictitious terms for CO and CL; the flag on CO `documentNumber` and CL `rut`. A backfill adds both to existing databases without overwriting edits (R4, R5). No new endpoint or permission.

**Angular.**
- The summary replaces the US-02 placeholder: step 1 answers from the configured fields (masked where flagged), the chosen plan with its price (ADR 0005), "Editar mis datos" / "Cambiar plan", the country's terms in a dialog (own renderer, no HTML, ADR 0007), an acceptance checkbox and "Quiero mi seguro".
- A simulated payment in the browser (ADR 0006): processing lock, rejection with retry, and a confirmation with a quote number. After paying, only the receipt stays in the tab; guards stop a second payment.

## Technical Context

**Language/Version**: TypeScript 6, Angular 22.3 (standalone, zoneless, signals); Strapi 5.63 on Node 22
**Primary Dependencies**: none new. `Intl.DateTimeFormat` / `Intl.NumberFormat` and `crypto.getRandomValues` (browser)
**Storage**: SQLite (CMS); `sessionStorage['quote-session']` gains `termsAccepted` and `receipt`
**Testing**: Vitest (frontend and cms) for the approved UT candidates only; Playwright for the approved E2E candidates only
**Target Platform**: web, mobile-first (≥320 px) to desktop
**Project Type**: web app, with `frontend/` and `cms/`
**Performance Goals**: summary usable in under 2 s on the local stack; review, accept and pay in under 1 min (SC-005)
**Constraints**: one build for every country; no token in the browser; no personal data sent; Bootstrap for layout only (ADR 0003)
**Scale/Scope**: 2 screens (summary, confirmation); terms of ~1–2 screens of text

## Constitution Check

| Principle | Status |
|-----------|--------|
| KISS / ask before over-engineering | ✅ Pure functions for rows, mask, payment and quote number; a ~60-line renderer, no library |
| No new dependency (§3.2) | ✅ None |
| Feature-first, cohesive files | ✅ New `features/summary/`; the renderer in `shared/ui/` |
| High-value tests only | ✅ Only the UT candidates the human approves below |
| BEM, tokens only | ✅ `.summary-section`, button and states recipes from ui-ux-guidelines |
| Breaking API contract (§3.3) | ✅ Additive fields only |
| No personal data sent | ✅ Payment and quote number run in the browser (R1) |
| Security | ✅ No `innerHTML`; links limited to http(s)/mailto (R5) |
| spec/plan ≤ 150 lines | ✅ |

## Project Structure

```text
cms/src/
├── api/country/…/schema.json        # + termsAndConditions (blocks)
├── api/form-field/…/schema.json     # + maskedInSummary
└── seed/                            # countries.ts (+ terms, backfill R5), form-fields.ts (+ flag, backfill R4)
frontend/src/app/
├── core/country/                    # + termsAndConditions (mapper drops unsafe or unknown nodes)
├── core/session/quote-session.store.ts   # + termsAccepted, completePayment(receipt), readReceipt, clearReceipt (R6)
├── shared/ui/rich-text/             # RichTextComponent + model (ADR 0007)
├── features/quote-form/data/        # + maskedInSummary on the field DTO and descriptor
├── features/summary/
│   ├── summary-rows.ts · mask.ts    # R8, R4
│   ├── payment/                     # simulate-payment.ts, quote-number.ts, payment.service.ts (R1–R3)
│   ├── summary.page.*               # data, plan, terms, accept, pay, states
│   └── confirmation.page.*          # receipt, copy number, Nueva cotización
└── features/quote-wizard/           # + noReceiptGuard, receiptGuard; routes (contracts/routes.md)
```

**Structure Decision**: same layout as US-02. `features/plan-list/summary-placeholder.page.ts` is deleted; the pricing functions are reused from `features/plan-list/pricing/`.

## ADR changes

- **New:** [ADR 0006 — Simulated payment in the browser, quote number and receipt-only session](../../docs/adr/0006-simulated-payment-and-receipt.md) (Accepted, Gate 2).
- **New:** [ADR 0007 — Terms as Strapi blocks, rendered without HTML](../../docs/adr/0007-rich-text-terms-without-html.md) (Accepted, Gate 2).
- **ADR 0001 amended:** masking uses the `maskedInSummary` flag, not keys; `termsAndConditions` is `blocks`.

## Design — summary and confirmation (chosen at Gate 2, rounds 1–4)

Options shown as interactive mockups: summary A (two columns), B (one column), C (sticky pay bar); confirmation A (success card), B (receipt ticket). Chosen: **summary B mixed with A**, **confirmation B**.

- **Frame:** the US-01 navy header and the real `app-stepper` (connector lines; on mobile "Paso 3 de 3" and only the current step), `.container`, the step 1 load reveal (fade up 14 px, 600 ms, 110 ms stagger, off under reduced motion).
- **Summary heading:** "Revisa y asegúrate".
- **Layout:** from 992 px, "Tus datos" and "Tu vehículo" side by side (`col-lg-6`); below 992 px every card stacks in one column (tablet and mobile). Then "Tu plan" full width, then the acceptance and the CTA centred (max 360 px; full width on mobile), with 28 px above them.
- **Cards:** white with a 1 px `--color-border` ring, 14 px radius; title (18 px, `--color-action`) on the left and its secondary pill on the right on every screen: "Editar mis datos" (both data cards) and "Cambiar plan". Rows: label muted on the left, value on the right.
- **Plan card:** brand ring; name, short description, a divider, then the price `$ 189.000*` (`--color-brand`, 30 px) and "/ mes" below the description on every screen.
- **Acceptance:** a custom 24 px checkbox first (2 px muted ring; checked: `--color-action` fill with a white check; focus ring), then "*Acepto términos y condiciones", where "términos y condiciones" is an underlined link that opens a modal `<dialog>` with the country's terms (title, "Cerrar", "Entendido"; focus returns to the link). The `*` ties the price to the terms. No terms card.
- **CTA:** "Quiero mi seguro" (yellow pill, no price), disabled until accepted; "Procesando…" with a spinner and `aria-busy` while paying. A rejection shows the `--color-error-bg` alert above the acceptance.
- **Confirmation (B):** a receipt ticket (dashed 1.5 px border, 14 px radius, max 360 px): a green check and "Pago aprobado", rows for quote number (bold), plan, country, date and total paid, then "Nueva cotización" (yellow pill). Stepper with all steps done.

## Unit test candidates

Names follow `describe('US-03 · FR-XXX …')`.

| ID | Area | What it checks | Why it matters | Decision |
|----|------|----------------|----------------|----------|
| UT-01 | `maskValue` (4 examples) | 10-digit cédula → `••••••4050`; RUT with dots → last 4 kept; exactly 4 and fewer than 4 characters → fully masked | FR-003 privacy rule; off-by-one errors leak digits | **Approved** (Gate 2) |
| UT-02 | `buildSummaryRows` (6 examples) | Sections and configured order; select → option label; checkbox → Sí/No; date → locale format; empty optional skipped; masked flag applied | FR-001 / SC-001: the summary must match what was entered, for any country's fields | **Approved** (Gate 2) |
| UT-03 | `simulatePayment` (4 examples) | CO `1020300000` rejected; CL `10.006.000-0` rejected after normalising; other values approved; no masked field → approved | FR-008: the documented rule testers and E2E rely on | **Approved** (Gate 2) |
| UT-04 | `createQuoteNumber` | Format `CO-20261122-XXXXXX` with the allowed alphabet; 1 000 calls give 1 000 different numbers | FR-009: readable, country-prefixed and not repeating | **Approved** (Gate 2) |
| UT-05 | `quote-session.store` | `termsAccepted` kept by `saveStep1`/`savePlan`; `completePayment` keeps only the receipt; `start` and `clearReceipt` drop it | FR-011 / SC-003: the receipt-only session and no stale data | **Approved** (Gate 2) |
| UT-06 | Guards | `noReceiptGuard`: receipt → confirmation; `receiptGuard`: none or other country → summary | SC-003: back and reload never reach "Quiero mi seguro" again | **Approved** (Gate 2) |
| UT-07 | Summary page | CTA disabled until accepted; double press → one payment; rejected → alert, data and acceptance kept, retry works; approved → receipt saved and confirmation; plan not offered → plans; no terms → error and the CTA disabled | The page's critical interactions (FR-004, FR-006–FR-010) | **Approved** (Gate 2) |
| UT-08 | Rich text mapper + component | Renders headings, paragraphs, lists, bold/italic/underline, links; `javascript:` link → text; unknown and image blocks dropped; text is escaped | ADR 0007 security; editor content must never inject HTML | **Approved** (Gate 2) |
| UT-09 | CMS backfill | Flag set only on `documentNumber`/`rut` rows where `null`; terms added only when empty and published only if the draft is clean | Existing databases get the fields without losing editors' changes | **Approved** (Gate 2) |

Not proposed: confirmation rendering, field and country mapper one-liners for the new fields, static texts, the `PaymentService` delay.

## E2E candidates

| ID | Flow | Justification | Decision |
|----|------|---------------|----------|
| E2E-5 | `/co/quote`: step 1 → plan → summary shows masked cédula and the step 2 price → CTA disabled → accept → "Quiero mi seguro" → "Procesando…" → confirmation with `CO-…` number → reload keeps it → Back never shows the CTA | The full wizard and the story's core promise, only provable on the real stack | **Approved** (Gate 2) |
| E2E-6 | `/cl/quote` with RUT `10.006.000-0`: accept → "Quiero mi seguro" → error panel → data and acceptance kept → "Editar mis datos", change RUT → pay succeeds; the CL terms differ from CO | The rejection path, the retry without losing data, and per-country terms end to end | **Rejected** (Gate 2): covered by UT-03, UT-07 and quickstart 10 |

Not proposed: admin edits of terms and flags, the CMS-down state (quickstart 11–15 and unit tests cover them).

## Revisions

### 2026-11-22 — Gate 2, round 1 (not approved)
- **Asked:**
  - The mockup's buttons looked broken. Show a mobile view, and use the load animation from the other two screens.
  - The CTA becomes "Quiero mi seguro" (same yellow) with no price in it.
  - The checkbox goes first, then "*Acepto términos y condiciones", with "términos y condiciones" looking like a link. The price ends with a matching `*`.
  - Layout: option B mixed with A, so Tus datos and Tu vehículo sit side by side, Tu plan and Términos y condiciones below them, then the button.
  - The heading becomes "Revisa y asegúrate".
- **Changed:** a new mockup with fixed button styles, a desktop/mobile switch and the fade-up reveal. The summary layout is mixed as asked, on two 2-column rows from 992 px and stacked below that. The acceptance and CTA are centred below. The link scrolls to the terms card.

### 2026-11-22 — Gate 2, round 2 (not approved)
- **Asked:** delete the terms card; fix the broken mobile view; stack every card from tablet down, like option B; make the checkbox look better.
- **Changed:**
  - The terms card is gone: the "términos y condiciones" link opens the country's terms in a modal dialog with "Cerrar" and "Entendido", and focus returns to the link.
  - Two-column rows from 992 px only, one column below.
  - A custom 24 px checkbox (action fill and a white check when ticked, focus ring), like the plan radio.
  - The mockup has desktop, tablet and mobile views.

### 2026-11-22 — Gate 2, round 3 (not approved)
- **Asked:** the stepper must follow the agreed US-01 one; on every screen, the price and "/ mes" go below the description and "Cambiar plan" sits at the top right like the other "Editar" buttons; add space above the acceptance checkbox.
- **Changed:**
  - The mockup reuses the real `app-stepper` markup and styles: connector lines, and "Paso 3 de 3" with only the current step on mobile.
  - The plan card has the title row with "Cambiar plan" on the right, then the name, the description, a divider and the price.
  - 28 px above the acceptance.

### 2026-11-22 — Gate 2, round 4 (approved)
- **Asked:** remove the "Texto ficticio de ejemplo." line from the terms; approved the summary; confirmation B; approved UT-01…UT-09 and E2E-5, rejected E2E-6.
- **Changed:** the design section records the chosen summary and confirmation B (the options are summarised); the seeded terms carry no placeholder lines; Status is Approved (Gate 2); ADRs 0006 and 0007 are Accepted.
