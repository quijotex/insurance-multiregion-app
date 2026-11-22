# 0002 — Agentic workflow: Spec Kit and 3 human gates

- **Status:** Accepted
- **Date:** 2026-11-22
- **Related:** `FLOW.md`, `.specify/memory/constitution.md`, `CLAUDE.md`, all user stories

## Context and problem

The increment must go from a functional user story to QA-ready code through a system of AI agents, with people stepping in at points we define. The flow has to be explicit, justified, traceable and repeatable, and it has to stay as frictionless as possible: every human checkpoint costs time, but every missing one risks the agent inventing scope or over-engineering.

So we need to decide:

1. Which framework drives the flow from story to code.
2. Where the human steps in, and how much autonomy the agents get in between.

## Decision drivers

- Traceability from user story to QA.
- A single, approved source of truth that automatic checks can compare against.
- Detect gaps in the user story before building.
- Repeatable: the same flow every time.
- Low friction: as few human stops as possible, placed where they add the most value.

## Decision

**Spec Kit and 3 human gates**, running in Claude Code:

- **Gate 1 — Spec** (after specify + clarify).
- **Gate 2 — Plan** (plan, ADRs, design option, E2E candidates).
- **Gate 3 — Handoff review** (before QA).

Between Gate 2 and Gate 3 the agents run on autopilot (tasks → implementation → verify → conditional E2E → review → commit), bounded by the stop conditions of the constitution.

### Why this one?

- **Traceable:** Spec Kit offers traceability by using git (a branch and a numbered spec folder per feature), which is good to get the whole path from user story to QA.
- **Spec as source:** this gives a valid and approved point of comparison for the different automatic checks within the flow.
- **Gap detection:** the built-in clarify skill detects gaps in the user story, which saves effort before building.
- **Global context:** the constitution.md serves as global project context, where we set limits and expected behaviors for agents.
- **Repeatable process:** every time we run the flow it is still the same, because of Spec Kit capabilities and default behavior.

### Why this human gate design?

- **Gates live where they contribute the most:** Gate 1 avoids a typical AI error: inventing scope or writing extra criteria. Gate 2 avoids another typical mistake: overdesign or overengineering. An error detected in the spec phase costs minutes, but in the handoff phase it can cost a new wave of implementation.
- **Every gate has its own criteria and a clear rejection path.**
- **Human revisions are logged:** Gate 1 corrections are saved into the spec's Clarifications, and Gate 2 corrections into the plan's Revisions.
- **Agent autonomy after approvals.**
- **The reviewer agent uses a different model**, which reduces blind spots.
- **Every agent has its own responsibilities, tools and skills.**
- **Conditional E2E, approved by the human.**

## Considered options

1. **Spec Kit with 3 human gates** (chosen).
2. **Spec Kit as-is, with a human review after every phase** (specify, clarify, plan, tasks, implement): maximum control, but the human stops the flow 5+ times per story. Not taken: too much friction, and reviewing `tasks.md` adds little over reviewing `plan.md`.
3. **Fully autonomous flow, no human gates:** fastest. Not taken: nobody would catch invented scope or over-engineering until QA, which is the most expensive point to find them.
4. **Our own SDD variant without a framework:** total freedom over templates and steps. Not taken: we would have to build and maintain what Spec Kit already gives (templates, numbered features, clarify), and the result would be less repeatable.
5. **Kiro (spec-driven IDE):** specs built into the tool. Not taken: it ties the flow to one IDE, and its subagents, skills and context file are less portable than Claude Code's versioned Markdown files.

## Consequences

- **Partial independence of the reviewer agent:** it belongs to the same family of models, so some blind spots are shared.
- **Heavy for small stories:** for a small user story the full flow can be heavy and expensive.
- **The human can become the bottleneck:** no story goes ahead without passing Gates 1 and 2.
- **Built for one developer:** this setup was designed for a solo developer working with an agent, not for a team.
- **No human in the loop from step 4 to step 9:** quality there depends on the reviewer agent and the automatic checks.
