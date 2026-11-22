# Review — 001-us-00-country-selection (US-00)

## Round 1 — 2026-11-22

Range reviewed: `706529f..HEAD` (11 commits). Verification: `npm --prefix frontend run verify` passed (lint, typecheck, 42 tests in 6 files). `npm --prefix cms run build` passed.

| ID | Severity | Location | Finding | Rule/FR | Status | Resolution |
|----|----------|----------|---------|---------|--------|------------|
| R-01 | Major | frontend/src/app/features/quote-wizard/quote-wizard.shell.scss:45-55, quote-wizard.shell.html:6-11 | Below 576px the country name is always visually hidden, because the chip is meant to show only the flag. For a country without an icon (a valid configuration per the Edge Cases), the header then shows no visible active country on mobile, only "Cambiar país". | FR-007 (every step shows the active country), Edge Case "Country without an icon: shown with its name only" | Open | Hide the name on narrow screens only when an icon is rendered, e.g. add a `wizard-header__country--with-icon` modifier when `country.iconUrl` is set and scope the visually-hidden rule to it. Add one shell test: no icon → the name is visible (no hiding modifier). |
| R-02 | Minor | cms/src/api/country/controllers/country.ts:6-12 | The controller forces `active = true` but leaves `status` open to the client. Strapi 5 REST accepts `?status=draft`, so a Public caller may be able to list draft (unpublished) countries. That would undercut R1's rationale ("availability is a property of the API, not of a query string"). The impact is low for US-00, but the same pattern will be copied for Plan and FormField (draft prices and terms). | Research R1, ADR 0001 (available = published **and** active), FR-002 | Open | In `find`, also set `ctx.query.status = 'published'` (dropping any client value). Check by hand with `curl '/api/countries?status=draft'`. |
| R-03 | Minor | frontend/src/app/features/country-selection/country-selection.page.scss:106-109 | Hovering a tile also changes the background (`--color-surface-alt`). The design chosen at Gate 2 says "On hover only the border turns action blue. The background never darkens." | plan.md › Design options › Chosen (Gate 2) | Open | Remove `background` from `.choice-tile:hover` (keep the border change only). |
| R-04 | Minor | frontend/src/app/features/country-selection/country-selection.page.html:44; quote-wizard.shell.html:8 | The flag sits next to the visible country name, so it is decorative, but it gets `alt="Bandera de X"`. Each radio's accessible name is then "Bandera de Chile Chile (Seleccionado)" and the header chip reads "Bandera de Chile Chile". | ui-ux-guidelines §6 (decorative images `alt=""`), FR-009 (clear accessible name) | Open | Use `alt=""` on the flag in the tile and in the header chip, where the name is always in the DOM. `iconAlt` can stay in the model for future uses where the flag stands alone. |
| R-05 | Minor | frontend/src/app/features/quote-wizard/quote-wizard.shell.scss:59-75 | Raw colour values in a component (`#fff`, `rgba(255, 255, 255, 0.12)`). | ui-ux-guidelines §1 ("Components use tokens only — no raw hex values") | Open | Use `var(--color-surface)` for the white border and text, and add a token for the hover overlay (or use an existing one). |
| R-06 | Minor | frontend/src/app/features/country-selection/country-selection.page.html:16-18 | The loading state is a text line, while the guidelines ask for skeletons shaped like the final content (two tile placeholders). | ui-ux-guidelines §3 States › Loading; angular-conventions (three async states) | Open | Render two `.choice-tile--skeleton` placeholders inside a region with `aria-busy="true"` and a visually hidden "Cargando países…". |
| R-07 | Minor | frontend/src/app/app.ts:4-9 | The root component has no `changeDetection: ChangeDetectionStrategy.OnPush`. | angular-conventions › Components (OnPush) | Open | Add OnPush to `App`. |
| R-08 | Minor | frontend/src/app/features/quote-wizard/quote-wizard.shell.spec.ts:14-16; country-selection.page.spec.ts:44-46 | The tests find controls by CSS class (`.wizard-header__change`, `.button--cta`) instead of by role or label. A styling rename breaks the tests even though behaviour is unchanged. | angular-conventions › Testing ("DOM queries by role/label") | Open | Find buttons by their text or accessible name (as the "Reintentar" test already does). |
| R-09 | Minor | frontend/src/app/features/country-selection/country-selection.page.ts:34-36 | After "Cambiar país", the selection screen opens with focus left on `body`. A keyboard or screen-reader user gets no cue that the view changed, which is inconsistent with step 1 (`step1-placeholder.page.ts`), where focus moves to the heading. | angular-conventions › Accessibility (move focus to heading on view change), SC-004 | Open | Give the `h1` `tabindex="-1"` and focus it with `afterNextRender`, as the step 1 placeholder does. |

### Spec conformance summary
- FR-001–FR-006, FR-009–FR-012: implemented and covered by unit tests (mapper, store, guards, page, shell, dialog). FR-008 is deferred to US-01–US-03 by the spec, which is correct.
- Public role: only `api::country.country.find`. No `findOne`, no write actions, and no upload permission needed (icons render through `/uploads`). The browser uses only the relative `/api` and `/uploads` paths, and no token exists in the frontend. Dev admin credentials are fictitious, dev-only defaults documented in the README. No extra scope was built.

### For the human to check by hand
1. **Scenario 8 (not run):** in the admin, switch Chile's **Active** off, reload `/` (Chile gone) and `/cl/quote` (redirect with "not available" message). Then unpublish Colombia and confirm the same behaviour. Restore both afterwards.
2. **`?status=draft` (R-02):** with a draft country saved, run `curl 'http://localhost:8080/api/countries?status=draft'` to see whether drafts leak.
3. **Confirm dialog paths (FR-007 / FR-012):** these cannot be reached in US-00 because the session data is always empty, so they are verified only by unit tests. Re-test by hand once US-01 writes data: same-tab link to the other country (confirm and cancel), "Cambiar país" with data, Esc to cancel, and focus returning to the trigger.
4. **Screen reader pass:** listen to the radio group (legend "País" plus the tile names) and the `role="alert"` announcement of the "not available" message.
5. **Mobile header without icon (R-01):** after the fix, create a country with no icon and check the header at 320px.

**Verdict: Changes requested** (R-01 Major; R-02–R-09 Minor, fix or justify as Won't fix in round 2).

## Round 2 — 2026-11-22

Range reviewed: fix commits `144e6aa`, `16d7eb2`, `dc3f7df`, `5d7c771` (full feature range `706529f..HEAD` re-checked for regressions). Verification: `npm --prefix frontend run verify` passed (lint, typecheck, 43 tests in 6 files). `npm --prefix cms run build` passed.

| ID | Severity | Location | Finding | Rule/FR | Status | Resolution |
|----|----------|----------|---------|---------|--------|------------|
| R-01 | Major | quote-wizard.shell.html:6, quote-wizard.shell.scss:45, 80 | Country name hidden on mobile even without an icon. | FR-007, Edge Case "no icon" | Resolved (144e6aa) | The name is hidden only under `wizard-header__country--with-icon`, a class added only when `iconUrl` is set, and the `min-width: 576px` reset uses the same selector. A new shell test covers the no-icon case. |
| R-02 | Minor | cms/src/api/country/controllers/country.ts:11 | `?status=draft` could list unpublished countries. | Research R1, ADR 0001 | Resolved (5d7c771) | `find` now forces `status: 'published'` after spreading the client query, so the client value is overwritten. The orchestrator checked at runtime that a draft-only country is no longer listed. |
| R-03 | Minor | country-selection.page.scss:106 | Tile hover changed the background. | plan.md › Design options › Chosen | Resolved (16d7eb2) | Hover now changes only the border colour. |
| R-04 | Minor | country-selection.page.html:45; quote-wizard.shell.html:8 | Decorative flags had a non-empty alt, so names were read twice. | ui-ux-guidelines §6, FR-009 | Resolved (144e6aa, 16d7eb2) | Both images use `alt=""`. The name is always in the DOM next to them (visually hidden at most). The shell test was updated. |
| R-05 | Minor | quote-wizard.shell.scss:59-75 | Raw colours (`#fff`, `rgba(255,255,255,0.12)`) in a component. | ui-ux-guidelines §1 | Open | Not fixed. It does not block the gate. Fix it in a follow-up (Gate 3 task or the next story touching the header): use `var(--color-surface)` and add an overlay token. |
| R-06 | Minor | country-selection.page.html:16-18 | Loading state is text, not a skeleton. | ui-ux-guidelines §3 States › Loading | Open | Not fixed. It does not block the gate, because the loading, error and empty states all exist and work. Use the skeleton when a shared skeleton component is introduced. |
| R-08 | Minor | quote-wizard.shell.spec.ts:21-23, 55-58; country-selection.page.spec.ts:44-46 | Tests query by CSS class instead of role or label. The new R-01 test also relies on the BEM class, which is unavoidable there because it asserts the hiding modifier. | angular-conventions › Testing | Open | Not fixed. It does not block the gate. Change the button lookups to find by accessible name when these specs are next edited. |
| R-09 | Minor | country-selection.page.ts:34-36 | After "Cambiar país", focus is left on `body` instead of the heading. | angular-conventions › Accessibility, SC-004 | Open | Not fixed. It is the most user-relevant of the open items (keyboard and screen-reader users). I recommend adding it as a Gate 3 task: `h1 tabindex="-1"` plus `afterNextRender` focus, as in `step1-placeholder.page.ts`. |

R-07 (Minor, `app.ts` OnPush): **Resolved (dc3f7df)**. `App` now declares `ChangeDetectionStrategy.OnPush`.

No new Blocker or Major findings. The fixes are small and scoped, and none of them introduced a regression. The Public role, token-free frontend and relative URLs are unchanged.

### For the human to check by hand
1. **Scenario 8 (not run):** in the admin, switch Chile's **Active** off, reload `/` (Chile gone) and `/cl/quote` (redirect with the "not available" message). Then unpublish Colombia and confirm the same behaviour. Restore both afterwards.
2. **Confirm dialog paths (FR-007 / FR-012):** still reachable only once US-01 writes session data. Re-test then: a same-tab link to the other country (confirm and cancel), "Cambiar país" with data, Esc to cancel, and focus returning to the trigger.
3. **Screen reader pass:** the radio group should read as legend "País" plus the tile names, with no "Bandera de…" prefix now. Also check the header chip (name only) and the `role="alert"` "not available" message.
4. **Mobile header without icon (R-01):** create a country with no icon and check at 320px that its name is visible. A country with an icon should show only the flag below 576px.
5. **Focus after "Cambiar país" (R-09, open):** note that focus currently stays on `body`. Decide whether to add it as a Gate 3 task.

(The `?status=draft` check from round 1 has been dropped because the orchestrator verified it at runtime for R-02.)

**Verdict: Approved** (all Blocker and Major findings resolved; R-05, R-06, R-08 and R-09 remain Open as Minor follow-ups, R-09 recommended as a Gate 3 task).

## Round 3 — 2026-11-22 (Gate 3 corrections)

Commits reviewed: `c0fcee7` (tasks T015–T020 and the updated choice-tile recipe), `44679b4` (R-05), `75ff6a1` (R-06, R-08, R-09, T019, T020). Verification: `npm --prefix frontend run verify` passed (lint, typecheck, 45 tests in 6 files). The CMS was not touched in this round. The orchestrator's browser check on docker (1440×900 and 320px) is consistent with the code.

| ID | Severity | Location | Finding | Rule/FR | Status | Resolution |
|----|----------|----------|---------|---------|--------|------------|
| R-05 | Minor | quote-wizard.shell.scss:3, 59-74; styles.scss:10 | Raw colours in the wizard header. | ui-ux-guidelines §1 | Resolved (44679b4) | Every white in the header now uses `var(--color-surface)`. The hover overlay uses a new `--color-on-brand-overlay` token, defined once in `styles.scss`. No raw colour values are left in the component. |
| R-06 | Minor | country-selection.page.html:16-21; country-selection.page.scss:152-174 | Loading state was text instead of a skeleton. | ui-ux-guidelines §3 States › Loading | Resolved (75ff6a1) | Two `choice-tile--skeleton` placeholders (`aria-hidden`) sit inside an `aria-busy="true"` region with a visually hidden "Cargando países…". They have the same size as the real tiles, so nothing jumps when the countries load. The pulse animation is turned off under `prefers-reduced-motion`. |
| R-08 | Minor | country-selection.page.spec.ts:43-56; quote-wizard.shell.spec.ts:20-23 | Tests found controls by CSS class. | angular-conventions › Testing | Resolved (75ff6a1) | The tests now find buttons by their text ("Continuar", "Cambiar país") and radios by their label text. The remaining class lookups are acceptable: `choice-tile--selected` and the R-01 modifier are the behaviour being tested, and the index-based `radio()` helper is used only to check that nothing is checked. |
| R-09 | Minor | country-selection.page.ts:45-47; country-selection.page.html:6 | Focus stayed on `body` after "Cambiar país". | angular-conventions › Accessibility, SC-004 | Resolved (75ff6a1) | The `h1` has `tabindex="-1"` and gets focus in `afterNextRender` every time `/` is entered. A unit test checks that the heading is `document.activeElement`. The focus ring is removed only from this heading (not interactive, reachable only by script), and the same is done for the step 1 heading. Every interactive control keeps its `:focus-visible` ring. |

**T019 (centered desktop layout): conforms.** On the page, `:host` is a column flex container with `min-height: 100dvh`. Below the header, `.country-page` gets `flex: 1` and, at ≥ 768px only, `justify-content: center`, so the title, subtitle, tiles and Continuar are centered both ways below the brand bar. Mobile keeps the top-aligned flow. Tile content is centered (`align-items` and `justify-content: center`), and every tile has the same `min-height: 120px`. The recipe asks for at least 96px, so 120px is allowed.

**T020 (check icon, no "Seleccionado"): conforms to the updated recipe.** A selected tile has a 2px `--color-action` border, a `--color-surface-highlight` background and a 20px check icon. The icon is absolutely positioned at the top right (the tile is `position: relative`) and is `aria-hidden`. There is no extra text, so selecting causes no layout shift. The native radio inside the `<label>` still announces the checked state, and a unit test asserts that the "Seleccionado" text is absent. The selected state is shown by the border, the background and the icon together, not by colour alone. The hover rule changes only the border, as the recipe asks.

No new Blocker or Major findings. No extra scope was built. The security posture (Public role, no token, relative URLs) is unchanged.

### For the human to check by hand
1. **Scenario 8 (not run):** in the admin, switch Chile's **Active** off, reload `/` (Chile gone) and `/cl/quote` (redirect with the "not available" message). Then unpublish Colombia and confirm the same behaviour. Restore both afterwards.
2. **Confirm dialog paths (FR-007 / FR-012):** still reachable only once US-01 writes session data. Re-test then: a same-tab link to the other country (confirm and cancel), "Cambiar país" with data, Esc to cancel, and focus returning to the trigger.
3. **Screen reader pass:** on entering `/` (first load and after "Cambiar país"), the heading should be announced, then the radio group as legend "País" plus the tile names, with the checked state announced by the radio (no "Seleccionado" text now). While loading, the region should be busy and read "Cargando países…". Also check the header chip (name only) and the `role="alert"` "not available" message.
4. **Mobile header without icon (R-01):** create a country with no icon and check at 320px that its name is visible. A country with an icon should show only the flag below 576px. In the same test, check the selection tiles: a tile without a flag centers its name, so it will not line up with the names in tiles that have a flag. Decide whether that is acceptable.
5. **Keyboard focus visuals:** Tab from the focused heading into the radio group and onto Continuar. The tile and the button should show the focus ring, and the heading should not.

**Verdict: Approved** (R-01–R-09 all Resolved, no open findings).

## Round 4 — 2026-11-22 (Gate 3 image)

Commits reviewed: `db89fa4` (task T021) and `dfe07ce` (implementation). Verification: `npm --prefix frontend run verify` passed (lint, typecheck, 45 tests in 6 files). `npm --prefix frontend run build` passed with no budget warnings (the `country-selection-page` lazy chunk is 9.99 kB raw). The CMS was not touched. The orchestrator's browser check on docker (1440×900 and 360px) matches the code.

No new findings.

**T021 (split layout with illustration): conforms.**
- At ≥ 768px, `.country-page` becomes a two-column grid. The left `__hero` has the new `--color-surface-brand-soft` background, the illustration at 300px and the phrase "Tu carro protegido, en el país donde manejas." (20px/700 `--color-brand`, high contrast on the soft background). The right `__content` holds the title, subtitle, alert, tiles and Continuar, left-aligned (`align-items: flex-start`, tiles `justify-content: flex-start`) and vertically centered (`justify-content: center`).
- Below 768px, the hero is a column above the content: the illustration is 150px, the phrase is `display: none`, and the content stays centered with the tiles side by side (`flex: 1 1 0`, `min-width: 130px`, so two tiles fit at 320px).
- The template is unchanged apart from the new wrapper elements. The `@switch`, `@if` and `@for` (with `track`) blocks, and all their states, were only re-indented.

**ui-ux-guidelines §6 Imagery: conforms.**
- `selection-hero.svg` is a small hand-written SVG made of geometric primitives (ellipse and circle blobs, a car path, a shield with a check). It has no embedded raster, no `<script>`, no external references and no third-party artwork, so it counts as an own SVG with no licensing concern. Its colours are the token values (brand, action, CTA yellow, cyan accent, highlight, border, text) plus one lighter window blue (`#9fc0ff`). Raw hex inside a static asset is fine: the "tokens only" rule in §1 applies to component styles.
- The image is decorative and uses `alt=""`, with explicit `width`/`height` (no layout shift while it loads). The relative `images/...` path resolves from `/` because the page is only served at the root route.

**Choice tile recipe: unchanged.** Default, hover (border only), selected (border, highlight background and the absolutely positioned check), `:has(:focus-visible)` ring, skeleton and reduced motion all work as in round 3. The new 768px rule only changes how the tile row is aligned.

**Regressions: none.**
- Heading focus still works. `afterNextRender` queries `h1` inside the host, and the `h1` (still `tabindex="-1"`) is now inside `__content`. The unit test still passes.
- Moving `.visually-hidden` to `styles.scss` keeps it working. The component scss is emulated, so before the move the rule only applied inside this page. It now applies everywhere, and no other component defines a conflicting rule. The hidden legend "País", the "Cargando países…" text and the hidden radios are unaffected.
- Security, the Public role and relative URLs are unchanged. No data was added.

**Budget note (no finding):** `anyComponentStyle` `maximumWarning` went from 4 kB to 6 kB, while `maximumError` stays at 8 kB. The page stylesheet compiles to about 4.9 kB unminified (header, page layout, hero, tiles, skeleton), so going over 4 kB is expected for a page that styles its own tiles. The raise is acceptable. When a later story reuses the choice tile, moving it into `shared/ui/` would shrink this stylesheet and make it possible to lower the warning again.

### For the human to check by hand
1. **Scenario 8 (not run):** in the admin, switch Chile's **Active** off, reload `/` (Chile gone) and `/cl/quote` (redirect with the "not available" message). Then unpublish Colombia and confirm the same behaviour. Restore both afterwards.
2. **Confirm dialog paths (FR-007 / FR-012):** still reachable only once US-01 writes session data. Re-test then: a same-tab link to the other country (confirm and cancel), "Cambiar país" with data, Esc to cancel, and focus returning to the trigger.
3. **Screen reader pass:** on entering `/` (first load and after "Cambiar país"), the heading should be announced first, then the radio group as legend "País" plus the tile names, with the checked state announced by the radio. The illustration should be skipped (`alt=""`). The hero is an `<aside>`, so it also shows up as a "complementary" landmark that contains only the phrase. Check that this does not feel noisy. If it does, a plain `div` is enough. While loading, the region should be busy and read "Cargando países…". Also check the header chip (name only) and the `role="alert"` "not available" message.
4. **Mobile header and tiles without icon (R-01):** create a country with no icon and check at 320px that its name is visible in the header. A country with an icon should show only the flag below 576px. A tile without a flag centers its name, so it will not line up with tiles that have a flag. Decide whether that is acceptable.
5. **Keyboard focus visuals:** Tab from the focused heading into the radio group and onto Continuar. The tile and the button should show the focus ring, and the heading should not.
6. **Split layout at the 768px edge and in between (T021):** at 768–1000px, check that the two halves still look balanced (each is 50%, and the content is capped at 480px), that the tiles do not wrap awkwardly, and that the "not available" alert and the error panel look right in the right column. At 320px, check that the 150px illustration plus the title still leave the tiles and Continuar visible without much scrolling.

**Verdict: Approved** (T021 conforms. No open findings.)

## Round 5 — 2026-11-22 (Gate 3 Bootstrap layout)

Commits reviewed: `4d1bd38` (ADR 0003, ui-ux-guidelines §5, CLAUDE.md Layout rule, task T022), `91c1493` (`bootstrap` 5.3.8 pinned exactly, grid and utilities CSS in `angular.json`) and `212c563` (layout refactor of the selection page, wizard shell and step 1). Verification: `npm --prefix frontend run verify` passed (lint, typecheck, 45 tests in 6 files). `npm --prefix frontend run build` passed with no budget warnings. Global `styles` is 131 kB raw and about 8 kB transfer. The `country-selection-page` chunk went down from 9.99 kB to 9.49 kB. The CMS was not touched. The orchestrator's docker check at 320, 768 and 1440px matches the code.

No new findings.

| ID | Severity | Location | Finding | Rule/FR | Status | Resolution |
|----|----------|----------|---------|---------|--------|------------|
| — | — | — | No findings this round | — | — | — |

**ADR 0003: good quality.** It covers context (layout drift, no width cap, the style budget), decision drivers, three options with pros and cons, the decision and who made it (the human at Gate 3, constitution §3.2), concrete rules (layout only, 1140px cap, Bootstrap breakpoints, load order) and honest trade-offs (two vocabularies, the spacer scale differs from `--space-*`, precompiled CSS needs overrides). "Related" lists US-00 to US-03 and T022. The skill §5 and the CLAUDE.md line say the same thing as the ADR. The old "max content width 1120px" was replaced consistently with 1140px.

**Dependency: conforms.** `bootstrap` is pinned to `5.3.8` with no caret. Only `bootstrap-grid.min.css` and `bootstrap-utilities.min.css` are loaded, before `src/styles.scss`. There is no Reboot, no component CSS and no JS.

**New layout rule: conforms.**
- Only container, grid, display, flex, spacing, sizing (`w-100`, `min-vh-100`) and text-align classes are used. A scan of every template found no Bootstrap colour, typography, border, shadow or component classes (`btn`, `card`, `bg-*`, `text-primary`, `fs-*`, `fw-*`, `border*`, `shadow*`, `rounded*`, `alert`).
- Every screen's content sits in a `.container`: the selection page header and `main`, the wizard header and the wizard `main`. The 1140px cap is a single global override at ≥ 1400px in `styles.scss`, which matches the ADR.
- The hand-written page layout was removed: `:host` flex, `.country-page` grid, `__hero` and `__content` flex and padding, `__tiles` flex, `.wizard-header__inner` and `__actions`, `.wizard-main`, and the `.step` margin and padding. No removed class is still referenced in templates, unit tests or e2e.
- What is left in component SCSS is component styling: colours, typography, the fieldset reset, the hero's soft background at md, the illustration size, the tagline `max-width`, and `.step { max-width: 560px }` (the form-card width from the §3 recipe). Bootstrap utilities are `!important`, so they win over the remaining `margin-top: 0` rules in the emulated component styles. They do not conflict.

**BEM components: untouched.** The choice tile (default, hover, selected with the check, `:has(:focus-visible)`, skeleton, reduced motion), the button variants, the header chip, its narrow-screen hidden name and the "Cambiar país" button are identical to round 4.

**Regressions: none.**
- Heading focus: the `h1` keeps `tabindex="-1"`, and both pages still focus it from `afterNextRender`. The unit tests pass.
- States: loading (`aria-busy`, "Cargando países…"), error with Reintentar, empty, and the `role="alert"` "not available" message are unchanged. Only layout and spacing classes were added.
- Tiles still sit side by side at 320px (`flex: 1 1 0`, `min-width: 130px`, wrapping with `gap-3`).
- Security, the Public role, relative URLs and data are unchanged.

**Notes (no finding):**
- The `.visually-hidden` rule in `styles.scss` now duplicates Bootstrap's `.visually-hidden` utility, which is equivalent. It is harmless and can be removed later.
- The selection page wrapper uses `min-vh-100` (100vh) where it used `100dvh` before. On mobile browsers with a collapsing URL bar, the page can be a few pixels taller than the visible area. Because mobile content is top-aligned (`align-content-start`), this only adds a little scroll at the end.
- The fieldset reset now sets only `margin-top: 0`, `padding` and `border`, so the browser's default 2px inline margins come back next to `w-100`. The 12px column padding absorbs the extra width, so nothing is clipped and nothing scrolls.
- Spacing moved to Bootstrap's scale. For example, the subtitle gap is now 24px (`mb-4`) instead of 32px, and the wizard header padding is 8px instead of 12px. This is the expected trade-off from the ADR.

### For the human to check by hand
1. **Scenario 8 (not run):** in the admin, switch Chile's **Active** off, reload `/` (Chile gone) and `/cl/quote` (redirect with the "not available" message). Then unpublish Colombia and confirm the same behaviour. Restore both afterwards.
2. **Confirm dialog paths (FR-007 / FR-012):** still reachable only once US-01 writes session data. Re-test then: a same-tab link to the other country (confirm and cancel), "Cambiar país" with data, Esc to cancel, and focus returning to the trigger.
3. **Screen reader pass:** on entering `/` (first load and after "Cambiar país"), the heading should be announced first, then the radio group as legend "País" plus the tile names, with the checked state announced by the radio. The illustration should be skipped (`alt=""`). The hero `<aside>` shows up as a "complementary" landmark. Check that this does not feel noisy. While loading, the region should be busy and read "Cargando países…". Also check the header chip and the `role="alert"` "not available" message.
4. **Mobile header and tiles without icon (R-01):** create a country with no icon and check at 320px that its name is visible in the header. A country with an icon should show only the flag below 576px. A tile without a flag centers its name, so it will not line up with tiles that have a flag. Decide whether that is acceptable.
5. **Keyboard focus visuals:** Tab from the focused heading into the radio group and onto Continuar. The tile and the button should show the focus ring, and the heading should not.
6. **Bootstrap layout (T022):** at 1440px and wider, the brand bar is full width while the wordmark, the hero and the selection block stay inside the 1140px container. The hero's soft background now ends at the container edge instead of filling half the screen. Confirm that this is the look you want. At 768–1000px, check that the two columns look balanced and that the alert and the error panel fit the right column. In the wizard (`/co/quote`), check that the header wordmark and the country chip line up with the step content edges. At 320px, check that the tiles and Continuar are visible without much scrolling.

**Verdict: Approved** (T022 conforms to ADR 0003 and the §5 layout rule. No open findings.)
