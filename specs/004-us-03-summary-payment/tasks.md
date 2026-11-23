# Tasks: US-03 – Summary and payment

**Input**: [spec.md](spec.md) (Gate 1), [plan.md](plan.md) (Gate 2), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [ADR 0006](../../docs/adr/0006-simulated-payment-and-receipt.md), [ADR 0007](../../docs/adr/0007-rich-text-terms-without-html.md)

**Tests**:
- Only the unit test candidates approved at Gate 2, UT-01…UT-09, each in the task that builds its code. Names follow `describe('US-03 · FR-XXX …')`. Regression tests for bugs found later must be named in their task.
- E2E-5 only (approved). E2E-6 was rejected.

**Format**: `[ID] [P?] [Owner] [Story] Description (FR) — files`.
- `[P]` means the task shares no files with the other `[P]` tasks of the same phase.
- Owners: `[CMS]` cms-developer, `[FE]` frontend-developer, `[E2E]` e2e-tester, `[ORCH]` orchestrator.
- Stories: US-03 is the traceability ID; `S1`–`S4` are the spec's user stories.

## Phase 1: Foundational — CMS (blocks the stories)

- [x] T001 [CMS] US-03 Schemas per [data-model.md](data-model.md) and [contracts/cms-api.md](contracts/cms-api.md):
  - Country gains `termsAndConditions` (`blocks`), with the editor description from data-model.
  - FormField gains `maskedInSummary` (boolean, default `false`), with its description.
  (FR-003, FR-005) — `cms/src/api/country/content-types/country/schema.json`, `cms/src/api/form-field/content-types/form-field/schema.json`
- [x] T002 [CMS] US-03 Seed and backfill:
  - Different fictitious Spanish terms for CO and CL (heading, 3–4 paragraphs, one list, one `https://example.com/...` link, no placeholder lines such as "Texto ficticio de ejemplo"); none for PE.
  - `maskedInSummary: true` on CO `documentNumber` and CL `rut` in the seed.
  - Backfill R4: the flag only on `documentNumber`/`rut` rows where it is `null` (DB layer, draft and published rows).
  - Backfill R5: terms only where empty, written to the draft and published only if `shouldPublishAfterBackfill` allows it, otherwise a warning.
  - **UT-09:** these backfill decisions (pure functions, like UT-10 of US-02).
  (FR-014, R4, R5) — `cms/src/seed/countries.ts`, `cms/src/seed/form-fields.ts`, `cms/src/index.ts`, tests (depends on T001)

## Phase 1: Foundational — Frontend (parallel with the CMS phase; the contract is fixed)

- [x] T003 [P] [FE] US-03 Contract models: `Country` gains `termsAndConditions: RichTextBlock[]` (the mapper drops unknown nodes, images, code, and links with a scheme other than http(s)/mailto, which become text; missing → `[]`); the form field DTO and descriptor gain `maskedInSummary` (missing → `false`). The rich text model lives in `shared/ui/rich-text/rich-text.model.ts` (FR-003, FR-005) — `frontend/src/app/core/country/**`, `frontend/src/app/features/quote-form/data/form-field.*`, `frontend/src/app/shared/ui/rich-text/rich-text.model.ts`
- [x] T004 [P] [FE] US-03 Summary pure functions:
  - `maskValue(value)`: last 4 characters kept, the rest `•`; 4 or fewer → fully masked. **UT-01** (4 examples).
  - `buildSummaryRows(fields, values, locale)` per R8. **UT-02** (6 examples).
  (FR-001, FR-003) — `frontend/src/app/features/summary/mask.ts`, `summary-rows.ts`, specs
- [x] T005 [P] [FE] US-03 Payment (ADR 0006):
  - `simulatePayment(values, maskedKeys)` with a doc comment stating the rule and linking ADR 0006. **UT-03** (4 examples).
  - `createQuoteNumber(countryCode, now, random)` per R3, default random from `crypto.getRandomValues`. **UT-04**.
  - `PaymentService.pay(...)` returning the outcome after ~1.5 s.
  (FR-008, FR-009) — `frontend/src/app/features/summary/payment/**`
- [x] T006 [P] [FE] US-03 Session: `termsAccepted` (`acceptTerms(boolean)`, kept by `saveStep1` and `savePlan`), `completePayment(receipt)` (one write: receipt in, data, `step1Completed`, `planId` and `termsAccepted` out), `readReceipt()`, `clearReceipt()`; `start(country)` and `discardData` drop the receipt. **UT-05** (FR-011, R6) — `frontend/src/app/core/session/quote-session.store*.ts`

## Phase 2: Stories S1–S4 (Frontend)

- [x] T007 [FE] US-03 `RichTextComponent` per ADR 0007: `@switch`/`@for` templates for paragraph, heading (levels shifted to `h3`–`h4`), lists, quote, text with bold/italic/underline, and links (new tab, `rel="noopener noreferrer"`). No `innerHTML`. **UT-08** (mapper and component) (FR-005) — `frontend/src/app/shared/ui/rich-text/**` (depends on T003)
- [x] T008 [FE] US-03 Guards and routes per [contracts/routes.md](contracts/routes.md): `noReceiptGuard` on step 1, plans and summary; `receiptGuard` on the new `confirmation` route; `summary` → `SummaryPage`. Delete `features/plan-list/summary-placeholder.page.ts`. **UT-06** (FR-012) — `frontend/src/app/features/quote-wizard/*.guard*.ts`, `frontend/src/app/app.routes.ts` (depends on T006)
- [x] T009 [FE] US-03 `SummaryPage` per the plan's chosen design and the ui-ux-guidelines Summary block and Checkbox recipes:
  - **Data:** loads the country, form fields and plans; builds rows (T004) and the plan offer with `simulatePrice`/`formatPrice` (US-02); a plan no longer offered → `clearPlan` and redirect to `plans`. Loading (skeletons, `aria-busy`) and error (`role="alert"`, "Reintentar") states.
  - **Layout:** "Revisa y asegúrate"; the stepper on "Resumen"; "Tus datos" and "Tu vehículo" side by side from 992 px and stacked below; the plan card full width (price with `*` and "/ mes" below the description); "Editar mis datos" and "Cambiar plan" top right of their cards; the load reveal.
  - **Acceptance:** custom checkbox, "*Acepto términos y condiciones" with the link opening a native `<dialog>` (`RichTextComponent`, "Cerrar", "Entendido", Esc, focus back to the link); no terms → error instead of the link and the CTA stays disabled; the state is saved with `acceptTerms`.
  - **Pay:** "Quiero mi seguro" disabled until accepted; `paymentState` per R7 (processing lock, `aria-busy`, "Procesando…"); rejected → error panel above the acceptance, data and acceptance kept, retry; approved → `completePayment(receipt)` then `navigate(['confirmation'], { replaceUrl: true })`.
  - **Focus:** the heading on load.
  - **UT-07**.
  (FR-001–FR-010, FR-013) — `frontend/src/app/features/summary/summary.page.*` (depends on T003–T008)
- [x] T010 [FE] US-03 `ConfirmationPage` per the Receipt recipe (option B): stepper with all steps done, the ticket with "Pago aprobado", quote number, plan, country, date and total (formatted with the receipt's currency and locale), "Nueva cotización" → `clear()` and `/`. Heading focused on load; the load reveal (FR-009, FR-011, FR-013) — `frontend/src/app/features/summary/confirmation.page.*` (depends on T006, T008)

## Phase 3: E2E, review, docs

- [x] T011 [E2E] US-03 E2E-5 per plan.md (CO full flow: masked cédula, price, CTA disabled, accept, "Procesando…", confirmation with `CO-` number, reload keeps it, Back never shows the CTA) (FR-001–FR-012, SC-003) — `frontend/e2e/us-03-*.spec.ts` (depends on T002, T009, T010)
- [x] T012 [ORCH] US-03 Update the README (terms and the masked flag in the admin, the simulated payment rule and test values) and check the quickstart (SC-002) — `README.md`
- [x] T013 [ORCH] US-03 Code review rounds recorded in `review.md`, then the handoff

## Phase 4: Review fixes (code review rounds 1–3)

- [x] T014 [CMS] US-03 R-01: the terms backfill runs once per database (core-store marker; a fresh seed sets it). Regression test "R-01 · marker present: no backfill even when terms are empty; marker absent: backfill runs" (FR-005, FR-014) — `cms/src/seed/countries.ts`, `cms/src/seed/summary-backfill.test.ts`
- [x] T015 [FE] US-03 R-02–R-09, R-12, R-13: terms need visible text, with regression test "R-02 · terms with no visible text block the payment"; pay button keeps focus and a rejection focuses the alert; test FR names; the missing UT-03 example; keyboard-scrollable terms dialog; overlay token; `aria-required` on the acceptance; single focus on dialog close; two tests beyond the approved examples removed (FR-006, FR-008, FR-010, FR-013) — `frontend/src/app/features/summary/**`, `frontend/src/app/shared/ui/rich-text/rich-text.mapper.ts`, `frontend/src/styles.scss`
- [x] T016 [FE] US-03 R-10, R-11 (human asked to fix both): a link nested in a link becomes its text, with regression test "R-10 · a link nested in a link becomes its text"; `formatAmount` exported from the US-02 pricing code and used by the summary instead of stripping " / mes" (FR-002, FR-005) — `frontend/src/app/shared/ui/rich-text/rich-text.mapper.ts`, `rich-text.spec.ts`, `frontend/src/app/features/plan-list/pricing/format-price.ts`, `frontend/src/app/features/summary/summary.page.ts`

## Phase 5: Gate 3 corrections (human, 2026-11-22)

- [x] T017 [CMS] US-03 Gate 3: the seeded terms drop their own heading (the dialog already has the title "Términos y condiciones") and the "datos ficticios" line, for CO and CL. A one-shot upgrade (second core-store marker, set on a fresh seed) replaces terms only when they still equal the first seed exactly; edited terms are kept. Regression test "Gate 3 · replaces only the untouched first seed (heading and mock-data line) with the current terms" (FR-005, FR-014) — `cms/src/seed/countries.ts`, `cms/src/seed/summary-backfill.test.ts`
- [x] T018 [FE] US-03 Gate 3: the confirmation heading says "¡Listo, ya estás asegurado!"; a rejected payment opens a modal alert dialog ("No pudimos procesar tu pago.", "Entendido", "Cerrar", Esc; no "Editar mis datos" button, per the human; the close button on its own row above the icon and title, the title 18 px below 576 px so it fits one line at 320 px; focus back to "Quiero mi seguro") instead of the inline alert. UT-07's FR-010 test and E2E-5 follow the new UI (FR-009, FR-010) — `frontend/src/app/features/summary/summary.page.*`, `confirmation.page.html`, `frontend/e2e/us-03-summary-payment.spec.ts`, `.claude/skills/ui-ux-guidelines/SKILL.md`

## Dependencies

- T001 → T002 (CMS chain, one agent), in parallel with the frontend foundation.
- T003, T004, T005 and T006 run in parallel.
- T003 → T007. T006 → T008. T003–T008 → T009. T006 + T008 → T010.
- T002 + T009 + T010 → T011 → T013.
