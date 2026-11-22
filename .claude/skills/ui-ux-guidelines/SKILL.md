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
  --color-disabled-text: #878789;

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
- Disabled: `--color-disabled-bg` / `--color-disabled-text`, plus `aria-disabled` or `disabled`. Loading: keep width, show spinner + "Procesando…", `aria-busy="true"`.

**Form field** — `.form-field`, `__label`, `__control`, `__help`, `__error`, `--invalid`
- Label above the control, 14px/500; required marked with `*` and announced (`required` attribute).
- Control: min-height 52px, `--radius-sm`, 1px `--color-border`, 16px text (prevents iOS zoom). Focus: `--focus-ring` + border `--color-action`.
- Placeholder only as an example (`Ej: ABC123`), never as the label.
- Error: icon + text in `--color-error` below the control, `aria-describedby` linked, `aria-invalid="true"` on the control.
- Yes/No and short choices: segmented toggle built on native radio inputs (`.segmented`, `__option`, `--checked`).

**Form card** — `.form-card`: `--color-surface`, `--radius-md`, `--shadow-card`, padding `--space-6`, max-width 560px, centered. Title 20px/700 `--color-action`.

**Plan card** — `.plan-card`, `__badge`, `__name`, `__price`, `__section`, `__item`, `__item--excluded`, `--recommended`, `--selected`
- `--color-surface-alt`, `--radius-md`, padding `--space-6`, 1px ring `--color-border`.
- Badge: pill, 14px, `--color-surface-highlight` bg, `--color-brand` text, top-right.
- `--recommended`: `--color-surface-highlight` background + 1px ring `--color-action` + badge text from CMS.
- `--selected`: 2px ring `--color-action` + check icon + "Seleccionado" text (not color alone).
- Sections: Coberturas, Beneficios, and optionally "No incluye" with a muted cross icon.
- Price: large, formatted in country currency, with period ("/año").
- Selectable as a native radio group (`role` comes from `<input type="radio">` inside a `<label>`), one choice only.

**Stepper** — `.stepper`, `__step`, `--current`, `--done`: numbered steps with text labels; current step has `aria-current="step"`. On mobile show "Paso 2 de 3" + current label.

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

- Mobile-first. Breakpoints: 576, 768, 992, 1200px. Gutter 16px mobile, 24px desktop; max content width 1120px.
- Plan cards: stacked < 768px, 3 columns ≥ 992px (2 columns in between).
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
