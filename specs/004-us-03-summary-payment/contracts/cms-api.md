# Contract: CMS API changes for US-03

Both changes are additive (constitution §3.3): existing clients ignore the new fields. No new endpoint and no new Public permission.

## `GET /api/countries` (existing, Public `find`)

Each country gains `termsAndConditions`, a Strapi `blocks` array (or `null`):

```json
{
  "code": "CO",
  "termsAndConditions": [
    { "type": "heading", "level": 2, "children": [{ "type": "text", "text": "Términos del seguro" }] },
    { "type": "paragraph", "children": [
      { "type": "text", "text": "Al pagar aceptas " },
      { "type": "text", "text": "las condiciones generales", "bold": true },
      { "type": "text", "text": " del plan elegido." }
    ] },
    { "type": "list", "format": "unordered", "children": [
      { "type": "list-item", "children": [{ "type": "text", "text": "Vigencia mensual renovable." }] }
    ] },
    { "type": "paragraph", "children": [
      { "type": "link", "url": "https://example.com/co/condiciones", "children": [{ "type": "text", "text": "Ver condiciones" }] }
    ] }
  ]
}
```

Only published countries are returned (existing behaviour), so only published terms reach the browser.

## `GET /api/form-fields` (existing, Public `find`)

Each field gains `maskedInSummary: boolean`.

```json
{ "key": "documentNumber", "label": "Número de documento", "maskedInSummary": true }
```

## Angular

- `CountryDto` / `Country` gain `termsAndConditions` (mapper: R5 rules, `[]` when missing).
- `FormFieldDto` / `FormFieldDescriptor` gain `maskedInSummary` (missing → `false`).
- Updated in the same commit as the schema (CLAUDE.md).
