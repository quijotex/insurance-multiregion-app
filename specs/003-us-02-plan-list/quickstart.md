# Quickstart — US-02 Plan list

**Prerequisites:**
- Start the stack with `docker compose up --build`, or run `npm --prefix cms run develop` and `npm --prefix frontend start`.
- Admin login: see the README.
- The `cms-data` volume can be new or existing: the backfill adds the currency, locale and bands to an existing one.

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Complete step 1 for Colombia (driver aged 30, vehicle 3 years old) → Continuar | The 3 CO plans in order. Prices equal the base, in the format "$ 145.000 / mes", with no text explaining the price |
| 2 | Do the same for Chile | The 3 CL plans in CLP ("$ 39.990 / mes"), and no Colombian plan |
| 3 | Go back to step 1, enter a birth date for age 22 and a vehicle 8 years old → Continuar | Each price is × 1.20 × 1.10, rounded |
| 4 | Look at the recommended plan | A "Recomendado" badge with text, not colour only, on one plan only |
| 5 | Admin: mark a second CO plan as recommended, then reload | Still one badge, on the first in order |
| 6 | Open step 2 with no plan chosen | Continuar is disabled, and the hint "Elige un plan para continuar." is visible |
| 7 | Choose a plan, then another | Only the last one has the filled radio and the ring; nothing on the page moves |
| 8 | Continuar → summary placeholder → Volver, then reload | The same plan is still chosen |
| 9 | Admin: unpublish the chosen plan, then reload step 2 | The plan is gone, and no plan is chosen |
| 10 | Admin: deactivate every CL plan, then reload | The empty state with "Volver a tus datos", and no Continuar |
| 11 | Stop the CMS, then reload step 2 | An error panel with "Reintentar", which works once the CMS is back |
| 12 | Admin: make the birth date rule stricter so the saved data fails, then open step 2 | Back on step 1, with the error shown (R8) |
| 13 | Admin: save a plan with no country | Rejected with "El plan debe tener un país." |
| 14 | Admin: change a driver-age factor, then reload step 2 | The prices follow the new factor |
| 15 | Keyboard only, at 320 px and on desktop: Tab to the plans, choose with the arrows, press Continuar | It works. A screen reader announces the plan name, the price, "recomendado" and "seleccionado" |

**Commands** (E2E only for the approved candidates):
- `npm --prefix frontend run verify`
- `npm --prefix cms run build`
- `npm --prefix cms test`
- `npm --prefix frontend run e2e:docker`
