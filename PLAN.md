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
- [x] Server-side permission checks are implemented for all endpoints
- [x] Audit events written for sensitive mutations
- [x] Loading/empty/error states exist for UI routes
- [x] Local run works (`npm run dev`, docker Postgres)
- [x] Prisma migrations committed (when schema changes)
- [x] `lint`, `typecheck`, `test` pass (or are added as part of work)

---

# Milestone 0 — Foundation (Boot + DB + first routes)

**Status:** Completed locally on 2026-02-26 (PR number pending).  
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
   - [x] Create `/apps/web`, `/packages/types`, `/docs/*`, `/infra/terraform`
   - [x] Ensure README points to AGENTS/PRD/Architecture/ADR
2) Web scaffold
   - [x] Create Next.js app in `/apps/web`
   - [x] Confirm `npm run dev` works
3) Local DB
   - [x] Add `docker-compose.yml` for Postgres
   - [x] Add `.env.example` with `DATABASE_URL` placeholder
4) Prisma
   - [x] Install Prisma + init schema
   - [x] Create initial models: Org, User, Employee (minimal)
   - [x] Migration name: `init`
5) Health endpoint
   - [x] Add `/api/health` route that checks DB connectivity
6) First page
   - [x] Add `/performance/reviews` page with empty state
7) Containerization
   - [x] Add Dockerfile + .dockerignore
   - [x] Validate container run locally
8) CI
   - [x] Add GitHub Actions `ci.yml` for lint/typecheck/test/build

## Acceptance criteria
- [x] `docker compose up` starts Postgres
- [x] `npx prisma migrate dev` succeeds on a clean DB
- [x] `/api/health` returns ok + db ok
- [x] `/performance/reviews` loads without errors and shows empty state
- [x] CI workflow runs successfully on PR

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
   - [x] Center: questions + text answers (rich text deferred)
   - [x] Autosave endpoint per answer
   - [x] Submit endpoint with validation
   - [x] Required progress indicator + first-missing required question focus/scroll on submit failure
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

**Status:** Phase 1, Phase 2, and Phase 3 completed locally on 2026-02-27.  
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
   - [x] Add `CalibrationSession`, `CalibrationPlacement`
   - [x] Add `CalibrationSnapshot`
   - [x] Migration name: `add_calibration_mvp`
   - [x] Additional finalize migration: `add_calibration_snapshot_finalize_lock`

2. **Phase 1 — Packet view**
   - [x] UI route: `/performance/reviews/:cycleId/packet/:employeeId`
   - [x] API/service: permissioned packet fetch with submissions + answers
   - [x] Visibility rules: HR admin, manager-of-subject, subject employee only after release when policy allows
   - [x] Packet essentials placeholders: evidence counts, previous-cycles empty-state tab, summary placeholder block
   - [x] Loading/empty/error states for packet route
   - [x] Tests for packet fetch + permission gating
   - Completed in local workspace commit set for Milestone 2 Phase 1 on 2026-02-27

3. **Calibration session creation**
   - [x] Admin route: `/admin/performance/calibration/new`
   - [x] Admin list route: `/admin/performance/calibration`
   - [x] API: create session with cohort (`POST /api/performance/calibration`)
   - [x] API: list sessions (`GET /api/performance/calibration`)
   - Completed in local workspace commit set for Milestone 2 D1 follow-on on 2026-02-27

4. **Calibration workspace**
   - [x] UI: `/performance/calibration/:sessionId`
   - [x] Move control (dropdown “Move to box”) plus optional drag-drop
   - [x] Right drawer shows packet summary and link to packet
   - [x] Tabs: “This cycle” and “Previous cycles” (previous cycle tab currently empty state)
   - [x] Helper copy/tooltips and loading/empty/error/read-only states
   - Completed in local workspace commit set for Milestone 2 Phase 2 on 2026-02-27

5. **Finalize**
   - [x] Finalize endpoint locks session and creates snapshot JSON
   - [x] Endpoint: `POST /api/performance/calibration/:sessionId/finalize`
   - [x] Locked/read-only UI state: finalize banner + disabled move controls
   - Completed in local workspace commit set for Milestone 2 Phase 3 on 2026-02-27

6. **Quality**
   - [x] Tests for session fetch permission gating and placement move authorization
   - [x] Tests for finalize locking + snapshot creation
   - [x] Tests for unauthorized finalize access

### Acceptance criteria
- [x] Packet view works and is permission-gated
- [x] Calibration grid loads cohort and updates placement
- [x] Finalize locks session and stores snapshot
- [x] Audit events captured for move/finalize

## Milestone 3 — Improvement Plans MVP (Timeline + Audit + Export placeholder)

**Status:** Phase 1, Phase 2, Phase 3, and Phase 4 completed locally on 2026-02-27 (PR number pending).  
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
   - `/performance/improvement-plans/:planId` detail + timeline

3. **API**
   - Create plan
   - Update plan goals/date range
   - Add check-in entry
   - Change status
   - Get audit events
   - Export placeholder endpoint

4. **Permissions**
   - Strict: subject/manager/HR only

5. **Quality**
   - Tests for status transitions and audit events

### Phase tracking

#### Phase 1 — DB + create/list/detail APIs + strict permissions
- [x] Add Prisma enums/models: `ImprovementPlan`, `ImprovementPlanGoal`, `ImprovementPlanCheckIn`
- [x] Commit migration `add_improvement_plans_mvp`
- [x] Add seed/dev data for one improvement plan and goals
- [x] Add APIs:
  - [x] `POST /api/performance/improvement-plans`
  - [x] `GET /api/performance/improvement-plans`
  - [x] `GET /api/performance/improvement-plans/:planId`
- [x] Keep route handlers thin; move logic to `src/server/improvement-plans/*`
- [x] Enforce server-side permissions (HR admin, manager direct-report scope, subject/manager/HR access scope)
- [x] Add service tests for create/list/detail and permission denials
- [x] Local quality gates pass (`lint`, `typecheck`, `test`, `build`)
- Completed in local workspace commit set on 2026-02-27 (PR number pending)

#### Phase 2 — timeline/check-ins + status transitions + auditing
- [x] Add check-in API `POST /api/performance/improvement-plans/:planId/checkins`
- [x] Add status transition API `PATCH /api/performance/improvement-plans/:planId/status`
- [x] Add strict permissions:
  - [x] Check-in create: subject/manager/HR admin only
  - [x] Status change: manager owner or HR admin only
- [x] Add status transition validation rules (`DRAFT -> ACTIVE -> COMPLETED -> EXTENDED/CANCELED`, with completion outcome required)
- [x] Add audit events for check-in create and status transitions
- [x] Add detail UI route `/performance/improvement-plans/:planId` with timeline feed
- [x] Add loading/empty/error states for improvement plan detail timeline
- [x] Add tests for:
  - [x] Authorized check-in create + audit event
  - [x] Unauthorized check-in create blocked
  - [x] Valid status transition + audit event
  - [x] Invalid status transition rejected
  - [x] Unauthorized status transition blocked
- [x] Local quality gates pass (`lint`, `typecheck`, `test`, `build`)
- Completed in local workspace commit set on 2026-02-27 (PR number pending)

#### Phase 3 — audit log view + export placeholder
- [x] Add audit event retrieval endpoint for improvement plans
- [x] Add export placeholder endpoint and UI action
- [x] Add audit log view on `/performance/improvement-plans/:planId` with loading/empty/error states
- [x] Add tests for audit feed and export placeholder behavior
- [x] Local quality gates pass (`lint`, `typecheck`, `test`, `build`)
- Completed in local workspace commit set on 2026-02-27 (PR number pending)

#### Phase 4 — audit completeness for plan edits
- [x] Add plan edit endpoint `PATCH /api/performance/improvement-plans/:planId` for goals/date range
- [x] Add audit events for goal and date edits
- [x] Add permission + audit tests for edit flow
- [x] Local quality gates pass (`lint`, `typecheck`, `test`, `build`)
- Completed in local workspace commit set on 2026-02-27 (PR number pending)

### Acceptance criteria
- [x] Authorized users can create and view plans
- [x] Check-ins append to timeline and are audited
- [x] Export placeholder exists and is clearly marked
- [x] Unauthorized users cannot access plan data

## Milestone 4 — UX Polish + Help & Launch Readiness (No Analytics Yet)

**Status:** Core implementation complete in PRs #3, #4, #5, and #6; remaining consistency/help polish moved to Milestone 4.1.  
**Objective:** Make the product feel elegant and self-serve (Lattice-like UI polish + in-app guidance), while closing remaining MVP-adjacent UX gaps. Analytics dashboards will be handled in a later milestone after HR confirms the rating framework.

### Implementation notes (tighten execution)
- **Core routes in scope for UI consistency:** Home, Reviews Tasks, Write Review, Packet, Calibration, Improvement Plans (list/detail), Admin Review Cycles, Admin Calibration, Help.
- **Component locations (to avoid sprawl):**
  - UI primitives: `apps/web/src/components/ui/*`
  - Layout components: `apps/web/src/components/layout/*`
  - Page-specific components: colocate under the route folder or `apps/web/src/components/features/*`
- **Manual visual QA checklist (include in PR description for UX phases):**
  - [x] Spacing/typography consistent with PageHeader + tokens
  - [x] Buttons/inputs/cards use shared primitives (no one-off styles)
  - [x] Focus rings visible; keyboard navigation works for drawers/modals
  - [x] Loading/empty/error states present and readable
  - [x] No layout break on common widths (desktop + narrow)

### Scope

#### In scope (this milestone)
- UI Foundation / Design System polish (tokens + primitives + consistent layouts)
- In-app Guidance (Help Center + tooltips + contextual coaching + better empty states)
- Remaining follow-on UX gaps from Milestones 1–3:
  - write-review UX completeness
  - calibration notes + export placeholder
  - improvement plan list route + polish
- Basic home/dashboard task surfacing (in-app, lightweight)

#### Out of scope (explicitly deferred)
- Analytics dashboards and charts (Lattice-style insights)
- Identity/SSO hardening and production RBAC rollout
- Notifications/worker jobs
- Advanced AI analytics engines
- Full calibration write-back/ranking systems beyond agreed MVP+ scope

---

### Phase 1 — UI Foundation (Design System Nucleus)
- [x] Define design tokens (typography scale, spacing, radii, shadows) via Tailwind config and/or CSS variables
- [x] Create/standardize core UI primitives:
  - [x] Button
  - [x] Card
  - [x] Input / Textarea
  - [x] Select
  - [x] Badge/StatusChip
  - [x] Tabs
  - [x] Table
  - [x] Drawer/SidePanel
  - [x] Modal
  - [x] Toast
  - [x] EmptyState
  - [x] Skeleton loader
- [x] Create standard layout components:
  - [x] PageHeader (title + subtitle + primary CTA slot)
  - [x] SectionHeader
- [x] Refactor 3 routes to use primitives/layout:
  - [x] Home
  - [x] /performance/reviews (tasks)
  - [x] One admin route (review cycles list OR calibration admin list)
- [x] Add a short “Visual spot-check” list to the PR description (manual QA checklist)
- Completed in PR #3 (dev -> main Milestone 4 Phase 1)

**Acceptance criteria**
- [x] Refactored routes share consistent spacing/typography and components
- [x] No business logic changes
- [x] `lint`, `typecheck`, `test`, `build` pass in `apps/web`

---

### Phase 2 — Apply Consistency Across Core Flows
- [x] Refactor remaining core routes to use primitives/layout:
  - [x] Write review screen
  - [x] Packet view
  - [x] Calibration session view
  - [x] Improvement plans detail
  - [x] Admin review cycles new/create page (if still inconsistent)
- [ ] Standardize loading/empty/error states using shared components (remaining outliers moved to Milestone 4.1)
- [x] Add Skeleton loaders on packet/calibration/improvement plan detail where data fetches occur
- [x] Accessibility baseline pass:
  - [x] Focus states visible
  - [x] Keyboard navigation for drawers/modals
  - [x] `aria-label` on icon buttons

**Acceptance criteria**
- [x] Core flows look consistent and use shared components
- [ ] No mixed styling patterns remain on core routes (remaining admin/reviews outliers moved to Milestone 4.1)
- [x] `lint`, `typecheck`, `test`, `build` pass in `apps/web`
- Completed in PR #4 (dev -> main Milestone 4 Phase 2)

---

### Phase 3 — In-app Guidance (Help + Tooltips + Coaching)
- [x] Add persistent Help entry point in app shell (header or nav)
- [x] Add `/help` page with role-based sections and deep links:
  - [x] Employee: tasks, writing/submitting, evidence, viewing packet
  - [x] Manager: calibration, review participation, improvement plans
  - [x] HR: cycle setup, progress monitoring, calibration sessions, audit/export concepts
- [x] Add “Getting started” coaching card on Home (role-aware links)
- [x] Add contextual tooltips/helper text (concise, accessible) for:
  - [x] Submit (finality + visibility)
  - [x] Evidence (what counts + visibility)
  - [x] Calibration axes meaning + finalized/locked meaning
  - [x] Packet visibility rules (locked vs released)
  - [x] Improvement plan visibility & audit notes
- [x] Improve empty-state coaching copy on key pages (“what to do next”)

**Acceptance criteria**
- [x] Users can self-serve core workflows without external training
- [x] Tooltips are accessible (keyboard + aria) and concise
- [x] `/help` provides accurate deep links to in-app pages
- [x] `lint`, `typecheck`, `test`, `build` pass in `apps/web`
- Completed in PR #5 (dev -> main Milestone 4 Phase 3)

---

### Phase 4 — Remaining MVP-adjacent UX gaps (from PRD_AUDIT)
This phase finishes the leftover functional UX items without adding analytics.

#### Write-review UX completeness
- [x] Expand write-review left phase navigation beyond task context (clean phase nav)
- [x] Add right-panel reviewer/subject context summary on write-review screen
- [x] Keep current answer editor for MVP (richer editor deferred pending product confirmation)

#### Calibration completion
- [x] Add calibration participant notes/justifications in right drawer (if not already)
- [x] Add calibration snapshot export/download placeholder endpoint + UI action
- [x] Optional write-back of finalized bucket/rating to packet stable fields explicitly deferred pending product confirmation

#### Improvement plans completion
- [x] Add `/performance/improvement-plans` list route
- [x] Add incremental UX polish beyond MVP placeholders

#### Home/dashboard task surfacing
- [x] Add due-soon indicators for assigned review tasks and improvement plan check-ins (in-app only)

**Acceptance criteria**
- [x] All remaining follow-on items from Milestones 1–3 are tracked and completed here (or explicitly deferred)
- [x] New/updated endpoints include Zod validation + server-side permission checks
- [x] New mutations write audit events with non-sensitive metadata
- [x] New UI routes include loading/empty/error states
- [x] `lint`, `typecheck`, `test`, `build` pass in `apps/web`
- Completed in PR #6 (dev -> main Milestone 4 Phase 4)


## Milestone 4.1 — UX/Help Fixes

**Status:** Completed in PR #7 (dev -> main Milestone 4.1 UX/Help Fixes).  
**Objective:** Close the remaining consistency and help-system polish gaps identified by `docs/product/MILESTONE4_AUDIT.md`.

### Short checklist
- [x] Refactor admin calibration headers to shared layout primitives (`PageHeader` / `SectionHeader`) on:
  - `/admin/performance/calibration`
  - `/admin/performance/calibration/new`
- [x] Convert remaining one-off loading/error pages to shared primitives (`Skeleton`, `Card`, `Button`, `EmptyState`) for:
  - `/performance/reviews/loading`
  - `/performance/reviews/error`
  - `/admin/performance/calibration/loading`
  - `/admin/performance/calibration/new/loading`
  - `/admin/performance/review-cycles/loading`
- [x] Add a reusable tooltip/help-hint primitive and standardize contextual guidance usage on key flows
- [x] Re-run manual visual QA checklist for core routes and capture results in PR description
- [x] Ensure `lint`, `typecheck`, `test`, and `build` pass in `apps/web`

## Milestone 4.2 — Playwright E2E Smoke Suite (UX Regression Gates)

**Status:** Completed in PRs #8, #9, and #10.  
**Objective:** Add a small, stable Playwright smoke suite to catch UX regressions across core flows (Lattice-like UI polish protection). Keep scope minimal and tests reliable.

### Scope

#### In scope
- Add Playwright test runner and repo configuration under `apps/web`
- Add `apps/web/e2e/*` smoke tests for critical user journeys (5–8 tests max)
- Use stable selectors (`data-testid`) for key interactive elements
- Provide a repeatable local run path for E2E tests
- Optional: add an E2E job in CI for PRs to `main` once stable

#### Out of scope
- Full visual regression screenshot diffing (can be added later)
- Large suite of brittle UI tests
- Testing every page or every component
- Load/performance testing

---

### Phase 1 — Playwright Setup + First Smoke Test
- [x] Install Playwright test dependencies in `apps/web` (`@playwright/test`)
- [x] Create Playwright config (baseURL, webServer, retries, trace on failure)
- [x] Add npm scripts in `apps/web/package.json`:
  - [x] `test:e2e`
  - [x] `test:e2e:ui`
- [x] Add minimal smoke test: Home loads + navigation works
- [x] Add/standardize `data-testid` attributes on primary nav and Home “Getting started” links (only what tests need)
- [x] Document how to run E2E locally in README (short section)

**Acceptance criteria**
- [x] `npm run test:e2e` runs locally and passes consistently
- [x] One smoke test is present and stable
- [x] No flaky selectors (prefer `data-testid`)
- Completed in PR #8 (dev -> main Milestone 4.2 Phase 1)

---

### Phase 2 — Core Flow Smoke Coverage (Keep to ~5–8 tests)
Add smoke tests (only core happy paths; no deep edge cases):
- [x] Reviews tasks list loads (`/performance/reviews`)
- [x] Write review: autosave works + submit locks (minimal path)
- [x] Packet page renders
- [x] Calibration: open drawer + move placement via accessible control
- [x] Improvement plan: add check-in and see timeline entry

Implementation notes:
- [x] Add `data-testid` only where needed for stability (submit buttons, autosave indicator, drawer open, move placement control)
- [x] Keep each test under ~30–60 seconds and avoid brittle timing assumptions

**Acceptance criteria**
- [x] All smoke tests pass locally in one run
- [x] Tests are stable across repeated runs
- [x] Failures produce trace/screenshots for debugging (configured)
- Completed in PR #9 (dev -> main Milestone 4.2 Phase 2)

---

### Phase 3 — CI Integration (Optional, after stability)
- [x] Add a separate CI job/workflow to run E2E smoke suite:
  - [x] Run on PRs to `main` (or nightly until stable)
  - [x] Upload trace/screenshots on failure
- [x] Ensure E2E does not block iteration if flaky (use retries and keep suite small)

**Acceptance criteria**
- [x] E2E runs in CI reliably (or is scheduled nightly) with debuggable artifacts
- [x] CI remains fast enough for team velocity
- Completed in PR #10 (dev -> main Milestone 4.2 Phase 3)

## Milestone 5 — HR Scorecard + Analytics-ready Data Foundations + Demo Login (No Dashboards Yet)

**Status:** Not started  
**Objective:** Implement the HR-defined rating model and store analytics-ready data (competencies + weighted scorecard) while enabling HR to run everything through the UI using demo logins/configs (no scripts). Dashboards/charts will be a later milestone once HR confirms reporting preferences.

### HR form requirements (source)
- Competencies rated **1–5** by **Employee + Manager**, with comments:
  - Values / Culture Alignment
  - Judgment & Decision-Making
  - Safety & Compliance
  - Technical Skills
  - Quality of Work
  - Communication
  - Accountability
  - Relationship Building
  - Results Driven
  - Attitude
  - Service Oriented
  - Adaptability
- Performance Metrics Scorecard (weighted subset, totals to 100%):
  - Quality of Work (15%)
  - Communication (10%)
  - Accountability (15%)
  - Relationship Building (10%)
  - Results Driven (20%)
  - Attitude (10%)
  - Service Oriented (10%)
  - Adaptability (10%)
- Blended Rating per metric: `(Employee + Manager) / 2`
- Weighted Score % per metric: `(Blended / 5) * weight%`
- Total % mapped to rating:
  - 5 Exceptional: 90–100%
  - 4 Exceeds: 80–89%
  - 3 Meets: 70–79%
  - 2 Needs Improvement: 60–69%
  - 1 Unsatisfactory: <60%

### Key decisions (locked for this milestone)
- Peer/Upward reviews may collect the same 1–5 competency ratings + comments, but are **reference input only**.
- Scorecard math uses **Self + Manager only** by default.
- Scorecard weights are **global company-wide** (no per-department weights yet).
- Support **N/A / Not Observed** as a stored rating state; exclude from scoring by default (unless HR specifies otherwise later).

### Scope

#### In scope
- Data model changes to represent competencies/ratings with stable `dimension_key`
- Store self + manager competency ratings + comments (via existing submissions)
- Store scorecard weights as cycle config (global company weights)
- Compute and store derived scorecard outputs per employee packet:
  - per-metric blended rating
  - per-metric weighted percent
  - total percent
  - scorecard-mapped overall rating (1–5)
- Persist per-metric breakdown results (for easy charting later)
- Peer/upward reviews supported as **reference input** (ratings/comments stored) but **not included in scorecard math** (default)
- Demo-mode UI setup:
  - buttons/config pages to create demo org/users/cycle/calibration/plan (no scripts)
  - sample username/password per role for local use only
  - demo-only “log in as” or demo login page
- Update Playwright smoke suite to use demo login + demo setup

#### Out of scope
- Analytics dashboards/charts (separate milestone after HR confirms reporting view)
- Production SSO/identity hardening (later)
- Notifications/worker jobs (later)

---

### Phase 1 — Data Model + Cycle Scorecard Config (schema + migration)
- [x] Add `dimension_key` + rating question type support for competency questions (SCALE 1–5)
- [x] Add support for **N/A / Not Observed** rating state (stored, excluded from score by default)
- [x] Add scorecard config tables tied to the cycle:
  - [x] metric_key, weight_percent (must sum to 100)
- [x] Add packet fields (or derived tables) for storing:
  - [x] total_scorecard_percent
  - [x] scorecard_overall_rating (1–5)
  - [x] final_rating_source (SCORECARD | CALIBRATION)
- [x] Add per-metric breakdown storage (analytics-ready):
  - [x] scorecard_metric_result: packet_id, metric_key, self_rating, manager_rating, blended_rating, weight_percent, weighted_percent
- [x] Add snapshot fields for org attributes at cycle time (department/title/manager) (to prevent reporting drift)
- [x] Migration committed and tests updated if needed

Validation rules (Phase 1)
- [x] Weights sum-to-100 enforced server-side (not just UI)
- [x] Metric keys validated against an allowed list
- [x] N/A behavior documented and consistent

**Acceptance criteria**
- [x] Schema supports competency ratings and scorecard weights
- [x] Per-metric breakdown results are persistable
- [x] Weights sum to 100 enforced at validation layer
- [x] `lint/typecheck/test/build` pass
- Completed in PR #11 (dev -> main Milestone 5 Phase 1)

---

### Phase 2 — Scorecard Computation Engine + Tests
- [x] Compute blended ratings from self + manager submissions
- [x] Apply weights and compute total percent + mapped overall rating
- [x] Persist derived results on packet
- [x] Persist per-metric results into scorecard_metric_result (required for later charts)
- [x] Recompute trigger on manager submit and/or cycle lock (choose one and document)
  - [x] Chosen trigger: recompute on manager submission submit
- [x] Calibration override behavior:
  - [x] If calibration finalized, final rating source can become CALIBRATION (store both)
- [x] Unit tests:
  - [x] blended formula correctness
  - [x] weighted sum correctness
  - [x] rating threshold mapping correctness
  - [x] recompute trigger behavior
  - [x] boundary cases: 79/80/89/90 and <60 handling
  - [x] N/A behavior correctness (documented rule)

**Acceptance criteria**
- [x] Scorecard results computed deterministically and persisted
- [x] Tests prove formula correctness and mapping thresholds
- Completed in PR #12 (dev -> main Milestone 5 Phase 2)

---

### Phase 3 — Peer/Upward Reviews as Reference Input (No weighting)
- [x] Allow peer/upward submissions to include the same competency ratings/comments (1–5 + Not Observed)
- [x] Clearly label these as “Reference input” in manager view
- [x] Ensure scorecard computation ignores peer/upward by default
- [x] Permission tests for peer/upward visibility rules

**Acceptance criteria**
- [x] Peer/upward data can be collected and viewed where allowed
- [x] Scorecard totals unaffected by peer/upward by default

---

### Phase 4 — Demo Mode UI + Sample Role Logins (No scripts)
- [ ] Add DEMO_MODE guard (only in development)
- [ ] Add a Demo Setup page in UI:
  - [ ] Create demo org + employees + manager hierarchy
  - [ ] Create demo cycle + generate submissions
  - [ ] Create demo calibration session
  - [ ] Create demo improvement plan
- [ ] Add simple demo authentication:
  - [ ] sample usernames/passwords for roles (Employee/Manager/HR/Calibrator)
  - [ ] visible only in demo mode
  - [ ] demo-only “log in as” or demo login page
- [ ] Update Playwright smoke suite to use demo login + demo setup and run core flows

**Acceptance criteria**
- [ ] HR can demo everything from the UI with demo accounts (no scripts)
- [ ] Demo setup is disabled outside DEMO_MODE
- [ ] E2E suite still passes
