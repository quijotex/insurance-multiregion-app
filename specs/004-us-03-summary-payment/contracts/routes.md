# Contract: wizard routes after US-03

| Path | Page | Guards (in order) | Redirects |
|------|------|-------------------|-----------|
| `/:country/quote` | Step 1 form | `noReceiptGuard` | receipt → `confirmation` |
| `/:country/quote/plans` | Plan list | `noReceiptGuard`, `step1CompleteGuard` | receipt → `confirmation`; step 1 invalid → step 1 |
| `/:country/quote/summary` | **Summary** (replaces the placeholder) | `noReceiptGuard`, `step1CompleteGuard`, `planChosenGuard` | receipt → `confirmation`; no plan → `plans`; plan no longer offered (checked in the page) → `plans` |
| `/:country/quote/confirmation` | **Confirmation** (new) | `receiptGuard` | no receipt, or receipt of another country → `summary` |

- "Editar mis datos" → `/:country/quote`; "Cambiar plan" → `/:country/quote/plans`.
- After approval: save the receipt, then `navigate(['confirmation'], { replaceUrl: true })`.
- "Nueva cotización" clears the session and goes to `/` (country selection).
- The stepper shows step 3 "Resumen" as current on the summary, and all 3 steps done on the confirmation.
