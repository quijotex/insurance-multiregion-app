# 0003 — Bootstrap grid and utilities for page layouts

- **Status:** Accepted (Gate 3, US-00 — 2026-11-22)
- **Date:** 2026-11-22
- **Related:** US-00, US-01, US-02, US-03, `specs/001-us-00-country-selection/tasks.md` (T022)

## Context and problem

At the US-00 Gate 3 review, the human noticed that each screen builds its own layout with hand-written flex and grid rules, and nothing caps the page width. Every later screen (form, plans, summary) will need the same things: a centered, width-limited container, columns that stack on mobile, and consistent gutters. Writing that again per component makes the screens drift apart and inflates the component stylesheets (the US-00 selection page already went over the 4 kB style budget).

## Decision drivers

- One layout vocabulary for every screen (container, rows, columns, spacing).
- A capped page width on large screens.
- Keep our design tokens and BEM components (buttons, choice tiles, form fields) as they are.
- Smallest possible new dependency, with no runtime JS (constitution §3.2: approved by the human).

## Considered options

1. **Bootstrap 5.3, grid and utilities only**: the precompiled `bootstrap-grid.min.css` and `bootstrap-utilities.min.css`.
2. **Full Bootstrap CSS**: Reboot plus components, themed through Sass variables.
3. **Our own layout utilities**: a hand-written `.container` and grid in `styles.scss`.

## Decision

Chosen option: **1, Bootstrap grid and utilities only**, chosen by the human at Gate 3, because it gives every screen the same well-known layout classes (`.container`, `.row`, `.col-*`, `.d-flex`, `.justify-content-*`, `.align-items-*`, `.gap-*`, spacing `m-*`/`p-*`, `.text-*-center`) without touching how our components look.

Rules (also in the `ui-ux-guidelines` skill, §5 Layout):
- **Bootstrap is for layout only:** containers, the grid, display, flex, spacing and text alignment. Never use its colour, typography, border or shadow utilities, and never its components. Those come from our tokens and BEM recipes.
- **Width:** every screen's content sits in a `.container`, capped at 1140 px from 1400 px up (a global override), so the page width is limited.
- **Breakpoints:** Bootstrap's defaults (sm 576, md 768, lg 992, xl 1200 px) are the project breakpoints. Custom media queries use the same values.
- **Loading:** the two CSS files are listed in `angular.json` › `styles`, before `src/styles.scss`.

## Consequences

- **Positive:**
  - Layouts are shorter, consistent and familiar to any developer.
  - Component SCSS keeps only component styling.
  - No JS is shipped. The two files add about 137 kB of minified CSS (roughly 20 kB gzipped); utilities we do not use could be trimmed later with a Sass build if size matters.
- **Negative / trade-offs:**
  - Two styling vocabularies live side by side (Bootstrap layout classes and our BEM).
  - Bootstrap's spacer scale (0.25 / 0.5 / 1 / 1.5 / 3 rem) differs slightly from our `--space-*` tokens. Inside components we keep using the tokens.
  - The CSS is precompiled, so changing breakpoints or the container widths means adding overrides.
- **Follow-ups:**
  - Move to Sass imports only if theming Bootstrap variables becomes necessary.

## Pros and cons of the options

### Full Bootstrap CSS
- Good, because more classes are available (`.btn`, `.card`, `.form-control`).
- Bad, because Reboot and the components overlap with our BEM recipes, theming means rebuilding through Sass, and it adds about 200 kB of CSS.

### Our own layout utilities
- Good, because there is no dependency.
- Bad, because we would re-implement a grid that Bootstrap already provides and that reviewers know.
