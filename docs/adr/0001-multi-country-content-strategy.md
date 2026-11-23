# 0001 — Multi-country content strategy (Strapi + Angular)

- **Status:** Accepted (Gate 2, US-00 — 2026-11-22)
- **Date:** 2026-11-21
- **Related:** US-00, US-01, US-02, US-03
- **Amended:** Gate 2, US-01 — 2026-11-22 (FormField `section`, save validation, `legalAge`, published-only FormField `find`); Gate 2, US-02 — 2026-11-22 (Plan save check and published-only `find`, `plan.item` component, Country `currency`, `numberLocale` and age bands, ADR 0005); Gate 2, US-03 — 2026-11-22 (FormField `maskedInSummary`, Country `termsAndConditions` as `blocks`, ADRs 0006 and 0007)

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

- **Country** saves `code`, `name`, `icon` (media), `order`, `active`, `currency`, `numberLocale` (e.g. `es-CO`), `legalAge` and `termsAndConditions` (Strapi `blocks` rich text, rendered without HTML: [ADR 0007](0007-rich-text-terms-without-html.md), US-03). Each story adds the fields it uses (US-00: `code`, `name`, `icon`, `order`, `active`).
- **FormField** saves `key`, `label`, `type`, `required`, `helpText`, `placeholder`, `errorMessage`, `order` and `section` (`policyholder` | `vehicle`; no `step`, because only step 1 is a configurable form), plus two components:
  - `validations`: `min`, `max`, `pattern`, and `validators` with name and value.
  - `options`: for selects.
  - `key` is the stable technical name of the field (e.g. `documentNumber`, `vehicleYear`, `birthDate`). Angular uses it as the form control name, and the price rule uses it to find values. Masking on the summary does **not** use keys (Chile's document key is `rut`, Colombia's `documentNumber`): FormField has a `maskedInSummary` boolean that editors set (US-03), which also marks the identity document for the simulated payment rule ([ADR 0006](0006-simulated-payment-and-receipt.md)). Labels can't play this role because the business edits them. Unique per country.
  - `type` is an enumeration: `text`, `number`, `select`, `date`, `checkbox`.
- **Plan** saves `name`, `shortDescription`, `basePrice`, `order`, `recommended`, `active`, and `coverages` and `benefits` as repeatable components.
  - `coverages` and `benefits` use one component, `plan.item` (`text`). The recommended badge text is fixed in Angular (US-02).
  - **No `currency` on Plan, on purpose:** the user story lists currency as a plan attribute, but a plan can never be sold in a currency different from its country's. Keeping it only on Country removes a source of inconsistency (a Chilean plan in COP) and one field editors could get wrong. The plan's currency is always `plan.country.currency`.

The queries would be:

```
GET /api/countries?fields[0]=name&fields[1]=code&sort=order:asc
    &populate[icon][fields][0]=url&populate[icon][fields][1]=alternativeText

GET /api/form-fields?filters[country][code][$eq]=CO&sort=order:asc
    &populate[validations][populate][validators]=true&populate[options]=true

GET /api/plans?filters[country][code][$eq]=CO&filters[active][$eq]=true&sort=order:asc
    &populate[coverages]=true&populate[benefits]=true
```

Strapi's REST API returns only published documents by default, but `?status=draft` would override it, so the Country and FormField `find` controllers force `status: 'published'`. Components aren't returned unless populated, so `populate` is explicit (never `populate=*`).

`currency` (ISO 4217) and `numberLocale` (e.g. `es-CO`) live on Country (US-02), together with the price factors as two repeatable `pricing.age-band` components, `driverAgeBands` and `vehicleAgeBands` (see [ADR 0005](0005-simulated-price-rule-age-bands.md)). The Plan `find` controller also forces `status: 'published'` (US-02).

`legalAge` lives on Country (US-01). The birth-date field enables the named validator `legalAge`, which reads the active country's value, so the age is set once per country.

A country is **available** when it is published **and** `active`. The `active` filter is enforced by the Country `find` controller, not sent by the browser, so no client can list inactive countries by omitting it.

Icons are Strapi media served under `/uploads/`, which is proxied like `/api/` (nginx in Docker, the dev-server proxy locally), so the browser still talks only to its own origin.

### Public role permissions

The browser only reads, so the Public role gets exactly:

| Content type | Action | Why |
|--------------|--------|-----|
| Country | `find` | List the selection screen, validate the URL prefix, get currency, locale, legal age and terms. |
| FormField | `find` | Build the step 1 form. |
| Plan | `find` | Show the step 2 plans. |

Nothing else: no `findOne` (the filtered list is enough), no `create`/`update`/`delete`, no tokens. Permissions are granted in code at bootstrap, so a fresh database gets the same setup.

### Why like that?

- **Scalable, supports future countries:** create the Country and its fields and plans, without touching code or schema.
- **Independent publish cycles:** each plan and each field has its own publish cycle.
- **No hardcoded data:** currency, format and terms and conditions have a place in Strapi.
- **Country on/off switch:** a country is offered only when it is published and `active`. Editors can switch it off with `active` without unpublishing its content, or unpublish it. Changes to the terms and conditions also go through draft and publish instead of going live on save.

### Consequences and tradeoffs

- **Duplication:** each common field, like email, exists as many times as there are countries. On the other hand, that also gives a clear separation of data per country.
- **No atomic publication:** everything has to be published one by one, not all at once for a country. Mitigation: Strapi's Releases (only on paid subscriptions).
- **Risk of forgetting to assign new fields to their country:** Strapi 5 can't mark a relation as required, so it doesn't force fields or plans to be assigned to a Country. An unassigned field just never shows up anywhere, silently. Mitigation (implemented for FormField in US-01): a Document Service middleware rejects, on create, update and publish, a FormField without a country or with a `key` already used in its country. The same middleware rejects a Plan without a country (US-02).
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
- `/` is the **country selection screen** (US-00): it lists the countries returned by `GET /api/countries` in their configured order, with the last country the user was visiting (saved in `sessionStorage`) preselected, if it is still active and available. No country code is hardcoded.
- Any unknown, inactive or unpublished prefix (e.g. `/pe/quote`) **redirects** to `/` with a message explaining that the country is not available.
- **Session per tab:** one `sessionStorage` key per tab holds the active country and its wizard data, so a tab works with one country at a time. Changing the country from the wizard, or opening another country's link in the same tab, asks for confirmation before discarding the data. A link opened in a new tab starts its own session and leaves the other tab untouched.

### Advantages

- **Scalability:** a resolver or guard checks the code against `GET /api/countries`, not against an enum in code.
- **Separation of domains:** a `CountryContext` with a signal can feed each country separately, loading fields, plans and currency, while the tab's `sessionStorage` session keeps the data of the active country.
- **Easy e2e per country:** just open each prefix.
- **Close to a production-ready solution:** in production, subdomains could be better and preferable, and they could be implemented without changing the current approach much.

### Tradeoff

- Changing the country in the middle of the wizard restarts it, after the person confirms that their data will be discarded.
- A mistyped country in the URL sends the user to the selection screen instead of showing an error. Acceptable because the user picks the country again in one click.

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
