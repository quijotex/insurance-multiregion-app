# Research — US-01 Policyholder and vehicle data form

Each entry gives the **Decision**, the **Rationale** and the **Alternatives considered**.

## R1. FormField schema: section only, or step and section?
- **Decision:** `section` is an enumeration (`policyholder`, `vehicle`), and there is no `step` attribute. Every FormField belongs to step 1.
- **Rationale:** Only step 1 is a configurable form. Step 2 (plans) and step 3 (summary) have fixed layouts, so `step` would always hold the same value (YAGNI). The order of the sections is fixed in code (policyholder first, then vehicle; FR-002), and fields are sorted by `order` within each section.
- **Alternatives:** `step` + `section` as in ADR 0001 (a dead attribute); free-text section names (typos would create stray sections).

## R2. Rejecting a field with no country, or a duplicate key, on save
- **Decision:** A Document Service middleware, registered in `register()`, runs on `create`/`update`/`publish` of `api::form-field.form-field`. It rejects the save with a validation error when:
  - the field has no country, or
  - another FormField of the same country already uses the same `key`.
- **Rationale:** Strapi 5 cannot mark a relation as required, and `unique` on `key` would be global rather than per country. The middleware is the mitigation ADR 0001 already recommended. The spec now requires it (Edge Cases).
- **Alternatives:** Lifecycle hooks (deprecated in favour of Document Service middlewares in Strapi 5); a custom admin plugin (over-engineering).

## R3. Reading form fields: query and enforcement
- **Decision:** `GET /api/form-fields?filters[country][code][$eq]=CO&sort[0]=section:asc&sort[1]=order:asc&populate[validations][populate][validators]=true&populate[options]=true`. The `form-field` `find` controller forces `status: 'published'`, as Country does since the US-00 review, so `?status=draft` cannot leak drafts. Public gets only `api::form-field.form-field.find`.
- **Rationale:** One request per country, and nothing extra is populated. The country filter is not a security boundary: every published field is public anyway.
- **Alternatives:** Populating the fields from Country (one request, but it couples the two caches and cannot be sorted by order).

## R4. Legal age
- **Decision:** Country gains `legalAge` (integer, min 0, required, default 18). It is seeded with 18 for CO, CL and PE. Because the country seed runs only on an empty database, a small idempotent step fills `legalAge` on existing countries that lack it. The country request adds `fields[2]=legalAge`.
- **Rationale:** Clarify Q5, which follows ADR 0001.

## R5. Forms API in Angular
- **Decision:** Typed Reactive Forms: a `FormGroup<Record<string, FormControl<string | boolean>>>` built at runtime from the descriptors, with `nonNullable` controls.
- **Rationale:** Stable and well known. Errors are shown on leaving the field or pressing Continuar (FR-005), which is a plain `touched || submitted` check. Signal Forms in Angular 22 would mean adopting a newer API for no gain in this story.
- **Alternatives:** Signal Forms (newer API, team unfamiliar, risk); a hand-written signal form (re-implements validation state).

## R6. Validators: a pure builder and a named-rule registry
- **Decision:** `buildValidators(field, context)` is a pure function that returns `ValidatorFn[]`:
  - `required`, `min`/`max` (numbers), `pattern` (anchored);
  - named rules from a registry: `rut`, `legalAge` (reads `context.legalAge`), `maxYearsAgo` (value 20), `maxYearsAhead` (value 1).
  - An unknown name is skipped with a `console.warn` naming the field and the rule (spec Edge Cases).
  - Each failing rule returns the error key `invalid`, and the UI always shows the field's single configured `errorMessage`.
  - Dates are compared with the person's local "today" (`yyyy-mm-dd` from `<input type="date">`).
- **Rationale:** ADR 0001 "Named validators need code". One function, unit-tested rule by rule (angular-conventions). One message per field matches the story ("the error message configured for it").
- **Alternatives:** One message per rule (needs a schema change, which the story does not ask for).

## R7. RUT check digit
- **Decision:** Normalise the value (remove dots and the hyphen, upper-case K), require 7–8 body digits plus a check character, then compute modulo 11 with weights 2..7 (11 → `0`, 10 → `K`). The seed pattern stays permissive (`^[0-9.]{7,10}-?[0-9kK]$`), and `rut` does the real check.
- **Rationale:** Clarify Q1.

## R8. Session persistence while typing
- **Decision:** `QuoteSessionStore` gains `readStep1()` and `saveStep1(values)`, stored under `data.step1` (`Record<string, string | boolean>`). Saving is wired to `form.valueChanges` (synchronous, so no debounce is needed). `hasData()` becomes "some saved value is non-empty", so an untouched form never triggers the US-00 discard dialog. Keys that no longer exist are ignored when the form is rebuilt.
- **Rationale:** Clarify Q4. One store and one key, as in US-00 R5.

## R9. Routes and step 2 placeholder
- **Decision:** These are children of `/:country/quote`:
  - `''` → `Step1FormPage`.
  - `'plans'` → `Step2PlaceholderPage`, which has a "Volver" link back to `''`.
  - The plans route has a `step1CompleteGuard`. It redirects to step 1 unless the session holds `data.step1Completed === true`. That flag is set by a valid "Continuar" and cleared by any later edit.
- **Rationale:** "No invalid data reaches step 2" (SC-002) has to hold for a typed URL as well, not only for the button.
- **Alternatives:** Re-validating against the CMS config inside the guard (a second request, duplicated logic).

## R10. Unknown field type or select without options
- **Decision:** The mapper drops fields whose `type` is not in the enum (with `console.warn`). A select with no options is rendered disabled with its help text, and its `required` validator still applies (spec Edge Cases). `checkbox` is supported, though the seed has none.
