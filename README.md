# Multi-country car insurance quote

A single Angular app that quotes car insurance in **Colombia** and **Chile**, with every form field and plan managed from **Strapi**, built through an agentic flow with Claude Code and Spec Kit.

- **How it was built (the agentic flow):** [FLOW.md](FLOW.md)
- **Architecture decisions:** [docs/adr/](docs/adr/)
- **Specs per user story:** [specs/](specs/)

> **Status:** project setup complete; the wizard, seed data and admin bootstrap are built story by story (US-01 → US-03). Sections marked _To be completed_ are filled as each story lands.

> All data in this repository is fictitious. No real people, documents, plates, card data or credentials.

## Quick start

Requirements: Docker Desktop (with Docker Compose v2).

```bash
docker compose up --build
```

| URL | What |
|-----|------|
| http://localhost:4200/co/quote | App, Colombia |
| http://localhost:4200/cl/quote | App, Chile |
| http://localhost:1337/admin | Strapi admin panel |

Seed data for both countries is loaded on the first start. The Strapi admin user is created automatically on the first start with **dev-only** credentials (see [Strapi admin user](#strapi-admin-user)).

To stop: `docker compose down`. To also reset the database: `docker compose down -v`.

## Local development (without Docker)

Requirements: Node.js 22+ and npm.

```bash
npm --prefix cms ci
npm --prefix frontend ci
cp cms/.env.example cms/.env   # then replace the placeholder secrets

npm --prefix cms run develop   # Strapi on http://localhost:1337
npm --prefix frontend start    # Angular on http://localhost:4200 (proxies /api to Strapi)
```

## Tests and checks

| Command | What it runs |
|---------|--------------|
| `npm --prefix frontend run verify` | Lint + typecheck + unit tests (Vitest) |
| `npm --prefix frontend run e2e` | Playwright e2e; starts Strapi and Angular itself |
| `npm --prefix frontend run e2e:docker` | Playwright e2e against the running Docker stack |
| `npm --prefix cms run build` | Strapi build and typecheck |

## Repository structure

| Path | Content |
|------|---------|
| `frontend/` | Angular app (standalone components, signals, built-in control flow) |
| `cms/` | Strapi 5 project: content types, seed data, permissions |
| `docs/user-stories/` | Functional user stories, verbatim |
| `docs/adr/` | Architecture Decision Records |
| `specs/` | Spec, plan, tasks and review per user story |
| `.specify/` | Spec Kit: constitution, templates, scripts |
| `.claude/agents/`, `.claude/skills/` | Subagent and skill definitions |
| `.claude/settings.json` | Agent permissions (allowlist and hard limits) |
| `CLAUDE.md` | Global context file for all agents |
| `ai-logs/` | Unedited exports of the agent sessions |

## Strapi admin user

_To be completed with US-01: the admin user is created at bootstrap from environment variables with dev-only defaults, documented here._

## Security notes

- The browser never receives a Strapi token. It calls only relative `/api/...` URLs, proxied to Strapi by nginx (Docker) or the Angular dev server.
- The Strapi Public role can only `find` the content the wizard reads (see [ADR 0001](docs/adr/0001-multi-country-content-strategy.md)).
- The secrets in `docker-compose.yml` are dev-only placeholders. Override them with a root `.env` file for anything beyond local use.

## Known issues and notes

- **Google Fonts:** the Figtree font is loaded from the Google Fonts CDN, so each visitor's IP address is sent to Google. A self-hosted font would avoid it.
- **npm audit:** `npm audit` reports vulnerabilities in Strapi's transitive dependencies. They are not patched with `npm audit fix --force` because that would break Strapi's pinned versions.

## Requirements not met

_None so far. Any requirement left out will be listed here with the reason._
