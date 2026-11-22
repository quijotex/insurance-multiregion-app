# Contract — Application routes (UI)

| Address | Shows | Spec |
|---------|-------|------|
| `/` | Country selection screen; last visited country preselected if available | FR-002, FR-003, FR-011 |
| `/?unavailable=<code>` | Selection screen + "El país seleccionado no está disponible." | FR-006 |
| `/:country/quote` | Wizard shell for `:country` (header with country and "Cambiar país") → step 1 placeholder | FR-004, FR-005, FR-007 |
| `/CO/quote` (upper/mixed case) | Redirect to `/co/quote` | Edge Cases |
| `/:unknown/quote`, `/:inactive/quote` | Redirect to `/?unavailable=<code>` | FR-006 |
| Any other address | Redirect to `/` | — |

Rules:
- `:country` is the lower-case country `code`.
- Entering `/:B/quote` from a tab whose session holds data for another country asks for confirmation first (FR-012); cancel returns to `/:A/quote`.
- US-01 to US-03 add child steps under `/:country/quote` (e.g. `/co/quote/plans`); this contract only fixes the prefix.
