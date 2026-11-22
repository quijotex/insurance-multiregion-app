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
