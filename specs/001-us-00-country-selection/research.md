# Research — US-00 Country selection

Each entry: **Decision**, **Rationale**, **Alternatives considered**.

## R1. Who enforces "active" — the frontend filter or Strapi?
- **Decision:** Strapi. The `country` controller's `find` always adds `active = true` (published-only is already Strapi's REST default). The frontend never sends the filter.
- **Rationale:** With a client-side filter, anyone calling `/api/countries` without it would see inactive countries, and every client would have to remember it. Enforcing it on the server makes "only published and active" (FR-002) a property of the API, not of a query string.
- **Alternatives:** Filter in the query string (simplest, but not enforced); a separate route policy (more code for the same result).

## R2. Country icon: media field or text?
- **Decision:** Single media field `icon` (images only), served by Strapi under `/uploads/...`. The seed uploads two flag SVGs drawn for this project (`cms/src/seed/assets/`).
- **Rationale:** The business wants to manage "flag or icon" from Strapi (story context). A media field is the editor-friendly way; emoji flags do not render on Windows.
- **Alternatives:** Emoji (broken on Windows), icon key mapped to bundled assets (needs code per new country — violates SC-003).
- **To verify during implementation:** whether the Public role needs `plugin::upload` `find` to populate `icon`. If it does, grant only that action and document why.

## R3. How do media URLs reach the browser without exposing the CMS host?
- **Decision:** Proxy `/uploads/` like `/api/` (nginx in Docker, `proxy.conf.json` in dev). The app uses Strapi's relative `url` as-is.
- **Rationale:** Keeps the "browser talks only to its own origin" rule from ADR 0001 and avoids CORS.
- **Alternatives:** Absolute CMS URLs (leaks host, breaks in Docker), copying icons into the Angular bundle (not CMS-managed).

## R4. How is an unavailable country detected and reported?
- **Decision:** A route guard on `:country` loads the active countries, compares codes case-insensitively, and:
  - available but not lower case → redirect to the canonical lower-case URL;
  - unknown/inactive/unpublished → redirect to `/?unavailable=<code>`, and the selection screen shows the fixed "not available" message.
- **Rationale:** One place decides availability (FR-005, FR-006); the query parameter makes the message state shareable and testable without extra storage.
- **Alternatives:** Dedicated `/not-available` page (story requires the selection screen), router state (lost on reload).

## R5. Session data model per tab
- **Decision:** One `sessionStorage` key, `quote-session`, holding `{ countryCode, data }`. `countryCode` doubles as "last visited country" (FR-011). A tab holds one country at a time (FR-012).
- **Rationale:** `sessionStorage` is already per tab, so the "new tab opens directly, original tab keeps its data" rule (Clarification Q5) needs no code. One key is simpler than one per country and matches "one country per tab".
- **Alternatives:** One key per country (ADR 0001 original) — keeps data for countries the person left, which FR-007/FR-012 now discard anyway.

## R6. Confirmation before discarding data
- **Decision:** A shared confirm dialog on the native `<dialog>` element (`showModal()`), used by the header's "Cambiar país" (FR-007) and by a guard that runs when a tab with data for country A navigates to country B (FR-012).
- **Rationale:** Native modal dialogs give focus trapping, `Esc` to cancel and the right ARIA semantics without a new dependency.
- **Alternatives:** `window.confirm` (unstyled, not brandable), Angular CDK Dialog (new dependency — constitution §3.2).
- **Note:** In US-00 there is no form yet, so `data` is always empty and the dialog never appears in real use; it is verified with unit tests and becomes reachable with US-01.

## R7. Strapi bootstrap: permissions, seed and admin
- **Decision:** `cms/src/index.ts` bootstrap, idempotent:
  1. Grant Public `api::country.country.find` (only).
  2. If no countries exist: seed Colombia (`CO`, order 1), Chile (`CL`, order 2), both active and published with icons, and Perú (`PE`, order 3) published but **inactive**, to demo FR-006.
  3. If no admin exists: create one from `ADMIN_EMAIL` / `ADMIN_PASSWORD` (dev-only defaults in `docker-compose.yml`, documented in the README).
- **Rationale:** `docker compose up` must give a working app and admin with no manual steps (brief), and a fresh database gets identical permissions (strapi-conventions).
- **Alternatives:** Manual setup in the admin panel (not repeatable), Strapi data transfer files (opaque in review).

## R8. Fields beyond this story
- **Decision:** Country gets only what US-00 uses: `name`, `code`, `icon`, `order`, `active`. `currency`, `numberLocale`, `legalAge` and `termsAndConditions` (ADR 0001) are added by the stories that use them.
- **Rationale:** KISS; avoids seeding values no screen shows yet.
