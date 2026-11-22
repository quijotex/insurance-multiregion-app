---
name: strapi-conventions
description: Project conventions for the Strapi 5 CMS in cms/ — schemas in code, country-differentiated content, Public role permissions, seed procedure and API contract rules. Load before writing or reviewing CMS code.
---

# Strapi conventions (Strapi 5, TypeScript, SQLite)

## Content types live in code
- Every content type and component is defined as schema files under `cms/src/api/<name>/content-types/<name>/schema.json` and `cms/src/components/<category>/<name>.json`.
- Never rely on changes made only through the admin Content-Type Builder: they are not reviewable. If one is made in dev, commit the generated files.
- Use `draftAndPublish: true` for business-managed content so only published entries reach the app.
- Field names in camelCase; descriptive names (`basePrice`, not `price1`).

## Country differentiation
- The strategy is defined in the multi-country ADR in `docs/adr/`. Read it before modelling any content type and follow it exactly. Do not introduce a second mechanism.

## Querying (Strapi 5)
- Server code uses the Document Service API: `strapi.documents('api::x.x').findMany({ filters, populate, status: 'published' })`.
- REST responses in Strapi 5 are flat (no `data.attributes`); entries are identified by `documentId`.
- Populate explicitly what the frontend needs; never `populate=*` in production paths.

## Security and permissions
- The browser only reads. The Public role gets `find` / `findOne` on exactly the content types the wizard reads — nothing else, no `create/update/delete`.
- Permissions are granted in code at bootstrap (`cms/src/index.ts`), so a fresh database is configured identically. List each granted action with a comment saying why.
- No API tokens are created by code. No token of any kind reaches the frontend.
- Never read, print or commit `.env`; document new variables in `.env.example` only.

## Seed data
- Seed runs at bootstrap only when the database is empty, is idempotent, and lives in `cms/src/seed/` (one file per content type, data per country).
- Fictitious data only (no real people, documents or plates).
- Seeded entries are published so the app works right after `docker compose up`.
- An admin user for local development may be created from `.env` variables; defaults are dev-only and documented in the README.

## Contract
- The schema is the source of truth for the API contract. When a field is added/removed/renamed, report it so the Angular models in `frontend/src/app/features/*/data/` are updated in the same commit.
- Breaking changes to an existing contract require human approval (constitution §3.3).

## Verification
- `npm --prefix cms run build` must pass before reporting.
