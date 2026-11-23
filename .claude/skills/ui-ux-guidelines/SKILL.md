---
name: ui-ux-guidelines
description: Brand-based UI/UX guidelines for every client-facing view — design tokens, typography, component recipes (buttons, form fields, plan cards, stepper, states), accessibility, layout, imagery and copy tone. Load when proposing design options in plan.md, and when building or reviewing any UI.
---

# UI/UX guidelines

Visual language derived from research of the public car-insurance sites of a reference LatAm insurer operating in Colombia and Chile (2026-11-21). We reuse its **patterns and token values**, never its assets: no third-party logos, fonts or images in the repo. The product is a fictitious insurtech with its own text wordmark.

## 1. Design tokens

Defined once as CSS custom properties in `frontend/src/styles.scss`. Components use tokens only — no raw hex values.

```scss
:root {
  /* Brand */
  --color-brand: #0033a0;          /* navy: header, wordmark, info */
  --color-action: #2d6df6;         /* buttons, links, plan names */
  --color-action-hover: #26328c;
  --color-cta: #e3e829;            /* main CTA background only */
  --color-cta-hover: #d7de17;
  --color-on-cta: #26328c;         /* text on yellow */
  --color-accent: #00aec7;         /* DECORATIVE ONLY, never text (2.7:1) */

  /* Text & surfaces */
  --color-text: #1c1c24;
  --color-text-muted: #53565a;
  --color-surface: #ffffff;
  --color-surface-alt: #f8f8f8;    /* cards */
  --color-surface-highlight: #dfeaff; /* recommended plan, badges */
  --color-border: #cdced9;
  --color-disabled-bg: #e7e7e7;
  --color-disabled-text: #666666;   /* 4.6:1 on disabled-bg (Sura's #878789 was 2.9:1) */

  /* Status (fg / bg) */
  --color-error: #d12d35;   --color-error-bg: #fff4f3;
  --color-success: #067014; --color-success-bg: #def6de;
  --color-warning: #ed8b00; --color-warning-bg: #fff5ec;
  --color-info: #0033a0;    --color-info-bg: #e0eaff;

  /* Spacing (4px base) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px;

  /* Radius */
  --radius-sm: 8px;      /* inputs */
  --radius-md: 16px;     /* cards */
  --radius-pill: 999px;  /* buttons, badges */

  /* Elevation */
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.16);
  --shadow-soft: 0 8px 25px rgba(83, 89, 144, 0.07);
  --focus-ring: 0 0 0 4px rgba(0, 56, 255, 0.22);
}
```

## 2. Typography

- **Font:** Figtree from the Google Fonts CDN, only the weights we use, with `display=swap`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```
- **Fallback (lightweight, no download):** `--font-family: 'Figtree', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;`
- **Scale (mobile → desktop):**

| Role | Size | Weight | Color |
|------|------|--------|-------|
| Price / hero heading | 32px → 48px | 700 | `--color-text` |
| Step heading (`h1`) | 24px → 32px | 700 | `--color-brand` |
| Section / card title | 20px | 700 | `--color-action` |
| Body | 16px, line-height 1.5 | 400 | `--color-text` |
| Label, badge, helper | 14px | 500 | `--color-text-muted` |

- Never below 14px. Blue text (`--color-action`) only at ≥16px.

## 3. Component recipes (BEM)

Each component defines: default, hover, focus-visible, disabled and (if applicable) error/selected states.

**Button** — `.button`, `.button--cta`, `.button--primary`, `.button--secondary`
- Pill (`--radius-pill`), min-height 48px, padding `--space-3 --space-6`, 16px / 700.
- `--cta`: yellow bg, navy text. One per screen: the step's main action (Continue, Pay).
- `--primary`: action-blue bg, white text, hover `--color-action-hover`.
- `--secondary`: white bg, 1px navy border (Back, Edit).
- Disabled: `--color-disabled-bg` / `--color-disabled-text` (≥ 4.5:1), plus `aria-disabled` or `disabled`. Loading: keep width, show spinner + "Procesando…", `aria-busy="true"`.

**Choice tile** — `.choice-tile`, `--selected`: large single-choice option (e.g. country). Native radio inside a `<label>`.
- Default: `--color-surface`, 2px `--color-border`, `--radius-md`, min-height 96px, flag above name, name 20px/700 `--color-text` (black, never brand or white).
- Hover: border `--color-action` only. Never a background change or dark fill.
- Selected: 2px `--color-action` border + bg `--color-surface-highlight` + check icon absolutely positioned in the top-right corner (not color alone; no extra text, so selecting causes no layout shift). The native radio announces the checked state.
- Focus: `--focus-ring`. All text states ≥ 4.5:1.

**Form field** — `.form-field`, `__label`, `__control`, `__help`, `__error`, `--invalid`
- Label above the control, 14px/500; required marked with `*` and announced (`required` attribute).
- Control (soft filled, chosen at US-01 Gate 2): min-height 52px, 16px text (prevents iOS zoom), `--color-surface-brand-soft` fill, 12px top radius, no side borders, 2px bottom line `--color-text-muted` (≥3:1 against the fill). Focus: bottom line `--color-action`, fill `--color-surface-field-focus` (`#e8f0ff`), plus `--focus-ring` on `:focus-visible`. Invalid: bottom line `--color-error`.
- Placeholder only as an example (`Ej: ABC123`), never as the label.
- Error: icon + text in `--color-error` below the control, `aria-describedby` linked, `aria-invalid="true"` on the control.
- **Select** (`.select-field`): never the native option list. A `role="combobox"` trigger with the same soft-filled look and a chevron that rotates when open, plus a `role="listbox"` popup: white, 14px radius, `--shadow-card`, 6px padding; options 10px/12px padding, 10px radius, `--color-surface-brand-soft` for the active option, selected option bold `--color-on-cta` with a check icon. Keyboard per the WAI-ARIA select-only combobox: ↑/↓, Home/End, Enter/Space to pick, Esc to close, Tab to leave; `aria-expanded`, `aria-activedescendant`.
- Yes/No and short choices: segmented toggle built on native radio inputs (`.segmented`, `__option`, `--checked`).

**Form card** — `.form-card`: `--color-surface`, `--radius-md`, `--shadow-card`, padding `--space-6`, max-width 560px, centered. Title 20px/700 `--color-action`.

**Plan card** — `.plan-card`, `__badge`, `__radio`, `__name`, `__price`, `__section`, `__item`, `--recommended`, `--selected` (agreed at US-02 Gate 2)
- White `--color-surface`, 14px radius, padding `--space-4`/`--space-6`, 1px inset ring `--color-border`. No top stripe and no grey background.
- `--recommended`: a 5px `--color-brand` top border, a 1px brand ring, and a large `__badge` pill ("Recomendado" with a star icon; 16px bold text, an 18px icon, 6px × 18px padding; `--color-cta` bg, `--color-on-cta` text) centred **on the top border**. Only the first recommended plan in order.
- `--selected`: a `__radio` circle filled with `--color-action` and a white check, plus a 2px **inset** `--color-action` ring. No "Seleccionado" text: nothing may change size or position (no layout shift). The radio state is the non-colour cue.
- The cards share one CSS subgrid, so the name and description, the price (after a divider), Coberturas and Beneficios start on the same line in every card.
- Price: large, `--color-brand`, formatted in the country's currency with no decimals, followed by "/ mes". No text explaining how the price is calculated.
- Sections: Coberturas and Beneficios with check icons; an empty list is hidden.
- Selectable as a radio group, one choice only; the arrow keys move the choice.
- The "Continuar" pill is disabled (`--color-disabled-bg` / `--color-disabled-text`) until a plan is chosen, with no hint text.

**Stepper** — `.stepper`, `__step`, `--current`, `--done`: numbered steps with text labels in an `<ol>`, above the form card; current step has `aria-current="step"`. Current and done circles (32px): `--color-surface-highlight` fill, 2px `--color-action` ring, `--color-brand` number (check icon when done); upcoming: white, 1.5px `--color-border` ring, `--color-text-muted`. Current label bold `--color-brand`; connector lines 2px, `--color-action` up to a done step, else `--color-border`. On mobile show only the current circle + "Paso 2 de 3" + current label.

**Motion** — content loads with a skeleton, then items fade up 14px one by one (600ms `cubic-bezier(.2,.7,.2,1)`, 110ms stagger), only on first render, never on validation re-renders. Popups open with a 160ms fade/slide. All of it is off under `prefers-reduced-motion`.

**Summary block** — `.summary-section` with a title + "Editar" secondary link per section (data, vehicle, plan). Masked document shown as `•••• 5678`.

**States**
- **Loading:** skeletons shaped like the final content (cards, fields); `aria-busy` on the region.
- **Empty** (e.g. no plans): flat illustration or icon, friendly headline, one-line explanation, one action.
- **Error** (e.g. payment rejected, CMS down): `--color-error-bg` panel with icon, what happened, what to do, and a retry button. Never lose user data.
- **Success** (confirmation): `--color-success` check icon, headline, quote number prominent and copyable.

## 4. Accessibility (non-negotiable)

- Contrast: text ≥ 4.5:1. `--color-accent` never carries text; white on `--color-action` only at ≥16px bold.
- Visible `:focus-visible` on every interactive element (`--focus-ring`). Never `outline: none` without replacement.
- Touch targets ≥ 48×48px.
- Information never by color alone (selected, recommended, error all have text/icon).
- On step change, move focus to the step heading; announce async errors with `role="alert"`.
- Respect `prefers-reduced-motion` (no transitions).

## 5. Layout

- Mobile-first. Breakpoints are Bootstrap's: sm 576, md 768, lg 992, xl 1200 px. Custom media queries use the same values.
- **Layouts use Bootstrap 5.3 grid and utilities** ([ADR 0003](../../../docs/adr/0003-bootstrap-grid-for-layouts.md)) on every screen. Bootstrap is for layout only:
  - Page width: every screen's content sits in a `.container`, capped at 1140 px (global override), with Bootstrap's gutters.
  - Structure: `.row` / `.col-*` (`.col-12 .col-md-6`, …) for columns that stack on mobile.
  - Alignment and spacing: `.d-flex`, `.flex-column`, `.justify-content-*`, `.align-items-*`, `.gap-*`, `m-*` / `p-*`, `.text-center` / `.text-md-start`, `.d-none .d-md-block`.
  - Never use Bootstrap colour, typography, border, shadow or component classes (`.btn`, `.card`, `.bg-*`, `.text-primary`, `.fs-*`…). Those come from our tokens and BEM recipes.
  - Component SCSS holds component styling only (look, states, internal spacing with `--space-*`), not page layout.
- Plan cards: a Swiper slider below 992px (about 1.2 cards on mobile, 2.2 on tablet) and also from 992px when there are more than 3 plans (3 visible); a 3-column grid from 992px with 3 plans or fewer. The slider opens on the chosen or recommended plan, has no loop and no autoplay (only the load animation), keeps the card rows aligned across slides, and has previous/next arrows vertically centred at its left and right edges, with dots centred below.
- Header: navy bar with text wordmark; no navigation beyond the wizard.

## 6. Imagery

- Hero/decoration: optional. If used, fictitious stock-style photos of real-looking people relaxed with car/phone, or flat illustrations with soft blobs in brand blue, yellow and cyan.
- Empty/error states: simple flat illustration or large icon, never a stock photo.
- Decorative images: `alt=""`. Informative images: alt describes the content.
- Only images we are licensed to use (own SVGs, open-licensed illustrations). No assets from third-party sites.

## 7. Copy tone (Spanish, both countries)

- Informal "tú", warm, short sentences. CTAs as actions: "Continuar", "Ver planes", "Pagar ahora".
- Errors say what to do: "Ingresa una placa válida, por ejemplo ABC123."
- Country vocabulary comes from the CMS (placa vs patente, cédula vs RUT) — never hard-code it.

## 8. Design options in plan.md (Gate 2)

For each client-facing view, propose 2–3 options that **vary layout or interaction, not the visual language** (all use these tokens and components). Format per option:

```
### Option A — <name>
- Layout: <one or two lines, mobile and desktop>
- Pros / Cons: <...>
- Accessibility notes: <...>
**Recommendation:** Option X, because <...>
```

Examples of meaningful variations: form in one long card vs. grouped sections (policyholder / vehicle); plan cards side by side vs. comparison table; summary as cards vs. single list with inline edit links.
