# Implementation Plan: US-02 – Plan list

**Branch**: `003-us-02-plan-list` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md) (Approved Gate 1)

**Status**: Draft (Gate 2 pending)

**Artifacts**: [research.md](research.md) · [data-model.md](data-model.md) · [contracts/](contracts/) · [quickstart.md](quickstart.md) · [ADR 0005](../../docs/adr/0005-simulated-price-rule-age-bands.md)

## Summary

**Strapi.**
- New `Plan` collection (draft & publish). Coverages and benefits are `plan.item` components.
- Country gains `currency`, `numberLocale`, `driverAgeBands` and `vehicleAgeBands`.
- The US-01 save check now also rejects a plan with no country.
- The Plan `find` returns published plans only, and Public gets `find`.
- The seed adds 3 CO + 3 CL plans and 1 inactive one. A backfill fills the new Country fields on existing databases.

**Angular.**
- Step 2 replaces its placeholder with the plan list:
  - prices from the simulated rule (ADR 0005), in the country's currency;
  - a recommended badge;
  - a radio-group choice saved to the tab session;
  - loading, empty and error states.
- The step 1 guard also re-checks the saved values against the current fields (R-19).
- "Continuar" opens a summary placeholder with "Volver".

## Technical Context

**Language/Version**: TypeScript 6, Angular 22.3 (standalone, zoneless, signals); Strapi 5.63 on Node 22
**Primary Dependencies**: no new ones. `Intl.NumberFormat` (browser) formats the currency (R4).
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
| No new dependency (§3.2) | ✅ None |
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
- **ADR 0001 amended:**
  - The Plan save check is implemented, and the Plan `find` returns published plans only.
  - Coverages and benefits use the `plan.item` component.
  - Country gains `currency`, `numberLocale` and the age bands.

## Design options — plan list (`/:country/quote/plans`)

All three options share the same frame:
- **Shell and stepper:** the existing navy header and stepper ("Elige tu plan" is current), in a Bootstrap `.container`.
- **Heading:** "Elige tu plan", with the help text "El precio mensual se ajusta según tu edad y la antigüedad de tu carro."
- **Cards:** the `.plan-card` recipe, as a native radio group.
- **Buttons:** "Volver" (secondary) and "Continuar" (the yellow pill).

Interactive mockups are shown at Gate 2.

**Option A — Card grid (recommended).**
- Layout: `row g-4`, `col-12 col-md-6 col-lg-4`, as the recipe says (stacked, then 2, then 3 columns).
- Each card shows the badge, name, short description, a large price with " / mes", the Coberturas list (check icons) and the Beneficios list.
- The whole card is the radio label. The chosen card shows a 2 px blue ring, a check and "Seleccionado".
- The buttons sit below the grid.
- *Pros:* easy to compare side by side; matches the recipe. *Cons:* long cards on mobile.

**Option B — Compact list with details on demand.**
- Layout: one card per row (`col-12 col-lg-10`), with the name and description on the left and the price and radio on the right.
- "Ver coberturas y beneficios" expands the lists (a disclosure button).
- *Pros:* short on mobile. *Cons:* comparing coverages needs extra clicks; more interaction to make accessible.

**Option C — Grid with a sticky selection bar.**
- The grid from A, plus a bar fixed at the bottom on mobile (sticky on desktop) that shows the chosen plan, its price and "Continuar".
- *Pros:* the CTA is always in reach. *Cons:* the bar covers content at 320 px and needs extra focus and scroll care.

**Recommendation:** A. It is the simplest, follows the plan-card recipe exactly, and keeps one keyboard path (arrows inside the group, then Tab to the buttons).

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
| UT-08 | Plan list page | Restores the choice, or drops it when the plan is not offered; Continuar without a choice → message and focus; with a choice → summary; empty and error states with retry | The page's critical interactions (FR-007–FR-010) | Pending |
| UT-09 | CMS middleware (Plan) | Rejects a plan with no country on create, update and publish; accepts a save that leaves the country untouched | ADR 0001 mitigation; a plan without a country silently disappears | Pending |
| UT-10 | CMS country backfill | Fills currency, locale and bands only when they are missing; never overwrites an edited value | Existing databases must get the new fields without losing editors' changes | Pending |

Not proposed:
- Card rendering, and the static texts and getters.
- The Plan controller's `status` override (one line; quickstart 9 covers it).
- The plan seed contents.

## E2E candidates

| ID | Flow | Justification | Decision |
|----|------|---------------|----------|
| E2E-3 | `/co/quote`: fill in step 1 → the plans show in order, in COP, with the badge → Continuar without a choice shows the message → choose → summary → Volver keeps the choice | The story's core promise: CMS plans, the price, the choice and the session together, which only the real stack proves | Pending |
| E2E-4 | `/cl/quote` with a driver aged 22 and a vehicle 8 years old → the CLP prices equal base × 1.20 × 1.10 | The price rule reading the CMS bands and step 1 data end to end, in the second country | Pending |

Not proposed: the empty and error states, admin edits, and reloads (unit tests and the quickstart cover them). The full-flow E2E belongs to US-03.

## Revisions

_No revisions yet._
