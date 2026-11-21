# Project Constitution


## 1. Engineering Principles

- **KISS & Pragmatic Reusability:** Keep solutions simple (KISS). Favor clear, specific code over premature abstractions; extract reusable pieces when a pattern repeats (Rule of Three) and genuinely reduces maintenance.
- **Intentional Naming:** Write code for human understanding. Names must express *what* something is or does, not *how*. Start functions with meaningful verbs and use clear nouns for variables.
- **Modular & Cohesive Files:** Avoid large, monolithic files. Split code into focused, single-responsibility components and functions.
- **Feature-First Architecture:** Organize folders and files by domain/feature rather than technical type to keep the repository clean and scalable.
- **Ask Before Over-engineering:** When facing trade-offs in complexity or architecture, pause and ask for alignment before introducing new abstractions or dependencies.
- **High-Value Testing:** Test business logic, validation rules, calculations, API integrations, data transformations, edge cases, and critical user interactions. Never write tests for CSS/styles, static layouts, configuration files, or initial scaffolding.
- **Atomic Conventional Commits:** Make small, atomic, and functional commits following the Conventional Commits specification; each commit must represent a complete, working unit.
- **BEM for CSS:** Follow the BEM (Block, Element, Modifier) methodology for CSS classes and HTML styling hooks.



## 2. Agentic Workflow Rules
- **Low Friction:** Keep `spec.md` and `plan.md` concise (maximum 150 lines each). No corporate fluff.
- **Autonomous Execution:** Once `plan.md` is approved, generate `tasks.md` and execute the implementation straight through without asking for confirmation between tasks.
- **Parallelism:** Use subagents (Agent tool) to execute independent tasks marked with `[P]` in `tasks.md` in parallel.
- **Self-Correction:** Run tests, typecheck, and linter after each block; automatically fix failures before reporting back to the user.

## 3. Human-in-the-Loop Boundaries (When to Stop and Ask)
Stop execution and ask for explicit approval ONLY if:
1. There are business ambiguities in `spec.md` (maximum 5 specific questions).
2. A new external dependency not included in the stack needs to be added.
3. There are breaking changes to public API contracts.
4. A test or build fails after 3 consecutive self-correction attempts.
