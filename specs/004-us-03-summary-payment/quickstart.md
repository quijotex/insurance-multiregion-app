# Quickstart — US-03 Summary and payment

**Prerequisites:**
- Start the stack with `docker compose up --build`, or run `npm --prefix cms run develop` and `npm --prefix frontend start`.
- Admin login: see the README.
- The `cms-data` volume can be new or existing: the backfill adds the terms and the masked flag to an existing one.

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Colombia: complete step 1 (cédula `1020304050`) → choose a plan → Continuar | The summary lists every step 1 answer under its label, in two groups; the cédula reads `••••••4050`; the plan shows the same price as step 2 |
| 2 | Same for Chile with RUT `12.345.678-5` | Chile's fields and labels; RUT `••••••••78-5`; CLP price |
| 3 | Open "términos y condiciones" on both countries | A dialog with different texts, as published in the admin; headings, bold, list and link render; the link opens in a new tab; closing returns focus to the link |
| 4 | Look at "Quiero mi seguro" before and after ticking the checkbox, then untick | Disabled → enabled → disabled |
| 5 | "Editar mis datos" → change the birth date → Continuar → Continuar | Summary shows the new date and the recalculated price |
| 6 | "Cambiar plan" → choose another → Continuar | Summary shows the new plan |
| 7 | Accept and press "Quiero mi seguro", then press again quickly | "Procesando…", the button stays locked, one confirmation with `CO-YYYYMMDD-XXXXXX`, the plan and the amount |
| 8 | On the confirmation: reload, then browser Back | The confirmation is still shown; Back never shows "Quiero mi seguro" again |
| 9 | "Nueva cotización" | Country selection, with an empty form on the next quote |
| 10 | Pay with cédula `1020300000` (CO) or RUT `10.006.000-0` (CL) | An error panel announced to screen readers; data, plan and acceptance kept; "Quiero mi seguro" works again |
| 11 | Admin: empty CL's terms and publish, then reload the CL summary | An error instead of the terms; "Quiero mi seguro" stays disabled |
| 12 | Admin: edit CO's terms and save without publishing, then reload | The summary still shows the published text; after publishing, the new one |
| 13 | Admin: untick "masked in summary" on CL `rut`, reload | The RUT shows in full |
| 14 | Admin: unpublish the chosen plan, then open the summary | Back on step 2, no plan chosen |
| 15 | Stop the CMS, reload the summary | An error with "Reintentar", which works once the CMS is back |
| 16 | Keyboard only, at 320 px and on desktop: edit links, terms link and dialog, checkbox, "Quiero mi seguro" | All reachable with visible focus; the dialog scrolls with the keyboard and closes with Esc |

**Commands** (E2E only for the approved candidates):
- `npm --prefix frontend run verify`
- `npm --prefix cms run build`
- `npm --prefix cms test`
- `npm --prefix frontend run e2e:docker`
