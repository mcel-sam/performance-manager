# PLAN.md — Execution plans (living)

This file tracks milestone-level execution plans and serves as the coordination doc for Codex-driven development.
For detailed requirements, see `/docs/product/PRD.md`. For working rules, see `/AGENTS.md`.

---

## How to use this file

### When to use a plan
Use a plan when the task:
- spans UI + API + DB (or infra)
- needs sequencing
- involves permissions/audit logging
- impacts multiple routes/modules

### Plan rules
- Keep changes vertical-slice oriented (DB → API → UI → tests).
- Each milestone can be delivered via multiple PRs, but each PR should be independently testable.
- Every PR must include: how to test, migrations (if any), screenshots for UI changes.

---

## Shared “Definition of Done” (applies to all plans)
- [ ] Server-side permission checks are implemented for all endpoints
- [ ] Audit events written for sensitive mutations
- [ ] Loading/empty/error states exist for UI routes
- [ ] Local run works (`npm run dev`, docker Postgres)
- [ ] Prisma migrations committed (when schema changes)
- [ ] `lint`, `typecheck`, `test` pass (or are added as part of work)

---

# Milestone 0 — Foundation (Boot + DB + first routes)

**Status:** Not started  
**Objective:** Prove the stack end-to-end: Next.js boots, Postgres reachable, migrations work, basic pages load.

## Scope
**In scope**
- Next.js app scaffold in `/apps/web` (TS, App Router, Tailwind, ESLint)
- Shared package scaffold in `/packages/types`
- Local Postgres via root `docker-compose.yml`
- Prisma setup + initial migration
- `GET /api/health` returns `{ ok: true, db: "ok" }` when DB is reachable
- `/performance/reviews` page loads and shows an empty state
- Containerization: `Dockerfile` + `.dockerignore`
- GitHub Actions: `ci.yml` (PR checks). Deploy workflow can be stubbed if Azure resources not ready.

**Out of scope**
- Real auth (can be mocked for MVP foundation if needed)
- Full review cycle UI and workflow

## Work breakdown (ordered)
1) Repo scaffold
   - [ ] Create `/apps/web`, `/packages/types`, `/docs/*`, `/infra/terraform`
   - [ ] Ensure README points to AGENTS/PRD/Architecture/ADR
2) Web scaffold
   - [ ] Create Next.js app in `/apps/web`
   - [ ] Confirm `npm run dev` works
3) Local DB
   - [ ] Add `docker-compose.yml` for Postgres
   - [ ] Add `.env.example` with `DATABASE_URL` placeholder
4) Prisma
   - [ ] Install Prisma + init schema
   - [ ] Create initial models: Org, User, Employee (minimal)
   - [ ] Migration name: `init`
5) Health endpoint
   - [ ] Add `/api/health` route that checks DB connectivity
6) First page
   - [ ] Add `/performance/reviews` page with empty state
7) Containerization
   - [ ] Add Dockerfile + .dockerignore
   - [ ] Validate container run locally
8) CI
   - [ ] Add GitHub Actions `ci.yml` for lint/typecheck/test/build

## Acceptance criteria
- [ ] `docker compose up` starts Postgres
- [ ] `npx prisma migrate dev` succeeds on a clean DB
- [ ] `/api/health` returns ok + db ok
- [ ] `/performance/reviews` loads without errors and shows empty state
- [ ] CI workflow runs successfully on PR

## How to test
```bash
# from repo root
docker compose up -d

cd apps/web
npm install
npx prisma migrate dev
npm run dev

```

## visit: 
#### http://localhost:3000/api/health
#### http://localhost:3000/performance/reviews

# Performance Reviews — MVP Milestones

## Milestone 1 — Reviews MVP (Cycle + Tasks + Write + Autosave + Submit + Evidence attach)

**Status:** Phase 1, Phase 2, and Phase 3 complete (local workspace, PR number pending).  
**Objective:** Run a review cycle end-to-end for a small org with basic evidence support.

### Scope

#### In scope
- Admin can create a cycle, generate packets/submissions, and move cycle states
- Employees/managers can see assigned review tasks
- Write screen: 3-panel layout (phase nav, questions, evidence sidebar)
- Autosave and submit with required validation
- Evidence: counts + drill-in list + attach/detach evidence to answers
- Audit logging for all sensitive mutations
- Seed data sufficient for demo (org, employees, one cycle, evidence)

#### Out of scope
- Complex reviewer assignment logic (use simple rules first)
- Advanced rating rubrics (keep minimal)
- Notifications/email reminders (optional later)

### Work breakdown (ordered)

1. [x] **Data model + migration**
   - Add models: `ReviewCycle`, `ReviewTemplate`, `ReviewTemplateQuestion`
   - Add models: `ReviewPacket`, `ReviewSubmission`, `ReviewAnswer`
   - Add evidence models: `EvidenceItem`, `AnswerEvidenceLink`
   - Add audit model: `AuditEvent` (if not already)
   - Migration name: `add_reviews_mvp_core`

2. **Admin cycle setup**
   - [x] UI: `/admin/performance/review-cycles` list
   - [x] UI: `/admin/performance/review-cycles/new`
   - [x] API: create cycle
   - [x] API: generate packets/submissions
   - [x] API: status transitions `Draft → Active → Locked → Released`
   - [x] Audit events for each mutation

3. [x] **Tasks list**
   - [x] UI: `/performance/reviews` shows submissions assigned to current user
   - [x] API: tasks endpoint

4. [x] **Write review screen**
   - [x] Route: `/performance/reviews/:cycleId/write/:submissionId`
   - [x] Center: questions + rich text editor
   - [x] Autosave endpoint per answer
   - [x] Submit endpoint with validation
   - [x] Submitted review is read-only

5. **Evidence panel**
   - [x] Evidence counts by type
   - [x] Drill-in list (by type)
   - [x] Attach/detach evidence to answer
   - [x] Audit events for attach/detach

6. **Quality**
   - [x] Tests for required validation
   - [x] Tests for permission denial on cross-submission access
   - [x] Tests for evidence attach/detach + no-leak visibility counts
   - [x] Tests for cycle state transitions
   - [x] Ensure empty/loading/error states

7. [x] **Seed/demo**
   - Seed script to create minimal org and sample data

Phase 1 note: Completed locally on 2026-02-26 (no PR number assigned in local workspace).
Phase 2 note: Completed locally on 2026-02-26 (no PR number assigned in local workspace).
Phase 3 note: Completed locally on 2026-02-26 (no PR number assigned in local workspace).

### Acceptance criteria
- [x] HR can create cycle + generate submissions
- [x] User sees tasks list
- [x] User can write answers, refresh page, and see work preserved
- [x] Submit blocks until required questions answered
- [x] Evidence can be attached/detached and is audited
- [x] Permissions prevent cross-employee access

### How to test
```bash
docker compose up -d
cd apps/web
npm install
npx prisma migrate dev
npm run dev
```

#### use seed endpoint/script if present
#### navigate:
#### /admin/performance/review-cycles
#### /performance/reviews
#### open a submission and verify autosave+submit


## Milestone 1.5 — App Shell & UX Foundation + Reviews Hardening

**Status:** Completed locally on 2026-02-27 (PR number pending).  
**Objective:** Establish a consistent app shell UX and close the remaining Milestone 1 gaps for admin workflow hardening.

### Scope

#### In scope
- Shared application shell layout (global navigation + content container)
- Home page for module navigation and current milestone entry points
- Shared UI primitives for consistent cards/buttons/form controls
- Remaining Milestone 1 items:
  - Admin review cycle pages (`/admin/performance/review-cycles`, `/admin/performance/review-cycles/new`)
  - Review cycle status transition API (`Draft -> Active -> Locked -> Released`)
  - Tests for cycle status transitions

#### Out of scope
- Milestone 2 packet/calibration implementation
- Design-system overhaul beyond foundational primitives

### Work breakdown (ordered)

1. **App shell foundation**
   - [x] Add app shell layout used by main app routes
   - [x] Add primary navigation for Home, Reviews, and Admin Review Cycles

2. **Home route**
   - [x] Replace default Next.js starter page with product home route
   - [x] Add quick links to active workflows

3. **Shared UI primitives**
   - [x] Add shared primitives for button/card/badge/input/select (or equivalent)
   - [x] Use primitives in new admin/home views

4. **Admin review cycles UI**
   - [x] Add `/admin/performance/review-cycles` list page with loading/empty/error states
   - [x] Add `/admin/performance/review-cycles/new` create page with loading/error states
   - [x] Add UI actions to generate artifacts and transition status

5. **API hardening**
   - [x] Add cycle status transition server logic with Zod validation + permission checks
   - [x] Add thin route handler for transition endpoint
   - [x] Add cycle listing endpoint (for admin pages)
   - [x] Add audit events for status transitions

6. **Quality**
   - [x] Add tests for valid and invalid cycle status transitions
   - [x] Ensure lint, typecheck, test, and build pass

### Acceptance criteria
- [x] App shell is visible on core app routes and provides stable navigation
- [x] Home page is no longer scaffold placeholder and links to key flows
- [x] Admin can create cycles from UI, generate artifacts, and move cycle status in order
- [x] Invalid or out-of-order status transitions are rejected server-side
- [x] Cycle transition tests are present and passing
- [x] Full quality gates pass locally


## Milestone 2 — Packets + Calibration (9-box)

**Status:** Phase 1 (Review Packet view) completed locally on 2026-02-27; calibration work pending.  
**Objective:** Managers/HR can view packets and calibrate a cohort in 9-box with finalize snapshot.

### Scope

#### In scope
- Packet view (subject-centric) with submissions read-only after lock
- Calibration session creation (simple cohort selection)
- 9-box UI with placements
- Right drawer with packet summary and “This cycle / Previous cycles” tabs (previous can be empty initially)
- Finalize calibration creates immutable snapshot and locks session
- Audit events for move + finalize

#### Out of scope
- Sophisticated analytics comparisons
- Fully accessible drag-drop (provide non-drag move control in MVP)

### Work breakdown (ordered)

1. **Data model + migration**
   - [ ] Add `CalibrationSession`, `CalibrationPlacement`, `CalibrationSnapshot`
   - [ ] Migration name: `add_calibration_mvp`

2. **Phase 1 — Packet view**
   - [x] UI route: `/performance/reviews/:cycleId/packet/:employeeId`
   - [x] API/service: permissioned packet fetch with submissions + answers
   - [x] Visibility rules: HR admin, manager-of-subject, subject employee only after release when policy allows
   - [x] Loading/empty/error states for packet route
   - [x] Tests for packet fetch + permission gating
   - Completed in local workspace commit set for Milestone 2 Phase 1 on 2026-02-27

3. **Calibration session creation**
   - [ ] Admin route (optional for MVP): `/admin/performance/calibration/new`
   - [ ] API: create session with cohort

4. **Calibration workspace**
   - [ ] UI: `/performance/calibration/:sessionId`
   - [ ] Move control (dropdown “Move to box”) plus optional drag-drop
   - [ ] Right drawer shows packet summary and link to packet

5. **Finalize**
   - [ ] Finalize endpoint locks session and creates snapshot JSON
   - [ ] Optionally write final bucket/rating to packet

6. **Quality**
   - [ ] Tests for finalize locking + snapshot creation

### Acceptance criteria
- [x] Packet view works and is permission-gated
- [ ] Calibration grid loads cohort and updates placement
- [ ] Finalize locks session and stores snapshot
- [ ] Audit events captured for move/finalize

## Milestone 3 — Improvement Plans MVP (Timeline + Audit + Export placeholder)

**Status:** Not started  
**Objective:** Create and manage improvement plans with compliance-ready records.

### Scope

#### In scope
- Create plan (manager/HR)
- Plan detail page with timeline entries (check-ins)
- Status transitions (draft/active/completed/extended/cancel)
- Audit log for all changes
- Export placeholder endpoint/button

#### Out of scope
- Complex templating and approval workflows
- Advanced notifications

### Work breakdown (ordered)

1. **Data model + migration**
   - `ImprovementPlan`, `ImprovementPlanGoal`, `ImprovementPlanCheckIn`
   - Attachments (optional scaffolding)
   - Migration name: `add_improvement_plans_mvp`

2. **UI routes**
   - `/performance/improvement-plans` list
   - `/performance/improvement-plans/:planId` detail + timeline

3. **API**
   - Create plan
   - Add check-in entry
   - Change status
   - Get audit events
   - Export placeholder endpoint

4. **Permissions**
   - Strict: subject/manager/HR only

5. **Quality**
   - Tests for status transitions and audit events

### Acceptance criteria
- [ ] Authorized users can create and view plans
- [ ] Check-ins append to timeline and are audited
- [ ] Export placeholder exists and is clearly marked
- [ ] Unauthorized users cannot access plan data
