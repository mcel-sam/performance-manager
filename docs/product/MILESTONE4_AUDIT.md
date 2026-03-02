# Milestone 4 Audit — UX Polish + Help & Guidance

Date: 2026-02-28  
Scope audited: `PLAN.md` Milestone 4 (Phases 1–4), implementation in `apps/web`, and required docs (`AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`).

## Short summary
Milestone 4 is **largely implemented and demo-capable** across Phases 1–4, including shared UI primitives, core-flow consistency updates, Help Center, contextual guidance, write-review hardening, calibration notes/export placeholder, improvement plan list route, and home due-soon surfacing.  
Remaining issues are mostly **consistency/polish** (a few pages still use one-off layout/loading/error patterns) and **plan-doc hygiene** (Milestone 4 status line and one PR reference placeholder in `PLAN.md`).

---

## 1) Phase-by-phase checklist verification against PLAN.md

### Phase 1 — UI Foundation (Design System Nucleus)
Status: **Complete (with one documentation inconsistency)**

| PLAN item | Status | Evidence |
|---|---|---|
| Design tokens + primitives created | Complete | `apps/web/src/app/globals.css`, `apps/web/src/components/ui/{button,card,input,textarea,select,badge,tabs,table,drawer,modal,toast,empty-state,skeleton}.tsx` |
| Standard layout components (`PageHeader`, `SectionHeader`) | Complete | `apps/web/src/components/layout/page-header.tsx`, `apps/web/src/components/layout/section-header.tsx` |
| 3 routes refactored (Home, Reviews tasks, one admin route) | Complete | `apps/web/src/app/page.tsx`, `apps/web/src/app/performance/reviews/page.tsx`, `apps/web/src/app/admin/performance/review-cycles/page.tsx` |
| Acceptance criteria pass (`lint/typecheck/test/build`) | Complete | scripts exist in `apps/web/package.json`; current gates pass (see Section 5) |

Notes:
- `PLAN.md` still shows `Completed in PR #TBD` for Phase 1 and `Milestone 4 Status: Not started` even though phases are checked complete.

### Phase 2 — Apply Consistency Across Core Flows
Status: **Partial (functionally complete, minor consistency gaps remain)**

| PLAN item | Status | Evidence |
|---|---|---|
| Refactor write-review, packet, calibration session, improvement detail, admin review-cycle create | Complete | `apps/web/src/app/performance/reviews/[cycleId]/write/[submissionId]/page.tsx`, `apps/web/src/components/reviews/write-review-form.tsx`, `apps/web/src/app/performance/reviews/[cycleId]/packet/[employeeId]/page.tsx`, `apps/web/src/components/reviews/review-packet-view.tsx`, `apps/web/src/components/calibration/calibration-session-view.tsx`, `apps/web/src/components/improvement-plans/improvement-plan-detail-view.tsx`, `apps/web/src/app/admin/performance/review-cycles/new/page.tsx` |
| Standardize loading/empty/error with shared components | Partial | Many routes do this, but some still use one-off markup: `apps/web/src/app/performance/reviews/{loading,error}.tsx`, `apps/web/src/app/admin/performance/calibration/{loading.tsx,new/loading.tsx}`, `apps/web/src/app/admin/performance/review-cycles/loading.tsx` |
| Skeleton loaders on packet/calibration/improvement detail | Complete | `apps/web/src/app/performance/reviews/[cycleId]/packet/[employeeId]/loading.tsx`, `apps/web/src/app/performance/calibration/[sessionId]/loading.tsx`, `apps/web/src/app/performance/improvement-plans/[planId]/loading.tsx` |
| Accessibility baseline (focus states, keyboard tabs/modal, aria labels) | Complete | `apps/web/src/components/ui/tabs.tsx` (arrow/home/end keyboard nav + roving tabIndex), `apps/web/src/components/ui/modal.tsx` (focus-visible close), `apps/web/src/components/calibration/calibration-session-view.tsx` (`aria-label` on placement buttons) |

### Phase 3 — In-app Guidance (Help + Tooltips + Coaching)
Status: **Complete**

| PLAN item | Status | Evidence |
|---|---|---|
| Persistent Help entry in shell | Complete | `apps/web/src/components/layout/app-shell.tsx` (`/help` nav item) |
| `/help` page with role sections + deep links | Complete | `apps/web/src/app/help/page.tsx` (Employee/Manager/HR sections and route links) |
| Role-aware Getting Started card on Home | Complete | `apps/web/src/app/page.tsx`, `apps/web/src/components/home/getting-started.ts` |
| Contextual helper text on key actions | Complete | Submit/Evidence: `apps/web/src/components/reviews/write-review-form.tsx`; Calibration meaning/lock: `apps/web/src/components/calibration/calibration-session-view.tsx`; Packet visibility: `apps/web/src/app/performance/reviews/[cycleId]/packet/[employeeId]/page.tsx`; Improvement visibility/audit note: `apps/web/src/components/improvement-plans/improvement-plan-detail-view.tsx` |
| Empty-state coaching improvements | Complete | `apps/web/src/app/performance/reviews/page.tsx`, `apps/web/src/app/performance/improvement-plans/page.tsx`, plus `EmptyState` usage in packet/calibration/improvement detail components |

### Phase 4 — Remaining MVP-adjacent UX gaps
Status: **Complete (with product-confirmed deferrals documented)**

| PLAN item | Status | Evidence |
|---|---|---|
| Write-review left phase nav expanded | Complete | `apps/web/src/app/performance/reviews/[cycleId]/write/[submissionId]/page.tsx` |
| Write-review right panel context summary | Complete | `apps/web/src/components/reviews/write-review-form.tsx` (`submissionContext` block in drawer) |
| Keep current editor unless confirmed | Complete (deferred by design) | Plain textarea/editor retained in `apps/web/src/components/reviews/write-review-form.tsx` |
| Calibration notes/justification in drawer | Complete | UI: `apps/web/src/components/calibration/calibration-session-view.tsx`; DB/API: `apps/web/prisma/schema.prisma`, `apps/web/src/server/calibration/calibration-session-service.ts`, migration `apps/web/prisma/migrations/20260227213028_add_calibration_placement_justification_note/migration.sql` |
| Calibration export placeholder endpoint + UI | Complete | API: `apps/web/src/app/api/performance/calibration/[sessionId]/export/route.ts`; service: `apps/web/src/server/calibration/calibration-session-service.ts`; UI action: `apps/web/src/components/calibration/calibration-session-view.tsx` |
| Improvement plans list route | Complete | `apps/web/src/app/performance/improvement-plans/page.tsx` (+ `loading.tsx`, `error.tsx`) |
| Home due-soon indicators | Complete | `apps/web/src/app/page.tsx` (review tasks + improvement plans due-soon cards) |

---

## 2) Evidence map: routes/components touched for Milestone 4

### Shared system
- Layout shell: `apps/web/src/components/layout/app-shell.tsx`
- Layout primitives: `apps/web/src/components/layout/page-header.tsx`, `apps/web/src/components/layout/section-header.tsx`
- UI primitives: `apps/web/src/components/ui/*` (button/card/input/select/textarea/tabs/table/drawer/modal/toast/empty-state/skeleton)

### Core pages/routes
- Home: `apps/web/src/app/page.tsx`
- Help: `apps/web/src/app/help/page.tsx`
- Reviews tasks: `apps/web/src/app/performance/reviews/page.tsx`
- Write review: `apps/web/src/app/performance/reviews/[cycleId]/write/[submissionId]/page.tsx`
- Packet view: `apps/web/src/app/performance/reviews/[cycleId]/packet/[employeeId]/page.tsx`
- Calibration session: `apps/web/src/app/performance/calibration/[sessionId]/page.tsx`
- Improvement plans list/detail:
  - `apps/web/src/app/performance/improvement-plans/page.tsx`
  - `apps/web/src/app/performance/improvement-plans/[planId]/page.tsx`
- Admin review cycles list/new:
  - `apps/web/src/app/admin/performance/review-cycles/page.tsx`
  - `apps/web/src/app/admin/performance/review-cycles/new/page.tsx`
- Admin calibration list/new:
  - `apps/web/src/app/admin/performance/calibration/page.tsx`
  - `apps/web/src/app/admin/performance/calibration/new/page.tsx`

### Key feature components
- Write-review form: `apps/web/src/components/reviews/write-review-form.tsx`
- Packet view: `apps/web/src/components/reviews/review-packet-view.tsx`
- Calibration view: `apps/web/src/components/calibration/calibration-session-view.tsx`
- Improvement detail: `apps/web/src/components/improvement-plans/improvement-plan-detail-view.tsx`

---

## 3) Pages still not using shared primitives/layout consistently

These are the highest-confidence pages that still use one-off layout/loading/error patterns instead of shared `PageHeader`, `Skeleton`, `Card`, `Button` combinations:

1. `apps/web/src/app/admin/performance/calibration/page.tsx`
   - Uses raw `<header>` with custom classes instead of `PageHeader`.
2. `apps/web/src/app/admin/performance/calibration/new/page.tsx`
   - Uses raw `<header>` with custom classes instead of `PageHeader`.
3. `apps/web/src/app/performance/reviews/loading.tsx`
   - Uses raw `animate-pulse` blocks instead of shared `Skeleton` component.
4. `apps/web/src/app/performance/reviews/error.tsx`
   - Uses raw `<button>` and custom error card instead of shared `Card` + `Button`.
5. `apps/web/src/app/admin/performance/calibration/loading.tsx`
   - Uses raw pulse blocks, no `Skeleton` primitive.
6. `apps/web/src/app/admin/performance/calibration/new/loading.tsx`
   - Uses raw pulse blocks, no `Skeleton` primitive.
7. `apps/web/src/app/admin/performance/review-cycles/loading.tsx`
   - Uses raw pulse blocks, no `Skeleton` primitive.

---

## 4) Missing help/tooltips/empty-state coaching items (if any)

### Missing or partially implemented
1. Dedicated tooltip pattern is not standardized as a reusable primitive.
   - Current guidance is mostly helper text/toasts/details blocks, which is acceptable but inconsistent with “tooltips/helper text” phrasing.
2. Admin calibration pages are less guided than user-facing flows.
   - `apps/web/src/app/admin/performance/calibration/page.tsx` and `.../new/page.tsx` lack `PageHeader`-style coaching/metadata pattern used elsewhere.
3. Reviews route-level loading/error pages are not yet using the same coached/shared-state pattern.
   - `apps/web/src/app/performance/reviews/{loading,error}.tsx`.

### Already covered (no gap found)
- Help entry + role-based `/help` content
- Write-review submit/evidence guidance
- Calibration meaning/finalized explanation
- Packet visibility guidance
- Improvement-plan visibility/audit guidance
- Empty-state coaching on primary list/detail flows

---

## 5) Quality gates status (current scripts)

Source: `apps/web/package.json`
- `lint`: present (`eslint .`)
- `typecheck`: present (`next typegen && tsc --noEmit --incremental false`)
- `test`: present (`vitest run`)
- `build`: present (`next build --webpack`)

Current run status in this audit session:
- `npm run lint`: **PASS**
- `npm run typecheck`: **PASS** (initial run surfaced transient `.next/types` missing file errors; immediate rerun passed)
- `npm test`: **PASS** (11 test files, 64 tests)
- `npm run build`: **PASS**

Missing gates/scripts:
- None for the requested set.

---

## 6) Top 5 small PRs to reach “HR demo ready”

1. **Unify admin calibration headers with shared layout**
   - Refactor `apps/web/src/app/admin/performance/calibration/page.tsx` and `.../new/page.tsx` to `PageHeader` + `SectionHeader`.
2. **Standardize remaining loading/error pages**
   - Convert reviews/admin loading/error outliers to shared `Skeleton`, `Card`, `Button`, `EmptyState`.
3. **Add a small shared tooltip/help-hint primitive**
   - Replace ad hoc `details`/toast helper blocks where appropriate for consistent keyboard + aria behavior.
4. **Add smoke tests for demo-critical routes**
   - Lightweight Playwright or integration checks for `/help`, write-review guidance, calibration export placeholder, improvement list/detail.
5. **Plan/docs hygiene PR**
   - Update `PLAN.md` Milestone 4 top-level status (`Not started` -> complete), Phase 1 PR placeholder (`#TBD`), and manual QA checklist section state.

---

## 7) Plan consistency notes

`PLAN.md` inconsistencies observed:
- Milestone 4 header still says `Status: Not started` while all phases are checked complete.
- Phase 1 completion note still contains `PR #TBD`.
- Manual visual QA checklist under Milestone 4 implementation notes remains unchecked even though phase PRs included checklist completion.

These are documentation consistency issues, not product-code blockers.
