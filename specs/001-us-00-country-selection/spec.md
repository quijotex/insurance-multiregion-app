# Feature Specification: US-00 – Country selection

**Feature Branch**: `001-us-00-country-selection`

**Created**: 2026-11-22

**Status**: Approved (Gate 1) — 2026-11-22

**Input**: User story [US-00](../../docs/user-stories/US-00.md) (verbatim business story — source of truth). Architecture: [ADR 0001](../../docs/adr/0001-multi-country-content-strategy.md).

## Clarifications

### Session 2026-11-22

- Q: On the selection screen, does picking a country go straight to the form, or pick it and then press "Continue"? → A: Select, then Continue. The countries are a single-choice group; a "Continue" button, disabled until a country is chosen, opens the form.
- Q: When someone returns to the selection screen, is the country they last visited in this session already selected? → A: Yes. If a country was visited in this browser session and is still available, it starts selected and "Continue" is enabled; otherwise nothing is selected.
- Q: Where does the person choose to change the country inside the wizard? → A: A header control on every wizard step shows the active country (icon + name) with a "Cambiar país" button; it asks for confirmation if data was entered, then opens the selection screen.
- Q: The data form (US-01) doesn't exist yet; what does "Continue" open in this story? → A: The wizard shell: country addresses, the header with the active country and "Cambiar país", and a step 1 placeholder showing the active country. US-01 replaces the placeholder with the form.
- Q: A person with Colombia data opens a shared link for Chile; what happens to the Colombia data? → A: It depends on where the link opens. In a **new tab or window**, Chile opens directly and the Colombia data stays untouched in its own tab. In the **same tab** that holds Colombia data, the person is first asked to confirm that it will be discarded; confirming opens Chile empty, cancelling returns to Colombia with the data intact.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a country and enter the wizard (Priority: P1)

A person opens the application without a country and picks Colombia or Chile from the countries the business has made available. From then on, everything they see belongs to that country.

**Why this priority**: Nothing else in the wizard can be shown until the country is known; it is the entry point of every quote.

**Independent Test**: With Colombia and Chile active and published, open the application root, pick a country and check that the first wizard step opens in that country's context.

**Acceptance Scenarios**:

1. **Given** Colombia and Chile are active and published, **When** I open the application without a country, **Then** I see the selection screen with Colombia and Chile, each with its name and icon, in the configured order.
2. **Given** I am on the selection screen, **When** I select Chile and press "Continue", **Then** I move on to the data form for Chile, and the address shows Chile.
4. **Given** I am on the selection screen and no country is selected, **When** I look at "Continue", **Then** it is disabled.
3. **Given** I am on the selection screen, **When** I use only the keyboard, **Then** I can move between the countries, select one and continue.

---

### User Story 2 - Open the application directly in a country (Priority: P1)

A person receives a link for a country and lands directly in that country's wizard. If the link points to a country that isn't offered, they are told so and can pick an available one.

**Why this priority**: Shared links are how marketing and support send people to the right country; a broken link must never be a dead end.

**Independent Test**: Open a Colombia link and check the selection screen is skipped; open a link for an unknown or inactive country and check the selection screen shows the "not available" message.

**Acceptance Scenarios**:

1. **Given** I have a link to the application for Colombia, **When** I open it, **Then** I see the data form for Colombia without going through the selection screen.
3. **Given** a tab holds data I entered for Colombia, **When** I open a Chile link in that same tab, **Then** I am asked to confirm that my Colombia data will be discarded; confirming opens Chile empty, cancelling returns me to Colombia with my data.
4. **Given** a tab holds data I entered for Colombia, **When** I open a Chile link in a new tab, **Then** Chile opens directly and the Colombia tab keeps its data.
2. **Given** the link points to a country that does not exist, is not active, or is not published, **When** I open it, **Then** I see the selection screen and a message explaining that the country is not available.

---

### User Story 3 - Change the country after starting (Priority: P2)

A person who already entered data for one country decides to quote in another one. They are warned that their data will be discarded and decide whether to continue.

**Why this priority**: Less frequent than the first entry, but losing data without warning would break trust.

**Independent Test**: Enter data in the Colombia form, choose to change to Chile, cancel (data kept), then confirm (empty Chile form).

**Acceptance Scenarios**:

1. **Given** I entered data in the form for Colombia, **When** I press "Cambiar país" in the header, **Then** I am asked to confirm that my data will be discarded.
2. **Given** I am asked to confirm, **When** I confirm and then select Chile and continue, **Then** I see the empty form for Chile and the Colombia data is gone.
3. **Given** I am asked to confirm, **When** I cancel, **Then** I stay in Colombia with my data untouched.
4. **Given** I have not entered any data yet, **When** I choose to change the country, **Then** I go to the selection screen without a confirmation.

---

### Edge Cases

- **No countries available** (none active and published, or the content service fails): the selection screen shows a clear message instead of an empty list, and a retry action if the service failed.
- **Only one country available**: the selection screen is still shown; the person selects it explicitly.
- **Country without an icon**: it is shown with its name only; the layout does not break.
- **Country deactivated while the person is in the wizard**: on the next reload, the person lands on the selection screen with the "not available" message.
- **Country code in the address with different letter case** (e.g. `CO` vs `co`): treated as the same country.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The business team MUST be able to configure each country with name, code, icon, order and active status, without code changes.
- **FR-002**: The selection screen MUST show only countries that are both published and active, sorted by their configured order.
- **FR-003**: The person MUST be able to select exactly one country from a single-choice group; selecting does not navigate by itself.
- **FR-004**: A "Continue" action, disabled until a country is selected, MUST open the first wizard step (data form) for the selected country.
- **FR-005**: The selected country MUST be part of the address, so that opening that address later shows that country's wizard directly, without the selection screen.
- **FR-006**: An address with a country that does not exist, is not active or is not published MUST show the selection screen with a message explaining that the country is not available.
- **FR-007**: Every wizard step MUST show the active country (icon and name) and a "Cambiar país" control. Using it after data was entered MUST ask for confirmation; confirming discards that country's data and opens the selection screen, cancelling keeps the person where they were with their data.
- **FR-008**: Every country-dependent content shown in later steps (form, plans, currency, terms) MUST come from the selected country.
- **FR-009**: The selection screen MUST be fully operable with the keyboard, and each country MUST have an accessible name.
- **FR-010**: The selection screen MUST show loading, empty and error states (see Edge Cases).
- **FR-011**: When the person returns to the selection screen, the country last visited in the same browser session MUST start selected if it is still available; otherwise no country is selected.
- **FR-012**: Opening an address for another country in a tab that holds entered data MUST ask for confirmation first; confirming discards that data and opens the new country empty, cancelling returns to the previous country with its data. In a new tab or window, the address opens directly.

### Key Entities

- **Country**: a market where insurance is sold. Attributes in this story: name, code (also used in the address), icon, order, active status, publication status. Further attributes (currency, number format, legal age, terms) are defined in ADR 0001 and used by later stories.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person reaches the data form of their country in at most 2 actions from the application root.
- **SC-002**: 100% of addresses with an available country open that country directly; 100% of addresses with an unavailable country show the "not available" message.
- **SC-003**: A new country published and activated by the business team appears on the selection screen after a reload, with no deployment.
- **SC-004**: The whole selection, including changing country, can be completed using only the keyboard.

## Assumptions

- Copy is in Spanish for both countries; the "not available" and "no countries" messages are fixed application texts (an unavailable country has no content to take them from).
- **Scope of this story:** the selection screen plus the wizard shell (country addresses, header with active country and "Cambiar país", step 1 placeholder showing the active country). The data form, plans and terms arrive with US-01 to US-03; until then, "the data form for <country>" is verified as "step 1 of the wizard for <country>", and FR-008 is verified by those stories.
- Data entered is kept only in the browser session of each tab, and a tab holds the data of one country at a time (FR-007, FR-012).

## Conflicts with ADR 0001 *(to resolve at Gate 2)*

- **New Country attributes:** the story adds `icon`, `order` and `active`; ADR 0001 has none of them.
- **Two availability switches:** ADR 0001 uses publish/unpublish as the on/off switch; the story requires *published and active*. Both will apply (FR-002, FR-006).
- **Sort order:** ADR 0001 sorts countries by name; the story requires the configured order (FR-002).
- **Change of country:** ADR 0001 says changing country restarts the wizard; the story adds a confirmation before discarding data, from the header control (FR-007) and from a same-tab link (FR-012).
- **Session data per country:** ADR 0001 keeps a separate session key per country; with FR-012 a tab holds one country's data at a time.
- **Preselected country:** ADR 0001 preselects the last visited country; the story did not mention it. Kept (Clarifications, FR-011).
