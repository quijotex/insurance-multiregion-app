# 0005 — Simulated price rule with age bands on Country

- **Status:** Proposed
- **Date:** 2026-11-22
- **Related:** US-02, ADR 0001 ("Limits of configurability"), ADR 0004 (field keys), `specs/003-us-02-plan-list/research.md` (R1–R4)

## Context and problem

Step 2 shows each plan's monthly price adjusted by step 1 data (US-02 FR-005). The clarify answers fix the rule as **base price × driver-age factor × vehicle-age factor**, rounded to a whole peso.
- The factors are editable per country from Strapi.
- The currency and number format live only on the Country.

Step 1 data (the birth date) stays in the tab and is never sent to a server. The rule is a simulation, not a real tariff, but it must be deterministic and documented.

## Decision drivers

- The business edits the factors without a deployment (clarify Q2).
- Personal data never leaves the browser (spec Assumptions).
- The same inputs always give the same price (FR-005), and the rule is easy to test.
- KISS: no rule engine, and no new dependency.

## Considered options

1. **Age bands on Country, price calculated in Angular** with a pure function.
2. **A Strapi custom endpoint** `POST /api/quotes/price` that receives the ages and returns the prices.
3. **A generic formula** stored in the CMS (JSON or an expression) and run by Angular.
4. **Factors hard-coded** in Angular per country.

## Decision

Chosen option: **1**.
- Country gets two repeatable components, `driverAgeBands` and `vehicleAgeBands`, with entries `{ fromAge, toAge, factor }`.
- Angular calculates `round(basePrice × driverFactor × vehicleFactor)`:
  - The ages come from the step 1 keys `birthDate` and `vehicleYear`.
  - The first band covering the age wins.
  - A missing value, or no matching band, gives factor 1.
- The price is formatted with `Intl.NumberFormat(country.numberLocale, { style: 'currency', currency: country.currency })` with 0 decimals.

**The rule is not explained to the person** (Gate 2): the page shows only the final monthly price. It is documented as an explicit decision in:
- this ADR;
- a doc comment on `simulatePrice` that links here;
- the Strapi `description` of the band fields and of the `pricing.age-band` component, so editors know what a factor does.

This meets every driver: editors change numbers in the admin, and nothing personal is sent. The function is pure and has a table of examples.

## Consequences

- **Positive:**
  - Factors, bands, currency and format are content.
  - A new country only needs its bands.
  - The rule is visible in one small, tested function.
- **Negative / trade-offs:**
  - The *shape* of the rule (two age factors, multiplied) is code. A new factor, such as the vehicle make, needs a developer. This is consistent with ADR 0001's limits of configurability.
  - The price is only a display price. It is not a server-trusted quote: anyone can change it in their own browser. That is acceptable for a simulation with no payment.
- **Follow-ups:**
  - US-03 shows the same `finalPrice` in the summary, reusing the function.
  - A real tariff would move the price to the server (option 2), which would also need a consent and privacy decision.

## Pros and cons of the options

### 1. Bands on Country, Angular calculates
- Good: no personal data sent; deterministic; editable; no new endpoint.
- Bad: the price can't be trusted server-side.

### 2. Strapi endpoint
- Good: one authoritative price; the rule is hidden.
- Bad: the birth date goes to the server; it needs a custom route, a permission, and error handling; it is overkill for a simulation.

### 3. Generic formula in the CMS
- Good: the most flexible.
- Bad: editors write code without validation; it needs an evaluator, which brings a dependency or a security risk; it is over-engineered.

### 4. Hard-coded factors
- Good: the simplest.
- Bad: it breaks clarify Q2 and ADR 0001 ("no country data hardcoded in Angular").
