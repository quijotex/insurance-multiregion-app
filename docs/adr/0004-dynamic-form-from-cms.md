# 0004 — Dynamic step 1 form built from CMS field descriptors

- **Status:** Accepted (Gate 2, US-01 — 2026-11-22)
- **Date:** 2026-11-22
- **Related:** US-01, ADR 0001 ("Named validators need code", "Limits of configurability"), `specs/002-us-01-policyholder-vehicle-form/research.md` (R5, R6, R8, R9)

## Context and problem

Step 1 has no fixed fields. Its fields, order, options, rules and messages come from Strapi per country (ADR 0001), and the business changes them without a deployment. Angular has to turn that data into an accessible, strictly validated form. It must keep what the person typed across reloads, and never let invalid data reach step 2.

## Decision drivers

- No country-specific code in Angular, except named rules that genuinely need an algorithm.
- Validation logic must be testable as pure functions (angular-conventions).
- Use a stable, well-known forms API, with no new dependency (constitution §3.2).
- An unknown configuration must never block the person.

## Considered options

1. **Typed Reactive Forms built at runtime from descriptors**, with a pure `buildValidators` and a registry of named rules.
2. **Signal Forms** (Angular's newer forms API).
3. **A JSON-schema form library** (for example Formly).

## Decision

Option 1.
- **Mapper:** `mapFormFields` maps the Strapi DTOs to `FormFieldDescriptor`s. It drops unknown types with a warning and groups the fields by `section`.
- **Validators:** `buildValidators(descriptor, { legalAge, today })` returns the Angular validators:
  - built-in: `required`, `min`, `max`, anchored `pattern`;
  - named, from a registry keyed by name: `rut`, `legalAge`, `maxYearsAgo`, `maxYearsAhead`.
  - An unknown name is skipped, with `console.warn`.
- **Error display:** a field shows its single configured `errorMessage` when it is `invalid && (touched || submitted)`. Once shown, the message follows the value live (spec FR-005).
- **Persistence:** every change is saved to the quote session (`data.step1`), and the values are restored when the form is rebuilt; keys that no longer exist are ignored. A valid "Continuar" sets `step1Completed`, which a guard on step 2 requires.

## Consequences

- **Positive:**
  - A new field, option, pattern or min/max needs no code.
  - Each rule is a small tested function.
  - The form never breaks on an unknown rule.
- **Negative / trade-offs:**
  - One error message per field, not one per rule. Editors write a message that covers every rule on the field.
  - A new kind of rule (for example another country's document check digit) still needs a developer, as already stated in ADR 0001.
  - Values are kept as strings (or booleans for checkboxes). Numbers and dates are parsed inside the validators, and later steps parse again if they need to.
- **Follow-ups:**
  - Revisit Signal Forms when the team adopts it across the app.

## Pros and cons of the other options

### Signal Forms
- Good, because it fits the signal-based state.
- Bad, because the team does not know it yet and it adds risk to the core step for no functional gain.

### Formly (or similar)
- Good, because it renders from JSON out of the box.
- Bad, because it is a new dependency, uses its own JSON shape that differs from our Strapi schema, and harder to style with our BEM recipes.
