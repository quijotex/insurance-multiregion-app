# Data model — US-01

Source of truth: the Strapi schemas in `cms/src/api/` and `cms/src/components/`. Angular models live in `frontend/src/app/features/quote-form/data/`.

## Country (changed)

| Field | Type | Rules |
|-------|------|-------|
| `legalAge` | integer | required, min 0, default 18. **New** in US-01 (FR-007). |

The existing fields are unchanged: `name`, `code`, `icon`, `order`, `active`.

## FormField (new collection `api::form-field.form-field`, draft & publish)

| Field | Type | Rules |
|-------|------|-------|
| `key` | string | required, regex `^[a-z][a-zA-Z0-9]*$`, **unique per country** (middleware R2) |
| `label` | string | required |
| `type` | enumeration | `text`, `number`, `select`, `date`, `checkbox`; required |
| `required` | boolean | default `false` |
| `helpText` | string | optional |
| `placeholder` | string | optional. An example only, e.g. `Ej: ABC123`; never used as the label |
| `errorMessage` | string | required. One message shown for any failed rule (R6) |
| `order` | integer | required, min 1. Sort order within the section |
| `section` | enumeration | `policyholder`, `vehicle`; required (R1) |
| `country` | relation manyToOne → Country | **required on save** (middleware R2) |
| `validations` | component `form.validations` (single) | optional |
| `options` | component `form.option` (repeatable) | used when `type = select` |

### Component `form.validations` (`FormValidations`)
| Field | Type | Notes |
|-------|------|-------|
| `min` | decimal | for numbers |
| `max` | decimal | for numbers |
| `pattern` | string | a regular expression, applied anchored (whole value) |
| `validators` | component `form.validator` (repeatable) | named rules |

### Component `form.validator` (`FormValidator`)
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | required. One of `rut`, `legalAge`, `maxYearsAgo`, `maxYearsAhead` (R6). An unknown name is skipped |
| `value` | integer | optional, e.g. 20 for `maxYearsAgo` |

### Component `form.option` (`FormOption`)
| Field | Type | Notes |
|-------|------|-------|
| `label` | string | required, shown to the person |
| `value` | string | required, stored in the session |

Options keep their order in the component list.

## Quote session (changed, `sessionStorage` key `quote-session`)

```text
{ countryCode: "co", data: { step1?: Record<key, string | boolean>, step1Completed?: boolean } }
```
- `step1` is saved on every change (R8). `hasData()` is true only if some value is non-empty.
- `step1Completed` is set by a valid "Continuar" and cleared on any edit (R9).
- Changing country discards `data` (US-00 FR-007/FR-012, unchanged).

## Seed (FR-013): all fields required and published

| # | CO key · label · type | CL key · label · type | Rules |
|---|----------------------|----------------------|-------|
| 1 | `documentType` · Tipo de documento · select (CC, CE) | `rut` · RUT · text | CL: pattern + `rut` |
| 2 | `documentNumber` · Número de documento · text | — | pattern `^[0-9]{6,10}$` |
| 3 | `fullName` · Nombre completo · text | same | pattern: letters and spaces, 3–80 |
| 4 | `birthDate` · Fecha de nacimiento · date | same | `legalAge` |
| 5 | `email` · Correo electrónico · text | same | email pattern |
| 6 | `mobilePhone` · Celular · text | same | CO `^3[0-9]{9}$` · CL `^9[0-9]{8}$` |
| 7 | `city` · Ciudad · select | `region` · Región · select | CO: 5 cities · CL: the 16 regions, north to south (Gate 3) |
| 8 | `plate` · Placa · text | `plate` · Patente · text | CO `^[A-Za-z]{3}[0-9]{3}$` · CL `^([A-Za-z]{4}[0-9]{2}\|[A-Za-z]{2}[0-9]{4})$` |
| 9 | `vehicleMake` · Marca · select | same | 6 common makes |
| 10 | `vehicleYear` · Año del vehículo · number | same | `maxYearsAgo` 20, `maxYearsAhead` 1 |

Rows 1–7 are in the `policyholder` section and rows 8–10 in `vehicle`. Colombia has 10 fields and Chile 9. A field can be in both countries with the same key, because keys only need to be unique within a country.
