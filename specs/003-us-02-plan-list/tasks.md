# Tasks: US-02 – Plan list

**Input**: [spec.md](spec.md) (Gate 1), [plan.md](plan.md) (Gate 2), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [ADR 0005](../../docs/adr/0005-simulated-price-rule-age-bands.md)

**Tests**:
- Only the unit test candidates approved at Gate 2, UT-01…UT-10, each in the task that builds its code. Names follow `describe('US-02 · FR-XXX …')`. Regression tests for bugs found later must be named in their task.
- E2E-3 and E2E-4 (approved).

**Format**: `[ID] [P?] [Owner] [Story] Description (FR) — files`.
- `[P]` means the task shares no files with the other `[P]` tasks of the same phase.
- Owners: `[CMS]` cms-developer, `[FE]` frontend-developer, `[E2E]` e2e-tester, `[ORCH]` orchestrator.
- Stories: US-02 is the traceability ID; `S1`–`S4` are the spec's user stories.

## Phase 1: Setup

- [x] T001 [P] [FE] US-02 Add `swiper` (latest stable major, approved at Gate 2) as a frontend dependency, and import its core CSS only where the slider is used (R13) — `frontend/package.json`, `frontend/package-lock.json`

## Phase 2: Foundational — CMS (blocks the stories)

- [x] T002 [P] [CMS] US-02 Components per [data-model.md](data-model.md):
  - `plan.item`: `text` (string, required, maxLength 120).
  - `pricing.age-band`: `fromAge` and `toAge` (integer, required, min 0), `factor` (decimal, required, min 0.01).
  - The component `description` states the rule for editors (R12).
  (FR-001, FR-005) — `cms/src/components/plan/item.json`, `cms/src/components/pricing/age-band.json`
- [x] T003 [CMS] US-02 Country gains:
  - `currency` (required, `^[A-Z]{3}$`)
  - `numberLocale` (required, `^[a-z]{2}-[A-Z]{2}$`)
  - `driverAgeBands` and `vehicleAgeBands` (repeatable `pricing.age-band`), with descriptions per data-model (R12)
  (FR-004, FR-005, R2, R4) — `cms/src/api/country/content-types/country/schema.json` (depends on T002)
- [x] T004 [CMS] US-02 `Plan` collection per [data-model.md](data-model.md):
  - Attributes: `name`, `shortDescription` (maxLength 160), `basePrice` (integer, min 0), `coverages` and `benefits` (repeatable `plan.item`), `order` (min 1), `recommended`, `active`, and `country` (manyToOne → Country).
  - Draft & publish enabled.
  - The `find` controller forces `status: 'published'` (R7).
  (FR-001, FR-002) — `cms/src/api/plan/**` (depends on T002)
- [x] T005 [CMS] US-02 Save check (R6):
  - Rename `form-field-integrity` to `country-integrity`, keeping the FormField rules unchanged.
  - Add Plan: `create`, `update` and `publish` without a country fail with "El plan debe tener un país."
  - `readCountryPayload` is reused.
  - Move the existing tests with the module.
  - **UT-09:** rejects a missing country on create, update and publish; accepts a save that leaves the country untouched.
  (FR-001, Edge Cases) — `cms/src/middlewares/country-integrity*.ts`, `cms/src/index.ts` (depends on T004)
- [x] T006 [CMS] US-02 Seed, backfill and permissions:
  - Countries get `currency`, `numberLocale` and bands (CO COP/es-CO, CL CLP/es-CL, PE PEN/es-PE; the bands from data-model).
  - A backfill fills them only when missing.
    - **UT-10:** fills only the missing values and never overwrites an edited one.
  - Seed the plans from data-model (3 CO, 3 CL, CO "Clásico" inactive, one recommended per country, coverages and benefits) only when no Plan exists. All published.
  - Grant Public `api::plan.plan.find`.
  (FR-014, R5) — `cms/src/seed/countries.ts`, `cms/src/seed/plans.ts`, `cms/src/seed/permissions.ts`, `cms/src/index.ts`, tests (depends on T003, T004, T005)

## Phase 2: Foundational — Frontend (parallel with the CMS phase; the contract is fixed)

- [x] T007 [FE] US-02 Country: the DTO, model and mapper gain `currency`, `numberLocale`, `driverAgeBands` and `vehicleAgeBands` (`AgeBand { fromAge, toAge, factor }`). `CountryService` populates both band components.
  - **UT-05:** maps the fields; drops a band with from > to or factor ≤ 0; missing bands → [].
  (FR-004, FR-005) — `frontend/src/app/core/country/**`
- [x] T008 [FE] US-02 Pricing (pure functions):
  - `simulatePrice(basePrice, driverAge, vehicleAge, country)`. Its doc comment states the rule and links ADR 0005 (R12).
    - **UT-01:** 8 examples (band edges 24/25, 65/66, 5/6, 10/11; no band and unknown age → factor 1; overlap → first wins; rounding).
  - `agesFromStep1(values, today)`, reading the keys `birthDate` and `vehicleYear`.
    - **UT-02:** 4 examples (birthday today vs tomorrow; vehicle age never below 0; missing or invalid → null).
  - `formatPrice(amount, country)` with `Intl.NumberFormat` and 0 decimals, followed by " / mes".
    - **UT-03:** CO and CL.
  (FR-004, FR-005, R1, R3, R4) — `frontend/src/app/features/plan-list/pricing/**` (depends on T007)
- [x] T009 [P] [FE] US-02 Plan data layer per [contracts/plans-api.md](contracts/plans-api.md): the DTOs, the `Plan` model, `mapPlans` and `PlanService.load(countryCode)` (filters, sort, populate).
  - **UT-04:** only the first recommended plan is highlighted; empty coverages or benefits → []; a bad `basePrice` drops the plan.
  (FR-002, FR-003, FR-006) — `frontend/src/app/features/plan-list/data/**`
- [x] T010 [P] [FE] US-02 Session: `savePlan(id)`, `readPlanId()` and `clearPlan()`. `saveStep1` keeps `planId`; `discardData` and `start(otherCountry)` drop it.
  - **UT-06:** these cases.
  (FR-009, R9) — `frontend/src/app/core/session/quote-session.store*.ts`

## Phase 3: Stories S1–S4 (Frontend)

- [x] T011 [FE] US-02 Guards and routes:
  - `step1CompleteGuard` becomes async. It loads the country's form fields and checks the saved values with `buildValidators` on a throw-away `FormGroup`, with `restoredValue` for selects.
    - Values invalid, or fields fail to load → clear `step1Completed` and redirect to step 1.
  - New `planChosenGuard`: no `planId` → redirect to `plans`.
  - Routes: `plans` → `PlanListPage`; `summary` → `SummaryPlaceholderPage` behind both guards.
  - **UT-07:** these cases.
  (FR-011, FR-008, R8) — `frontend/src/app/features/quote-wizard/step1-complete.guard*.ts`, `plan-chosen.guard*.ts`, `frontend/src/app/app.routes.ts`, `frontend/src/app/core/session/quote-session.store.ts` (a `clearStep1Completed` helper if needed) (depends on T010)
- [x] T012 [FE] US-02 `PlanCardComponent` per the plan's "Chosen" design and the ui-ux-guidelines plan-card recipe:
  - White S1 card with a 1px ring.
  - Recommended: a 5px brand top border and a large yellow "Recomendado" pill on the top border; a visually hidden ", plan recomendado" in the label.
  - A custom radio with a check, and a 2px inset ring when selected. No "Seleccionado" text, no layout shift.
  - The name and description, the price after a divider, and Coberturas and Beneficios, with empty lists hidden.
  - The rows go in subgrid slots.
  (FR-003, FR-006, FR-007) — `frontend/src/app/features/plan-list/components/plan-card/**` (depends on T008, T009)
- [x] T013 [FE] US-02 `PlanListPage`:
  - **Data and states:** loads the country and the plans, and computes `PlanOffer`s from the step 1 values. Loading (skeleton cards, `aria-busy`), empty ("Volver a tus datos", no Continuar) and error (`role="alert"`, "Reintentar") states.
  - **Selection:** a native radio group, `<fieldset>` + `<legend>`; the arrow keys change the choice. It restores `planId`, or drops it when the plan is not offered. Choosing saves it.
  - **Layout:**
    - From 992px, a 3-column grid with a subgrid, so the rows align.
    - Below that, Swiper (Navigation, Pagination, A11y, Keyboard): about 1.2 / 2.2 slides, centred on the recommended plan, `loop: false`, no autoplay.
      - Arrows and dots appear only with the slider, and have Spanish labels.
      - Choosing a plan calls `slideTo`.
      - Swiper is created in `afterNextRender` and destroyed on resize ≥ 992 and on destroy.
  - **Motion:** the step 1 load animation (fade up 14px, 600ms, 110ms stagger, first render only, off under reduced motion).
  - **Buttons:** "Volver" (secondary) → step 1. "Continuar" (the yellow pill) is disabled until a choice, then → `summary`.
  - **Focus:** the heading gets focus on load.
  - No price help text.
  - **UT-08:** restore and drop; Continuar disabled → enabled → navigates; empty and error with retry.
  (FR-002–FR-010, FR-013) — `frontend/src/app/features/plan-list/plan-list.page.*` (depends on T001, T011, T012)
- [x] T014 [P] [FE] US-02 `SummaryPlaceholderPage`: the stepper on "Resumen", the text "El resumen llega con US-03." and "Volver" → `plans`. Delete `step2-placeholder.page.ts` (FR-012) — `frontend/src/app/features/plan-list/summary-placeholder.page.ts`, `frontend/src/app/features/quote-wizard/step2-placeholder.page.ts`

## Phase 4: E2E, review, docs

- [x] T015 [E2E] US-02 E2E-3 (CO choose-plan flow) and E2E-4 (CL price adjustment) per plan.md (FR-002–FR-009, SC-002) — `frontend/e2e/us-02-*.spec.ts` (depends on T006, T013, T014)
- [x] T016 [ORCH] US-02 Update the README (plans in the admin, the price bands) and check the quickstart (SC-001) — `README.md`
- [x] T017 [ORCH] US-02 Code review rounds recorded in `review.md`, then the handoff

## Phase 5: Gate 3 corrections (human manual test, 2026-11-22)

- [ ] T018 [FE] US-02 Slider arrows sit at the slider's left and right edges, vertically centred on the cards. They sit in the side gutters from 768px and overlay the track edges (white fill, action ring, 48px) below that. The dots stay centred below the slider (FR-013) — `frontend/src/app/features/plan-list/plan-list.page.*`
- [ ] T019 [FE] US-02 More than 3 plans → a slider on desktop as well:
  - **Up to 3 plans from 992px:** the 3-column grid stays as it is.
  - **More than 3 plans from 992px:** Swiper with 3 visible slides, arrows and dots, no loop, no autoplay.
  - **Below 992px:** always the slider.
  - **Row alignment in the slider:** the name, price, Coberturas and Beneficios rows line up across slides. A ResizeObserver syncs each row's height to the tallest card, replacing the "equal heights only" trade-off from R13.
  - **Regression test "G3 · more than 3 plans use the slider on desktop":** 4 plans on a desktop viewport → slider mode, with arrows and dots; 3 plans → grid.
  (FR-002, FR-013) — `frontend/src/app/features/plan-list/**` (depends on T018)

## Dependencies

- T002 → T003, T004 → T005 → T006 (CMS chain, one agent).
- T007 → T008; T009 and T010 run in parallel. All of them run in parallel with the CMS chain.
- T010 → T011. T008 + T009 → T012. T001 + T011 + T012 → T013. T014 runs in parallel with T012 and T013.
- T006 + T013 + T014 → T015 → T017.
