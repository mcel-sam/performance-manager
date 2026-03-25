# Trellis Gap Analysis

## Executive Summary

- Repo state reviewed against the current Vanilla Build docs shows a strong local/demo prototype, not a sandbox-ready build.
- Core workflow foundations exist for goals, reviews, calibration, succession, and improvement plans, but most areas are only partially aligned to the current PRD, role model, and environment strategy.
- The largest gaps are sandbox auth, role-model drift, Vanilla-scope drift in exposed navigation/routes, and workflow rules that exist in UI or schema form but are not yet enforced end-to-end.
- Server-side domain services do enforce many permissions, but the current auth model still relies on development/demo context and client-supplied `x-user-id` / `x-org-id` headers in many API calls.
- This analysis is based on repo inspection only. I did not run browser flows or deploy the app for this report.

## Status by Area

### 1. Sandbox Readiness

- Status: `Partial`
- Summary:
  - The app is coherent enough for local walkthroughs, but the current build is still optimized for development/demo use rather than a shared HR sandbox.
  - Multiple core workflows exist, but sandbox-specific requirements in the docs are not yet met around auth, environment hardening, and hiding dev-only paths.
- Evidence:
  - `apps/web/src/app/login/page.tsx`
  - `apps/web/src/components/demo/demo-login-panel.tsx`
  - `apps/web/src/app/api/demo/login/route.ts`
  - `apps/web/src/app/api/demo/reset/route.ts`
  - `apps/web/src/config/env.ts`
  - `apps/web/.env.local`
  - `docs/engineering/IMPLEMENTATION_CHECKLIST.md`
  - `docs/engineering/ENVIRONMENT_MATRIX.md`
- Gaps:
  - Sandbox auth path from the docs is not implemented.
  - Dev/demo reset and role-login flows are still first-class surfaces.
  - Several pages and help content still point to seeded demo routes and dev-only setup.
  - Local/demo behavior should not be counted as sandbox-ready.
- Recommended next action:
  - Replace demo-first entry paths with a real sandbox auth path, then remove or fully hide demo login/reset outside local development.

### 2. Authentication

- Status: `Partial`
- Summary:
  - Authentication exists for local development and demos, but the documented sandbox path is missing.
  - The current request model is not suitable for a shared sandbox because many APIs trust client-supplied identity headers.
- Evidence:
  - `apps/web/src/server/auth/request-context.ts`
  - `apps/web/src/proxy.ts`
  - `apps/web/src/config/env.ts`
  - `apps/web/src/components/reviews/write-review-form.tsx`
  - `apps/web/src/components/goals/goals-workspace.tsx`
  - `apps/web/src/components/calibration/calibration-session-view.tsx`
  - `docs/architecture/ARCHITECTURE.md`
  - `docs/engineering/IMPLEMENTATION_CHECKLIST.md`
  - `docs/engineering/ENVIRONMENT_MATRIX.md`
- Gaps:
  - No Supabase Auth implementation for sandbox.
  - No production-path Entra integration scaffolding beyond docs.
  - `getRequestContext()` requires `x-user-id` and `x-org-id`; many client components send those headers directly.
  - SSR pages commonly use `getDevRequestContext()`, which is explicitly development-oriented.
- Recommended next action:
  - Move request identity to server-owned session/auth middleware and eliminate client-controlled identity headers from app APIs.

### 3. Roles and Permissions

- Status: `Partial`
- Summary:
  - Permission checks are present in several server services, but the current role model does not match the docs and some access rules are weakened by the current auth approach.
  - The repo still treats `CALIBRATOR` as a first-class role, while the current docs describe `SUPER_ADMIN`.
- Evidence:
  - `apps/web/prisma/schema.prisma`
  - `apps/web/src/server/navigation/nav-visibility-service.ts`
  - `apps/web/src/config/navigation.ts`
  - `apps/web/src/server/calibration/calibration-session-service.ts`
  - `apps/web/src/server/goals/goal-service.ts`
  - `apps/web/src/server/reviews/review-packet-service.ts`
  - `apps/web/src/server/improvement-plans/improvement-plan-service.ts`
  - `docs/product/ROLE_PERMISSIONS.md`
- Gaps:
  - Role enum includes `CALIBRATOR` and does not include `SUPER_ADMIN`.
  - Calibration finalization is allowed for `HR_ADMIN` or `CALIBRATOR`, not the documented super-admin-only model.
  - Permission checks are not centrally enforced from a real authenticated session.
  - Some visibility rules depend on navigation filtering, but server trust still starts from dev/demo identity resolution.
- Recommended next action:
  - Align the persisted role model and server permission rules to the current docs, starting with replacing `CALIBRATOR` semantics and hardening server-owned identity.

### 4. Organization and Reporting Structure

- Status: `Partial`
- Summary:
  - The repo has a real organization and manager/report hierarchy model and an HR-admin user management surface.
  - This area is structurally ahead of several others, but it is still tied to dev/demo seeding and the older role model.
- Evidence:
  - `apps/web/prisma/schema.prisma`
  - `apps/web/src/server/users/user-management-service.ts`
  - `apps/web/src/app/admin/users/page.tsx`
  - `apps/web/prisma/seed.mjs`
  - `apps/web/src/server/demo/seed/fixtures.ts`
- Gaps:
  - Shared-sandbox identity provisioning is not wired to the user/org model.
  - The role set is not doc-aligned.
  - Current org realism depends heavily on seeded demo data.
- Recommended next action:
  - Keep the current org/reporting model, but connect it to sandbox auth and doc-aligned roles before counting it as sandbox-ready.

### 5. Goals + Measures

- Status: `Partial`
- Summary:
  - Goals are implemented as a usable local workflow with cycles, ownership, key results, updates, and manager visibility.
  - The implementation does not yet match the governed Vanilla Build workflow described in the current docs.
- Evidence:
  - `apps/web/src/app/goals/page.tsx`
  - `apps/web/src/components/goals/goals-workspace.tsx`
  - `apps/web/src/components/goals/goal-composer.tsx`
  - `apps/web/src/server/goals/goal-service.ts`
  - `apps/web/src/app/admin/goals/cycles/page.tsx`
  - `apps/web/src/components/admin/goal-cycles-manager.tsx`
  - `docs/product/PRD.md`
- Gaps:
  - No documented goal state model such as `Draft`, `Submitted`, `Changes Requested`, `Approved`, `Overridden`.
  - No manager approval/request-changes flow.
  - No approved-goal lock or super-admin override model.
  - No evidence of the documented five-goal cap or explicit goal-type handling.
  - Admin copy says goal windows can run independently from review cycles, which conflicts with the current Vanilla Build governance direction.
- Recommended next action:
  - Narrow the goals workflow to the documented Vanilla state model and approval rules before adding more goals breadth.

### 6. Reviews

- Status: `Partial`
- Summary:
  - Reviews are one of the most mature areas in the repo: cycle setup, task lists, writing flows, packets, and access checks all exist.
  - The current implementation is still broader than Vanilla Build scope and only partially aligned to the current content model.
- Evidence:
  - `apps/web/src/app/performance/reviews/page.tsx`
  - `apps/web/src/app/performance/reviews/[cycleId]/write/[submissionId]/page.tsx`
  - `apps/web/src/components/reviews/write-review-form.tsx`
  - `apps/web/src/components/reviews/review-packet-view.tsx`
  - `apps/web/src/server/reviews/admin-cycle-service.ts`
  - `apps/web/src/server/reviews/participant-review-service.ts`
  - `apps/web/src/server/reviews/review-packet-service.ts`
  - `apps/web/src/components/admin/review-cycle-create-form.tsx`
  - `docs/product/REVIEW_CONTENT_MODEL.md`
  - `docs/product/ROLE_PERMISSIONS.md`
- Gaps:
  - Peer and upward review flows are still built and exposed even though current role docs mark them out of scope for Vanilla Build.
  - Review cycle generation still creates `PEER` and `UPWARD` submissions.
  - Review templates/content do not clearly match the current review content model in all cases.
  - Packet summary and some historical/summary surfaces are still placeholders.
- Recommended next action:
  - Constrain reviews to the Vanilla Build review types and then align templates/forms to the current review content model.

### 7. 9-Box Calibration

- Status: `Partial`
- Summary:
  - Calibration has real session creation, placement movement, participant scoping, finalization, and snapshotting.
  - It is not yet aligned to the current role model or to the doc-defined downstream outputs.
- Evidence:
  - `apps/web/src/app/admin/performance/calibration/page.tsx`
  - `apps/web/src/app/admin/performance/calibration/new/page.tsx`
  - `apps/web/src/app/performance/calibration/[sessionId]/page.tsx`
  - `apps/web/src/components/calibration/calibration-session-view.tsx`
  - `apps/web/src/server/calibration/calibration-admin-service.ts`
  - `apps/web/src/server/calibration/calibration-session-service.ts`
  - `docs/product/PRD.md`
  - `docs/product/ROLE_PERMISSIONS.md`
- Gaps:
  - Finalization permissions are based on `HR_ADMIN` / `CALIBRATOR`, not the documented super-admin control.
  - Home/help/nav surfaces still route directly to the seeded `calibration_session_seed_1`.
  - Finalization updates packet rating source but does not produce the documented succession/risk outputs.
  - Admin guidance still references setting `DEV_USER_ID`, which is not sandbox behavior.
- Recommended next action:
  - Keep the existing calibration mechanics, but tighten finalization permissions and wire documented post-calibration outputs before sandbox handoff.

### 8. Succession and Risk Outputs

- Status: `Partial`
- Summary:
  - The repo has a substantial succession planning module, but it is broader than the current Vanilla Build intent.
  - As implemented, succession is a standalone workspace, not a narrowly scoped output of calibration.
- Evidence:
  - `apps/web/src/app/talent/succession/page.tsx`
  - `apps/web/src/app/admin/talent/succession/page.tsx`
  - `apps/web/src/components/succession/succession-overview.tsx`
  - `apps/web/src/components/succession/succession-position-detail-view.tsx`
  - `apps/web/src/server/succession/succession-service.ts`
  - `apps/web/prisma/schema.prisma`
  - `docs/product/PRD.md`
  - `docs/product/ROLE_PERMISSIONS.md`
- Gaps:
  - Standalone succession planning is broader than the current Vanilla Build scope.
  - Calibration does not appear to write the documented succession/risk outputs directly.
  - Output fields and workflow do not clearly match the current doc model for readiness, emergency backup, and organizational risk outputs.
  - Manager visibility of risk-related data is still partly controlled by env flag (`ALLOW_MANAGER_RISK_VIEW`), which is not a final sandbox policy.
- Recommended next action:
  - Reduce this area to doc-aligned calibration outputs for sandbox, and hide broader standalone succession planning surfaces for now.

### 9. PIP

- Status: `Partial`
- Summary:
  - The repo has a functional improvement-plan workflow with creation, detail views, check-ins, status changes, and access checks.
  - It is not yet the doc-aligned PIP workflow described for the Vanilla Build and sandbox pilot.
- Evidence:
  - `apps/web/src/app/performance/improvement-plans/page.tsx`
  - `apps/web/src/app/performance/improvement-plans/[planId]/page.tsx`
  - `apps/web/src/components/improvement-plans/improvement-plan-detail-view.tsx`
  - `apps/web/src/server/improvement-plans/improvement-plan-service.ts`
  - `docs/product/PRD.md`
  - `docs/product/SANDBOX_PILOT.md`
  - `docs/engineering/IMPLEMENTATION_CHECKLIST.md`
- Gaps:
  - Generic improvement-plan model is not clearly the same as the documented PIP workflow.
  - No enforced 30/60/90-day checkpoint structure.
  - No clear linkage from calibration/review outcomes into PIP initiation rules.
  - Export remains a placeholder.
- Recommended next action:
  - Convert the current improvement-plan flow into the narrower documented PIP workflow with explicit checkpoint handling.

### 10. Frontend / UX Alignment

- Status: `Partial`
- Summary:
  - The frontend is well beyond a wireframe stage and includes role-aware navigation, empty states, loading/error states, and real workflow layouts.
  - The biggest UX issue is not lack of UI polish; it is scope drift and dev/demo exposure in user-facing surfaces.
- Evidence:
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/config/navigation.ts`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/app/help/page.tsx`
  - `apps/web/src/app/performance/reviews/loading.tsx`
  - `apps/web/src/app/performance/reviews/error.tsx`
  - `apps/web/src/app/performance/improvement-plans/error.tsx`
  - `docs/engineering/FRONTEND_STANDARDS.md`
- Gaps:
  - Navigation exposes features broader than the current Vanilla Build.
  - Home/help content includes seeded demo-route shortcuts and role-model drift.
  - Some pages surface dev-only instructions or assumptions.
  - UX alignment is strongest inside individual workflows and weaker at the product-shell level.
- Recommended next action:
  - Trim navigation and landing/help surfaces to the current Vanilla Build so the sandbox feels focused and trustworthy.

### 11. Browser Validation Readiness

- Status: `Partial`
- Summary:
  - Playwright is present and the repo has meaningful browser coverage, which is a strong foundation for sandbox validation.
  - Current browser tests are still anchored to demo-mode auth and include out-of-scope surfaces.
- Evidence:
  - `apps/web/playwright.config.ts`
  - `apps/web/e2e/core-flows.spec.ts`
  - `apps/web/e2e/home-navigation.spec.ts`
  - `apps/web/e2e/succession.spec.ts`
  - `apps/web/e2e/reporting.spec.ts`
  - `apps/web/e2e/ux-audit.spec.ts`
  - `.github/workflows/e2e-smoke.yml`
  - `.github/workflows/e2e-ux-audit.yml`
  - `docs/engineering/QUALITY_STRATEGY.md`
- Gaps:
  - E2E setup assumes demo reset/login flows.
  - No sandbox-auth browser path exists to validate.
  - Current suites spend coverage on routes that likely should not ship in the first sandbox.
- Recommended next action:
  - Retarget browser coverage to the reduced Vanilla Build surface and the eventual sandbox login path.

### 12. Deployment / Environment Readiness

- Status: `Missing`
- Summary:
  - The repo has environment docs and a lightweight DB health check, but not the actual shared-environment implementation expected by the docs.
  - This is the least complete area relative to the documented sandbox/prod direction.
- Evidence:
  - `apps/web/src/config/env.ts`
  - `apps/web/src/app/api/health/route.ts`
  - `apps/web/src/server/health/check-db.ts`
  - `apps/web/.env.example`
  - `infra/terraform/README.md`
  - `docs/engineering/ENVIRONMENT_MATRIX.md`
  - `docs/architecture/ARCHITECTURE.md`
- Gaps:
  - No concrete sandbox deployment configuration is present.
  - No Supabase Auth setup or documented secret/config wiring in the app.
  - Infra directory does not contain an implemented environment stack.
  - The checked-in local env shape is still tuned for local Postgres + demo mode.
- Recommended next action:
  - Establish the minimum sandbox environment implementation: auth provider wiring, shared database config, and a deployment path consistent with the environment matrix.

## Vanilla Scope Mismatches

- `apps/web/src/app/performance/tracks/page.tsx`
  - Tracks/growth surface appears broader than the current Vanilla Build and should likely be hidden for sandbox.
- `apps/web/src/app/admin/performance/reporting/page.tsx`
  - Reporting appears broader than the current Vanilla Build and should likely be hidden.
- `apps/web/src/app/talent/succession/page.tsx`
  - Manager-facing standalone succession planning is broader than the current “outputs from calibration” scope.
- `apps/web/src/app/admin/talent/succession/page.tsx`
  - HR-facing standalone succession workspace is broader than current Vanilla scope.
- `apps/web/src/config/navigation.ts`
  - Navigation still exposes `Tracks`, `Reporting`, standalone `Succession`, and `User Management`; at minimum these should be reviewed against current sandbox scope before exposure.
- `apps/web/src/components/admin/review-cycle-create-form.tsx`
  - Review cycle setup still supports peer/upward review configuration that current role docs mark out of scope.
- `apps/web/src/server/reviews/admin-cycle-service.ts`
  - Backend still generates peer/upward review submissions.
- `apps/web/src/app/performance/reviews/page.tsx`
  - Review task/filtering surfaces still include peer/upward review concepts.
- `apps/web/src/app/admin/goals/cycles/page.tsx`
  - Admin copy explicitly positions goals as independently governed from review cycles, which conflicts with current Vanilla Build direction.
- `apps/web/prisma/schema.prisma`
  - Role model still includes `CALIBRATOR`; current docs describe `SUPER_ADMIN`.
- `apps/web/src/app/page.tsx`
  - Home experience still includes hardcoded seeded calibration links and calibrator-focused behavior.
- `apps/web/src/app/help/page.tsx`
  - Help surface still links to seeded demo routes.
- `apps/web/src/app/login/page.tsx`
  - Demo login is a useful local tool, but it should not be the visible sandbox entry path.

## Highest-Leverage Next Steps

1. Replace demo/header-based identity with real sandbox auth and server-owned request context.
2. Align roles and permission rules to the current docs, especially replacing `CALIBRATOR` behavior with the documented admin model.
3. Hide or remove out-of-scope navigation and routes before sandbox review, starting with Tracks, Reporting, and standalone Succession.
4. Narrow review workflows to Vanilla scope by disabling peer/upward review creation and related UI.
5. Convert the current goals implementation to the documented approval-governed workflow instead of expanding generic goal functionality.
6. Tighten calibration finalization so it matches the current permission model and writes the required downstream outputs.
7. Collapse succession/risk to doc-aligned calibration outputs and defer broader succession planning surfaces.
8. Refocus improvement plans into the documented PIP flow, including explicit 30/60/90 checkpoint support.
9. Retarget Playwright coverage to the reduced Vanilla sandbox surface and eventual sandbox auth path.
10. Stand up the minimum shared sandbox environment implementation defined by the environment matrix and checklist.

## Evidence Appendix

- Source-of-truth docs reviewed:
  - `PLAN.md`
  - `docs/architecture/ARCHITECTURE.md`
  - `docs/engineering/IMPLEMENTATION_CHECKLIST.md`
  - `docs/product/PRD.md`
  - `docs/product/ROLE_PERMISSIONS.md`
  - `docs/product/REVIEW_CONTENT_MODEL.md`
  - `docs/engineering/FRONTEND_STANDARDS.md`
  - `docs/engineering/QUALITY_STRATEGY.md`
  - `docs/engineering/ENVIRONMENT_MATRIX.md`
- Core schema and seed sources:
  - `apps/web/prisma/schema.prisma`
  - `apps/web/prisma/seed.mjs`
  - `apps/web/src/server/demo/seed/fixtures.ts`
- Auth, request context, and environment:
  - `apps/web/src/config/env.ts`
  - `apps/web/src/server/auth/request-context.ts`
  - `apps/web/src/proxy.ts`
  - `apps/web/src/app/login/page.tsx`
  - `apps/web/src/components/demo/demo-login-panel.tsx`
  - `apps/web/src/app/api/demo/login/route.ts`
  - `apps/web/src/app/api/demo/reset/route.ts`
  - `apps/web/.env.example`
  - `apps/web/.env.local`
- App shell and navigation:
  - `apps/web/src/app/layout.tsx`
  - `apps/web/src/app/page.tsx`
  - `apps/web/src/app/help/page.tsx`
  - `apps/web/src/config/navigation.ts`
  - `apps/web/src/server/navigation/nav-visibility-service.ts`
- Goals:
  - `apps/web/src/app/goals/page.tsx`
  - `apps/web/src/components/goals/goals-workspace.tsx`
  - `apps/web/src/components/goals/goal-composer.tsx`
  - `apps/web/src/server/goals/goal-service.ts`
  - `apps/web/src/app/admin/goals/cycles/page.tsx`
  - `apps/web/src/components/admin/goal-cycles-manager.tsx`
- Reviews:
  - `apps/web/src/app/performance/reviews/page.tsx`
  - `apps/web/src/app/performance/reviews/[cycleId]/write/[submissionId]/page.tsx`
  - `apps/web/src/components/reviews/write-review-form.tsx`
  - `apps/web/src/components/reviews/review-packet-view.tsx`
  - `apps/web/src/server/reviews/admin-cycle-service.ts`
  - `apps/web/src/server/reviews/participant-review-service.ts`
  - `apps/web/src/server/reviews/review-packet-service.ts`
  - `apps/web/src/components/admin/review-cycle-create-form.tsx`
- Calibration:
  - `apps/web/src/app/admin/performance/calibration/page.tsx`
  - `apps/web/src/app/admin/performance/calibration/new/page.tsx`
  - `apps/web/src/app/performance/calibration/[sessionId]/page.tsx`
  - `apps/web/src/components/calibration/calibration-session-view.tsx`
  - `apps/web/src/server/calibration/calibration-admin-service.ts`
  - `apps/web/src/server/calibration/calibration-session-service.ts`
- Succession and risk:
  - `apps/web/src/app/talent/succession/page.tsx`
  - `apps/web/src/app/admin/talent/succession/page.tsx`
  - `apps/web/src/components/succession/succession-overview.tsx`
  - `apps/web/src/components/succession/succession-position-detail-view.tsx`
  - `apps/web/src/server/succession/succession-service.ts`
- PIP / improvement plans:
  - `apps/web/src/app/performance/improvement-plans/page.tsx`
  - `apps/web/src/app/performance/improvement-plans/[planId]/page.tsx`
  - `apps/web/src/components/improvement-plans/improvement-plan-detail-view.tsx`
  - `apps/web/src/server/improvement-plans/improvement-plan-service.ts`
- Org and user administration:
  - `apps/web/src/app/admin/users/page.tsx`
  - `apps/web/src/server/users/user-management-service.ts`
- Deployment and validation:
  - `apps/web/src/app/api/health/route.ts`
  - `apps/web/src/server/health/check-db.ts`
  - `infra/terraform/README.md`
  - `apps/web/playwright.config.ts`
  - `apps/web/e2e/core-flows.spec.ts`
  - `apps/web/e2e/home-navigation.spec.ts`
  - `apps/web/e2e/succession.spec.ts`
  - `apps/web/e2e/reporting.spec.ts`
  - `apps/web/e2e/ux-audit.spec.ts`
  - `.github/workflows/ci.yml`
  - `.github/workflows/e2e-smoke.yml`
  - `.github/workflows/e2e-ux-audit.yml`
