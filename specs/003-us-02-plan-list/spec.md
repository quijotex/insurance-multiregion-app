# Feature Specification: US-02 – Plan list

**Feature Branch**: `003-us-02-plan-list`

**Created**: 2026-11-22

**Status**: Approved (Gate 1) — 2026-11-22

**Input**: User story [US-02](../../docs/user-stories/US-02.md) (verbatim business story, the source of truth). Builds on [US-01](../002-us-01-policyholder-vehicle-form/spec.md), which provides the step 1 form, the tab's quote session (step 1 values and completion) and a step 2 placeholder at `/:country/quote/plans`. Architecture: [ADR 0001](../../docs/adr/0001-multi-country-content-strategy.md) (Plan collection, currency on Country, limits of configurability), [ADR 0003](../../docs/adr/0003-bootstrap-grid-for-layouts.md) (layout), [ADR 0004](../../docs/adr/0004-dynamic-form-from-cms.md) (step 1 values by field key).

## Clarifications

### Session 2026-11-22

- Q: Which step 1 data drives the simulated price rule? → A: The policyholder's age and the vehicle's age: final price = base price × driver-age factor × vehicle-age factor (FR-005).
- Q: Can the business change the rule's factors from the content manager? → A: Yes, per country. The age bands and their factors are configured on the Country; the shape of the rule (age × vehicle) is fixed and documented (ADR 0001, limits of configurability).
- Q: Where is the currency configured? → A: On the Country only, with its number format, as ADR 0001 says; every plan uses its country's currency (FR-004).
- Q: What period does a price cover and what does a plan show? → A: Prices are monthly. Each plan shows only its final monthly price ("/ mes") (FR-004).
- Q (Gate 2, human design review): Should the page explain how the price is calculated? → A: No. The rule still applies, but the person doesn't need to know how the company estimates prices: no help text about it. The rule is documented as an explicit decision in the docs (ADR 0005), in the code and in the content manager (FR-004, FR-005).
- Q (Gate 2, human design review): What does "Continuar" do before a plan is chosen? → A: It is disabled until a plan is chosen, with no extra hint text (FR-008).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the plans for my country (Priority: P1)

A person who completed step 1 sees the plans offered in their country, in the order the business chose, each with its name, short description, price, coverages and benefits.

**Why this priority**: Without plans there is nothing to choose; it is the core of the quote.

**Independent Test**: With plans configured for Colombia and Chile, complete step 1 in each country and check that step 2 shows only that country's active, published plans, in order, with prices in the country's currency.

**Acceptance Scenarios**:

1. **Given** I completed step 1, **When** I reach the plans step, **Then** I see only the active and published plans for my country, in the configured order.
2. **Given** a plan, **When** I view it, **Then** I see its name, short description, final price in my country's currency and format, its coverages and its benefits.
3. **Given** a plan is inactive, unpublished or belongs to another country, **When** I view the list, **Then** it is not shown.

---

### User Story 2 - Spot the recommended plan (Priority: P2)

The business marks one plan as recommended, and the person sees it highlighted.

**Why this priority**: It guides the choice, but the list works without it.

**Independent Test**: Mark one Chilean plan as recommended, reload step 2 for Chile: that plan is visually distinguished and announced as recommended.

**Acceptance Scenarios**:

1. **Given** a plan is marked as recommended, **When** I view the plan list, **Then** that plan is visually distinguished from the others, and the distinction is not conveyed by colour alone.
2. **Given** no plan is marked as recommended, **When** I view the list, **Then** no plan is highlighted.

---

### User Story 3 - Choose one plan and continue (Priority: P1)

The person selects exactly one plan and moves on to the summary.

**Why this priority**: The quote cannot finish without a chosen plan.

**Independent Test**: Select a plan, then another: only the last one is marked. Press "Continuar": the summary step opens. Go back: the chosen plan is still marked.

**Acceptance Scenarios**:

1. **Given** I am on the plan list, **When** I select a plan, **Then** it is marked as chosen and any previously chosen plan is not.
2. **Given** a plan is chosen, **When** I press "Continuar", **Then** I move on to the summary step.
3. **Given** no plan is chosen, **When** I view the list, **Then** "Continuar" is disabled.
4. **Given** I chose a plan, **When** I come back to step 2 from the summary or reload the tab, **Then** the same plan is still chosen, if it is still offered.
5. **Given** I use only the keyboard or a screen reader, **When** I choose a plan, **Then** I can reach, choose and confirm it, and I hear which plan is chosen.

---

### User Story 4 - Be told when there are no plans (Priority: P2)

When the business has no active plans for a country, the person is told so instead of seeing an empty page.

**Why this priority**: An empty page would look broken and lose the person.

**Independent Test**: Deactivate every plan of a country and reach step 2: a clear message explains that no plans are available, with a way back.

**Acceptance Scenarios**:

1. **Given** there are no active plans for my country, **When** I reach the plans step, **Then** I see a message explaining that no plans are available, and "Continuar" is not offered.

---

### Edge Cases

- **Content service fails**: step 2 shows an error with a retry action, like step 1 (US-01 FR-010).
- **Step 1 data no longer valid** (the business changed a field or rule after the person continued, review R-19): step 2 re-checks the saved step 1 values against the current fields and sends the person back to step 1 when they are not valid.
- **Chosen plan no longer offered** (deactivated, unpublished or removed): the choice is dropped, and the person must choose again.
- **Step 1 edited after choosing a plan**: the plan stays chosen and its price is recalculated with the new data.
- **More than one plan marked as recommended**: only the first one in the configured order is highlighted.
- **Plan saved without a country**: the content manager rejects it, as for form fields (ADR 0001 mitigation).
- **Plan with no coverages or no benefits**: shown without that list; never an empty heading.
- **Price adjustment needs a step 1 value that the country does not ask for**, or no band covers the age: that factor does not apply (factor 1).
- **Overlapping bands** configured by mistake: the first band in its configured order wins.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The business team MUST be able to configure each plan per country with: name, short description, base price, coverages, benefits, order, recommended flag, active status and country, and publish or unpublish it, without code changes.
- **FR-002**: Step 2 MUST show only the plans of the active country that are published and active, sorted by their configured order.
- **FR-003**: Each plan MUST show its name, short description, final price, coverages and benefits.
- **FR-004**: Prices are monthly. Each plan MUST show only its final monthly price, followed by "/ mes", in the active country's currency and number format (Colombian pesos for Colombia, Chilean pesos for Chile), with no decimals. The currency and format are configured once on the country, never on a plan. The page does not explain how the price is calculated.
- **FR-005**: The final price MUST be the base price × the driver-age factor × the vehicle-age factor, rounded to a whole peso. Each factor comes from the age bands configured on the active country (an age range and its factor); the policyholder's age and the vehicle's age come from step 1. The rule is simulated, and it is documented as an explicit decision in the docs, in the code and in the content manager's field descriptions, but not shown to the person. The same inputs MUST always give the same price.
- **FR-006**: A plan marked as recommended MUST be visually distinguished and announced as recommended to assistive technology. At most one plan is highlighted (see Edge Cases).
- **FR-007**: The person MUST be able to choose exactly one plan; choosing another replaces the choice. The choice MUST be visible and announced.
- **FR-008**: "Continuar" MUST be disabled until a plan is chosen; once a plan is chosen, it moves to the summary step.
- **FR-009**: The chosen plan MUST be saved in the tab's session and restored when the person returns to step 2 or reloads, while the plan is still offered.
- **FR-010**: Step 2 MUST show loading, empty ("no plans available") and error (with retry) states. The empty state offers a way back to step 1.
- **FR-011**: Step 2 MUST be reachable only with a complete and still valid step 1 (US-01 guard, plus the re-check in Edge Cases).
- **FR-012**: The summary step MUST exist as a placeholder with a "Volver" action to step 2, until US-03 replaces it.
- **FR-013**: The plan list MUST be fully keyboard-operable and work on mobile (320 px) and desktop.
- **FR-014**: The seed MUST provide fictitious plans: 3 for Colombia and 3 for Chile, each with coverages and benefits, one recommended per country, plus one inactive plan to show filtering, and the price factors of each country (see Assumptions).

### Key Entities

- **Plan**: one offer in one country. Attributes: name, short description, base price, coverages (list), benefits (list), order, recommended, active, country, publication status.
- **Country** (from US-00/US-01): gains its **currency**, **number format**, **driver-age bands** and **vehicle-age bands** (each band: from age, to age, factor) in this story.
- **Quote session** (from US-01): now also holds the chosen plan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A plan published, reordered, highlighted or deactivated by the business team is reflected on step 2 after a reload, with no deployment, in 100% of cases.
- **SC-002**: 100% of shown prices use the country's currency and format, and match the documented rule for the given step 1 data.
- **SC-003**: A person can compare the plans and choose one in under 1 minute.
- **SC-004**: The chosen plan is still chosen in 100% of returns to step 2 and reloads, while it is offered.
- **SC-005**: The whole step can be completed using only the keyboard, on mobile (320 px) and desktop.

## Assumptions

- Copy is in Spanish. Plan texts come from the content manager; state messages and button texts are fixed application texts.
- **Seeded price factors (same for both countries, editable per country):** driver age under 25: 1.20; 25–65: 1.00; over 65: 1.15. Vehicle age 0–5 years: 1.00; 6–10: 1.10; 11–20: 1.20. Ages are whole years on the current date. It is a simulation, not a real tariff.
- The summary step (US-03) does not exist yet, so it is a placeholder (FR-012). Data stays in the tab's session and is never sent to a server.
- Data is fictitious: plan names, prices, coverages and benefits are invented.

## Conflicts with ADR 0001 *(resolved at clarify)*

- **Currency:** the story lists currency as a plan attribute; ADR 0001 keeps it only on Country. Resolved: Country only (FR-004).
- **Price rule:** resolved as a fixed, documented rule shape with its factors configured per country (FR-005), consistent with ADR 0001's limits of configurability.
