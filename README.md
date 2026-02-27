# Performance Manager

Performance Management System monorepo for reviews, calibration, and improvement plans.

## Repository layout

- `apps/web` - Next.js application (App Router UI + Route Handlers API)
- `packages/types` - shared DTOs and contract types
- `infra/terraform` - Terraform stacks and modules
- `docs` - product, architecture, and ADR documentation

## Core docs

- Product requirements: `docs/product/PRD.md`
- Architecture: `docs/architecture/ARCHITECTURE.md`
- ADR stack decision: `docs/adr/0001-stack.md`
- Repo coding rules: `AGENTS.md`
- Milestone execution tracking: `PLAN.md`

## Implemented scope (through Milestone 1.5)

- Milestone 0 foundation:
  - Local PostgreSQL dev database via `docker-compose.yml`
  - Prisma schema + migrations baseline
  - Health route: `GET /api/health`
  - Reviews entry page: `GET /performance/reviews`
  - Root Dockerfile and CI checks
- Milestone 1 Phase 1:
  - Core reviews data model and migration
  - Admin API for cycle create + packet/submission generation
  - Seed/demo data
- Milestone 1 Phase 2:
  - Participant tasks list (`/performance/reviews`)
  - Write review route with autosave + submit validation
- Milestone 1 Phase 3:
  - Evidence retrieval API with visibility enforcement (`GET /api/evidence`)
  - Evidence drill-in in write review UI
  - Attach/detach evidence to answers
  - Audit events for evidence attach/detach
- Milestone 1.5:
  - App shell layout with global navigation
  - Home page replacing default scaffold
  - Shared UI primitives for admin/review surfaces
  - Admin review cycle pages (`/admin/performance/review-cycles`, `/admin/performance/review-cycles/new`)
  - Admin cycle status transition API (`PATCH /api/admin/performance/review-cycles/:cycleId/status`)

## Local setup

1. Start Postgres from repo root:

```bash
docker compose up -d
```

2. Install app dependencies and prepare the DB:

```bash
cd apps/web
cp .env.example .env.local
npm install
npx prisma migrate dev
npm run db:seed
```

3. Run the app:

```bash
npm run dev
```

4. Open key routes:

- `http://localhost:3000/`
- `http://localhost:3000/admin/performance/review-cycles`
- `http://localhost:3000/api/health`
- `http://localhost:3000/performance/reviews`

## Development identity defaults

The web UI uses a local dev request context by default:

- `DEV_USER_ID=user_employee_1`
- `DEV_ORG_ID=org_demo_1`

Set these in `apps/web/.env.local` to switch local user context.

## API endpoints used in Milestone 1

- `GET /api/admin/performance/review-cycles`
- `GET /api/performance/reviews/tasks`
- `GET /api/performance/reviews/:cycleId/submissions/:submissionId`
- `PATCH /api/performance/reviews/:cycleId/submissions/:submissionId/answers`
- `POST /api/performance/reviews/:cycleId/submissions/:submissionId/submit`
- `PATCH /api/admin/performance/review-cycles/:cycleId/status`
- `GET /api/evidence?subjectEmployeeId=...&types=...`
- `POST /api/review-answers/:answerId/evidence-links`
- `DELETE /api/review-answers/:answerId/evidence-links/:evidenceItemId`

Note: API routes expect `x-user-id` and `x-org-id` headers.

## Quick manual checks

```bash
# health
curl -s http://localhost:3000/api/health
```

```bash
# evidence list example
curl -s 'http://localhost:3000/api/evidence?subjectEmployeeId=emp_employee_1' \
  -H 'x-user-id: user_employee_1' \
  -H 'x-org-id: org_demo_1'
```

## Quality gates

Run from `apps/web`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Containerization

Dockerfile location: repo root (`/Dockerfile`)

Build and run from repo root:

```bash
docker build -t performance-manager .
docker run --rm -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e 'DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/perf?schema=public' \
  performance-manager
```

## Notes

- Do not commit secrets. Use `.env.local` for local development.
- Keep API routes thin and put reusable server logic in `apps/web/src/server/*`.
- Commit Prisma migrations for every schema change.
