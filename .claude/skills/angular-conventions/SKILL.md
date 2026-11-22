---
name: angular-conventions
description: Project conventions for Angular code in frontend/ — folder layout, state with signals, dynamic form recipe, HTTP/error handling, accessibility and test rules. Load before writing or reviewing Angular code.
---

# Angular conventions (Angular 22, standalone, zoneless)

## Folder layout (feature-first)
```
frontend/src/app/
  core/                 # app-wide singletons: country context, http, error handling
  shared/ui/            # reusable presentational components (no business logic)
  features/<feature>/   # one folder per feature, e.g. quote-form, plan-list, summary
    <feature>.page.ts   # routed container component
    components/         # presentational components of this feature
    data/               # API service + models (*.model.ts) + mappers
    state/              # signal-based store for the feature, if needed
    *.spec.ts           # tests next to the code they test
```

## Components
- Standalone only, `changeDetection: ChangeDetectionStrategy.OnPush`, no NgModules.
- `input()`, `output()`, `model()` signal APIs; `inject()` instead of constructor injection.
- Templates use `@if`, `@for` (always with `track`), `@switch`. No `*ngIf` / `*ngFor`.
- Container (page) components talk to services/state; presentational components only receive inputs and emit outputs.
- Every async view handles three states: loading, error (with retry), empty.

## State
- `signal()` / `computed()` for state; `linkedSignal()` / `resource()` / `httpResource()` when they simplify async data.
- RxJS only where streams are genuinely needed (e.g. debounced input). Convert at the edge with `toSignal()`.
- Wizard state that must survive back-navigation or refresh lives in one store per wizard, persisted to `sessionStorage` through a single persistence helper. Never store tokens there.

## HTTP and contracts
- Call only relative URLs (`/api/...`). No hosts, no tokens, no `environment.ts` secrets.
- Strapi responses are mapped to app models in `data/*.mapper.ts`; components never see raw Strapi shapes.
- Models mirror the Strapi schema (source of truth). Any schema change updates the model in the same commit.

## Forms
- Typed Reactive Forms (`FormGroup<{...}>`, `nonNullable`) or Signal Forms if stable in the installed version — decided once in the plan, then consistent.
- Dynamic form: config from CMS → typed field descriptors → validators built by a pure function (`buildValidators(field)`) that is unit-tested per rule.
- Error messages come from configuration, shown next to the field, linked with `aria-describedby`.

## Accessibility (mandatory)
- Every control has a visible `<label for>`; help text and errors linked via `aria-describedby`; invalid fields get `aria-invalid="true"`.
- The whole wizard is operable by keyboard; on step change, move focus to the step heading.
- Use native elements (`button`, `input`, `select`) before ARIA roles.

## Styling
- BEM class names: `block__element--modifier`. SCSS per component; design tokens as CSS custom properties in `styles.scss`.
- Mobile-first; layouts must work from 320px width.

## Testing
- Vitest unit tests for: validators, mappers, price rules, stores, critical component interactions.
- No tests for styles, static templates or scaffolding.
- Name tests after requirements: `describe('US-01 · FR-003 vehicle year range', ...)`.
- Prefer testing pure functions; for components use `TestBed` with harness-free DOM queries by role/label.
