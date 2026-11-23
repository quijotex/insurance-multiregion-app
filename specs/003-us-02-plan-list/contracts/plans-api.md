# Contract — Plans API and Country additions (US-02)

## `GET /api/plans` (Public: `find`)

```text
/api/plans?filters[country][code][$eq]=CO&filters[active][$eq]=true&sort=order:asc
  &populate[coverages]=true&populate[benefits]=true&pagination[pageSize]=100
```

- Always returns published entries only: the controller forces `status=published` (R7). Unpublished plans, inactive plans and other countries' plans never come back (FR-002).
- Response item:

```json
{ "id": 1, "documentId": "abc", "name": "Plus", "shortDescription": "Lo esencial y más.",
  "basePrice": 145000, "order": 2, "recommended": true, "active": true,
  "coverages": [{ "id": 3, "text": "Responsabilidad civil" }],
  "benefits": [{ "id": 7, "text": "Grúa 24/7" }] }
```

- **Errors:** any non-2xx response shows the step 2 error state with a retry (FR-010).

## `GET /api/countries` (Public: `find`, existing) — additions

- The existing query also requests `populate[driverAgeBands]=true&populate[vehicleAgeBands]=true`.
- Each item gains these fields:
  - `currency`
  - `numberLocale`
  - `driverAgeBands`, e.g. `[{ "fromAge": 0, "toAge": 24, "factor": 1.2 }]`
  - `vehicleAgeBands`, in the same shape

## Save check (Document Service middleware)

- Creating, updating or publishing a Plan without a country fails with HTTP 400 "El plan debe tener un país."
- An admin save that leaves the country untouched passes (US-01 T028).

## Change type

Additive: a new endpoint and new Country fields (constitution §3.3).
