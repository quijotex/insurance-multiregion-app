# Research — US-02 Plan list

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

## R1 — Where the price is calculated
- **Decision:** in Angular, as a pure function `simulatePrice(basePrice, driverAge, vehicleAge, country)` in `features/plan-list/pricing/`. The bands come from the Country (CMS), and the ages come from the step 1 values saved in the tab.
- **Rationale:**
  - The spec keeps step 1 data in the tab and never sends it to a server (Assumptions). A server endpoint would need the birth date.
  - A pure function always gives the same price for the same inputs (FR-005), and a table of examples tests it.
- **Alternatives:**
  - A Strapi custom endpoint: it sends personal data and adds code.
  - Factors hard-coded in Angular: this breaks clarify Q2, which makes them editable per country.
  - See [ADR 0005](../../docs/adr/0005-simulated-price-rule-age-bands.md).

## R2 — How the age bands are stored
- **Decision:**
  - Country gets two repeatable components, `driverAgeBands` and `vehicleAgeBands`. Both use the type `pricing.age-band` (`fromAge`, `toAge`, `factor`).
  - The band order in the admin is the lookup order: the first band that covers the age wins (Edge Cases).
- **Rationale:** editors see the bands next to the country's currency. There is no new collection and no relation to forget.
- **Alternatives:**
  - A `PriceFactor` collection: one more relation that can be left empty.
  - A JSON field: no validation in the admin.

## R3 — Which step 1 values drive the price
- **Decision:** the field keys `birthDate` and `vehicleYear` (ADR 0004: keys are stable, and the price rule uses them).
  - **Driver age:** whole years on today's date, the same calculation as `legalAge`.
  - **Vehicle age:** the current year − `vehicleYear`, never below 0.
  - **Factor 1:** applies when the value is missing or can't be read, or when no band covers the age (Edge Cases).
- **Rationale:** labels change but keys do not. Both keys exist in the CO and CL seeds.

## R4 — Currency and number format
- **Decision:**
  - Country gains `currency` (ISO 4217, `^[A-Z]{3}$`) and `numberLocale` (BCP 47, `^[a-z]{2}-[A-Z]{2}$`).
  - Angular formats the price with `Intl.NumberFormat(numberLocale, { style: 'currency', currency, maximumFractionDigits: 0, minimumFractionDigits: 0 })` and adds " / mes" (FR-004).
  - Seed: CO `COP` / `es-CO`, CL `CLP` / `es-CL`, PE `PEN` / `es-PE`.
- **Rationale:**
  - `Intl` ships with the browser: no new dependency, and no Angular locale data to register.
  - COP has 2 decimals by default, so 0 decimals is forced.
- **Alternatives:** Angular `CurrencyPipe`. It needs `registerLocaleData` for each country, which hard-codes the country list.

## R5 — Existing databases
- **Decision:**
  - A bootstrap backfill, like the US-01 `legalAge` one: for each seeded country code, it sets `currency`, `numberLocale` and the bands only when they are empty. It never overwrites an edited value.
  - Plans are seeded only when the Plan collection is empty.

## R6 — Plan save check
- **Decision:**
  - Turn the US-01 Document Service middleware into one module that covers both content types:
    - **FormField:** needs a country, and its key is unique per country.
    - **Plan:** needs a country.
  - `readCountryPayload` is reused as is.
  - Message: "El plan debe tener un país."
- **Rationale:**
  - The ADR 0001 mitigation lives in one place.
  - The admin payload quirks fixed in T028 are already handled.

## R7 — Published plans only
- **Decision:**
  - The Plan `find` controller forces `status: 'published'`, as FormField does (US-01 R3).
  - Public gets only Plan `find`.

## R8 — Re-checking step 1 on step 2 (review R-19)
- **Decision:** `step1CompleteGuard` becomes async. Besides `step1Completed`, it loads the country's form fields and checks the saved values with the same validators as step 1:
  - It runs `buildValidators` on a throw-away `FormGroup`.
  - Saved select values go through US-01's `restoredValue` rule first.
  - **Values invalid:** the guard clears `step1Completed` and redirects to step 1, where the errors show (US-01 FR-005).
  - **Fields fail to load:** it redirects to step 1, which shows its error and retry. No value is lost.
- **Rationale:** both steps use one set of rules, so validation is not duplicated.

## R9 — Chosen plan in the session
- **Decision:** the chosen plan is stored as `data.planId` (the plan's `documentId`) in `quote-session`.
  - `saveStep1` keeps it, so the price is recalculated (Edge Cases).
  - `discardData` and a country change drop it.
  - On load, a `planId` that is not in the list is removed (FR-009).

## R10 — Selection control
- **Decision:** a native radio group, per the plan-card recipe:
  - A `<fieldset>` with a `<legend>`, and one `<input type="radio">` inside each card's `<label>`.
  - The arrow keys move between plans.
  - The chosen card shows "Seleccionado" with a check icon.
  - "Continuar" is disabled until a plan is chosen, with no hint text (FR-008, Gate 2).
  - Selection needs no text: the custom radio and the ring change, and nothing moves (no layout shift).
- **Alternatives:** buttons with `aria-pressed`. They have no arrow-key behaviour and need more ARIA to get right.

## R11 — Recommended badge
- **Decision:**
  - The mapper highlights only the first `recommended` plan in order (Edge Cases).
  - The badge text is fixed, "Recomendado". The radio label adds a visually hidden ", plan recomendado" (FR-006).
- **Alternatives:** badge text from the CMS. The recipe allows it, but the story doesn't need it, so it is not added.

## R12 — Where the price rule is documented
- **Decision:** the rule is not shown to the person (Gate 2). It is documented in three places:
  - [ADR 0005](../../docs/adr/0005-simulated-price-rule-age-bands.md).
  - A doc comment on `simulatePrice`, linking ADR 0005.
  - The Strapi `description` of the Country band fields and of the `pricing.age-band` component, so editors see what a factor does.

## R13 — Plan slider (below 992 px)
- **Decision:** `swiper` (core API, with the Navigation, Pagination, A11y and Keyboard modules), as the human asked at Gate 2.
  - Created in `afterNextRender` only when the viewport is below 992 px, and destroyed above that. From 992 px the same cards sit in a 3-column grid.
  - `loop: false`, no autoplay, `slidesPerView` about 1.2 (mobile) and 2.2 (tablet), centred on the recommended plan.
  - Arrows and dots are real buttons with Spanish labels.
  - Choosing a plan with the arrow keys calls `slideTo`.
  - The only motion is the step 1 load animation, which is off under `prefers-reduced-motion`.
- **Trade-off:** slides are separate boxes, so rows align exactly only in the desktop grid (CSS subgrid). In the slider the cards keep equal heights.
- **Alternatives:** the CSS scroll-snap slider from the mockup, which needs no dependency. The human preferred Swiper.
