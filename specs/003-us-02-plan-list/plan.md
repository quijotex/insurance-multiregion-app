# Implementation Plan: US-02 – Plan list

**Branch**: `003-us-02-plan-list` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md) (Approved Gate 1)

**Status**: Draft (Gate 2 pending; design approved)

**Artifacts**: [research.md](research.md) · [data-model.md](data-model.md) · [contracts/](contracts/) · [quickstart.md](quickstart.md) · [ADR 0005](../../docs/adr/0005-simulated-price-rule-age-bands.md)

## Summary

**Strapi.**
- New `Plan` collection (draft & publish) with `plan.item` coverages and benefits. Public gets only `find`, which returns published plans only.
- Country gains `currency`, `numberLocale`, `driverAgeBands` and `vehicleAgeBands`.
- The US-01 save check also rejects a plan with no country.
- The seed adds 3 CO + 3 CL plans and 1 inactive one. A backfill fills the new Country fields on existing databases.

**Angular.**
- Step 2 replaces its placeholder with the plan list: simulated prices (ADR 0005) in the country's currency, a recommended badge, a radio choice saved to the tab session, and loading, empty and error states.
- The step 1 guard also re-checks the saved values (R-19).
- "Continuar" opens a summary placeholder with "Volver".

## Technical Context

**Language/Version**: TypeScript 6, Angular 22.3 (standalone, zoneless, signals); Strapi 5.63 on Node 22
**Primary Dependencies**: **new (approved by the human at Gate 2):** `swiper` (frontend, the latest stable major) for the plan slider (R13). `Intl.NumberFormat` (browser) formats the currency (R4).
**Storage**: SQLite (CMS); `sessionStorage['quote-session']` gains `planId`
**Testing**: Vitest (frontend and cms) for the approved UT candidates only; Playwright for the approved E2E candidates only
**Target Platform**: web, mobile-first (≥320 px) to desktop
**Project Type**: web app, with `frontend/` and `cms/`
**Performance Goals**: step 2 usable in under 2 s on the local stack; choosing a plan takes under 1 min (SC-003)
**Constraints**: one build for every country; no token in the browser; only `/api` and `/uploads` are proxied; Bootstrap for layout only (ADR 0003)
**Scale/Scope**: 3–5 plans per country; 2 screens (the plan list and the summary placeholder)

## Constitution Check

| Principle | Status |
|-----------|--------|
| KISS / ask before over-engineering | ✅ A pure price function, no rule engine (ADR 0005); fixed badge text (R11) |
| No new dependency (§3.2) | ✅ Only `swiper`, requested and approved by the human at Gate 2 |
| Feature-first, cohesive files | ✅ New `features/plan-list/` (page, card, data, pricing) |
| High-value tests only | ✅ Only the UT candidates the human approves below |
| BEM, tokens only | ✅ The `.plan-card` recipe from ui-ux-guidelines |
| Breaking API contract (§3.3) | ✅ Additive: a new endpoint and new Country fields |
| No personal data sent | ✅ The price is calculated in the browser (R1) |
| spec/plan ≤ 150 lines | ✅ |

Re-check after design: ✅ no violations, so Complexity Tracking is not needed.

## Project Structure

```text
cms/src/
├── api/plan/                       # schema.json, controller (published only, R7), routes, services
├── api/country/…/schema.json       # + currency, numberLocale, driverAgeBands, vehicleAgeBands
├── components/plan/item.json       # { text }
├── components/pricing/age-band.json  # { fromAge, toAge, factor }
├── middlewares/country-integrity.ts  # was form-field-integrity.ts: FormField (country + key) and Plan (country) (R6)
├── seed/plans.ts                   # 3 CO + 3 CL + 1 inactive (FR-014)
├── seed/countries.ts               # + currency, locale, bands, and their backfill (R5)
└── seed/permissions.ts             # + Public plan.find
frontend/src/app/
├── core/country/                   # model and mapper: + currency, numberLocale, bands
├── core/session/quote-session.store.ts   # + savePlan / readPlanId / clearPlan (R9)
├── features/plan-list/
│   ├── data/                       # plan.model.ts, plan.mapper.ts, plan.service.ts
│   ├── pricing/                    # simulate-price.ts, ages-from-step1.ts, format-price.ts
│   ├── components/plan-card/       # one radio card: badge, name, price, coverages, benefits
│   ├── plan-list.page.*            # states, radio group, Continuar, restore the choice
│   └── summary-placeholder.page.ts # FR-012
└── features/quote-wizard/          # step1CompleteGuard: async re-check (R8); + planChosenGuard; 'summary' route
```

**Structure Decision**: the same layout as US-01. The step 2 placeholder is deleted.

## ADR changes

- **New:** [ADR 0005 — Simulated price rule with age bands on Country](../../docs/adr/0005-simulated-price-rule-age-bands.md) (Proposed; Accepted with this Gate 2).
- **ADR 0001 amended:** the Plan save check is implemented; the Plan `find` returns published plans only; coverages and benefits use `plan.item`; Country gains `currency`, `numberLocale` and the age bands.

## Design options — plan list (`/:country/quote/plans`)

All options use the navy header and stepper, a `.container`, the `.plan-card` recipe as a native radio group, and "Volver" / "Continuar". Interactive mockups were shown at Gate 2.

- **Option A — Card grid (recommended):** `col-12 col-md-6 col-lg-4`; each card has the badge, name, description, the price with " / mes", Coberturas and Beneficios; the buttons sit below. *Pros:* easy side-by-side comparison; it matches the recipe. *Cons:* long cards on mobile.
- **Option B — Compact list:** one row per plan, with the price and radio on the right and the lists behind "Ver coberturas y beneficios". *Pros:* short on mobile. *Cons:* comparing needs extra clicks.
- **Option C — Grid with a sticky bar** showing the chosen plan, its price and "Continuar". *Pros:* the CTA is always in reach. *Cons:* the bar covers content at 320 px.

**Recommendation:** A. It is the simplest, follows the recipe, and has one keyboard path.

**Chosen (Gate 2, rounds 1–3): option A, refined with the human:**
- **Frame:** the US-01 navy header (Asegura+), the numbered stepper (S3: the done step shows a check, "Elige tu plan" is current; on mobile only the current circle and "Paso 2 de 3 · Elige tu plan"), and no help text about the price.
- **Cards (S1):** white with a 1 px `--color-border` ring, 14 px radius, no top stripe.
  - The recommended plan gets a 5 px `--color-brand` top border, a 1 px brand ring, and a yellow "Recomendado" pill with a star, sitting on the top border.
- **Aligned rows:** the cards share one CSS subgrid, so the name and description, the price (after a divider), Coberturas and Beneficios start on the same line in every card.
- **Selection without layout shift:** a custom radio circle (it fills `--color-action` with a white check) plus a 2 px inset `--color-action` ring. There is no "Seleccionado" text, and nothing changes size.
- **Layout:** a 3-column grid from 992 px. Below that, a Swiper slider (about 1.2 cards on mobile, 2.2 on tablet) with previous/next arrows and dots, opening on the recommended plan. No loop and no autoplay: the cards only fade up once on load, as in step 1 (off under `prefers-reduced-motion`). Choosing a plan with the arrow keys slides to it.
- **Buttons:** "Volver" (outlined secondary) and "Continuar" (the yellow pill), which is disabled (`--color-disabled-bg` / `--color-disabled-text`) until a plan is chosen, with no hint text.

**Summary placeholder:** the US-01 placeholder card with the stepper on "Resumen", the text "El resumen llega con US-03." and "Volver". There are no options: it is temporary.

## Unit test candidates

Each candidate needs the human's Approved or Rejected at Gate 2. Names follow `describe('US-02 · FR-XXX …')`.

| ID | Area | What it checks | Why it matters | Decision |
|----|------|----------------|----------------|----------|
| UT-01 | `simulatePrice` (8 examples) | Band edges 24/25 and 65/66 (driver) and 5/6 and 10/11 (vehicle); no band and unknown age → factor 1; overlapping bands → the first wins; rounding to a whole peso | The core business rule; SC-002 requires 100% of prices to match it, and edge errors are silent | Pending |
| UT-02 | `agesFromStep1` (4 examples) | Birthday today vs tomorrow; the vehicle age from `vehicleYear`, never below 0; a missing or invalid value → null | A wrong age silently changes every price | Pending |
| UT-03 | `formatPrice` (2 examples) | CO `es-CO`/COP and CL `es-CL`/CLP with no decimals and " / mes" | FR-004 forces 0 decimals; COP shows 2 by default, an easy regression | Pending |
| UT-04 | `plan.mapper` | Only the first recommended plan is highlighted; empty coverages or benefits → []; a bad `basePrice` drops the plan | Edge cases the CMS can produce; a wrong badge misleads the person | Pending |
| UT-05 | Country mapper (bands) | Maps `currency`, locale and bands; drops an invalid band (from > to, factor ≤ 0); missing bands → [] | Bad CMS data must not crash pricing or produce absurd prices | Pending |
| UT-06 | `quote-session.store` | Saves and reads `planId`; `saveStep1` keeps it; `discardData` and a country change drop it | FR-009 / SC-004 persistence, plus the "step 1 edited" edge case | Pending |
| UT-07 | Guards | `step1CompleteGuard`: valid values pass; values invalid against the current fields → step 1 with `step1Completed` cleared; fields fail to load → step 1. `planChosenGuard`: no plan → plans | FR-011 / R-19: invalid data must never reach plans or the summary | Pending |
| UT-08 | Plan list page | Restores the choice, or drops it when the plan is not offered; Continuar disabled until a choice, then → summary; empty and error states with retry | The page's critical interactions (FR-007–FR-010) | Pending |
| UT-09 | CMS middleware (Plan) | Rejects a plan with no country on create, update and publish; accepts a save that leaves the country untouched | ADR 0001 mitigation; a plan without a country silently disappears | Pending |
| UT-10 | CMS country backfill | Fills currency, locale and bands only when they are missing; never overwrites an edited value | Existing databases must get the new fields without losing editors' changes | Pending |

Not proposed: card rendering, static texts and getters, the one-line Plan controller `status` override (quickstart 9 covers it), and the plan seed contents.

## E2E candidates

| ID | Flow | Justification | Decision |
|----|------|---------------|----------|
| E2E-3 | `/co/quote`: fill in step 1 → the plans show in order, in COP, with the badge → Continuar disabled → choose → summary → Volver keeps the choice | The story's core promise: CMS plans, the price, the choice and the session together, which only the real stack proves | Pending |
| E2E-4 | `/cl/quote` with a driver aged 22 and a vehicle 8 years old → the CLP prices equal base × 1.20 × 1.10 | The price rule reading the CMS bands and step 1 data end to end, in the second country | Pending |

Not proposed: the empty and error states, admin edits, and reloads (unit tests and the quickstart cover them). The full-flow E2E belongs to US-03.

## Revisions

### 2026-11-22 — Gate 2, round 1 (not approved)
- **Asked:** reuse the agreed US-01 stepper and header; brand colours instead of grey cards; a mobile slider; "Recomendado" on the top border; prices and lists aligned across cards; no "Seleccionado" text (it causes layout shift).
- **Changed:** a new mockup with the stepper and header, subgrid-aligned cards, a badge on the top border, selection by radio and ring, a mobile slider, and two card styles (S1 white, S2 tinted).

### 2026-11-22 — Gate 2, round 2 (not approved)
- **Asked:** S1 without the cyan stripe; the slider couldn't be moved; use the slider on tablet too; remove the price help text.
- **Changed:** white cards, with a navy top border on the recommended plan only; a slider below 992 px with drag, previous/next buttons and dots.

### 2026-11-22 — Gate 2, round 3 (not approved yet)
- **Asked:**
  - "Continuar" should work only after a plan is chosen, in the agreed colours.
  - The price rule still applies, but customers needn't know how prices are estimated. Document it as a clear decision in the docs, the code and Strapi.
- **Changed:**
  - The spec is updated (Clarifications, FR-004, FR-005, FR-008, User Story 3).
  - ADR 0005 and R12 record where the rule is documented.
  - The chosen design is recorded, and UT-08 and E2E-3 are adjusted.

### 2026-11-22 — Gate 2, round 4 (design approved)
- **Asked:** remove the "Elige un plan para continuar." hint; use Swiper for the slider, with arrows and dots, no loop and no movement except the step 1 load animation; then move on.
- **Changed:** FR-008 and User Story 3 drop the hint. `swiper` is added as an approved dependency (R13). The design section, the recipe and the quickstart are updated.
