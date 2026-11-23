# Data model — US-02 Plan list

The source of truth is `cms/src/api/**/schema.json`. The Angular models in `features/plan-list/data/` and `core/country/` mirror it, and change in the same commit.

## Plan (new collection `api::plan.plan`, draft & publish)

| Attribute | Type | Rules |
|-----------|------|-------|
| `name` | string | required |
| `shortDescription` | string | required, maxLength 160 |
| `basePrice` | integer | required, min 0 (whole pesos, monthly) |
| `coverages` | component `plan.item`, repeatable | may be empty |
| `benefits` | component `plan.item`, repeatable | may be empty |
| `order` | integer | required, min 1 |
| `recommended` | boolean | default false |
| `active` | boolean | required, default true |
| `country` | relation many-to-one → Country | required by the save check (R6) |

**Component `plan.item`:** `text` (string, required, maxLength 120).

## Country (changes)

| Attribute | Type | Rules |
|-----------|------|-------|
| `currency` | string | required, `^[A-Z]{3}$` |
| `numberLocale` | string | required, `^[a-z]{2}-[A-Z]{2}$` |
| `driverAgeBands` | component `pricing.age-band`, repeatable | order = lookup order |
| `vehicleAgeBands` | component `pricing.age-band`, repeatable | order = lookup order |

**Component `pricing.age-band`:**
- `fromAge`: integer, required, min 0.
- `toAge`: integer, required, min 0.
- `factor`: decimal, required, min 0.01.

A band covers an age when `fromAge ≤ age ≤ toAge`.

**Seed bands (both countries):**

| Band | Ages | Factor |
|------|------|--------|
| Driver | 0–24 | 1.20 |
| Driver | 25–65 | 1.00 |
| Driver | 66–120 | 1.15 |
| Vehicle | 0–5 | 1.00 |
| Vehicle | 6–10 | 1.10 |
| Vehicle | 11–20 | 1.20 |

**Seed plans (fictitious):**

| Country | Plan | Base price | Notes |
|---------|------|-----------|-------|
| CO | Básico | 89.000 | |
| CO | Plus | 145.000 | recommended |
| CO | Total | 210.000 | |
| CO | Clásico | 99.000 | inactive |
| CL | Esencial | 24.990 | |
| CL | Plus | 39.990 | recommended |
| CL | Full | 59.990 | |

Each plan has 2 to 5 coverages and 1 to 3 benefits.

## Angular models

- **`Country`** gains `currency: string`, `numberLocale: string`, `driverAgeBands: AgeBand[]` and `vehicleAgeBands: AgeBand[]`.
  - The mapper drops a band with `fromAge > toAge` or `factor ≤ 0`.
  - Missing bands become `[]`, which gives factor 1.
- **`Plan`** has `id` (the documentId), `name`, `shortDescription`, `basePrice`, `coverages: string[]`, `benefits: string[]` and `highlighted: boolean`.
  - `highlighted` is true only for the first recommended plan in order.
  - A DTO without a finite `basePrice ≥ 0` is dropped.
- **`PlanOffer`** (view model) has `plan`, `finalPrice` (integer) and `formattedPrice` ("$ 145.000 / mes").

## Quote session (`sessionStorage['quote-session']`)

```text
{ countryCode, data: { step1: {…}, step1Completed?: true, planId?: string } }
```

- New methods: `savePlan(id)`, `readPlanId()`, `clearPlan()`.
- `saveStep1` keeps `planId`.
- `discardData` and `start(otherCountry)` drop it.

## Price rule (FR-005, ADR 0005)

```text
finalPrice = round(basePrice × factor(driverAge, driverAgeBands) × factor(vehicleAge, vehicleAgeBands))
factor(age, bands) = first band with fromAge ≤ age ≤ toAge → its factor; none, or age unknown → 1
```

Example: base 145.000, driver aged 22 (factor 1.20), vehicle 8 years old (factor 1.10) → 191.400.
