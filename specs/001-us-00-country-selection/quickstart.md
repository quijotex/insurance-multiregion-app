# Quickstart — validate US-00

## Prerequisites
Docker Desktop running. Fresh data: `docker compose down -v`.

## Run
```bash
docker compose up --build
```

## Scenarios

| # | Do | Expect | Spec |
|---|----|--------|------|
| 1 | Open http://localhost:4200/ | Colombia, then Chile, with flags; Perú is not listed; "Continuar" disabled | FR-002, FR-003 |
| 2 | Select Chile (keyboard: Tab to the group, arrows, Space), press "Continuar" | `/cl/quote`, header shows Chile + "Cambiar país", step 1 placeholder | FR-004, FR-005, FR-009 |
| 3 | Reload `/` | Chile is preselected, "Continuar" enabled | FR-011 |
| 4 | Open http://localhost:4200/co/quote in a new tab | Colombia wizard directly, no selection screen | FR-005 |
| 5 | Open `/pe/quote` and `/xx/quote` | Selection screen with "not available" message | FR-006 |
| 6 | Open `/CL/quote` | Redirects to `/cl/quote` | Edge Cases |
| 7 | Stop the `cms` container, reload `/` | Error state with "Reintentar"; start `cms`, press it → list appears | FR-010 |
| 8 | Admin: http://localhost:1337/admin with README dev credentials; set Chile `active = false`, reload `/` | Only Colombia listed, no deployment | FR-001, SC-003 |
| 9 | `curl -X POST http://localhost:4200/api/countries` | 403 | Security |

Confirmation dialogs (FR-007, FR-012) have no reachable data in US-00; they are covered by unit tests and checked again in US-01.

## Automated
```bash
npm --prefix frontend run verify
npm --prefix cms run build
npm --prefix frontend run e2e:docker   # approved E2E candidates only
```
