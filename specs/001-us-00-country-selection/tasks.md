# Tasks: US-00 – Country selection

**Input**: [spec.md](spec.md) (Gate 1), [plan.md](plan.md) (Gate 2), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: unit tests from the plan's Test plan (Vitest). No E2E (rejected at Gate 2).

**Format**: `[ID] [P?] [Owner] [Story] Description (FR) — files`. `[P]` = no shared files with the other `[P]` tasks of the same phase. Owner: `[CMS]` cms-developer, `[FE]` frontend-developer, `[ORCH]` orchestrator (infra files outside `cms/` and `frontend/src/`). User story tags: US-00 (traceability ID); `S1`–`S3` = spec user stories.

## Phase 1: Setup

- [x] T001 [P] [CMS] US-00 Create the `Country` collection type per [data-model.md](data-model.md): `Country.name` (string, required), `Country.code` (string, required, unique, `^[A-Z]{2}$`), `Country.icon` (single media, images, optional), `Country.order` (integer, required, min 1), `Country.active` (boolean, required, default true); draft & publish enabled with core router/service, and a `find` controller that always adds `active = true` (FR-001, FR-002, R1) — `cms/src/api/country/**`
- [x] T002 [P] [ORCH] US-00 Proxy `/uploads/` to Strapi like `/api/` (R3) — `frontend/proxy.conf.json`, `frontend/nginx.conf`
- [x] T003 [P] [FE] US-00 Replace the Angular placeholder with a bare `<router-outlet />`; add design tokens and base typography from ui-ux-guidelines, Figtree from Google Fonts with system fallback; delete the scaffold `app.spec.ts` (constitution: no tests for scaffolding) — `frontend/src/styles.scss`, `frontend/src/index.html`, `frontend/src/app/app.*`

## Phase 2: Foundational (blocks the stories)

- [x] T004 [CMS] US-00 Idempotent bootstrap: grant Public `api::country.country.find` only (plus `plugin::upload` read only if populate needs it — verify and document, R2); seed CO (1), CL (2) active+published with flag SVGs drawn for the project, PE (3) published+inactive without icon; create dev admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if none exists (FR-001, R7) — `cms/src/index.ts`, `cms/src/seed/**` (depends on T001)
- [x] T005 [P] [FE] US-00 `Country` model, pure mapper (code → lower case, `iconUrl`, `iconAlt` falls back to name, null icon) with unit tests, and `CountryService` loading `GET /api/countries` with the contract query, cached as a signal-friendly list (FR-001, FR-002) — `frontend/src/app/core/country/**`
- [x] T006 [P] [FE] US-00 `QuoteSessionStore` over `sessionStorage['quote-session']` `{countryCode, data}`: read, start country, `hasData`, discard, clear; tolerant to corrupt JSON; unit tests (FR-011, FR-012, R5) — `frontend/src/app/core/session/**`
- [x] T007 [P] [FE] US-00 Shared confirm dialog on native `<dialog>` (`showModal`, Esc = cancel, focus returns to the trigger), resolving a boolean; BEM, Spanish copy via inputs (FR-007, FR-012, R6) — `frontend/src/app/shared/ui/confirm-dialog/**`

## Phase 3: S1 — Choose a country and enter the wizard (P1) 🎯 MVP

- [x] T008 [P] [FE] US-00 Selection page at `/` per the Gate 2 design: brand bar, title "¿Dónde quieres asegurar tu carro?", subtitle "Elige tu país para ver los planes y precios", choice tiles (native radios in a `fieldset`, flag above black name, light hover, selected = highlight + check + "Seleccionado"), centered "Continuar" CTA disabled until selection, navigates to `/:code/quote`; preselects the session country if available; loading, empty and error + "Reintentar" states; a single available country is still shown and must be selected explicitly; a country without icon shows its name only (Edge Cases); "not available" alert when `?unavailable=` is present; unit tests (FR-002, FR-003, FR-004, FR-006, FR-009, FR-010, FR-011) — `frontend/src/app/features/country-selection/**`
- [x] T009 [P] [FE] US-00 Wizard shell at `/:country/quote`: navy header option A (wordmark, country chip with icon + name — flag only on mobile, "Cambiar país" secondary button), step 1 placeholder showing the active country; app routes (`/`, `/:country/quote`, fallback → `/`) (FR-004, FR-005, FR-007) — `frontend/src/app/features/quote-wizard/**`, `frontend/src/app/app.routes.ts`

## Phase 4: S2 — Open the application directly in a country (P1)

- [x] T010 [FE] US-00 Country guard on `:country`: available → start session country; different case → redirect to lower case; unknown/inactive/unpublished → `/?unavailable=<code>` and clear the session; unit tests (FR-005, FR-006, Edge Cases) — `frontend/src/app/features/quote-wizard/country.guard*` (depends on T005, T006, T009)
- [x] T011 [FE] US-00 Switch-confirm guard: tab session holds data for another country → confirm dialog; confirm discards and continues, cancel returns to `/:previous/quote`; no data → pass; unit tests (FR-012) — `frontend/src/app/features/quote-wizard/switch-confirm.guard*` (depends on T006, T007, T010)

## Phase 5: S3 — Change the country after starting (P2)

- [x] T012 [FE] US-00 Header "Cambiar país": no data → `/` (session country preselected); data → confirm dialog, confirm discards data and goes to `/`, cancel stays; unit tests (FR-007, FR-011) — `frontend/src/app/features/quote-wizard/**` (depends on T007, T009)

## Phase 6: Polish

- [x] T013 [ORCH] US-00 Dev-only `ADMIN_EMAIL`/`ADMIN_PASSWORD` defaults in `docker-compose.yml`; README admin section (how to open the admin, toggle `active`, publish) — `docker-compose.yml`, `README.md` (depends on T004)
- [x] T014 [ORCH] US-00 Run quickstart scenarios 1–9 on `docker compose up --build`; record results in the handoff summary (FR-001–FR-012, SC-001–SC-004)

## Phase 7: Gate 3 corrections (human, 2026-11-22)

From the human's manual test and the request to fix every open review finding.

- [x] T015 [FE] US-00 R-05: replace raw colours in the wizard header with tokens (`--color-surface`, new overlay token in `styles.scss`) (FR-007) — `frontend/src/styles.scss`, `frontend/src/app/features/quote-wizard/quote-wizard.shell.scss`
- [x] T016 [FE] US-00 R-06: loading state as tile-shaped skeletons with `aria-busy` and a visually hidden "Cargando países…" (FR-010) — `frontend/src/app/features/country-selection/**`
- [x] T017 [FE] US-00 R-08: tests find buttons and controls by role / accessible name instead of CSS class (except the R-01 modifier assertion) — `frontend/src/app/features/**/*.spec.ts`
- [x] T018 [FE] US-00 R-09: after "Cambiar país" (and on every entry to `/`), focus moves to the selection heading (`tabindex="-1"`, `afterNextRender`), without a visible ring for programmatic focus; unit test (FR-009, SC-004) — `frontend/src/app/features/country-selection/**`
- [x] T019 [FE] US-00 Manual test 1: on desktop (≥ 768 px) the selection block (title, subtitle, tiles, Continuar) is centered horizontally and vertically in the space below the brand bar; tile content (flag + name) is centered in every tile and aligned across tiles (FR-002) — `frontend/src/app/features/country-selection/**`
- [x] T020 [FE] US-00 Manual test 2: remove the visible "Seleccionado" text (layout shift); selected = highlight background + border + check icon absolutely positioned in the tile's top-right corner, so selecting causes no layout shift; the checked state stays announced by the native radio (FR-003, FR-009) — `frontend/src/app/features/country-selection/**`, `.claude/skills/ui-ux-guidelines/SKILL.md` (choice-tile recipe)
- [x] T021 [FE] US-00 Manual test 3 (human picked option B from an interactive mockup): split layout on desktop (≥ 768 px). The left half has a light brand background with a flat SVG illustration drawn for the project (car, shield with check, soft blobs in brand blue, yellow and cyan; decorative `alt=""`) and the brand phrase "Tu carro protegido, en el país donde manejas.". The right half holds the selection block (title, subtitle, alert, tiles, Continuar), left-aligned and vertically centered. On mobile the illustration shrinks to about 150 px above the centered title and the phrase is hidden (FR-002, FR-009) — `frontend/public/images/selection-hero.svg`, `frontend/src/app/features/country-selection/**`
- [x] T022 [FE] US-00 Gate 3 (human): use Bootstrap 5.3 grid and utilities for every layout ([ADR 0003](../../docs/adr/0003-bootstrap-grid-for-layouts.md)). Add `bootstrap` (exact version), load `bootstrap-grid.min.css` and `bootstrap-utilities.min.css` in `angular.json` before `styles.scss`, cap `.container` at 1140 px, and refactor the selection page, the wizard shell and step 1 to use `.container`, `.row`/`.col-*` and the flex and spacing utilities, removing the hand-written layout rules. Components (tiles, buttons, dialog) keep their BEM and tokens. No visual regression on 320 px, 768 px or 1440 px — `frontend/package.json`, `frontend/angular.json`, `frontend/src/styles.scss`, `frontend/src/app/features/**`

FR-008 (later content comes from the selected country) is enforced structurally by the country prefix and verified by US-01 to US-03.

## Dependencies & waves

| Wave | Tasks | Agents |
|------|-------|--------|
| 1 | T001 → T004 · T003, T005, T006, T007 · T002 | cms-developer ∥ frontend-developer ∥ orchestrator |
| 2 | T008 ∥ (T009 → T010 → T011 → T012) | frontend-developer ×2 |
| 3 | T013, T014 | orchestrator |
| 4 (Gate 3) | T015 → T020, T021, T022 | frontend-developer |
