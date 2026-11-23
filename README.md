# Multi-country car insurance quote

A single Angular app that quotes car insurance in **Colombia** and **Chile**, with every form field and plan managed from **Strapi**, built through an agentic flow with Claude Code and Spec Kit.

- **How it was built (the agentic flow):** [FLOW.md](FLOW.md)
- **Architecture decisions:** [docs/adr/](docs/adr/)
- **Specs per user story:** [specs/](specs/)

> **Status:** complete. All four stories (US-00 → US-03) are built, reviewed and approved at Gate 3.

> All data in this repository is fictitious. No real people, documents, plates, card data or credentials.

## Wizard steps

The brief asks for at least 3 steps and allows more if justified. We added one before them:

| Step | Story | Screen |
|------|-------|--------|
| 0 | US-00 | Country selection (`/`). Needed because the country comes from the URL prefix ([ADR 0001](docs/adr/0001-multi-country-content-strategy.md)): it is the entry point that leads to `/co/...` or `/cl/...`. |
| 1 | US-01 | Policyholder and vehicle data form |
| 2 | US-02 | Plan list |
| 3 | US-03 | Summary and payment |

US-00 keeps its own number so US-01 to US-03 match the brief's IDs one to one.

## Quick start

Requirements: Docker Desktop (with Docker Compose v2).

```bash
docker compose up --build
```

| URL | What |
|-----|------|
| http://localhost:4200/ | App, country selection |
| http://localhost:4200/co/quote | App, Colombia |
| http://localhost:4200/cl/quote | App, Chile |
| http://localhost:1337/admin | Strapi admin panel |

Seed data for both countries is loaded on the first start. The Strapi admin user is created automatically on the first start with **dev-only** credentials (see [Strapi admin user](#strapi-admin-user)).

To stop: `docker compose down`. To also reset the database: `docker compose down -v`.

## Local development (without Docker)

Requirements: Node.js 22+ and npm.

```bash
npm --prefix cms ci
npm --prefix frontend ci
cp cms/.env.example cms/.env   # then replace the placeholder secrets

npm --prefix cms run develop   # Strapi on http://localhost:1337
npm --prefix frontend start    # Angular on http://localhost:4200 (proxies /api to Strapi)
```

## Tests and checks

| Command | What it runs |
|---------|--------------|
| `npm --prefix frontend run verify` | Lint + typecheck + unit tests (Vitest) |
| `npm --prefix frontend run e2e` | Playwright e2e; starts Strapi and Angular itself |
| `npm --prefix frontend run e2e:docker` | Playwright e2e against the running Docker stack |
| `npm --prefix cms run build` | Strapi build and typecheck |
| `npm --prefix cms test` | CMS unit tests (Vitest): seed patterns, field and plan save rules, country pricing backfill |

## Repository structure

| Path | Content |
|------|---------|
| `frontend/` | Angular app (standalone components, signals, built-in control flow) |
| `cms/` | Strapi 5 project: content types, seed data, permissions |
| `docs/user-stories/` | Functional user stories, verbatim |
| `docs/adr/` | Architecture Decision Records |
| `specs/` | Spec, plan, tasks and review per user story |
| `.specify/` | Spec Kit: constitution, templates, scripts |
| `.claude/agents/`, `.claude/skills/` | Subagent and skill definitions |
| `.claude/settings.json` | Agent permissions (allowlist and hard limits) |
| `CLAUDE.md` | Global context file for all agents |
| `ai-logs/` | Unedited exports of the agent sessions |

## Strapi admin user

On the first start, Strapi creates a super admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if no admin exists yet. The dev-only defaults set in `docker-compose.yml` are fictitious:

| Field | Default (dev only) |
|-------|--------------------|
| Email | `admin@example.test` |
| Password | `DevOnly-Passw0rd` |

To use other values, put them in a root `.env` file, which is never committed. Locally (`npm --prefix cms run develop`), no admin is created unless both variables are set; Strapi then asks you to register one.

### Managing countries (US-00)

In the admin, go to **Content Manager › Country**. A country is offered on the selection screen when it is **published** and **Active** is on, and countries are listed by **Order**. To hide one, switch **Active** off or unpublish it. The seed includes Perú as published but inactive, so `/pe/quote` shows the "not available" message.

### Managing the step 1 form (US-01)

Go to **Content Manager › Form Field**. Each entry is one question of step 1 for one country, and changes show after a reload, with no deployment.

- **Add a field:** create an entry and set the following, then **Publish** it:
  - **Country** (required; a field without a country is rejected on save);
  - **Key**: a technical name in camelCase, unique within its country (e.g. `vehicleModel`);
  - **Label**, **Type** (`text`, `number`, `select`, `date`, `checkbox`), **Required**, **Help text**, **Placeholder** (an example such as `Ej: ABC123`) and **Error message**;
  - **Section** (`policyholder` = "Tus datos", `vehicle` = "Tu carro") and **Order**.
- **Reorder or relabel:** change **Order** (fields sort by it within their section) or **Label**, then publish.
- **Remove:** unpublish or delete the entry. It stops appearing and is no longer required.
- **Select options:** add entries under **Options** (label shown, value stored). They keep their list order.
- **Rules:** under **Validations**:
  - **Min** and **Max** apply to numbers.
  - **Pattern** is a regular expression for the whole value.
  - **Validators** are named rules the app implements:

| Name | Value | Checks |
|------|-------|--------|
| `rut` | — | Chilean RUT format and check digit |
| `legalAge` | — | Age ≥ the country's **Legal age** (Content Manager › Country) |
| `maxYearsAgo` | years, e.g. `20` | Year no earlier than current year − value |
| `maxYearsAhead` | years, e.g. `1` | Year no later than current year + value |

A validator name the app does not know is skipped, with a warning in the browser console, so the form keeps working. A new kind of rule needs a developer ([ADR 0001](docs/adr/0001-multi-country-content-strategy.md), "Limits of configurability"). The legal age is set once per country in the Country entry (seed: 18).

### Managing plans and prices (US-02)

Go to **Content Manager › Plan**. Each entry is one plan for one country. Changes show on step 2 after a reload, with no deployment.

- **Add a plan:** set the following, then **Publish** it:
  - **Country** (required; a plan without a country is rejected on save);
  - **Name**, **Short description** and **Base price** (whole pesos per month, in the country's currency);
  - **Coverages** and **Benefits** (one text each);
  - **Order**, **Recommended** and **Active**.
- **Hide a plan:** untick **Active**, or unpublish it.
- **Recommended:** only the first recommended plan in order gets the "Recomendado" badge.

**Prices** are simulated ([ADR 0005](docs/adr/0005-simulated-price-rule-age-bands.md)) and are not explained to customers:

```text
monthly price = base price × driver-age factor × vehicle-age factor   (rounded to a whole peso)
```

- Each country sets its **Currency** (e.g. `COP`), **Number locale** (e.g. `es-CO`) and two lists of age bands in **Content Manager › Country**: **Driver age bands** and **Vehicle age bands**. Each band has **From age**, **To age** and **Factor**.
- The first band that covers the age applies. With no band, the factor is 1.
- The seed uses these bands for both countries:
  - Driver age: under 25 → 1.20; 25–65 → 1.00; over 65 → 1.15.
  - Vehicle age: 0–5 years → 1.00; 6–10 → 1.10; 11–20 → 1.20.

### Managing the summary and payment (US-03)

- **Terms and conditions:** in **Content Manager › Country**, edit **Terms and conditions** (rich text: headings, paragraphs, bold, lists and links; images and code are not shown), then **Publish**. The summary shows only the published text, in a dialog opened from "términos y condiciones". A country with no terms cannot be paid ([ADR 0007](docs/adr/0007-rich-text-terms-without-html.md)).
- **Masked fields:** in **Content Manager › Form Field**, tick **Masked in summary** on the identity document field. The summary then shows only its last 4 characters (`••••••4050`). The seed sets it on Colombia's `documentNumber` and Chile's `rut`.

**Payment** is simulated in the browser ([ADR 0006](docs/adr/0006-simulated-payment-and-receipt.md)): no card data is asked for and nothing is charged or sent.

- A payment is **rejected** when the masked identity document ends in `0000` (dots and hyphens ignored), and **approved** otherwise.
- Test values: Colombia cédula `1020300000`, Chile RUT `10.006.000-0` (rejected); any other valid document (approved).
- An approved payment shows a quote number like `CO-20261122-7KQ4MZ` (country, date, 6 random characters). After that, the tab keeps only the receipt: the form data and the plan are cleared, and a reload or Back shows the confirmation again. "Nueva cotización" starts over.

## Security notes

- The browser never receives a Strapi token. It calls only relative `/api/...` URLs, proxied to Strapi by nginx (Docker) or the Angular dev server.
- The Strapi Public role can only `find` the content the wizard reads (see [ADR 0001](docs/adr/0001-multi-country-content-strategy.md)).
- Quote data never leaves the browser: the price and the simulated payment run in Angular, and the terms are rendered from Strapi blocks without HTML ([ADR 0007](docs/adr/0007-rich-text-terms-without-html.md)).
- The secrets in `docker-compose.yml` are dev-only placeholders. Override them with a root `.env` file for anything beyond local use.

## Known issues and notes

- **Google Fonts:** the Figtree font is loaded from the Google Fonts CDN, so each visitor's IP address is sent to Google. A self-hosted font would avoid it.
- **npm audit:** `npm audit` reports vulnerabilities in Strapi's transitive dependencies. They are not patched with `npm audit fix --force` because that would break Strapi's pinned versions.

## Requirements not met

None. The payment is simulated in the browser by design, as agreed for US-03 ([ADR 0006](docs/adr/0006-simulated-payment-and-receipt.md)): no card data is asked for and nothing is charged.
