# Research: US-03 – Summary and payment

**Spec**: [spec.md](spec.md) · **Plan**: [plan.md](plan.md)

## R1 — Where the simulated payment runs

- **Decision:** in the browser, as a pure function `simulatePayment(step1Values, maskedKeys)` behind a `PaymentService` that waits ~1.5 s (`timer`) and resolves `approved` or `rejected`.
- **Rationale:** the spec keeps all quote data in the tab and never sends it to a server (US-01/US-02 assumptions, FR-008). A pure function is deterministic and trivially unit-tested; the service is the single seam a real gateway would replace.
- **Alternatives:** a Strapi custom endpoint `POST /api/payments` (sends personal data to the server, needs a new Public permission and a controller for a fake result); a random outcome (not reproducible, rejected at clarify).

## R2 — Payment outcome rule

- **Decision:** rejected when any field marked "masked in summary" has a value whose letters and digits (dots, hyphens and spaces removed) end in `0000`; approved otherwise. Test values: CO cédula `1020300000`; CL RUT `10.006.000-0` (valid check digit, digits `100060000`).
- **Rationale:** clarify Q2. Reusing the masked flag (R4) means the rule finds "the identity document" without hard-coding `documentNumber`/`rut`. Normalising makes the RUT format irrelevant.
- **Alternatives:** a rule on a hard-coded key (breaks for Chile, conflicts with ADR 0001); a rule on the plate (not the identity document the clarify answer names).

## R3 — Quote number format

- **Decision:** `<CC>-<YYYYMMDD>-<6 chars>`, e.g. `CO-20261122-7KQ4MZ`. The 6 characters come from `crypto.getRandomValues` over a 31-character alphabet without look-alikes (no `0 O 1 I L`): ~887 million combinations per country and day.
- **Rationale:** readable aloud and copyable, tells support the country and day, and collisions are negligible for a demo (FR-009). No server counter exists.
- **Alternatives:** a UUID (unreadable); a sequential number (needs a server); `Math.random` (not a CSPRNG, weaker spread).

## R4 — Which fields are masked

- **Decision:** FormField gains `maskedInSummary` (boolean, default `false`). Seed sets it `true` for CO `documentNumber` and CL `rut`. Masking shows the last 4 characters and replaces every earlier character with `•` (values of 4 characters or fewer are fully masked).
- **Rationale:** clarify Q1 and ADR 0001 (no country data in Angular). Editors can flag a new document field without a deployment.
- **Backfill:** existing databases get `maskedInSummary = true` on `documentNumber`/`rut` rows only where the column is still `null` (never set by an editor), at the DB layer on draft and published rows alike, like `backfillLegalAge`. A boolean scalar needs no draft/publish dance (US-02 R-01/R-15 only applied to components).

## R5 — Terms and conditions format and rendering

- **Decision:** Country gains `termsAndConditions` of Strapi type **`blocks`** (rich text). Angular renders it with its own small `RichTextComponent` that walks the blocks JSON with `@switch` templates: paragraph, heading (levels shifted to `h3`–`h4` under the page `h2`), ordered/unordered list, quote, and inline text with bold, italic and underline; links only for `https:`, `http:` and `mailto:` (else plain text), opened in a new tab with `rel="noopener noreferrer"`. Images and code blocks are ignored.
- **Rationale:** clarify Q4. No `innerHTML`, no sanitiser and no new dependency; Angular's interpolation escapes all text (FR-005, OWASP XSS).
- **Alternatives:** Strapi `richtext` (Markdown) plus a Markdown library (new dependency, then HTML that needs sanitising); `@strapi/blocks-react-renderer` (React only).
- **Backfill:** seeded terms are added to countries whose `termsAndConditions` is empty, with the same draft-only write and "publish only if clean" rule as the US-02 pricing backfill (`shouldPublishAfterBackfill`), because `blocks` is written through the Document Service.

## R6 — Session after payment (receipt only)

- **Decision:** `QuoteSession` gains `termsAccepted: boolean` and `receipt: { quoteNumber, countryCode, planName, amount, currency, numberLocale, paidAt } | null`. On approval, `completePayment(receipt)` writes the receipt and drops `data`, `step1Completed`, `planId` and `termsAccepted` in one write. `start(country)` and "Nueva cotización" clear the receipt.
- **Rationale:** clarify Q3 (FR-011). The receipt holds formatted inputs (currency, locale) so the confirmation renders without loading anything.
- **Alternatives:** keep everything read-only (keeps personal data longer); clear everything (the confirmation is lost on reload).

## R7 — Preventing a double payment

- **Decision:** three layers. (1) The page holds `paymentState: 'idle' | 'processing' | 'rejected'`; `pay()` returns early unless idle or rejected, and the button is `disabled` + `aria-busy` while processing. (2) On approval the receipt is saved *before* navigating to the confirmation (`replaceUrl: true`). (3) A `noReceiptGuard` on the summary (and steps 1–2) redirects to the confirmation while a receipt exists, so back navigation and reloads never show "Quiero mi seguro" again.
- **Rationale:** FR-007, SC-003. A reload during processing cancels a payment that never happened (it is simulated), so nothing is lost.

## R8 — Summary rows from the configured fields

- **Decision:** a pure `buildSummaryRows(fields, values, locale)` returns `{ policyholder: Row[], vehicle: Row[] }`, each row `{ key, label, display }`, in the fields' configured order. Display: select → the option label; checkbox → "Sí"/"No"; date → `Intl.DateTimeFormat(numberLocale)` (e.g. `12/05/1990`); masked → R4; empty optional values are skipped; a value for a field no longer configured is not shown.
- **Rationale:** ADR 0004 (keys, not labels, identify values); FR-001.

## R9 — Routes and guards

- **Decision:** `summary` → `SummaryPage` (`noReceiptGuard`, `step1CompleteGuard`, `planChosenGuard`); new `confirmation` → `ConfirmationPage` (`receiptGuard`: no receipt → `summary`, which then guards back to the step needed). The plan-still-offered check runs in the page (it already loads the plans), dropping `planId` and redirecting to `plans`, like US-02.
- **Rationale:** FR-012; reuses the US-02 guards.
