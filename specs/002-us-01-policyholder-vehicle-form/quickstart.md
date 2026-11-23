# Quickstart — validate US-01

## Prerequisites
Docker Desktop must be running. For fresh data, run `docker compose down -v`; this also re-runs the seed.

## Run
```bash
docker compose up --build
```

## Scenarios

| # | Do | Expect | Spec |
|---|----|--------|------|
| 1 | Open `/co/quote` | "Tus datos" shows 7 fields (document type … city) and "Tu carro" shows 3 (placa, marca, año), each with its label and help text | FR-002–FR-004, FR-013 |
| 2 | Open `/cl/quote` | RUT instead of document type and number; Región and Patente; 9 fields | FR-002, FR-013 |
| 3 | On `/cl/quote`, type RUT `12.345.678-9`, then Tab | RUT error shown. `12.345.678-5` clears it | FR-005, FR-014 |
| 4 | Press "Continuar" with the form empty | Every field shows its error; focus is on the first field; the URL is unchanged | FR-006 |
| 5 | Birth date of someone aged 17; vehicle year 21 years ago, then next year + 1 | Age error; year error twice | FR-007, FR-008 |
| 6 | Fill in valid data, press "Continuar", then "Volver" | Step 2 placeholder, then step 1 with all values | FR-009, FR-012 |
| 7 | Type half the form and reload | Values restored; untouched fields show no errors | FR-005, FR-009 |
| 8 | Open `/co/quote/plans` directly in a new tab | Redirected to `/co/quote` | SC-002 |
| 9 | With data typed, press "Cambiar país" | Confirmation dialog (US-00) | FR-009 |
| 10 | Admin: add and publish a field for Chile, reload; then unpublish it | It appears in its order, then disappears | FR-001, SC-001 |
| 11 | Admin: save a field with no country, then a second `plate` for Chile | Both saves are rejected with a message | Edge Cases |
| 12 | Stop the `cms` container and reload step 1 | Error state with "Reintentar" | FR-010 |
| 13 | Complete the form with the keyboard only, at 320 px and on desktop | Every field reachable; errors announced | FR-011, SC-005 |

## Automated
```bash
npm --prefix frontend run verify
npm --prefix cms run build
npm --prefix frontend run e2e   # only the E2E candidates approved at Gate 2
```
