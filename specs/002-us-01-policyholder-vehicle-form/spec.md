# Feature Specification: US-01 – Policyholder and vehicle data form

**Feature Branch**: `002-us-01-policyholder-vehicle-form`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User story [US-01](../../docs/user-stories/US-01.md) (verbatim business story, the source of truth). Builds on [US-00](../001-us-00-country-selection/spec.md), which provides the country selection and the wizard shell with a step 1 placeholder. Architecture: [ADR 0001](../../docs/adr/0001-multi-country-content-strategy.md) (content per country, validations, limits of configurability) and [ADR 0003](../../docs/adr/0003-bootstrap-grid-for-layouts.md) (layout).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fill in my data and my vehicle's data for my country (Priority: P1)

A person who chose a country sees step 1 of the wizard with the fields the business configured for that country, in the configured order: their own data first, then their vehicle's. They fill it in and continue to step 2.

**Why this priority**: Without the form there is nothing to price; it is the first step of every quote.

**Independent Test**: With fields configured for Colombia and Chile, open `/co/quote` and `/cl/quote` and check that each shows only its own fields in order. Fill in valid data and continue to step 2.

**Acceptance Scenarios**:

1. **Given** fields are configured for Colombia and for Chile, **When** I open the wizard for a country, **Then** I see only that country's published fields, in the configured order, each with its label and help text.
2. **Given** a field is a select (for example vehicle make or city), **When** I open it, **Then** I see the options configured for it in the content manager.
3. **Given** all required fields are valid, **When** I press "Continuar", **Then** I move to step 2.
4. **Given** I use only the keyboard, **When** I fill in the form, **Then** I can reach, fill in and leave every field and press "Continuar".

---

### User Story 2 - Be told what is wrong before continuing (Priority: P1)

When a value does not meet its configured rule, the person sees the configured error message next to the field and cannot continue until it is fixed.

**Why this priority**: The quote depends on correct data; invalid data must never reach the plans step.

**Independent Test**: Leave a required field empty, enter an underage birth date and a vehicle year older than 20 years; check each message and that "Continuar" does not advance.

**Acceptance Scenarios**:

1. **Given** I am filling out the form, **When** a field does not meet its configured validation, **Then** I see that field's configured error message next to it, and I cannot move to the next step.
2. **Given** I press "Continuar" with invalid or empty required fields, **When** the form is checked, **Then** every invalid field shows its message and focus moves to the first invalid field.
3. **Given** the birth date makes me younger than the country's legal age, **When** the field is checked, **Then** I see the configured error message.
4. **Given** a vehicle year later than next year or more than 20 years before the current year, **When** the field is checked, **Then** I see the configured error message.

---

### User Story 3 - Keep my data when I go back (Priority: P2)

A person who moved on to step 2 goes back to step 1 and finds everything they typed still there.

**Why this priority**: Re-typing data is a common reason to abandon a quote.

**Independent Test**: Fill in the form, continue to step 2, go back; all values are still there. Reload the page: they are still there (same tab).

**Acceptance Scenarios**:

1. **Given** I moved on to step 2, **When** I go back to step 1, **Then** my data is still filled in.
2. **Given** I entered data and reload the page in the same tab, **When** step 1 opens, **Then** my data is still filled in.
3. **Given** I entered data, **When** I use "Cambiar país" or open another country's link in the same tab, **Then** I am asked to confirm before my data is discarded (US-00 FR-007, FR-012).

---

### User Story 4 - Change the form without a deployment (Priority: P1)

The business team adds, removes, reorders or relabels fields, and changes their options, rules and messages, from the content manager.

**Why this priority**: It is the core business promise of the product: the form adapts per country without development work.

**Independent Test**: Publish a new field for Chile, reload `/cl/quote`: it appears in its order. Unpublish it: it disappears. No code change, no deployment.

**Acceptance Scenarios**:

1. **Given** the business team adds a new published field in the content manager, **When** I reload the application, **Then** the new field appears without code changes.
2. **Given** a field is unpublished or deleted, **When** I reload, **Then** it no longer appears and is not required.

---

### Edge Cases

- **No fields configured** for the country, or the content service fails: step 1 shows a clear message and a retry action instead of an empty form; "Continuar" is not offered.
- **Unknown rule name**: a field references a rule the application does not implement. The field still works, that rule is skipped, and the problem is reported for developers. The person is not blocked.
- **Field saved without a country**: the content manager rejects it, so a field can never be silently lost (ADR 0001 mitigation).
- **Select without options**: shown as unavailable with its help text; if required, the person cannot continue and sees its error message.
- **Saved data for a field that no longer exists** (after a configuration change): it is ignored. Saved data that no longer meets a changed rule is shown with its error.
- **Two fields with the same technical key in one country**: the content manager rejects the second one.
- **Dates**: legal age and vehicle year are computed against the current date in the person's time zone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The business team MUST be able to configure each form field per country with: label, technical key, type (text, number, select, date, checkbox), required flag, validations, help text, error message, order, section (policyholder or vehicle) and country, and publish or unpublish it, without code changes.
- **FR-002**: Step 1 MUST show only the published fields of the active country, grouped by section (policyholder first, then vehicle) and sorted by their configured order.
- **FR-003**: Select fields MUST list the options configured for them, in their configured order.
- **FR-004**: Each field MUST show its label (always visible), its help text when configured, and a required marker when it is required.
- **FR-005**: A field that does not meet its validation (required, minimum and maximum, pattern, or a named rule) MUST show its configured error message next to it, after the person leaves the field or tries to continue.
- **FR-006**: "Continuar" MUST NOT move to step 2 while any field is invalid. Pressing it MUST show every error and move focus to the first invalid field.
- **FR-007**: The policyholder MUST be of legal age for the active country, using the legal age configured for that country.
- **FR-008**: The vehicle year MUST be no later than next year and no earlier than 20 years before the current year, with the limits set in the field's configuration.
- **FR-009**: Valid step 1 data MUST be kept in the tab's session, so going back from step 2 or reloading shows it again, and the US-00 confirmations before discarding data apply.
- **FR-010**: Step 1 MUST show loading, empty and error states with a retry action (see Edge Cases).
- **FR-011**: The form MUST be fully keyboard-operable, and errors MUST be announced to assistive technology and linked to their field.
- **FR-012**: Step 2 MUST exist as a placeholder with a "Volver" action back to step 1, until US-02 replaces it with the plans.
- **FR-013**: The seed MUST provide fictitious fields for Colombia (document type: cédula de ciudadanía or de extranjería; document number; plate, called placa) and for Chile (RUT; plate, called patente), plus name, birth date, email, phone, city or region, vehicle make and vehicle year for both.

### Key Entities

- **Form field**: one question of step 1 for one country. Attributes: technical key (unique per country), label, type, required, validations (min, max, pattern, named rules with a value), help text, error message, order, section, options (for selects), country, publication status.
- **Country** (from US-00): gains its **legal age** in this story.
- **Quote session** (from US-00): now holds the step 1 values by field key.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A field published, reordered or unpublished by the business team is reflected on step 1 after a reload, with no deployment, in 100% of cases.
- **SC-002**: 100% of invalid values defined in the acceptance scenarios are blocked with the configured message; no invalid data reaches step 2.
- **SC-003**: A person can complete step 1 for either country in under 2 minutes with valid data.
- **SC-004**: 100% of step 1 values are still present after going back from step 2 or reloading the tab.
- **SC-005**: The whole form can be completed using only the keyboard, on mobile (320 px) and desktop.

## Assumptions

- Copy is in Spanish. Field texts come from the content manager; the state messages (loading, empty, error) and the button texts are fixed application texts.
- The plans step (US-02) does not exist yet, so step 2 is a placeholder (FR-012). The full-flow end-to-end test belongs to US-03.
- Rules that cannot be expressed with fixed min, max or pattern values (legal age, vehicle year relative to today, and any document check digit) are named rules that the application implements. Their values (for example 20 years) are configured; new kinds of rule need a developer (ADR 0001, "Limits of configurability").
- Plate and document formats are validated with configurable patterns. Whether the Chilean RUT check digit is validated is to be confirmed at clarify.
- The data is fictitious, kept only in the tab's session, and never sent to a server in this story.

## Conflicts with ADR 0001 *(to resolve at Gate 2)*

- **Legal age source:** ADR 0001 stores `legalAge` on Country; the story calls it a business rule. Both are kept: the age value lives on the country, and the field's rule references it.
- **Section:** ADR 0001 lists `step`/`section` on FormField; this story needs only a section (policyholder or vehicle) within step 1.
- **Saving without a country:** ADR 0001 *recommends* rejecting it on save; this spec makes it a requirement (Edge Cases).
