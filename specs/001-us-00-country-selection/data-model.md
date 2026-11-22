# Data model — US-00 Country selection

## Strapi: `Country` (collection type `api::country.country`)

Draft & Publish: **enabled**.

| Field | Type | Rules | Spec |
|-------|------|-------|------|
| `name` | string | required | FR-001 |
| `code` | string | required, unique, regex `^[A-Z]{2}$` (ISO 3166-1 alpha-2, upper case) | FR-001, FR-005 |
| `icon` | media (single, images) | optional; app shows the name only when missing | FR-001, Edge Cases |
| `order` | integer | required, min 1 | FR-001, FR-002 |
| `active` | boolean | required, default `true` | FR-001, FR-002 |

Visibility rule (server-enforced, research R1): a country is **available** when it is published **and** `active = true`.

### Seed (fictitious demo data)

| code | name | order | active | published | icon |
|------|------|-------|--------|-----------|------|
| CO | Colombia | 1 | true | yes | `co.svg` |
| CL | Chile | 2 | true | yes | `cl.svg` |
| PE | Perú | 3 | **false** | yes | — |

## Angular: app models (`frontend/src/app/core/country/`)

```ts
interface Country {
  code: string;      // lower case in the app and in URLs: 'co'
  name: string;
  iconUrl: string | null;
  iconAlt: string;   // alternativeText, falls back to name
}
```

Mapped from the Strapi response by a pure mapper (`code` → lower case, `icon.url` → `iconUrl`).

## Browser session (per tab): `sessionStorage['quote-session']`

```ts
interface QuoteSession {
  countryCode: string;               // last visited country in this tab (FR-011)
  data: Record<string, unknown>;     // wizard data; empty in US-00, filled from US-01
}
```

State transitions:

| From | Event | To |
|------|-------|----|
| none | open `/:country/quote` (available) | `{ countryCode, data: {} }` |
| `{A, empty}` | open `/:B/quote` | `{ B, {} }` — no confirmation |
| `{A, data}` | open `/:B/quote` in same tab → confirm | `{ B, {} }` (FR-012) |
| `{A, data}` | open `/:B/quote` in same tab → cancel | stays `{A, data}`, back to `/:A/quote` |
| `{A, data}` | "Cambiar país" → confirm | `{ A, {} }`, go to `/` with A preselected (FR-007, FR-011) |
| `{A, …}` | A becomes unavailable, reload | `/?unavailable=a`; session cleared |
