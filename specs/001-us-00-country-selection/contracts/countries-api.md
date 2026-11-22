# Contract — Countries API (Strapi → Angular)

Source of truth: `cms/src/api/country/content-types/country/schema.json`. Angular model: `frontend/src/app/core/country/country.model.ts`.

## Request (browser, same origin, no token)

```
GET /api/countries
    ?fields[0]=name&fields[1]=code
    &populate[icon][fields][0]=url&populate[icon][fields][1]=alternativeText
    &sort=order:asc
```

- The server **always** returns only published countries with `active = true` (research R1); clients do not send an `active` filter.
- Public role permission: `find` on Country only.

## Response 200

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "a1b2c3",
      "name": "Colombia",
      "code": "CO",
      "icon": { "id": 1, "documentId": "x9", "url": "/uploads/co_123.svg", "alternativeText": "Bandera de Colombia" }
    },
    {
      "id": 2,
      "documentId": "d4e5f6",
      "name": "Chile",
      "code": "CL",
      "icon": null
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 25, "pageCount": 1, "total": 2 } }
}
```

- `icon` may be `null`.
- `icon.url` is relative and served through the same-origin `/uploads/` proxy.

## Errors

| Case | Response | App behavior |
|------|----------|--------------|
| CMS down / network error | 5xx or no response | Selection screen error state with "Reintentar" (FR-010) |
| No available countries | 200 with `data: []` | Selection screen empty state (Edge Cases) |
| Write attempt (`POST/PUT/DELETE`) by Public | 403 | Never done by the app |
