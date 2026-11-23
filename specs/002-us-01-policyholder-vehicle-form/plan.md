# Implementation Plan: US-01 – Policyholder and vehicle data form

**Branch**: `002-us-01-policyholder-vehicle-form` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md) (Approved Gate 1)

**Status**: Approved (Gate 2) — 2026-11-22

**Artifacts**: [research.md](research.md) · [data-model.md](data-model.md) · [contracts/](contracts/) · [quickstart.md](quickstart.md) · [ADR 0004](../../docs/adr/0004-dynamic-form-from-cms.md)

## Summary

**Strapi.** Add a `FormField` collection (draft & publish) with validations, named validators and options. A Document Service middleware rejects a field with no country or with a key already used in its country. Country gains `legalAge`. The seed adds 10 fields for CO and 9 for CL, and Public gets `find` on FormField.

**Angular.** Replace the step 1 placeholder with a form built at runtime from those fields, in two sections, saved to the tab's session as the person types. A valid "Continuar" opens a step 2 placeholder with "Volver", and a guard keeps step 2 closed until step 1 is complete.

## Technical Context

**Language/Version**: TypeScript 6, Angular 22.3 (standalone, zoneless, signals); Strapi 5.63 on Node 22
**Primary Dependencies**: Angular Reactive Forms (`@angular/forms`, already installed); the Strapi Document Service. **New (approved at Gate 2):** `vitest` as a cms devDependency, plus the `npm --prefix cms test` script.
**Storage**: SQLite (CMS); `sessionStorage` key `quote-session` (browser)
**Testing**: Vitest (unit); Playwright only for the E2E candidates approved below
**Target Platform**: web, mobile-first (≥320 px) to desktop
**Project Type**: web app, with `frontend/` and `cms/`
**Performance Goals**: step 1 usable in under 2 s on the local stack; completed in under 2 min (SC-003)
**Constraints**: one build for every country; no token in the browser; only `/api` and `/uploads` are proxied; Bootstrap for layout only (ADR 0003)
**Scale/Scope**: about 10 fields per country; 2 screens (step 1 form, step 2 placeholder)

## Constitution Check

| Principle | Status |
|-----------|--------|
| KISS / ask before over-engineering | ✅ Reactive Forms with no form library; one error message per field; no `step` attribute (R1) |
| No new dependency (§3.2) | ✅ Only `vitest` (cms, dev only), approved by the human at Gate 2 |
| Feature-first, cohesive files | ✅ New `features/quote-form/` (page, components, data, validators) |
| High-value tests only | ✅ Validators, mapper, store, guard, form page interactions (see Test plan) |
| BEM, tokens only | ✅ `.form-card`, `.form-field` recipes from ui-ux-guidelines |
| Breaking API contract (§3.3) | ✅ Additive only: a new endpoint, and Country gains `legalAge` |
| spec/plan ≤ 150 lines | ✅ |

Re-check after design: ✅ no violations, so Complexity Tracking is not needed.

## Project Structure

```text
cms/src/
├── api/form-field/               # schema.json, controller (published only, R3), routes, services
├── api/country/…/schema.json     # + legalAge (R4)
├── components/form/              # validations.json, validator.json, option.json
├── middlewares/form-field-integrity.ts   # Document Service middleware: country required, key unique per country (R2)
├── seed/form-fields.ts           # CO 10 / CL 9 fields (FR-013), plus a legalAge backfill (R4)
└── index.ts                      # register(): middleware; bootstrap(): + Public form-field.find
frontend/src/app/
├── core/country/                 # model, mapper, service: + legalAge
├── core/session/quote-session.store.ts   # + readStep1/saveStep1/step1Completed; hasData = non-empty values (R8)
├── features/quote-form/
│   ├── data/                     # form-field.model.ts, form-field.mapper.ts, form-field.service.ts
│   ├── validation/               # build-validators.ts, named-rules.ts (rut, legalAge, maxYearsAgo, maxYearsAhead)
│   ├── components/form-field/    # one control per type: label, help, error, aria wiring
│   └── step1-form.page.*         # states, sections, Continuar, focus on first invalid control
└── features/quote-wizard/        # routes: '' → Step1FormPage, 'plans' → Step2PlaceholderPage + step1CompleteGuard (R9)
```

**Structure Decision**: same `frontend/` + `cms/` layout as US-00. The step 1 placeholder is deleted.

## ADR changes

- **New:** [ADR 0004 — Dynamic form built from CMS field descriptors](../../docs/adr/0004-dynamic-form-from-cms.md) (Proposed; Accepted with this Gate 2).
- **ADR 0001 amended** to resolve the spec's conflicts:
  1. FormField has `section` (`policyholder` | `vehicle`) and no `step` (R1). It also gains `placeholder`.
  2. Rejecting a FormField without a country moves from *recommended* to *implemented*, together with "key unique per country" (R2).
  3. `legalAge` lives on Country, and the field's `legalAge` rule reads it (clarify Q5). 4. The FormField `find` returns published entries only, enforced on the server (R3).

## Design options — step 1 form (`/:country/quote`)

These sit inside the existing navy header (US-00 option A) and a Bootstrap `.container`. All three use the `.form-field` recipe: label above, 52 px controls, the error below with an icon, and the yellow "Continuar" pill. Interactive mockups were shown at Gate 2.

**Option A — One form card with two sections (recommended).**
- The top shows "Paso 1 de 3 · Tus datos y los de tu carro".
- One centered `.form-card` (`col-12 col-lg-8`) holds the section titles "Tus datos" and "Tu carro".
- Short fields sit in pairs from 768 px (`col-md-6`), and long ones span the full width.
- "Continuar" is at the bottom right (full width on mobile).
- *Pros:* one reading path, scales to more fields. *Cons:* a long page on mobile.

**Option B — Two cards side by side** (`col-lg-6` each, stacked on mobile). *Pros:* both parts at a glance. *Cons:* uneven columns (7 vs 3 fields); Tab runs down one card, then back up.

**Option C — Form with a side help panel** (card A in `col-lg-8` plus a sticky `col-lg-4` "¿Por qué te pedimos estos datos?" panel). *Pros:* builds trust. *Cons:* more copy and layout, and the panel is not in the CMS.

**Recommendation:** A. It is the simplest, has the most predictable keyboard order, and works the same on mobile and desktop.

**Chosen (Gate 2): option A, refined with the human:**
- **Step header:** a numbered stepper above the card (Tus datos → Elige tu plan → Resumen).
  - The current and completed circles have a `--color-surface-highlight` fill, a 2 px `--color-action` ring and a `--color-brand` number (a check once completed); upcoming steps are white with a grey ring.
  - The current label is bold `--color-brand`, and the line up to a completed step is `--color-action`. Chosen as S3 at round 3. `aria-current="step"`; on mobile only the current circle shows, with "Paso 1 de 3 · Tus datos".
- **Card title:** "Cuéntanos de ti y de tu carro" with the subtitle "Te toma menos de 2 minutos." The section titles carry icons.
- **Fields:** a soft fill (`#f3f7ff`, a 12 px top radius, a 2 px `--color-text-muted` bottom line, darker than the mockup's for ≥3:1); on focus the line turns action blue and the fill deepens; on error the line turns red.
- **Dropdowns:** custom, never the native list. A button with `role="combobox"` opens a rounded listbox (14 px radius, shadow, a check on the selected option, hover and active tint).
  - Keyboard: ↑/↓, Home/End, Enter/Space to pick, Esc to close, Tab to leave (the WAI-ARIA select-only combobox pattern). No new dependency.
- **Load animation:** a skeleton first, then the items fade up 14 px one by one (600 ms each, 110 ms apart). It is off under `prefers-reduced-motion`.

**Step 2 placeholder:** the same card with "Paso 2 de 3 · Elige tu plan", the text "Los planes llegan con US-02." and a secondary "Volver" button. There are no options: it is temporary.

## E2E candidates

| ID | Flow | Justification | Decision |
|----|------|---------------|----------|
| E2E-1 | `/co/quote`: the CMS fields render; fill in valid data; "Continuar" → step 2; "Volver" → values kept | The core promise of the story: CMS config, proxy, validation and session together, which only a real stack proves | **Approved** (Gate 2) |
| E2E-2 | `/cl/quote`: invalid RUT and an underage birth date block "Continuar", with the configured messages and focus on the first error | Country-specific rules are the highest-risk logic, and invalid data must never reach plans | **Approved** (Gate 2) |

Not proposed: reloads, the "Cambiar país" dialog, CMS publish/unpublish (unit tests and the quickstart cover them). The full-flow E2E belongs to US-03.

## Test plan (unit, Vitest)

Critical rules get explicit valid/invalid tables. Names follow `describe('US-01 · FR-XXX …')`.

| Area | Valid examples | Invalid examples | Spec |
|------|----------------|------------------|------|
| `rut` rule | `12.345.678-5`, `12345678-5`, `7.654.321-6`, a `K` digit in either case | wrong check digit, letters in the body, < 7 body digits, empty | FR-014 |
| Cédula (`documentNumber` pattern) | `123456`, `1020304050` | `12345`, `10203040501`, `1.020.304`, letters | FR-013 |
| Placa CO / patente CL patterns | `ABC123`, `abc123` / `BCDF12`, `AB1234` | `AB123`, `ABC1234`, `AB-123` / `BCD123`, `A12345` | FR-013 |
| Celular, email, name patterns | `3001234567`, `912345678`, `ana@correo.test` | `2001234567`, `81234567`, `ana@`, digits in the name | FR-013 |
| `legalAge` + Country | turns 18 today; reads the active country's value (country at 21 → age 21 passes); the mapper reads `legalAge`, missing → 18 | turns 18 tomorrow, a future date; age 20 with a country at 21 | FR-007 |
| `maxYearsAgo` / `maxYearsAhead` | current year − 20, current year + 1 | current year − 21, current year + 2, `20.5`, text | FR-008 |
| `build-validators` | required, min/max, anchored pattern (no partial match) | an unknown rule is skipped with a warning; a bad regex in the CMS is skipped | FR-005, Edge Cases |
| `form-field.mapper` | grouping by section and order, null validations and options | an unknown type is dropped | FR-002, FR-003 |
| `quote-session.store` | save/restore step 1; `step1Completed` cleared on edit | `hasData` false when all values are empty | FR-009 |
| `step1CompleteGuard` | complete → pass | not complete → redirect to step 1 | SC-002 |
| Step 1 page | errors only after blur or Continuar, then live; Continuar focuses the first invalid control; valid → navigates; restored values; loading, empty and error with retry | — | FR-005, FR-006, FR-010 |
| Custom select | ↑/↓, Home/End, Enter/Space picks, Esc closes; `aria-expanded` / `aria-activedescendant` | — | FR-011 |
| CMS (`npm --prefix cms test`) | seed patterns accept the tables above; middleware accepts a valid field, the same key in another country, and an update keeping its own key; the `legalAge` backfill fills only missing values | seed patterns reject the tables above; middleware rejects a missing country or a duplicate key on create, update and publish; the backfill never overwrites an edited value | FR-007, FR-013, Edge Cases |

## Revisions

### 2026-11-22 — Gate 2, round 1 (not approved)
- **Asked:** keep option A (one card), but replace the plain "Paso 1 de 3" + title header; add a smooth load animation for the form; propose a less plain look for the fields.
- **Changed:** a new interactive mockup with three step headers (H1 numbered stepper, H2 progress bar, H3 navy band inside the card), three field styles (F1 floating label, F2 leading icon + valid check, F3 soft filled), and a load animation (skeleton → fields fade up 10 px in a 45 ms stagger, off under `prefers-reduced-motion`). Pending the human's pick.

### 2026-11-22 — Gate 2, round 2 (not approved yet)
- **Asked:** stepper H1, but with the CTA yellow instead of the navy; custom dropdowns with rounded borders instead of the native list; F3 soft filled fields; a slower load animation, one item at a time.
- **Changed:** the design section now records the refined option A (yellow stepper, F3 fields, custom combobox listbox, 600 ms / 110 ms stagger). A new interactive mockup was produced.

### 2026-11-22 — Gate 2, round 3
- **Asked:** another colour for the current-step circle (plain yellow has about 1.2:1 contrast on the page).
- **Changed:** four token-based options were shown, and the human chose S3 (light tint, blue ring, navy number). The stepper line in the design section was updated.

### 2026-11-22 — Gate 2, round 4
- **Asked:** approved the design; approved both E2E candidates; asked for explicit unit tests on the critical rules (RUT, cédula, placa/patente and the other patterns).
- **Changed:** the Test plan is now a table of valid/invalid cases; Vitest is added to cms (approved) to test the seed patterns and the save middleware; `npm --prefix cms test` joins the per-wave checks; E2E-1 and E2E-2 are marked Approved.

### 2026-11-22 — Gate 2, round 5 (approved)
- **Asked:** approved the plan, and asked for tests on the middleware and on `legalAge` on Country.
- **Changed:** the Test plan adds the `legalAge` cases (mapper, a country value other than 18, the CMS backfill) and the middleware's edge cases (same key in another country, update keeping its key, publish). Status set to Approved (Gate 2).
