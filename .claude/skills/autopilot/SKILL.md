---
name: autopilot
description: Autonomously executes from an approved plan to tested code using Spec Kit and subagents.
---

Read `.specify/memory/constitution.md` and the current files in `specs/` (`spec.md` and `plan.md`).

1. Verify that `plan.md` has already been approved by the user. If it does not exist or critical clarifications are missing, stop and ask for them.
2. Generate `tasks.md` following `.specify/templates/tasks-template.md`, explicitly marking tasks that do not share files and can run in parallel with `[P]`.
3. Execute the tasks in `tasks.md` in waves:
   - Spawn subagents in parallel for `[P]` task groups.
   - Execute tasks with dependencies sequentially.
4. At the end of each wave, run the test suite and type validation. If anything fails, fix it before moving forward.
5. Mark completed tasks as `[x]` in `tasks.md` and provide a brief summary of created files, decisions made, and test results.
