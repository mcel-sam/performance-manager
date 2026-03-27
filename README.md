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
- Demo walkthrough: `docs/demo/WALKTHROUGH.md`
- HR demo checklist: `docs/demo/HR_DEMO_CHECKLIST.md`
- Repo coding rules: `AGENTS.md`
- Milestone execution tracking: `PLAN.md`

## Implemented scope (through Milestone 5 Phase 4)

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
- Milestone 5 Phase 1:
  - Scorecard-ready schema foundations (`ReviewQuestionType`, `CompetencyDimensionKey`, cycle scorecard config, packet scorecard fields, per-metric result table)
  - Snapshot org attributes on packets (department/title/manager)
- Milestone 5 Phase 2:
  - Scorecard computation engine (Self + Manager weighted scoring)
  - Deterministic packet/per-metric persistence
  - Recompute trigger on manager submit
  - Calibration finalize sets `finalRatingSource=CALIBRATION`
- Milestone 5 Phase 3:
  - Write-review support for competency scale ratings + not-observed state
  - Peer/upward packet entries labeled as “Reference input”
  - Scorecard explicitly ignores peer/upward by default
- Milestone 5 Phase 4:
  - Development-only `DEMO_MODE` guardrails
  - Demo-first login page (`/login`) with one-click role sign-in tiles
  - Demo reset endpoint (`POST /api/demo/reset`) with typed confirmation and full reseed
  - Playwright smoke suite switched to demo reset + `/login` role tile sign-in flow

## Sandbox / Supabase Postgres setup

1. In `apps/web/.env.local`, set:

```bash
DATABASE_URL=...   # Supabase pooled connection string
DIRECT_URL=...     # Supabase direct/session connection string for Prisma CLI
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DEMO_MODE=false
NEXT_PUBLIC_DEMO_MODE=false
```

2. Install app dependencies, apply schema to the sandbox database, and bootstrap the shared sandbox org and users:

```bash
cd apps/web
npm install
npm run db:migrate:deploy
SANDBOX_BOOTSTRAP_DEFAULT_PASSWORD='replace-with-a-shared-sandbox-password' npm run db:sandbox:bootstrap
```

If `SUPABASE_SERVICE_ROLE_KEY` is configured, the bootstrap also provisions or updates the sandbox
Supabase Auth accounts and links them to Trellis user records. Without the service role key, the
script still provisions Trellis users, memberships, and employee profiles; auth identities then link
on first successful login by matching email.

The sandbox bootstrap provisions the fixed MCEL sandbox roster and reporting lines used for the
shared sandbox.

3. Run the app:

```bash
npm run dev
```

4. Validate the sandbox path:

- `http://localhost:3000/login`
- `http://localhost:3000/api/health`

## Optional local Postgres setup

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

## Container image and Azure Container Apps notes

The root `Dockerfile` now builds a production image that is suitable for Azure Container Apps and
other Azure container runtimes.

### What the container expects

Set these runtime environment variables in Azure:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEMO_MODE=false`
- `NEXT_PUBLIC_DEMO_MODE=false`
- `PRESENTATION_MODE=false`
- `ALLOW_MANAGER_RISK_VIEW=false`

Recommended container settings:

- Expose port `3000`
- Set the ingress target port to `3000`
- Use `/api/health` for liveness/readiness checks
- Keep `RUN_DB_MIGRATIONS=false` for normal multi-replica app revisions unless you intentionally
  want startup-time migrations

### Build and run the production image locally

```bash
docker build -t trellis-web .
docker run --rm -p 3000:3000 --env-file apps/web/.env.local trellis-web
```

### Run with Docker Compose

The default compose flow still starts only local Postgres:

```bash
docker compose up -d
```

To run the production web container alongside Postgres:

```bash
docker compose --profile app up --build
```

The compose `web` service defaults to the internal Postgres service, but you can point it at your
Azure/Supabase database by exporting `DATABASE_URL` and `DIRECT_URL` before starting compose.

### Running migrations or sandbox bootstrap in a container

The image entrypoint supports mode switching with `CONTAINER_COMMAND`:

- `web` starts the Next.js server
- `migrate` runs `prisma migrate deploy` and exits
- `bootstrap` runs the sandbox bootstrap script and exits

Examples:

```bash
docker run --rm --env-file apps/web/.env.local -e CONTAINER_COMMAND=migrate trellis-web
docker run --rm --env-file apps/web/.env.local \
  -e CONTAINER_COMMAND=bootstrap \
  -e SANDBOX_BOOTSTRAP_DEFAULT_PASSWORD='replace-me' \
  trellis-web
```

For Azure Container Apps, this lets you reuse the same image for:

- the long-running web app
- a one-off migration task
- a one-off sandbox bootstrap task

## Development identity defaults

The web UI uses a local dev request context by default:

- `DEV_USER_ID=user_employee_1`
- `DEV_ORG_ID=org_demo_1`

Set these in `apps/web/.env.local` to switch local user context.

## Org branding themes

Trellis now resolves organization branding from `apps/web/src/branding`.

- `types.ts` defines the `OrgTheme` contract used by the UI.
- `themes/*.ts` contains one concrete theme per organization. `themes/morgan.ts` is the current live theme.
- `registry.ts` registers available themes and the default fallback.
- `resolver.ts` maps the current org id to a theme id. The demo org (`org_demo_1`) and sandbox org (`org_sandbox_1`) currently resolve to Morgan, with `TRELLIS_DEFAULT_ORG_THEME` available as an optional fallback override.
- `css-vars.ts` maps semantic org tokens into CSS variables consumed by the app shell and shared UI primitives.
- Shell and primitive work should prefer semantic variables such as `--color-shell-*`, `--color-surface-*`, `--color-status-*`, and `--color-text-*` rather than hardcoded org colors in feature screens.

To add another org theme later:

1. Create `apps/web/src/branding/themes/<org>.ts` using the `OrgTheme` contract.
2. Register it in `apps/web/src/branding/registry.ts`.
3. Add the org id to theme mapping in `apps/web/src/branding/resolver.ts`.
4. Keep feature code on semantic CSS variables and shared primitives instead of hardcoding org colors.

## Demo mode (Phase 5)

Enable demo mode in `apps/web/.env.local`:

```bash
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true
```

Then run:

1. Open `http://localhost:3000/login`
2. Click **Reset demo database & load sample data**
3. In the confirmation modal, type `RESET` and confirm
4. Use one of the role tiles:
   - **Sign in as HR Admin**
   - **Sign in as Calibrator**
   - **Sign in as Manager**
   - **Sign in as Employee**

Demo routes and endpoints are disabled unless `DEMO_MODE=true` **and** the app runs in development mode.
When demo mode is enabled, unauthenticated page requests redirect to `/login`.

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
- `POST /api/demo/login`
- `POST /api/demo/logout`
- `POST /api/demo/reset`

Note: In normal dev mode, API routes expect `x-user-id` and `x-org-id` headers (or `DEV_USER_ID`/`DEV_ORG_ID`). In `DEMO_MODE`, app page routes use the demo session cookie from `/login`.

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

## E2E smoke tests (Playwright)

Run from `apps/web` after DB migration. The suite provisions demo data through `/api/demo/reset` and signs in through `/login` role tiles:

```bash
npx playwright install chromium
npm run test:e2e
```

Interactive runner:

```bash
npm run test:e2e:ui
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
