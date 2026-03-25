# IMPLEMENTATION_CHECKLIST.md

# Trellis — Implementation Checklist

## 1. Purpose

This document translates the Trellis Vanilla Build into concrete implementation work.

It is intended to track what must be built, updated, validated, or hidden in order to:
- align the app to the Vanilla Build scope
- launch the HR sandbox
- prepare for later production hardening

This is an engineering execution checklist, not a PRD and not a long-form plan.

---

## 2. Current Delivery Goal

Current target:
- deploy a usable HR sandbox
- validate the core workflows end-to-end
- keep scope restricted to the Vanilla Build

Core workflows:
- Goals + Measures
- Reviews
- 9-Box Calibration
- Succession and Risk outputs from calibration
- PIP

---

## 3. Status Legend

Use any status format the team prefers. Suggested:

- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Blocked / needs decision
- [-] Deferred

---

## 4. Sandbox Readiness

### Current status
- Milestone: 1 — Sandbox Identity and Data Foundation
- State: In progress

### Active slices

#### Slice 1 — Shared sandbox environment
- [x] Sandbox environment created on Azure
- [x] Sandbox environment variables configured
- [x] Sandbox database provisioned
- [x] Sandbox deployment succeeds cleanly

#### Slice 2 — Shared sandbox safety
- [ ] Dev-only demo flows disabled in shared sandbox
- [ ] Real sandbox users can log in
- [ ] One realistic org exists in sandbox
- [ ] Navigation only exposes vanilla-scope features
- [ ] Unfinished modules are hidden

### Definition of done
- HR can access a stable sandbox without using developer-only shortcuts
- sandbox behaves like a real shared environment
- only vanilla-scope workflows are visible in the sandbox

### Validation
- deploy to sandbox successfully
- log in with a real sandbox user
- confirm demo/reset shortcuts are not exposed
- confirm only vanilla-scope navigation is visible

### Notes
- local-only dev shortcuts may still exist, but must not be exposed in the shared sandbox
- sandbox should behave like a real system, not a fake demo mode

---

## 5. Authentication

### Current status
- Milestone: 1 — Sandbox Identity and Data Foundation
- State: Partial

### Active slices

#### Slice 1 — Supabase auth foundation
- [x] Supabase Auth integrated for sandbox login
- [x] Login flow works for sandbox users
- [x] Logout flow works correctly
- [x] Sessions are stable

#### Slice 2 — Server-owned identity
- [ ] User identity maps correctly into application user records
- [ ] Shared sandbox no longer depends on client-supplied identity headers
- [ ] Current-user resolution works server-side for main auth path

#### Slice 3 — Production auth path
- [ ] Entra ID migration path remains documented
- [-] Entra ID implementation deferred until sandbox is validated

### Definition of done
- sandbox auth is reliable and safe for HR testing
- server-side identity is the source of truth for authenticated requests
- authenticated users can be resolved into Trellis users, org membership, and roles

### Validation
- log in and refresh session successfully
- confirm server-side current-user resolution works
- confirm protected routes do not depend on client-supplied identity headers
- confirm authenticated user can be matched to an app user record

### Notes
- Supabase is the sandbox auth provider only
- production auth remains Entra ID later
- do not rely on fake role switching in the shared sandbox

---

## 6. Roles and Permissions

### Current status
- Milestone: 1 — Sandbox Identity and Data Foundation
- State: Partial

### Active slices

#### Slice 1 — Role model alignment
- [ ] Roles standardized to Employee, Manager, HR Admin, and Super Admin
- [ ] Lingering Calibrator semantics identified
- [ ] Super Admin-only actions defined consistently

#### Slice 2 — Server-side permission enforcement
- [ ] Role checks enforced server-side
- [ ] Restricted actions hidden from unauthorized roles
- [ ] Restricted data not leaked in summaries, side panels, or alternate routes

#### Slice 3 — Relationship and restricted-scope enforcement
- [ ] Leadership-team access restricted appropriately
- [ ] Super Admin-only actions are enforced
- [ ] Manager-only report-scope checks are enforced

### Definition of done
- each role sees only the workflows and records they are supposed to access
- sensitive access rules are enforced server-side
- restricted talent workflows are not exposed to the wrong roles

### Validation
- log in as Employee, Manager, HR Admin, and Super Admin
- confirm role-based nav visibility
- confirm restricted routes are blocked
- confirm managers cannot act outside direct-report scope
- confirm Super Admin-only actions are inaccessible to non-Super Admin roles

### Notes
- UI hiding is not sufficient without backend enforcement
- this milestone focuses on the minimum role correctness needed for shared sandbox usage

---

## 7. Organization and Reporting Structure

### Current status
- Milestone: 1 — Sandbox Identity and Data Foundation
- State: In progress

### Active slices

#### Slice 1 — Sandbox org bootstrap
- [ ] Organization record structure supports sandbox tenant
- [ ] Employees, managers, HR admins, and super admin can be created and assigned
- [ ] Sandbox org bootstrap path is repeatable

#### Slice 2 — User, membership, and role mapping
- [ ] Authenticated users map to Trellis app users
- [ ] App users map to organization memberships
- [ ] Organization memberships map to roles

#### Slice 3 — Reporting relationships
- [ ] Reporting lines are stored correctly
- [ ] Manager/direct-report relationships drive access correctly
- [ ] Leadership cohort or restricted cohort can be identified if needed

### Definition of done
- reporting relationships and org scope reliably power access decisions
- sandbox users map cleanly into Trellis org records
- the sandbox supports realistic role-based testing

### Validation
- create or bootstrap one sandbox organization
- confirm users map to org memberships
- confirm at least one manager/direct-report relationship exists
- confirm manager-scoped flows reflect reporting lines correctly
- confirm role-based access depends on real app records, not demo shortcuts

### Notes
- AD/Entra sync is deferred
- sandbox org structure is manually managed for now
- Trellis remains the application source of truth for org membership during sandbox
---

## 8. Goals + Measures

- [ ] Goal types limited to:
  - Performance
  - Development
- [ ] Maximum of 5 total goals enforced per employee per cycle
- [ ] Goal state model supports:
  - Draft
  - Submitted
  - Changes Requested
  - Approved
  - Overridden
- [ ] Employee can create draft goals
- [ ] Employee can submit goals
- [ ] Manager can approve goals
- [ ] Manager can request changes
- [ ] Employee can revise and resubmit
- [ ] Approved goals are locked
- [ ] Super Admin can override locked goals in exceptional cases
- [ ] Goal progress updates allowed only in configured windows
- [ ] Goal comments allowed only in configured windows
- [ ] Goal revision history is visible where needed

Definition of done:
- employee-to-manager goal workflow works cleanly end-to-end and respects lock rules

---

## 9. Reviews

- [ ] Review types limited to:
  - Self Review
  - Manager Review
- [ ] Peer review hidden or removed from vanilla surfaces
- [ ] Upward review hidden or removed from vanilla surfaces
- [ ] HR-defined templates supported
- [ ] Employee can complete self review
- [ ] Manager can complete review for direct reports
- [ ] Goal context appears in review experience where needed
- [ ] Review packet aggregates required content
- [ ] Review release logic works correctly
- [ ] Employee sees released packet only when allowed

Definition of done:
- self and manager review flows are usable, scoped correctly, and release correctly

---

## 10. Review Content Model

- [ ] Employee review prompts finalized
- [ ] Manager review prompts finalized
- [ ] Talent review reference reflected in content model where appropriate
- [ ] Review prompts support:
  - accomplishments
  - goal progress
  - strengths
  - development opportunities
  - leadership behaviors
  - growth potential
  - career direction where applicable
- [ ] Review UI handles long-form responses cleanly

Definition of done:
- review prompts support realistic HR testing and feel intentional

---

## 11. 9-Box Calibration

- [ ] Calibration session model works for target review cycle
- [ ] Placement on 9-box grid works
- [ ] Placement rationale can be captured
- [ ] Relevant employee context is visible in calibration workflow
- [ ] Finalize action restricted to Super Admin
- [ ] Finalized calibration becomes immutable
- [ ] Leadership-team views restricted to Super Admin
- [ ] Managers can participate only within allowed scope

Definition of done:
- Super Admin can run a complete calibration workflow with correct restrictions

---

## 12. Succession and Risk Outputs

- [ ] Succession outputs captured from calibration
- [ ] Risk outputs captured from calibration
- [ ] Succession data includes:
  - emergency backup
  - ready now
  - ready future
  - readiness notes
- [ ] Risk data includes:
  - risk level
  - concern summary
  - suggested action
- [ ] Access to succession/risk outputs is restricted appropriately
- [ ] Standalone succession module is hidden if outside vanilla scope

Definition of done:
- calibration produces usable and permissioned talent outputs

---

## 13. PIP

- [ ] PIP can be created after review or calibration decision
- [ ] PIP status model supports:
  - Draft
  - Active
  - Completed
  - Extended
  - Cancelled
- [ ] Manager can provide checkpoint feedback
- [ ] HR can oversee the process
- [ ] 30-day checkpoint supported
- [ ] 60-day checkpoint supported
- [ ] 90-day checkpoint supported
- [ ] Timeline/history is readable
- [ ] Employee-facing visibility is appropriate
- [ ] PIP actions are audited

Definition of done:
- PIP workflow is usable, trackable, and appropriately restricted

---

## 14. Frontend / UX Alignment

- [ ] Navigation reflects vanilla scope only
- [ ] Incomplete modules are hidden
- [ ] Core screens follow frontend standards
- [ ] Labels are clear and professional
- [ ] Empty states are handled
- [ ] Loading states are handled
- [ ] Error states are handled
- [ ] Critical workflows have clear next actions
- [ ] High-sensitivity screens feel calm and trustworthy
- [ ] Layout and hierarchy are consistent across Goals, Reviews, Calibration, and PIP

Definition of done:
- the app feels coherent and trustworthy for HR-facing sandbox use

---

## 15. Browser Validation and QA

- [ ] Login validated by role
- [ ] Employee landing experience validated
- [ ] Manager landing experience validated
- [ ] HR Admin landing experience validated
- [ ] Super Admin landing experience validated
- [ ] Goals workflow validated in browser
- [ ] Reviews workflow validated in browser
- [ ] Calibration workflow validated in browser
- [ ] PIP workflow validated in browser
- [ ] Permission boundaries validated in browser
- [ ] Dead-end routes or broken screens identified
- [ ] Trust-breaking UX issues identified and fixed

Definition of done:
- core workflows are validated in-browser and safe for HR mock runs

---

## 16. Deployment and Operations

- [ ] Sandbox deployment process is documented
- [ ] Environment variable requirements are documented
- [ ] Sandbox secrets managed correctly
- [ ] DB migration flow is working
- [ ] Basic rollback/redeploy confidence exists
- [ ] Basic incident/debug path exists for sandbox issues

Definition of done:
- sandbox can be deployed, updated, and debugged without chaos

---

## 17. Audit and Safety

- [ ] Sensitive mutations emit audit events
- [ ] Goal approval/revision actions audited
- [ ] Review submissions audited where needed
- [ ] Calibration actions audited
- [ ] Succession/risk changes audited
- [ ] PIP changes audited
- [ ] Super Admin overrides audited

Definition of done:
- sensitive workflows are traceable

---

## 18. Deferred Until Production Hardening

- [-] Microsoft Entra ID implementation
- [-] Azure Database for PostgreSQL production migration
- [-] production-grade observability hardening
- [-] production-grade secret and access hardening
- [-] formal PR-heavy release workflow
- [-] broader analytics and extended modules
- [-] peer review and upward review
- [-] full standalone succession planning module

---

## 19. Final Sandbox Handoff Checklist

- [ ] HR users can log in
- [ ] one realistic org is configured
- [ ] one review cycle exists
- [ ] goals flow works end-to-end
- [ ] review flow works end-to-end
- [ ] calibration flow works end-to-end
- [ ] succession/risk outputs can be captured
- [ ] PIP can be created and updated
- [ ] non-vanilla or unfinished features are hidden
- [ ] major UX issues are addressed
- [ ] major permission issues are resolved

Definition of done:
- HR can perform realistic mock runs without relying on manual workaround processes