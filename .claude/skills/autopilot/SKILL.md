---
name: autopilot
description: Autonomously executes from an approved plan to tested, reviewed code using Spec Kit and subagents.
---

Read `.specify/memory/constitution.md`, `CLAUDE.md` and the current feature folder in `specs/` (`spec.md` and `plan.md`).

1. Verify that `plan.md` has already been approved by the user (`**Status**: Approved (Gate 2)`). If it does not exist or critical clarifications are missing, stop and ask for them.
2. Generate `tasks.md` following `.specify/templates/tasks-template.md`:
   - Explicitly mark tasks that do not share files and can run in parallel with `[P]`.
   - Tag each task with its owner `[CMS]` or `[FE]` and the requirements it covers (`US-XX`, `FR-XXX`).
3. Execute the tasks in `tasks.md` in waves:
   - Spawn subagents in parallel for `[P]` task groups: `cms-developer` for `[CMS]`, `frontend-developer` for `[FE]`.
   - Execute tasks with dependencies sequentially.
   - When `cms-developer` reports a contract change, make sure the matching Angular models are updated in the same wave.
4. At the end of each wave, run `npm --prefix frontend run verify` and `npm --prefix cms run build`. If anything fails, fix it before moving forward (max 3 attempts, then stop and ask — constitution §3.4).
5. Commit each verified wave as atomic Conventional Commits with the footer `Refs: US-XX`. Subagents never commit.
6. **E2E (conditional):** only if `plan.md` has E2E candidates marked **Approved**, spawn `e2e-tester` with them. Treat reported defects as new fix tasks for the developer agents, then rerun.
7. **Review:** spawn `code-reviewer` with the feature folder and the commit range. For each `Open` Blocker/Major finding, delegate the fix to the owning developer agent, verify, commit (`fix(...)`, `Refs: US-XX, R-NN`), then run review round 2. After round 2, anything still `Open` goes to the human.
8. Mark completed tasks as `[x]` in `tasks.md` and provide the handoff summary: created files, decisions made, test results (unit + e2e), review verdict with findings and resolutions, and what the human should check by hand.
