# Project Context & Rules

Always read and follow `.specify/memory/constitution.md` before planning, writing code, or running commands.
The full agentic flow (steps, gates, agents) is described in `FLOW.md`.

## Repository Structure
- `cms/`: Headless CMS built with Strapi 5 (TypeScript, SQLite). Content types, APIs, seed, permissions.
- `frontend/`: Angular 22 app (TypeScript, ESLint), Vitest unit tests next to the code, Playwright e2e in `frontend/e2e/`.
- `docs/user-stories/`: Functional user stories pasted verbatim by the human (`US-XX.md`). Never edited by AI.
- `docs/adr/`: Architecture Decision Records (MADR), `NNNN-<slug>.md`.
- `specs/NNN-us-XX-<slug>/`: `spec.md`, `plan.md`, `tasks.md`, `review.md` per user story (Spec Kit).
- `.claude/agents/`: subagent definitions. `.claude/skills/`: skills.
- `ai-logs/`: exported agent sessions. Never edit.

## Verification Commands
- **Frontend (lint + typecheck + unit tests):** `npm --prefix frontend run verify`
- **Frontend build:** `npm --prefix frontend run build`
- **Frontend e2e (Playwright):** `npm --prefix frontend run e2e`
- **CMS build / typecheck:** `npm --prefix cms run build`
- **CMS dev server:** `npm --prefix cms run develop`
- **Full stack:** `docker compose up --build`

## Stack Rules (all agents)
- **Angular:** standalone components only, no NgModules; signals for state; built-in control flow (`@if`, `@for`, `@switch`); typed forms; no `any`. Details: `angular-conventions` skill.
- **Strapi:** schemas defined in code; Public role gets only `find`/`findOne` on what the wizard reads. Details: `strapi-conventions` skill.
- **Security:** no Strapi token of any kind in the frontend; the browser calls only relative `/api/...` URLs (proxied by nginx / `proxy.conf.json`).
- **Accessibility:** every field has a visible label; the wizard is fully keyboard-operable; works on mobile and desktop.
- **Data:** fictitious data only. No real personal data, documents, plates or credentials anywhere in the repo.

## Plan Phase Additions (Gate 2)
`plan.md` must also contain, when applicable:
- **E2E candidates:** list only critical flows that deserve an e2e test, each with a one-line justification. The human marks each one **Approved** or **Rejected** at Gate 2. The `e2e-tester` agent runs only for approved candidates.
- **Design options:** for every client-facing view, 2–3 design options based on the `ui-ux-guidelines` skill, with a recommendation. The human picks one at Gate 2.
- **ADRs:** every architectural decision gets an ADR in `docs/adr/` (context, alternatives, consequences), linked from `plan.md`.

## Traceability
- The user story ID `US-XX` appears in: spec folder name, spec header, each task line, ADR "Related" field, test names (`describe('US-XX · FR-XXX …')`), and commit footer `Refs: US-XX`.
- Requirements in `spec.md` are numbered `FR-XXX`; tasks and tests reference them.
- Gate approvals are recorded in the artifact header: `**Status**: Approved (Gate 1|2) — <date>`.

## Security & Workflow Hygiene
- **NEVER** read, print, or commit `cms/.env` or any `.env` file (only read `.env.example` when checking required environment variables).
- The Strapi schema (`cms/src/api/`) is the source of truth for API contracts; Angular models in `frontend/src/app/features/*/data/` must match it. A schema change updates the models in the same commit.
- Never edit `.specify/templates/`, `.specify/scripts/`, `.claude/skills/speckit-*` or the constitution unless the human explicitly asks.
