# Feature Specification: US-03 – Summary and payment

**Feature Branch**: `004-us-03-summary-payment`

**Created**: 2026-11-22

**Status**: Approved (Gate 1) — 2026-11-22

**Input**: User story [US-03](../../docs/user-stories/US-03.md) (verbatim business story, the source of truth). Builds on [US-02](../003-us-02-plan-list/spec.md), which provides the chosen plan in the tab's quote session, the simulated price ([ADR 0005](../../docs/adr/0005-simulated-price-rule-age-bands.md)) and a summary placeholder at `/:country/quote/summary`. Architecture: [ADR 0001](../../docs/adr/0001-multi-country-content-strategy.md) (terms and conditions on Country, limits of configurability), [ADR 0003](../../docs/adr/0003-bootstrap-grid-for-layouts.md) (layout), [ADR 0004](../../docs/adr/0004-dynamic-form-from-cms.md) (step 1 values by field key). This is the last story of the wizard.

## Clarifications

### Session 2026-11-22

- Q: How does the app know which fields to mask (Colombia's document key is `documentNumber`, Chile's is `rut`)? → A: A per-field "masked in summary" setting in the content manager, set by editors; no keys in code (FR-003).
- Q: Which rule decides a simulated payment's outcome? → A: Rejected when the identity document ends in "0000"; approved otherwise. Documented in the README and an ADR (FR-008).
- Q: What happens to the tab's quote data after a successful payment? → A: Form data, plan and acceptance are cleared at once; only the receipt (quote number, plan, amount, date, country) stays, so a reload still shows it. "Nueva cotización" clears it and goes to country selection (FR-011).
- Q: How do editors write the terms and conditions? → A: Rich text with basic formatting (headings, paragraphs, bold, lists, links), rendered safely with no raw HTML (FR-005).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review my quote (Priority: P1)

A person who chose a plan sees one summary with their data, their vehicle's data and the chosen plan with its final monthly price, before paying.

**Why this priority**: The person must confirm what they are buying; it is the core of the story.

**Independent Test**: Complete steps 1 and 2 in Colombia and in Chile, reach the summary: every step 1 answer appears under its current label, grouped as policyholder or vehicle, the identity document is partly masked, and the plan shows the same price as on step 2.

**Acceptance Scenarios**:

1. **Given** I chose a plan, **When** I reach the summary, **Then** I see my data, my vehicle's data and the chosen plan (name and final monthly price in my country's currency).
2. **Given** my country asks for different fields, **When** I view the summary, **Then** it lists the fields my country's form asked, with their current labels, in the form's order, and the label of the chosen option for list fields.
3. **Given** a field the business marked as masked (the identity document), **When** I view the summary, **Then** only its last 4 characters are visible; the rest is replaced by a mask character.
4. **Given** an optional field I left empty, **When** I view the summary, **Then** it is not listed.

---

### User Story 2 - Fix my data or change the plan (Priority: P1)

From the summary, the person can go back to edit step 1 or choose another plan, and return to an updated summary.

**Why this priority**: The business rule requires it, and a wrong quote cannot be paid.

**Independent Test**: From the summary, edit the birth date in step 1 and continue through step 2: the summary shows the new date and the recalculated price. Then change the plan: the summary shows the new plan.

**Acceptance Scenarios**:

1. **Given** I am on the summary, **When** I choose "Editar mis datos", **Then** step 1 opens with my answers filled in.
2. **Given** I am on the summary, **When** I choose "Cambiar plan", **Then** step 2 opens with my plan still chosen.
3. **Given** I changed my data or my plan, **When** I come back to the summary, **Then** it shows the new values and the recalculated price.

---

### User Story 3 - Accept the terms of my country (Priority: P1)

The person reads the terms and conditions configured by the business for their country and accepts them before paying.

**Why this priority**: Paying without accepting the terms is not allowed.

**Independent Test**: Change Chile's terms in the content manager and publish: the Chilean summary shows the new text, Colombia's does not change. "Pagar" stays disabled until the acceptance box is ticked.

**Acceptance Scenarios**:

1. **Given** I am on the summary, **When** I view the terms and conditions, **Then** the text is the one published for my country.
2. **Given** I have not accepted the terms, **When** I view the summary, **Then** "Pagar" is disabled.
3. **Given** I accept the terms, **When** I view the summary, **Then** "Pagar" is enabled; if I untick them, it is disabled again.

---

### User Story 4 - Pay and get my quote number (Priority: P1)

The person pays (simulated) and gets a confirmation with a quote number; a failed payment can be retried without losing anything.

**Why this priority**: It closes the quote; without it the person never becomes insured.

**Independent Test**: Accept the terms and press "Pagar": the button is locked and shows progress, then a confirmation shows a quote number. Repeat with an identity document ending in "0000": a clear error appears, the data and the acceptance are kept, and "Pagar" works again.

**Acceptance Scenarios**:

1. **Given** I accepted the terms, **When** I press "Pagar", **Then** the button is locked and announced as processing until the payment ends, and further presses do nothing.
2. **Given** the payment succeeds, **When** it ends, **Then** I see a confirmation with a simulated quote number, the plan and the amount paid.
3. **Given** the payment fails, **When** it ends, **Then** I see a clear error message, my data, plan and acceptance are kept, and I can press "Pagar" again.
4. **Given** I see the confirmation, **When** I reload, go back or open the summary again, **Then** the same quote is never paid twice.

---

### Edge Cases

- **Terms not configured or not published for a country**: the summary shows an error instead of the terms and "Pagar" stays disabled; a person can never pay without terms to accept.
- **Content service fails** (country, form fields or plans): the summary shows an error with a retry action, like steps 1 and 2.
- **Chosen plan no longer offered** when reaching the summary: the person is sent back to step 2 to choose again (US-02 behaviour).
- **Step 1 data no longer valid**: the person is sent back to step 1 (US-02 re-check).
- **Reaching the summary without a plan or the confirmation without a payment** (typed URL): the person is redirected to the step they still need.
- **Very long terms text**: shown in a scrollable area of limited height that is keyboard-reachable; the acceptance box stays visible.
- **Identity document of 4 characters or fewer**: shown fully masked.
- **Price changed by the business between step 2 and payment**: the summary always shows the price calculated with the current plan and country data, and that is the amount paid.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The summary MUST show the step 1 answers in two groups, policyholder data and vehicle data, using each field's current label and order from the content manager, and the option label for list fields. Empty optional fields are not shown.
- **FR-002**: The summary MUST show the chosen plan: name, short description and final monthly price, calculated with the same rule and format as step 2 (US-02 FR-004, FR-005).
- **FR-003**: The identity document number MUST be shown partially masked: only the last 4 characters visible, the rest replaced by "•". Which fields are masked is a per-field setting in the content manager (seeded on for `documentNumber` and `rut`); no field key is hard-coded for masking.
- **FR-004**: The summary MUST offer "Editar mis datos" (to step 1, answers kept) and "Cambiar plan" (to step 2, plan kept). Coming back shows the updated data and price.
- **FR-005**: The business team MUST be able to configure the terms and conditions text per country as rich text with basic formatting (headings, paragraphs, bold, lists, links), and publish it through draft and publish, without code changes. It is rendered safely, never as raw HTML.
- **FR-006**: The summary MUST show the active country's published terms and an unticked acceptance checkbox with a visible label. "Pagar" MUST be disabled until it is ticked.
- **FR-007**: Pressing "Pagar" MUST lock the button and show a processing state until the payment ends. While processing, and after success, the payment cannot be submitted again.
- **FR-008**: The payment is simulated: no card or bank data is asked or stored, nothing is charged, and the outcome is decided by a documented rule: rejected when the identity document ends in "0000", approved otherwise.
- **FR-009**: On success, a confirmation view MUST show a simulated quote number, the plan, the amount paid and the country. The quote number is unique enough not to repeat in practice, and its format is documented.
- **FR-010**: On rejection, the summary MUST show a clear error message announced to assistive technology, keep the data, plan and acceptance, and let the person retry.
- **FR-011**: After a successful payment, the form data, plan and acceptance MUST be cleared at once, so the quote cannot be paid again or edited. Only the receipt (quote number, plan, amount, date, country) stays in the tab, so the confirmation survives a reload. "Nueva cotización" clears the receipt and goes to country selection.
- **FR-012**: The summary MUST be reachable only with a valid step 1 and a chosen plan still offered; the confirmation only after a successful payment.
- **FR-013**: The summary, payment and confirmation MUST show loading and error states, be fully keyboard-operable, and work on mobile (320 px) and desktop. The stepper shows step 3 "Resumen" as current.
- **FR-014**: The seed MUST provide fictitious terms and conditions for Colombia and Chile, different from each other.

### Key Entities

- **Country** (from US-00–US-02): gains its **terms and conditions** text in this story.
- **Form field** (from US-01): gains a **masked in summary** setting.
- **Quote session** (from US-01/US-02): also holds the terms acceptance and the payment state; after success it holds only the receipt.
- **Confirmed quote**: simulated quote number, country, plan, amount, date. It exists only in the tab; nothing is sent to a server.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of summaries, every step 1 answer and the plan's price match what the person entered and saw on step 2.
- **SC-002**: A terms text published by the business team for a country appears on that country's summary after a reload, with no deployment, in 100% of cases.
- **SC-003**: No quote can be paid twice: repeated presses, reloads and back navigation produce at most one confirmation per quote.
- **SC-004**: After a rejected payment, the person can retry without re-entering anything, in 100% of cases.
- **SC-005**: A person can review, accept and pay in under 1 minute, using only the keyboard, on mobile (320 px) and desktop.

## Assumptions

- Copy is in Spanish. Terms text comes from the content manager; labels, buttons and messages are fixed application texts.
- The simulated payment takes about 1–2 seconds so the processing state is visible.
- Policyholder and vehicle groups follow the field groups already defined for step 1 (US-01).
- Data is fictitious: terms texts and quote numbers are invented; no real payment is made.
- The quote session lives in the tab only (US-01); closing the tab discards it, including the confirmation.

## Conflicts with ADRs *(resolved at clarify)*

- **Masking by key vs. configuration (ADR 0001/0004):** ADR 0001 says the summary finds the document by key `documentNumber`, but Chile's key is `rut`. Resolved: a per-field setting in the content manager (FR-003); ADR 0001 is amended at plan.
- **Payment outcome:** no rule was defined. Resolved: the document-ending rule (FR-008), documented in an ADR at plan.
