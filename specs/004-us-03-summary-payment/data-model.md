# Data model: US-03 – Summary and payment

**Spec**: [spec.md](spec.md) · **Research**: [research.md](research.md)

## Strapi (source of truth for the API contract)

### Country (`api::country.country`) — additive

| Attribute | Type | Rules | Description shown to editors |
|-----------|------|-------|------------------------------|
| `termsAndConditions` | `blocks` (rich text) | optional in the schema; the summary blocks payment when empty (spec Edge Cases) | "Términos y condiciones que la persona acepta antes de pagar. Usa títulos, párrafos, negritas, listas y enlaces; las imágenes y el código no se muestran." |

Draft & publish already applies to Country: a terms change goes live only when published (ADR 0001).

### FormField (`api::form-field.form-field`) — additive

| Attribute | Type | Rules | Description shown to editors |
|-----------|------|-------|------------------------------|
| `maskedInSummary` | boolean | default `false` | "Oculta el valor en el resumen salvo los 4 últimos caracteres. Márcalo en el documento de identidad. También decide el pago simulado (ADR 0006)." |

### Seed (fictitious)

- CO and CL get different Spanish terms: a heading, 3–4 short paragraphs, one bullet list, one `https:` link to a fictitious page on `example.com`. PE (inactive) gets none.
- `maskedInSummary: true` on CO `documentNumber` and CL `rut`; `false` on every other field.
- Backfill on existing databases: R4 (masked flag, only where `null`) and R5 (terms, only where empty, publish only if clean).

## Angular models

### Country (`core/country/country.model.ts`) — additive

- `termsAndConditions: RichTextBlock[]` — `[]` when missing or not an array.

### Rich text (`shared/ui/rich-text/rich-text.model.ts`, new)

```ts
type RichTextInline =
  | { type: 'text'; text: string; bold?: boolean; italic?: boolean; underline?: boolean }
  | { type: 'link'; url: string; children: RichTextInline[] };
type RichTextBlock =
  | { type: 'paragraph' | 'quote'; children: RichTextInline[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: RichTextInline[] }
  | { type: 'list'; format: 'ordered' | 'unordered'; children: { type: 'list-item'; children: RichTextInline[] }[] };
```

Unknown block or inline types are dropped by the mapper; links with a scheme other than `https:`, `http:` or `mailto:` become their text.

### Form field descriptor (`features/quote-form/data/form-field.model.ts`) — additive

- DTO and descriptor gain `maskedInSummary: boolean` (missing → `false`).

### Summary row (`features/summary/summary-rows.ts`, new)

- `SummaryRow { key: string; label: string; display: string }`; `SummaryRows { policyholder: SummaryRow[]; vehicle: SummaryRow[] }` (R8).

### Quote session (`core/session/quote-session.store.ts`) — additive

```ts
interface QuoteReceipt {
  quoteNumber: string;     // CO-20261122-7KQ4MZ (R3)
  countryCode: string;
  planName: string;
  amount: number;          // whole pesos, from simulatePrice
  currency: string;        // COP, CLP
  numberLocale: string;    // es-CO, es-CL
  paidAt: string;          // ISO date-time
}
interface QuoteSession { /* existing */ termsAccepted?: boolean; receipt?: QuoteReceipt | null }
```

| State | `data` / `step1Completed` / `planId` | `termsAccepted` | `receipt` |
|-------|-------------------------------------|-----------------|-----------|
| Quoting (summary) | present | false → true when ticked | null |
| Payment rejected | kept | kept | null |
| Paid | **removed** | **removed** | set |
| "Nueva cotización" or `start(country)` | removed | removed | **removed** |

`saveStep1` and `savePlan` keep `termsAccepted`; changing the plan or the data does not untick it (the person accepted the country's terms, not a plan).

### Payment (`features/summary/payment/`, new)

- `simulatePayment(values: Step1Values, maskedKeys: string[]): 'approved' | 'rejected'` — pure (R2).
- `PaymentService.pay(...)`: `Observable<'approved' | 'rejected'>`, delayed ~1.5 s.
- `createQuoteNumber(countryCode, now, random)`: pure, `random` injectable for tests (R3).
