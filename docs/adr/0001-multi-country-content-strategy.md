# 0001 — Multi-country content strategy (Strapi + Angular)

- **Status:** Proposed
- **Date:** 2026-11-21
- **Related:** US-01, US-02, US-03

## Context and problem

The same application and the same build must sell car insurance in Colombia and Chile. Each country has its own regulations, identity documents, currency, coverages, terms and copy, and the business team (non-technical) must be able to change form fields and plans from Strapi without a deployment.

So we need to decide two things:

1. **Strapi:** how content is differentiated by country.
2. **Angular:** how the app knows which country to render.

## Decision drivers

- Add a new country without touching code or schema.
- Each piece of content (a field, a plan) can be edited and published on its own.
- No country data hardcoded in Angular: currency, format, legal age and terms live in Strapi.
- One build for every country.
- Easy to test per country (e2e).

## Part 1 — Strapi: Country as a collection with relations

### Decision

Let's take a **Country as collection** approach, and **FormField** and **Plan** as collections too, with a many-to-one relation towards Country. All three use native draft/published.

- **Country** saves `code`, `name`, `currency`, `numberLocale` (e.g. `es-CO`), `legalAge` and `termsAndConditions`.
- **FormField** saves `key`, `label`, `type`, `required`, `helpText`, `errorMessage`, `order` and `step`/`section`, plus two components:
  - `validations`: `min`, `max`, `pattern`, and `validators` with name and value.
  - `options`: for selects.
  - `key` is the stable technical name of the field (e.g. `documentNumber`, `vehicleYear`, `birthDate`). Angular uses it as the form control name, and the summary (masking) and the price rule use it to find values. Labels can't play this role because the business edits them. Unique per country.
  - `type` is an enumeration: `text`, `number`, `select`, `date`, `checkbox`.
- **Plan** saves `name`, `shortDescription`, `basePrice`, `order`, `recommended`, `active`, and `coverages` and `benefits` as repeatable components.
  - **No `currency` on Plan, on purpose:** the user story lists currency as a plan attribute, but a plan can never be sold in a currency different from its country's. Keeping it only on Country removes a source of inconsistency (a Chilean plan in COP) and one field editors could get wrong. The plan's currency is always `plan.country.currency`.

The queries would be:

```
GET /api/countries?fields[0]=code&fields[1]=name&sort=name:asc

GET /api/form-fields?filters[country][code][$eq]=CO&sort=order:asc
    &populate[validations][populate][validators]=true&populate[options]=true

GET /api/plans?filters[country][code][$eq]=CO&filters[active][$eq]=true&sort=order:asc
    &populate[coverages]=true&populate[benefits]=true
```

Strapi's REST API returns only published documents by default, so "only published" needs no extra filter. Components aren't returned unless populated, so `populate` is explicit (never `populate=*`).

### Public role permissions

The browser only reads, so the Public role gets exactly:

| Content type | Action | Why |
|--------------|--------|-----|
| Country | `find` | Validate the URL prefix, get currency, locale, legal age and terms. |
| FormField | `find` | Build the step 1 form. |
| Plan | `find` | Show the step 2 plans. |

Nothing else: no `findOne` (the filtered list is enough), no `create`/`update`/`delete`, no tokens. Permissions are granted in code at bootstrap, so a fresh database gets the same setup.

### Why like that?

- **Scalable, supports future countries:** create the Country and its fields and plans, without touching code or schema.
- **Independent publish cycles:** each plan and each field has its own publish cycle.
- **No hardcoded data:** currency, format and terms and conditions have a place in Strapi.
- **Country on/off switch:** because Country uses draft/publish, unpublishing a country takes it out of `GET /api/countries`, so the app stops serving it. Changes to the terms and conditions also go through draft and publish instead of going live on save.

### Consequences and tradeoffs

- **Duplication:** each common field, like email, exists as many times as there are countries. On the other hand, that also gives a clear separation of data per country.
- **No atomic publication:** everything has to be published one by one, not all at once for a country. Mitigation: Strapi's Releases (only on paid subscriptions).
- **Risk of forgetting to assign new fields to their country:** Strapi 5 can't mark a relation as required, so it doesn't force fields or plans to be assigned to a Country. An unassigned field just never shows up anywhere, silently. Mitigation (recommended): validate in Strapi on save, using Document Service middleware, rejecting a FormField or Plan without a country.
- **Extra code for validations:** Angular must parse Strapi data into code validations, because Strapi only sends data, and Angular should apply strict, typed validations in code, especially for forms and input values.
- **Named validators need code:** rules relative to today (legal age, vehicle year) and algorithms (RUT check digit) can't be expressed with fixed `min`/`max`/`pattern`, so they are named validators with a value, e.g. `{ name: "maxYearsAgo", value: 20 }`. Each name has a function in Angular.

### Limits of configurability

What we found: Strapi only sends data, so every validation rule ends up as code in Angular.

- **No deployment needed:** add, remove, reorder or relabel fields; change required flags, help texts, error messages, options, `min`/`max` and `pattern`; use any named validator Angular already implements; add, edit, sort, highlight or deactivate plans.
- **Needs a developer (and a deployment):** a new kind of rule, e.g. another country's document check digit. That is new behavior, not configuration, so it stays within the requirement "change the form fields and the offered plans from Strapi without requesting a deployment".
- **Known risk:** an editor can type a validator name that Angular doesn't implement. Angular ignores it and logs a warning, so the form keeps working, but that rule is not applied.

## Part 2 — Angular: country from the path prefix

### Decision

How does Angular know which country to render? Let's take the **path prefix** approach for its simplicity, e.g. `/co/quote` and `/cl/quote`. The path must always have the prefix.

- The prefix is the country `code` in lower case (`/co` ↔ `CO`).
- `/` and any unknown or unpublished prefix (e.g. `/pe/quote`) **redirect** to the last country the user was visiting, saved in `sessionStorage`, if it is still active and available in `GET /api/countries`. As a fallback, if there is none, they redirect to the first country in that list (sorted by name). No country code is hardcoded.

### Advantages

- **Scalability:** a resolver or guard checks the code against `GET /api/countries`, not against an enum in code.
- **Separation of domains:** a `CountryContext` with a signal can feed each country separately, loading fields, plans, currency and the unique persistent key per country in `sessionStorage`.
- **Easy e2e per country:** just open each prefix.
- **Close to a production-ready solution:** in production, subdomains could be better and preferable, and they could be implemented without changing the current approach much.

### Tradeoff

- Changing the country in the middle of the wizard restarts it.
- A mistyped country in the URL silently lands on another country instead of showing an error. Acceptable because every page shows which country is active.

## Considered options (not taken)

### i18n in Strapi with a locale per country
- **Good:** built into Strapi, manageable from the admin panel, easy to publish and filter via API by locale.
- **Not taken because:** i18n is not designed for this business case; it is for translating the same content. For example, the Chilean RUT is not a translation of the Colombian cédula.

### Enum field for country
- **Good:** the simplest approach, easy to filter.
- **Not taken because:** it has a big problem for this business case: we can't save unique values per country (currency, locale, legal age, terms), which would force us to hardcode data in Angular. That doesn't make any sense.

### A single document per country
- **Good:** everything in one request (a strength, but also a weakness) and atomic publishing per country.
- **Not taken because:** it brings everything at once even if you only need one field, and it doesn't let editors use the draft/publish pattern per plan, only for the whole country document.
