# Contract — Application routes (US-02 changes)

This adds to the [US-01 routes contract](../../002-us-01-policyholder-vehicle-form/contracts/routes.md).

| Address | Shows | Spec |
|---------|-------|------|
| `/:country/quote/plans` | The plan list, replacing the placeholder: loading, list, empty and error states | FR-002–FR-010 |
| `/:country/quote/plans` when step 1 is not complete or no longer valid | Redirect to `/:country/quote`, where the errors show | FR-011, R8 |
| `/:country/quote/summary` | A summary placeholder with "Volver" to the plans (until US-03) | FR-012 |
| `/:country/quote/summary` with no chosen plan | Redirect to `/:country/quote/plans` | FR-008 |

Rules:
- **"Continuar":**
  - With a chosen plan, it goes to `summary`.
  - Without one, it shows an error and focuses the first plan (FR-008).
- **Empty state:** it offers "Volver a tus datos" (back to step 1) and no "Continuar" (FR-010, User Story 4).
- **Focus:** on each step change, focus moves to the step heading.
