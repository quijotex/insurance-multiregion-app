# Implementation Plan: US-00 – Country selection

**Branch**: `001-us-00-country-selection` | **Date**: 2026-11-22 | **Spec**: [spec.md](spec.md) (Approved Gate 1)

**Status**: Approved (Gate 2) — 2026-11-22

**Artifacts**: [research.md](research.md) · [data-model.md](data-model.md) · [contracts/](contracts/) · [quickstart.md](quickstart.md)

## Summary

Add a `Country` collection in Strapi (name, code, icon, order, active; draft & publish), seeded with Colombia, Chile and an inactive Perú, readable by the Public role through a `find` that always returns only active, published countries. In Angular, add the selection screen at `/`, the country-prefixed wizard shell at `/:country/quote` (header with active country and "Cambiar país", step 1 placeholder), a guard that resolves the country from the URL, and a per-tab session that remembers the last country and asks before discarding data.

## Technical Context

**Language/Version**: TypeScript 6, Angular 22.3 (standalone, zoneless, signals); Strapi 5.63 on Node 22
**Primary Dependencies**: none new — Angular router/HttpClient, native `<dialog>`, Strapi upload plugin (built-in)
**Storage**: SQLite (CMS); `sessionStorage` per tab (browser)
**Testing**: Vitest (unit), Playwright (approved E2E only)
**Target Platform**: Web, mobile-first (≥320 px) to desktop
**Project Type**: Web app — `frontend/` (Angular) + `cms/` (Strapi)
**Performance Goals**: selection screen usable < 2 s on a local stack
**Constraints**: same build for every country; no token in the browser; only `/api` and `/uploads` proxied
**Scale/Scope**: a handful of countries; 2 screens (selection, wizard shell)

## Constitution Check

| Principle | Status |
|-----------|--------|
| KISS / ask before over-engineering | ✅ One session key, native dialog, no state library; Country gets only US-00 fields (R8) |
| No new dependency without approval (§3.2) | ✅ None |
| Feature-first, cohesive files | ✅ `features/country-selection`, `features/quote-wizard`, `core/country`, `core/session` |
| High-value tests only | ✅ See Test plan; no tests for styles or scaffolding |
| BEM | ✅ Per ui-ux-guidelines recipes |
| Breaking API contract (§3.3) | ✅ New endpoint only |
| spec/plan ≤ 150 lines | ✅ |

Re-check after design: ✅ no violations, Complexity Tracking not needed.

## Project Structure

```text
cms/
├── src/api/country/            # schema.json (Country), controller with active filter (R1), routes, services
├── src/seed/                   # countries.ts + assets/co.svg, cl.svg (R2, R7)
└── src/index.ts                # bootstrap: Public find permission, seed, dev admin (R7)
frontend/
├── proxy.conf.json, nginx.conf # + /uploads proxy (R3)
└── src/app/
    ├── core/country/           # country.model.ts, country.mapper.ts, country.service.ts (cached list)
    ├── core/session/           # quote-session.store.ts (sessionStorage, R5)
    ├── shared/ui/confirm-dialog/  # native <dialog> wrapper (R6)
    ├── features/country-selection/   # selection page: list, states, Continue
    └── features/quote-wizard/  # shell (header + outlet), country guard (R4), switch-confirm guard (FR-012), step-1 placeholder
docker-compose.yml              # + ADMIN_EMAIL / ADMIN_PASSWORD dev defaults
```

**Structure Decision**: existing `frontend/` + `cms/` web-app layout; feature folders per angular-conventions.

## ADR changes

ADR 0001 is updated (*Accepted* with this Gate 2) to resolve the spec's conflicts:

1. Country fields: + `icon` (media), `order`, `active`; currency/locale/legal age/terms stay, added by the stories that use them.
2. Availability = published **and** active, enforced in the `find` controller (R1).
3. Countries sorted by `order`, not by name.
4. `/uploads/` proxied like `/api/` (R3).
5. Session: one `quote-session` key per tab, one country at a time; country change and same-tab links to another country ask before discarding data (R5, R6). Replaces "one key per country".
6. Last visited country preselected (kept).

No new ADR: the rest are implementation choices recorded in research.md.

## Design options

### Selection screen (`/`)

**Option A — Country tiles.** A centered form-card titled "¿Dónde quieres asegurar tu carro?" with large radio tiles (flag above name) in a 2-column grid, yellow "Continuar" pill below. Mobile: tiles stack. *Pros:* flags prominent, big touch targets. *Cons:* grid looks odd with 3+ countries or long names.

**Option B — Country list (recommended).** Same form-card, but countries are full-width radio rows (flag left, name, check on the right when selected), "Continuar" below. *Pros:* scales to any number of countries, simplest keyboard and screen-reader behavior (a native radio group in a `fieldset`), identical on mobile and desktop. *Cons:* less visual than tiles.

**Option C — Split hero.** Desktop: brand hero (headline + illustration) on the left, the list from B on the right; mobile: hero shrinks to a headline above the list. *Pros:* feels like a landing page. *Cons:* more layout and assets for an entry screen the person leaves in seconds.

**Recommendation:** B — it matches the scalability driver of ADR 0001 and keeps accessibility trivial.

**Chosen (Gate 2): Option A, adjusted by the human.** The brand bar sits on top, then the title "¿Dónde quieres asegurar tu carro?" and the subtitle "Elige tu país para ver los planes y precios". Below them come two large country buttons on the same line (flag above name), styled as follows:
- They are white with a grey border, and the country names are always black (`--color-text`).
- On hover only the border turns action blue. The background never darkens.
- The selected button gets a light blue fill and a check icon.
- Keyboard support: they form a radio group, so arrows move the selection and Space selects.

The "Continuar" yellow pill is centered below and disabled until a country is selected. With three or more countries, the buttons wrap to a new row.

### Wizard shell header (`/:country/quote`)

**Option A — Navy top bar (recommended).** Navy bar with the text wordmark on the left and a country chip (flag + name) with a secondary "Cambiar país" button on the right. Mobile: the chip shows the flag only, with the button. *Pros:* always visible, one consistent place for country context.

**Option B — Country line above the stepper.** White header with the wordmark; under it, "Cotizando en: [flag] Chile · Cambiar país" as a text link above the stepper. *Pros:* lighter. *Cons:* easier to miss; the link competes with the step content.

**Recommendation:** A. **Chosen (Gate 2): A — navy top bar.**

## E2E candidates

| ID | Flow | Justification | Decision |
|----|------|---------------|----------|
| E2E-1 | Open `/`, select Chile with the keyboard, press "Continuar", land on `/cl/quote` with Chile in the header | The entry point of every quote; crosses CMS, proxy, routing and keyboard access | **Rejected** (Gate 2) |
| E2E-2 | Open `/pe/quote` (seeded inactive) → selection screen with "not available" message | Shared links are a business channel; a broken one must never be a dead end | **Rejected** (Gate 2) |

No E2E for this story: the `e2e-tester` agent does not run. The brief's required full-flow e2e belongs to a later story (US-03).

Not proposed: preselection, case redirect, empty/error states — covered by unit tests.

## Test plan (unit, Vitest)

- `country.mapper`: code lower-casing, null icon, alt fallback (FR-001).
- `country guard`: available, unknown, inactive, upper-case redirect (FR-005, FR-006).
- `quote-session.store`: persist/read, preselect, discard, per-country switch (FR-011, FR-012).
- `switch-confirm guard`: no data → pass; data → confirm/cancel paths (FR-012).
- Selection page: Continue disabled until selection, preselection, loading/empty/error + retry (FR-003, FR-004, FR-010).
- Header: "Cambiar país" with/without data (FR-007).

## Revisions

### 2026-11-22 — Gate 2, round 1 (not approved)
- **Asked:** design options must be shown as interactive mockups, not text/ASCII; selection screen with the two countries as big buttons on the same line and "Continuar" centered below; header also as an interactive mockup; no E2E for this screen.
- **Changed:** E2E-1 and E2E-2 marked Rejected; selection direction set to two large side-by-side country buttons + centered "Continuar"; interactive mockups produced for the selection screen and both header options, pending the human's pick.

### 2026-11-22 — Gate 2, round 2 (approved)
- **Asked:** header option A; selection buttons without the dark hover, with the country names in black; subtitle changed to "Elige tu país para ver los planes y precios"; approved after that change.
- **Changed:** Design options record the chosen selection design and header A. Status is set to Approved (Gate 2). ADR 0001 is now Accepted.
