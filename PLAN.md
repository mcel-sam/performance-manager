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

**Status:** Not started  
**Objective:** Make the product feel elegant and self-serve (Lattice-like UI polish + in-app guidance), while closing remaining MVP-adjacent UX gaps. Analytics dashboards will be handled in a later milestone after HR confirms the rating framework.

### Implementation notes (tighten execution)
- **Core routes in scope for UI consistency:** Home, Reviews Tasks, Write Review, Packet, Calibration, Improvement Plans (list/detail), Admin Review Cycles, Admin Calibration, Help.
- **Component locations (to avoid sprawl):**
  - UI primitives: `apps/web/src/components/ui/*`
  - Layout components: `apps/web/src/components/layout/*`
  - Page-specific components: colocate under the route folder or `apps/web/src/components/features/*`
- **Manual visual QA checklist (include in PR description for UX phases):**
  - [ ] Spacing/typography consistent with PageHeader + tokens
  - [ ] Buttons/inputs/cards use shared primitives (no one-off styles)
  - [ ] Focus rings visible; keyboard navigation works for drawers/modals
  - [ ] Loading/empty/error states present and readable
  - [ ] No layout break on common widths (desktop + narrow)

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
- Completed in PR #TBD (dev -> main Milestone 4 Phase 1)

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
- [x] Standardize loading/empty/error states using shared components
- [x] Add Skeleton loaders on packet/calibration/improvement plan detail where data fetches occur
- [x] Accessibility baseline pass:
  - [x] Focus states visible
  - [x] Keyboard navigation for drawers/modals
  - [x] `aria-label` on icon buttons

**Acceptance criteria**
- [x] Core flows look consistent and use shared components
- [x] No mixed styling patterns remain on core routes
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


## Milestone 5 — Analytics Foundations (Scaffold Only)

**Status:** Not started  
**Objective:** Prepare the platform for HR analytics dashboards without implementing final charts until the HR rating/competency framework is confirmed.

### In scope
- Add `/analytics` route and nav entry (placeholder)
- Define privacy rules (small-N suppression) in code/constants (placeholder values)
- Create reusable chart components and data-query service patterns (no real KPIs yet)
- Add a lightweight “reporting query layer” abstraction (e.g., `src/server/analytics/*`)
- Ensure metrics can be derived from stored ratings once rating framework is finalized

### Out of scope
- Final HR dashboards/KPIs
- Trend reporting across cycles
- Advanced “Explorer” builder

### Acceptance criteria
- `/analytics` page exists and is access-controlled (HR_ADMIN only)
- Chart component scaffolding exists and is reusable
- No hardcoded KPI assumptions are made before HR framework is finalized
