# Contract — Form fields API (Strapi → Angular)

The source of truth is `cms/src/api/form-field/content-types/form-field/schema.json` together with `cms/src/components/form/*.json`. The Angular models are in `frontend/src/app/features/quote-form/data/form-field.model.ts`.

## Request (browser, same origin, no token)

```
GET /api/form-fields
    ?filters[country][code][$eq]=CO
    &sort[0]=section:asc&sort[1]=order:asc
    &populate[validations][populate][validators]=true
    &populate[options]=true
    &pagination[pageSize]=100
```

- The server always returns only published fields. The `find` controller forces `status: 'published'` (research R3).
- Permission: Public role gets `find` on FormField only.

## Response 200 (excerpt)

```json
{
  "data": [
    {
      "id": 11, "documentId": "f1", "key": "birthDate", "label": "Fecha de nacimiento",
      "type": "date", "required": true, "helpText": "Debes ser mayor de edad.",
      "placeholder": null, "errorMessage": "Debes tener al menos 18 años.",
      "order": 4, "section": "policyholder",
      "validations": { "id": 3, "min": null, "max": null, "pattern": null,
        "allowedCharacters": null, "maxLength": null,
        "validators": [{ "id": 1, "name": "legalAge", "value": null }] },
      "options": []
    },
    {
      "id": 17, "documentId": "f7", "key": "vehicleMake", "label": "Marca",
      "type": "select", "required": true, "helpText": null, "placeholder": null,
      "errorMessage": "Elige la marca.", "order": 3, "section": "vehicle",
      "validations": null,
      "options": [{ "id": 1, "label": "Chevrolet", "value": "chevrolet" }]
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 100, "pageCount": 1, "total": 10 } }
}
```

- `validations` may be `null`, and `options` may be empty.
- The sort puts `policyholder` before `vehicle`, which happens to be alphabetical. The frontend still groups fields by section explicitly and does not rely on the sort.

## Countries API change (additive, not breaking)

`GET /api/countries` adds `fields[2]=legalAge`, and each country gains `"legalAge": 18`.

## Errors

| Case | Response | App behaviour |
|------|----------|---------------|
| CMS down / network error | 5xx or no response | Step 1 error state with "Reintentar" (FR-010) |
| No fields for the country | 200, `data: []` | Step 1 empty state, with no "Continuar" (Edge Cases) |
| Editor saves a field with no country, or with a duplicate key | 400 ValidationError in the admin | Never reached by the app (R2) |
| Write attempt by Public | 403 | Never done by the app |
