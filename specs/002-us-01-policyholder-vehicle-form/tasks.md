# Tasks: US-01 – Policyholder and vehicle data form

**Input**: [spec.md](spec.md) (Gate 1), [plan.md](plan.md) (Gate 2), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [ADR 0004](../../docs/adr/0004-dynamic-form-from-cms.md)

**Tests**: the unit tests in the plan's Test plan (Vitest in `frontend/` and, approved at Gate 2, in `cms/`). E2E-1 and E2E-2 are approved at Gate 2.

**Format**: `[ID] [P?] [Owner] [Story] Description (FR) — files`.
- `[P]` means the task shares no files with the other `[P]` tasks of the same phase.
- Owners: `[CMS]` cms-developer, `[FE]` frontend-developer, `[E2E]` e2e-tester, `[ORCH]` orchestrator (files outside `cms/` and `frontend/src/`).
- Stories: US-01 is the traceability ID, and `S1`–`S4` are the spec's user stories.

## Phase 1: Setup

- [x] T001 [P] [CMS] US-01 Add `vitest` as a cms devDependency (approved at Gate 2), a `test` script (`vitest run`) and a minimal `vitest.config.ts` limited to `src/**/*.test.ts`. Strapi build must ignore the test files — `cms/package.json`, `cms/vitest.config.ts`, `cms/tsconfig.json`
- [x] T002 [P] [CMS] US-01 Components per [data-model.md](data-model.md):
  - `FormValidations.min` and `FormValidations.max` (decimal), `FormValidations.pattern` (string), `FormValidations.validators` (repeatable `form.validator`);
  - `FormValidator.name` (string, required), `FormValidator.value` (integer, optional);
  - `FormOption.label` and `FormOption.value` (string, both required).
  (FR-001, FR-003) — `cms/src/components/form/validations.json`, `validator.json`, `option.json`
- [x] T003 [P] [CMS] US-01 Add `Country.legalAge` per [data-model.md](data-model.md) (integer, required, min 0, default 18) (FR-007, R4) — `cms/src/api/country/content-types/country/schema.json`
- [x] T004 [P] [ORCH] US-01 Add `npm --prefix cms test` to the CLAUDE.md verification commands and to the per-wave checks in the autopilot skill — `CLAUDE.md`, `.claude/skills/autopilot/SKILL.md`

## Phase 2: Foundational (blocks the stories)

- [x] T005 [CMS] US-01 `FormField` collection per [data-model.md](data-model.md):
  - Attributes:
    - `FormField.key` (required, `^[a-z][a-zA-Z0-9]*$`)
    - `FormField.label`
    - `FormField.type` (enum `text|number|select|date|checkbox`)
    - `FormField.required`
    - `FormField.helpText`
    - `FormField.placeholder`
    - `FormField.errorMessage` (required)
    - `FormField.order` (min 1)
    - `FormField.section` (enum `policyholder|vehicle`)
    - `FormField.country` (manyToOne → Country)
    - `FormField.validations`
    - `FormField.options`
  - Draft & publish enabled.
  - The `find` controller forces `status: 'published'`.
  (FR-001, FR-002, R1, R3) — `cms/src/api/form-field/**` (depends on T002)
- [x] T006 [CMS] US-01 Integrity middleware.
  - A pure `checkFormFieldIntegrity(data, existing)` plus a Document Service middleware, registered in `register()`, on `create`/`update`/`publish` of FormField.
  - It rejects a missing country, or a `key` already used by another document of the same country, with a ValidationError.
  - It allows the same key in another country, and an update that keeps its own key.
  - Unit tests per the Test plan.
  (Edge Cases, R2) — `cms/src/middlewares/form-field-integrity*.ts`, `cms/src/index.ts` (depends on T001, T005)
- [x] T007 [CMS] US-01 Seed, permissions and backfill.
  - Seed the CO (10) and CL (9) fields from [data-model.md](data-model.md) § Seed: all required and published, with the named rules `rut`, `legalAge`, `maxYearsAgo` 20 and `maxYearsAhead` 1.
  - The patterns are exported as constants from `seed/form-field-patterns.ts`.
  - The seed runs only when no FormField exists.
  - Backfill `legalAge = 18` on countries that lack it, never overwriting an existing value.
  - Grant Public `api::form-field.form-field.find`, with a comment saying why.
  - Unit tests: pattern valid/invalid tables, backfill.
  (FR-007, FR-013, R4) — `cms/src/seed/form-fields.ts`, `cms/src/seed/form-field-patterns*.ts`, `cms/src/seed/countries.ts`, `cms/src/seed/permissions.ts`, `cms/src/index.ts` (depends on T001, T003, T005, T006)
- [x] T008 [P] [FE] US-01 `Country.legalAge` in the DTO, model and mapper (missing → 18), plus `fields[2]=legalAge` in `CountryService`; unit tests (FR-007) — `frontend/src/app/core/country/**`
- [x] T009 [P] [FE] US-01 FormField data layer per [contracts/form-fields-api.md](contracts/form-fields-api.md):
  - DTOs and `FormFieldDescriptor`.
  - Pure `mapFormFields`: group by section (policyholder, vehicle), sort by order, drop unknown types with `console.warn`, handle null validations and options.
  - `FormFieldService.load(countryCode)`.
  - Unit tests.
  (FR-001–FR-003, R10) — `frontend/src/app/features/quote-form/data/**`
- [x] T010 [P] [FE] US-01 Validation.
  - `named-rules.ts`: `rut` (normalise, modulo 11, `K`), `legalAge(context.legalAge)` against the local today, `maxYearsAgo`, `maxYearsAhead`.
  - `build-validators.ts`: required, min/max, anchored pattern (a bad regex is skipped with a warning), registry lookup (an unknown name is skipped with a warning), and the single error key `invalid`.
  - Unit tests with the plan's valid/invalid tables.
  (FR-005, FR-007, FR-008, FR-014, R6, R7) — `frontend/src/app/features/quote-form/validation/**`
- [x] T011 [P] [FE] US-01 `QuoteSessionStore`:
  - `readStep1()`, `saveStep1(values)` (which also clears `step1Completed`), `markStep1Completed()`, `isStep1Completed()`.
  - `hasData()` is true only when some value is non-empty.
  - Unit tests.
  (FR-009, R8, R9) — `frontend/src/app/core/session/**`
- [x] T012 [P] [FE] US-01 Shared UI per the ui-ux-guidelines recipes:
  - Add the `--color-surface-field-focus` token.
  - `StepperComponent` (`<ol>`, S3 colours, `aria-current="step"`, collapses on mobile).
  - `SelectFieldComponent`: a custom select-only combobox implementing `ControlValueAccessor`, with the listbox popup and the keyboard ↑/↓, Home/End, Enter/Space, Esc, Tab; `aria-expanded`/`aria-activedescendant`; a disabled state when there are no options.
  - Unit tests for the combobox interactions.
  (FR-003, FR-011, Edge Cases) — `frontend/src/styles.scss`, `frontend/src/app/shared/ui/stepper/**`, `frontend/src/app/shared/ui/select-field/**`

## Phase 3: S1 + S2 — Fill in the form and be told what is wrong (P1) 🎯 MVP

- [x] T013 [FE] US-01 `FormFieldComponent`.
  - Renders one descriptor as a soft-filled control (`text`, `number` with `inputmode="numeric"`, `date`, `checkbox`, `select` → `SelectFieldComponent`).
  - A visible label, a required `*` plus the `required`/`aria-required` attribute, help text, placeholder.
  - Shows `errorMessage` when `invalid && (touched || submitted)`, live after that, linked with `aria-describedby` and `aria-invalid`.
  (FR-004, FR-005, FR-011) — `frontend/src/app/features/quote-form/components/form-field/**` (depends on T009, T010, T012)
- [x] T014 [FE] US-01 `Step1FormPage` at `/:country/quote` per the Gate 2 design.
  - Layout: the stepper above one card ("Cuéntanos de ti y de tu carro" / "Te toma menos de 2 minutos."), the sections "Tus datos" and "Tu carro" with icons, Bootstrap `row`/`col-md-6` pairs for short fields.
  - Data: loads the fields for the active country and builds the typed `FormGroup` with the country's `legalAge`.
  - Session: restores the session values (ignoring unknown keys) and saves on every `valueChanges`.
  - States: skeleton loading (`aria-busy`), empty and error with "Reintentar" (no "Continuar").
  - Motion: a one-by-one fade-up on first render only (600 ms / 110 ms, off with `prefers-reduced-motion`).
  - "Continuar": shows every error and focuses the first invalid control, or else marks step 1 completed and navigates to `plans`. Focus goes to the heading on load.
  - Unit tests per the Test plan.
  (FR-002–FR-006, FR-009, FR-010, FR-011, SC-005) — `frontend/src/app/features/quote-form/step1-form.page.*` (depends on T008, T011, T013)

## Phase 4: S3 — Keep my data when I go back (P2)

- [x] T015 [FE] US-01 Routes and step 2.
  - `Step2PlaceholderPage` at `/:country/quote/plans`: the stepper on step 2, the card "Elige tu plan" / "Los planes llegan con US-02.", and a secondary "Volver" to step 1.
  - `step1CompleteGuard`: redirects to step 1 unless the step is completed.
  - Wire the child routes and delete the step 1 placeholder.
  - Unit tests for the guard.
  (FR-009, FR-012, SC-002, R9) — `frontend/src/app/features/quote-wizard/**`, `frontend/src/app/app.routes.ts` (depends on T011, T014)

## Phase 5: S4 — Change the form without a deployment (P1)

- [x] T016 [ORCH] US-01 README: how to add, reorder, publish or unpublish a form field and set its rules in the admin; the named rules available; the per-country legal age (FR-001, SC-001) — `README.md` (depends on T007)

## Phase 6: E2E (approved at Gate 2)

- [x] T017 [E2E] US-01 E2E-1: on `/co/quote` the CMS fields render; fill in valid data; "Continuar" → step 2; "Volver" → values kept (FR-002, FR-009, FR-012) — `frontend/e2e/us-01-*.spec.ts` (depends on T007, T015)
- [x] T018 [E2E] US-01 E2E-2: on `/cl/quote` an invalid RUT and an underage birth date block "Continuar" with the configured messages, and focus moves to the first error (FR-005–FR-007, FR-014) — `frontend/e2e/us-01-*.spec.ts` (depends on T007, T015)

## Phase 7: Polish

- [ ] T019 [ORCH] US-01 Run quickstart scenarios 1–13 on `docker compose up --build` (fresh volume) and record the results in the handoff summary (FR-001–FR-014, SC-001–SC-005)

## Waves

| Wave | Tasks | Agents |
|------|-------|--------|
| 1 | T001–T003, T005–T007 · T008, T009, T011 · T010 · T012 · T004 | cms-developer · frontend-developer ×3 (parallel) · orchestrator |
| 2 | T013 | frontend-developer |
| 3 | T014, T015 | frontend-developer |
| 4 | T016 · T017, T018 | orchestrator · e2e-tester |
| 5 | Review (code-reviewer), fixes, T019 | — |
