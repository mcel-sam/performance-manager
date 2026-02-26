# Performance Manager

Performance Management System monorepo for reviews, calibration, and improvement plans.

## Repository layout

- `apps/web` - Next.js application (UI + API route handlers)
- `packages/types` - shared DTOs and contract types
- `infra/terraform` - Terraform stacks and modules
- `docs` - product, architecture, and ADR documentation

## Core docs

- Product requirements: `docs/product/PRD.md`
- Architecture: `docs/architecture/ARCHITECTURE.md`
- ADR stack decision: `docs/adr/0001-stack.md`
- Repo coding rules: `AGENTS.md`

## Milestone 0 target

Milestone 0 establishes the app/runtime foundation:

- Next.js app bootstrapped in `apps/web`
- Local PostgreSQL via Docker Compose
- Prisma schema + migration
- Health route at `/api/health`
- Empty-state page at `/performance/reviews`

Detailed setup and run commands are documented as part of Milestone 0 completion.
