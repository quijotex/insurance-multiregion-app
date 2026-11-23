# Analysis — US-01 (speckit-analyze, automatic check from autopilot)

## Run 1 — 2026-11-22

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| E1 | Coverage (constrained field) | HIGH | tasks.md T003; data-model.md § Country | `Country.legalAge` is constrained (required, min 0, default 18), but T003 does not cite data-model.md | Cite data-model.md in T003 |
| E2 | Coverage (constrained field) | HIGH | tasks.md T002; data-model.md § Components | The component fields are named bare (`name` required, `label`/`value` required), so there is no `Entity.field` citation | Name the components (`FormValidations`, `FormValidator`, `FormOption`) in data-model.md and cite `Entity.field` in T002 |
| C1 | Underspecification | MEDIUM | plan.md § Project Structure; tasks.md T001, T007, T012 | The tasks touch files the plan's structure does not list: `shared/ui/stepper`, `shared/ui/select-field`, `cms/vitest.config.ts`, `seed/form-field-patterns.ts` | Acceptable: these follow the approved design and test plan. Mention them in the review, with no plan change (Gate 2 approved) |
| F1 | Inconsistency | LOW | plan.md § ADR changes | ADR 0004 still reads "Proposed; Accepted with this Gate 2", while the ADR itself is Accepted | Cosmetic; leave it, since the plan is approved |

**Coverage:** FR-001 to FR-014 all have at least one task (14/14). SC-001 (T016, T019), SC-002 (T015), SC-003 (T019, manual timing), SC-004 (T011, T015) and SC-005 (T014) are covered. There are no unmapped tasks: every task carries US-01 and an FR, SC or R reference.

**Constitution:** no violations. The new dependency (`vitest` in cms) was approved at Gate 2 (§3.2). The tests target logic only.

**Metrics:** 14 FR + 5 SC · 19 tasks · coverage 100% · ambiguities 0 · duplications 0 · critical 0 · high 2.

**Action:** E1 and E2 fixed in tasks.md (T002, T003). data-model.md now names the component entities; no constraint changed. Rerun.

## Run 2 — 2026-11-22

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Underspecification | MEDIUM | plan.md § Project Structure | Unchanged from run 1 | Kept as is |
| F1 | Inconsistency | LOW | plan.md § ADR changes | Unchanged from run 1 | Kept as is |

**Constrained-field coverage:**

| Field | Canonical location | Tasks | Notes |
|-------|-------------------|-------|-------|
| `Country.legalAge` | data-model.md § Country | T003 | Consistent (required, min 0, default 18) |
| `FormField.key`, `.label`, `.type`, `.required`, `.helpText`, `.placeholder`, `.errorMessage`, `.order`, `.section`, `.country`, `.validations`, `.options` | data-model.md § FormField | T005 (with the uniqueness rule in T006) | Consistent: regex, enums, min 1 and required flags match |
| `FormValidations.min`, `.max`, `.pattern`, `.validators` | data-model.md § Components | T002 | Consistent |
| `FormValidator.name`, `.value` | data-model.md § Components | T002 | Consistent |
| `FormOption.label`, `.value` | data-model.md § Components | T002 | Consistent |

**Metrics:** coverage 100% · critical 0 · high 0 · medium 1 · low 1. Implementation may start.
