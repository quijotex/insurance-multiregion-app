# Contract — Application routes (US-01 additions)

This adds to the [US-00 routes contract](../../001-us-00-country-selection/contracts/routes.md), whose rules are unchanged.

| Address | Shows | Spec |
|---------|-------|------|
| `/:country/quote` | Step 1 form: the country's fields, in two sections, then "Continuar" | FR-002–FR-006, FR-010 |
| `/:country/quote/plans` | Step 2 placeholder with "Volver" (until US-02) | FR-012 |
| `/:country/quote/plans` while step 1 is not complete | Redirect to `/:country/quote` | SC-002, research R9 |

Rules:
- "Continuar" with a valid form sets `step1Completed` and navigates to `plans`. With errors, it shows them all and focuses the first invalid control (FR-006).
- "Volver" returns to step 1 with every value restored (FR-009).
- On each step change, focus moves to the step heading (angular-conventions).
