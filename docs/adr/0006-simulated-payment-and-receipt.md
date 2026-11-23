# 0006 — Simulated payment in the browser, quote number and receipt-only session

- **Status:** Accepted (Gate 2, US-03 — 2026-11-22)
- **Date:** 2026-11-22
- **Related:** US-03, ADR 0001 (FormField `maskedInSummary`), ADR 0005 (the price paid), `specs/004-us-03-summary-payment/research.md` (R1–R3, R6, R7)

## Context and problem

US-03 ends the quote with a payment that is **simulated** (story context). The person must see a processing state, a confirmation with a quote number, or a clear rejection they can retry (FR-007–FR-011). Testers and the e2e tests need to trigger a rejection on purpose. The quote data (including the identity document) has always stayed in the tab and has never been sent to a server.

## Decision drivers

- No personal data leaves the browser; no card data is ever asked for (FR-008).
- A reproducible, documented outcome rule (clarify Q2).
- A payment can never be submitted twice (FR-007, SC-003).
- After paying, keep only what the confirmation needs (clarify Q3).
- KISS: no new endpoint, permission or dependency.

## Considered options

1. **Pure function in Angular behind a `PaymentService`** with a short delay.
2. **A Strapi custom endpoint** `POST /api/payments` returning the outcome and a quote number.
3. **A third-party payment sandbox** (e.g. a provider's test mode).

## Decision

Chosen option: **1**.
- **Outcome rule:** a payment is **rejected** when any field marked `maskedInSummary` (the identity document) has a value whose letters and digits end in `0000` (dots, hyphens and spaces removed); otherwise it is **approved**. Test values: CO `1020300000`, CL `10.006.000-0`.
- **Delay:** ~1.5 s, so the processing state is visible.
- **Quote number:** `<CC>-<YYYYMMDD>-<6 chars>` (e.g. `CO-20261122-7KQ4MZ`), with 6 characters from `crypto.getRandomValues` over a 31-character alphabet without look-alikes.
- **Session:** on approval, one write saves a receipt (quote number, country, plan name, amount, currency, locale, date) and removes the step 1 data, the plan and the acceptance. "Nueva cotización" or choosing a country removes the receipt.
- **No double payment:** the button locks while processing; the receipt is saved before leaving the summary; a guard sends every wizard step to the confirmation while a receipt exists.

The rule is documented here, in the README, in a doc comment on `simulatePayment` that links here, and in the Strapi description of `maskedInSummary`.

## Consequences

- **Positive:** deterministic, testable, private; the `PaymentService` is the one seam a real gateway would replace.
- **Negative / trade-offs:**
  - Nothing is recorded server-side: the business cannot see sold quotes, and the quote number is only unique "in practice".
  - The rule is visible in the browser bundle. That is fine for a simulation.
  - A tester must know the "0000" values (README, quickstart).
- **Follow-ups:** a real product needs a server-side quote, a payment provider with tokenised card entry (never card data in our app), and a privacy/consent decision before sending personal data.

## Pros and cons of the options

### 1. Angular pure function
- Good: no data sent; no endpoint; unit-testable; the simplest.
- Bad: no server record; trust lives in the browser.

### 2. Strapi endpoint
- Good: a server could log the quote and generate sequential numbers.
- Bad: sends personal data to the server for a fake result; needs a route, a Public permission (a write on the Public role, against ADR 0001's find-only rule) and error handling.

### 3. Payment sandbox
- Good: realistic flow.
- Bad: real third-party accounts and keys, card fields, network dependency; far beyond "payment is simulated".
