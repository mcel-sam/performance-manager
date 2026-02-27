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

## Implemented scope (through Milestone 3 Phase 3)

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
- Milestone 2 Phase 1:
  - Review packet page (`/performance/reviews/:cycleId/packet/:employeeId`)
  - Packet fetch API (`GET /api/performance/reviews/:cycleId/packet/:employeeId`)
  - Server-side packet visibility gating for HR admins, manager-of-subject, and employee-after-release policy
  - Packet loading/empty/error states and packet permission tests
- Milestone 2 Phase 2:
  - Calibration workspace page (`/performance/calibration/:sessionId`) with 9-box layout
  - Right-side drawer with packet summary, packet link, and This Cycle/Previous Cycles tabs
  - Accessible placement move controls (performance + potential dropdowns)
  - Calibration APIs:
    - `GET /api/performance/calibration/:sessionId`
    - `PATCH /api/performance/calibration/:sessionId/placements/:employeeId`
  - Server-side move permission rules for HR admins, calibrators, and allowed managers
  - Audit events for placement moves
- Milestone 2 D1 follow-on:
  - Admin calibration list page (`/admin/performance/calibration`)
  - Admin calibration create page (`/admin/performance/calibration/new`)
  - Calibration session create/list APIs:
    - `POST /api/performance/calibration`
    - `GET /api/performance/calibration`
  - Session creation supports cycle selection, cohort selection, axis config, and participants
  - Audit event for session creation (`CALIBRATION_SESSION_CREATED`)
- Milestone 2 Phase 3:
  - Finalize endpoint (`POST /api/performance/calibration/:sessionId/finalize`)
  - Immutable calibration snapshot persisted at finalize time (`CalibrationSnapshot`)
  - Finalize lock enforces read-only placement updates after session finalization
  - Calibration UI finalized banner + disabled move controls while preserving drawer/packet view
  - Audit event for calibration finalize (`CALIBRATION_FINALIZED`)
- Milestone 3 Phase 1:
  - Improvement plan schema + migration:
    - `ImprovementPlan`, `ImprovementPlanGoal`, `ImprovementPlanCheckIn`
  - Improvement plan APIs:
    - `POST /api/performance/improvement-plans`
    - `GET /api/performance/improvement-plans`
    - `GET /api/performance/improvement-plans/:planId`
  - Strict server-side permission gating for create/list/detail access
  - Seed data for one improvement plan with goals
- Milestone 3 Phase 2:
  - Improvement plan detail timeline route:
    - `GET /performance/improvement-plans/:planId`
  - Timeline check-in API:
    - `POST /api/performance/improvement-plans/:planId/checkins`
  - Status transition API:
    - `PATCH /api/performance/improvement-plans/:planId/status`
  - Status transition rules enforced server-side with required completion outcome
  - Audit events for check-in create and status transitions
  - Loading/empty/error states on the improvement plan detail timeline page
- Milestone 3 Phase 3:
  - Audit log API:
    - `GET /api/performance/improvement-plans/:planId/audit`
  - Export placeholder API:
    - `GET /api/performance/improvement-plans/:planId/export` (returns HTTP 501 placeholder JSON)
  - Improvement plan detail UI now includes:
    - Timeline / Audit Log view toggle
    - Audit log loading/empty/error states
    - Export action with friendly placeholder response
  - Permission gating for audit and export access (subject/manager/HR-admin scope)

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
- `http://localhost:3000/admin/performance/calibration`
- `http://localhost:3000/api/health`
- `http://localhost:3000/performance/reviews`
- `http://localhost:3000/performance/reviews/cycle_seed_draft_1/packet/emp_employee_1` (as manager or HR dev user)
- `http://localhost:3000/performance/calibration/calibration_session_seed_1`
- `http://localhost:3000/performance/improvement-plans/improvement_plan_seed_1`

## Development identity defaults

The web UI uses a local dev request context by default:

- `DEV_USER_ID=user_employee_1`
- `DEV_ORG_ID=org_demo_1`

Set these in `apps/web/.env.local` to switch local user context.

For packet viewing against seeded data, use:

- `DEV_USER_ID=user_manager_1` (manager can view direct-report packet in Draft/Locked/Released)
- `DEV_USER_ID=user_employee_1` can view only after the cycle is `RELEASED` with `EMPLOYEE_AFTER_RELEASE` policy

For calibration session testing, use:

- `DEV_USER_ID=user_hr_admin_1` (full calibration access)
- `DEV_USER_ID=user_manager_1` (can access session and move direct reports only)

## API endpoints used in Milestone 1/2/3

- `GET /api/admin/performance/review-cycles`
- `GET /api/performance/reviews/tasks`
- `GET /api/performance/reviews/:cycleId/submissions/:submissionId`
- `PATCH /api/performance/reviews/:cycleId/submissions/:submissionId/answers`
- `POST /api/performance/reviews/:cycleId/submissions/:submissionId/submit`
- `PATCH /api/admin/performance/review-cycles/:cycleId/status`
- `GET /api/evidence?subjectEmployeeId=...&types=...`
- `POST /api/review-answers/:answerId/evidence-links`
- `DELETE /api/review-answers/:answerId/evidence-links/:evidenceItemId`
- `GET /api/performance/reviews/:cycleId/packet/:employeeId`
- `GET /api/performance/calibration/:sessionId`
- `GET /api/performance/calibration`
- `POST /api/performance/calibration`
- `PATCH /api/performance/calibration/:sessionId/placements/:employeeId`
- `POST /api/performance/calibration/:sessionId/finalize`
- `POST /api/performance/improvement-plans`
- `GET /api/performance/improvement-plans`
- `GET /api/performance/improvement-plans/:planId`
- `POST /api/performance/improvement-plans/:planId/checkins`
- `PATCH /api/performance/improvement-plans/:planId/status`
- `GET /api/performance/improvement-plans/:planId/audit`
- `GET /api/performance/improvement-plans/:planId/export`

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

```bash
# review packet example (manager access)
curl -s 'http://localhost:3000/api/performance/reviews/cycle_seed_draft_1/packet/emp_employee_1' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1'
```

```bash
# calibration session fetch (manager access)
curl -s 'http://localhost:3000/api/performance/calibration/calibration_session_seed_1' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1'
```

```bash
# calibration placement update (manager can move direct reports)
curl -s -X PATCH 'http://localhost:3000/api/performance/calibration/calibration_session_seed_1/placements/emp_employee_1' \
  -H 'content-type: application/json' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1' \
  -d '{\"performanceBucket\":\"HIGH\",\"potentialBucket\":\"HIGH\"}'
```

```bash
# finalize calibration session (HR admin or calibrator)
curl -s -X POST 'http://localhost:3000/api/performance/calibration/calibration_session_seed_1/finalize' \
  -H 'x-user-id: user_hr_admin_1' \
  -H 'x-org-id: org_demo_1'
```

```bash
# create improvement plan (HR admin)
curl -s -X POST 'http://localhost:3000/api/performance/improvement-plans' \
  -H 'content-type: application/json' \
  -H 'x-user-id: user_hr_admin_1' \
  -H 'x-org-id: org_demo_1' \
  -d '{
    "subjectEmployeeId":"emp_employee_1",
    "title":"Q3 Support Plan",
    "expectations":"Increase delivery reliability and communication quality.",
    "startDate":"2026-07-01T00:00:00.000Z",
    "endDate":"2026-09-30T00:00:00.000Z",
    "goals":[{"title":"Maintain consistent weekly risk updates"}]
  }'
```

```bash
# list improvement plans (manager scope)
curl -s 'http://localhost:3000/api/performance/improvement-plans' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1'
```

```bash
# get improvement plan detail (subject/manager/HR scope)
curl -s 'http://localhost:3000/api/performance/improvement-plans/improvement_plan_seed_1' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1'
```

```bash
# create a timeline check-in (subject/manager/HR scope)
curl -s -X POST 'http://localhost:3000/api/performance/improvement-plans/improvement_plan_seed_1/checkins' \
  -H 'content-type: application/json' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1' \
  -d '{"note":"Weekly coaching update: communication cadence improved."}'
```

```bash
# transition plan status (manager owner or HR admin)
curl -s -X PATCH 'http://localhost:3000/api/performance/improvement-plans/improvement_plan_seed_1/status' \
  -H 'content-type: application/json' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1' \
  -d '{"targetStatus":"ACTIVE"}'
```

```bash
# fetch plan audit log
curl -s 'http://localhost:3000/api/performance/improvement-plans/improvement_plan_seed_1/audit' \
  -H 'x-user-id: user_manager_1' \
  -H 'x-org-id: org_demo_1'
```

```bash
# export placeholder response (HTTP 501 by design in MVP)
curl -i 'http://localhost:3000/api/performance/improvement-plans/improvement_plan_seed_1/export' \
  -H 'x-user-id: user_manager_1' \
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
