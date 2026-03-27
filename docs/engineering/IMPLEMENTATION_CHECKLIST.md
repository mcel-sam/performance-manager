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
- Milestone: 5 — Pilot Readiness and Final Hardening
- State: In progress

### Active slices

#### Slice 1 — Shared sandbox environment
- [x] Sandbox environment created on Azure
- [x] Sandbox environment variables configured
- [x] Sandbox database provisioned
- [x] Sandbox deployment succeeds cleanly

#### Slice 2 — Shared sandbox safety
- [~] Dev-only demo flows disabled in shared sandbox
- [x] Real sandbox users can log in
- [x] One realistic org exists in sandbox
- [x] Navigation only exposes vanilla-scope features
- [x] Unfinished modules are hidden

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
- [x] User identity maps correctly into application user records
- [x] Shared sandbox no longer depends on client-supplied identity headers
- [x] Current-user resolution works server-side for main auth path

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
- Milestone: 3 — Role and Permission Alignment
- State: In progress

### Active slices

#### Slice 1 — Role model alignment
- [x] Roles standardized to Employee, Manager, HR Admin, and Super Admin
- [x] Lingering Calibrator semantics identified
- [~] Super Admin-only actions defined consistently

#### Slice 2 — Server-side permission enforcement
- [x] Role checks enforced server-side
- [x] Restricted actions hidden from unauthorized roles
- [~] Restricted data not leaked in summaries, side panels, or alternate routes

#### Slice 3 — Relationship and restricted-scope enforcement
- [~] Leadership-team access restricted appropriately
- [x] Super Admin-only actions are enforced
- [~] Manager-only report-scope checks are enforced

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
- the active runtime path and source-of-truth role docs now reflect Employee, Manager, HR Admin, and Super Admin
- reporting-line assignment in the admin flow now treats Super Admin as a valid reporting-structure participant instead of a deprecated role edge case
- left navigation is now grouped by function (`Performance`, `Talent`, `Admin`, `Support`) with collapsible section headers in the expanded shell and a compact section-icon rail + flyout pattern in the collapsed shell, while `Home` stays isolated as a direct anchor, the section icons reflect their actual work areas, and the flyouts now open directly to the actionable destinations instead of showing redundant section header rows
- HR admins who also manage direct reports now retain manager-scoped team visibility in nav and dashboard entry points instead of dropping that reporting-line context
- review submission access now stays with the assigned reviewer instead of broad HR-admin bypass access
- review packet access in the main sandbox path now depends on subject/direct-manager relationships, and HR operational reporting no longer surfaces packet drill-ins
- restricted calibration sessions now have an explicit server-side `isRestricted` flag, are Super Admin-only to create/access, and are hidden from HR-admin session lists in the active sandbox path
- deeper succession/risk and leadership-team permission cleanup remains deferred beyond the main sandbox path

---

## 7. Organization and Reporting Structure

### Current status
- Milestone: 1 — Sandbox Identity and Data Foundation
- State: In progress

### Active slices

#### Slice 1 — Sandbox org bootstrap
- [x] Organization record structure supports sandbox tenant
- [x] Employees, managers, HR admins, and super admin can be created and assigned
- [x] Sandbox org bootstrap path is repeatable

#### Slice 2 — User, membership, and role mapping
- [x] Authenticated users map to Trellis app users
- [x] App users map to organization memberships
- [x] Organization memberships map to roles

#### Slice 3 — Reporting relationships
- [x] Reporting lines are stored correctly
- [~] Manager/direct-report relationships drive access correctly
- [~] Leadership cohort or restricted cohort can be identified if needed

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

- [x] Goal types limited to:
  - Performance
  - Development
- [x] Maximum of 5 total goals enforced per employee per cycle
- [x] Goal state model supports:
  - Draft
  - Submitted
  - Changes Requested
  - Approved
  - Overridden
- [x] Employee can create draft goals
- [x] Employee can submit goals
- [x] Manager can approve goals
- [x] Manager can request changes
- [x] Employee can revise and resubmit
- [x] Approved goals are locked
- [x] Super Admin can override locked goals in exceptional cases
- [x] Goal progress updates allowed only in configured windows
- [x] Goal comments allowed only in configured windows
- [~] Goal revision history is visible where needed

Definition of done:
- employee-to-manager goal workflow works cleanly end-to-end and respects lock rules

Notes:
- the active goals path now uses explicit workflow states (`DRAFT`, `SUBMITTED`, `CHANGES_REQUESTED`, `APPROVED`, `OVERRIDDEN`) separate from progress status
- goal creation is now employee-owned in the active workflow, manager review is direct-report-only, and approved goals require Super Admin override before definition edits can resume
- elevated roles now retain self-owned goal participation, so managers, HR admins, and super admins can create, submit, and update their own goals while keeping their additive oversight permissions
- progress updates are restricted to approved goals during an active goal-cycle window; broader revision-history presentation can still be refined in later workflow passes
- the regular `/goals` workspace now leans into a participant-first flow for every role, with a lighter self-service composer, collapsible advanced details, draft/published goal groupings, optional filters/snapshot moved into the right-side support rail, and a focused one-goal-at-a-time create flow that separates `Save draft` from `Publish goal`
- a live browser pass on `localhost` validated the full Ted/Elliot loop for create, edit, submit, request changes, resubmit, approve, post-approval lock behavior, and approved-goal progress updates

---

## 9. Reviews

- [x] Review types limited to:
  - Self Review
  - Manager Review
- [x] Peer review hidden or removed from vanilla surfaces
- [x] Upward review hidden or removed from vanilla surfaces
- [~] HR-defined templates supported
- [x] Employee can complete self review
- [x] Manager can complete review for direct reports
- [x] Goal context appears in review experience where needed
- [x] Review packet aggregates required content
- [x] Review release logic works correctly
- [x] Employee sees released packet only when allowed

Definition of done:
- self and manager review flows are usable, scoped correctly, and release correctly

Notes:
- the active server path now treats self review and manager review as the only vanilla review types, even if legacy peer/upward records still exist in older data
- manager review write access is now limited to current direct-report relationships and unlocks only after the employee self review is submitted
- HR admin and Super Admin participant surfaces now keep the review queue visible so elevated roles can still complete their own assigned review work
- My Team now keeps direct reports visible even before HR generates review submissions, including Super Admin reporting lines in the sandbox roster
- participant task queues hide draft-cycle work and non-vanilla review relationships in the active sandbox workflow
- review packets now aggregate only self + manager submissions in the active path, while employee packet access still follows release policy and manager packet access stays relationship-scoped
- sandbox scenario data now includes a live self-review draft, a manager-review draft unlocked by a submitted self review, and a released packet for the active employee/manager sandbox pair
- browser validation confirmed end-to-end self-review submission, manager-review submission, and released-packet access in the sandbox path

---

## 10. Review Content Model

- [~] Employee review prompts finalized
- [~] Manager review prompts finalized
- [~] Talent review reference reflected in content model where appropriate
- [~] Review prompts support:
  - accomplishments
  - goal progress
  - strengths
  - development opportunities
  - leadership behaviors
  - growth potential
  - career direction where applicable
- [x] Review UI handles long-form responses cleanly

Definition of done:
- review prompts support realistic HR testing and feel intentional

Notes:
- the active write-review and packet views now apply relationship-aware prompt copy for self vs manager reviews without widening the schema mid-sandbox
- the active write-review surface now uses a simpler left-rail + question writer layout, removes the right-side evidence workspace, and keeps the cycle-template questions as the primary job to be done
- manager-review writing now includes a direct-report switcher in the left rail so managers can move between assigned reviews in the same cycle without returning to the queue first
- a lightweight writing toolbar now supports cleaner long-form responses while still preserving the existing plain-text review answer model and autosave behavior
- scale questions in the active review writer now use an inline 1-5 rating strip instead of a dropdown so scoring feels faster and more legible for managers and employees
- fuller role-specific template modeling can still be refined later if HR needs distinct stored self-review vs manager-review question sets

---

## 11. 9-Box Calibration

- [x] Calibration session model works for target review cycle
- [x] Placement on 9-box grid works
- [x] Placement rationale can be captured
- [x] Relevant employee context is visible in calibration workflow
- [x] Finalize action restricted to Super Admin
- [x] Finalized calibration becomes immutable
- [x] Leadership-team views restricted to Super Admin
- [x] Managers can participate only within allowed scope

Definition of done:
- Super Admin can run a complete calibration workflow with correct restrictions

Notes:
- calibration sessions in the active path can now only be created after the review cycle is locked or released, keeping calibration positioned as a post-review workflow
- restricted calibration sessions now provide an explicit leadership-sensitive path that is visible only to Super Admins in the main sandbox flow
- managers must be explicit calibration participants and can only view or move direct reports that are actually in the session cohort
- finalized sessions now carry downstream succession and risk summaries derived from the immutable calibration snapshot
- browser validation confirmed Super Admin session creation from a locked review cycle, placement movement with rationale, and finalization in the live sandbox path

---

## 12. Succession and Risk Outputs

- [x] Succession outputs captured from calibration
- [x] Risk outputs captured from calibration
- [x] Succession data includes:
  - emergency backup
  - ready now
  - ready future
  - readiness notes
- [x] Risk data includes:
  - risk level
  - concern summary
  - suggested action
- [x] Access to succession/risk outputs is restricted appropriately
- [x] Standalone succession module is hidden if outside vanilla scope

Definition of done:
- calibration produces usable and permissioned talent outputs

Notes:
- the active sandbox path now derives succession and risk outputs directly from the finalized calibration snapshot instead of relying on a standalone succession workflow
- downstream outputs are visible only to Super Admin in the active calibration workspace and export placeholder path
- broader dormant-route or future-state succession platform hardening remains deferred beyond this milestone
- browser validation confirmed downstream succession and risk summaries appear immediately after calibration finalization in the active sandbox workspace

---

## 13. PIP

- [x] PIP can be created after review or calibration decision
- [x] PIP status model supports:
  - Draft
  - Active
  - Completed
  - Extended
  - Cancelled
- [x] Manager can provide checkpoint feedback
- [x] HR can oversee the process
- [x] 30-day checkpoint supported
- [x] 60-day checkpoint supported
- [x] 90-day checkpoint supported
- [x] Timeline/history is readable
- [x] Employee-facing visibility is appropriate
- [x] PIP actions are audited

Definition of done:
- PIP workflow is usable, trackable, and appropriately restricted

Notes:
- new PIPs in the active path must now be linked to a locked/released review cycle and/or a finalized calibration session so the workflow stays explicitly post-review or post-calibration
- manager-created plans now require an explicit HR owner, keeping HR oversight visible in the workflow instead of optional by convention
- the active detail view now distinguishes general updates from 30/60/90-day checkpoints and shows the standard checkpoint schedule separately from the timeline feed
- checkpoint recording is now structured server-side: only the plan manager or HR can record milestone checkpoints, and 60-day / 90-day checkpoints must follow the earlier checkpoint sequence
- browser validation confirmed the active list/empty-state path no longer crashes on the revised schema and now uses improvement-plan-specific help copy in the sandbox surface
- sandbox scenario data now includes a live post-review improvement plan with kickoff and 30-day history, and browser validation confirmed opening the detail view plus recording a real 60-day checkpoint in the active path

---

## 14. Frontend / UX Alignment

- [x] Navigation reflects vanilla scope only
- [x] Incomplete modules are hidden
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

Notes:
- a modular org-brand theming layer now lives under `apps/web/src/branding`, with Morgan configured as the current default org theme for both the demo and sandbox org ids
- the root shell, navigation states, buttons, cards, badges, tabs, and core form primitives now consume semantic theme variables instead of the older hardcoded teal/amber palette
- the active Morgan pass keeps red intentional and restrained while letting black and neutral surfaces carry the main enterprise structure
- the visible shell pass now also covers empty states, filter bars, tables, drawers, modals, contextual help hints, skeleton/loading surfaces, and the main home dashboard hero/cards so the product reads as one cohesive Morgan-branded workspace instead of a mix of old accent systems
- the current content-cleanup pass removes low-value helper copy and repeated metadata from the visible Home, Reviews, Goals, Goal Cycles, and Calibration admin surfaces so lighter secondary text is used more intentionally instead of carrying redundant instructions
- the shared `Card` primitive now clips its own header/content layers, preventing the cut-corner artifact that appeared on framed surfaces like improvement-plan detail cards and any other pages using tinted `CardHeader` sections
- the home org-snapshot people card now prefers shared-manager peers as teammates whenever the viewer has a manager above them, and only falls back to direct reports for top-of-tree leaders without an upstream manager
- the home org-snapshot card no longer falls back to review-task subjects as fake teammates, and the employee landing hero now drops the redundant `Employee` badge while keeping elevated-role badges where they add context
- the home org-snapshot now uses one compact `Team` card with subtle peer/direct-report summary blocks and a light divider, then separates the two groups only inside the disclosure details, including one additional child-report level for direct reports who also manage people

---

## 15. Browser Validation and QA

- [x] Login validated by role
- [x] Employee landing experience validated
- [x] Manager landing experience validated
- [x] HR Admin landing experience validated
- [x] Super Admin landing experience validated
- [x] Goals workflow validated in browser
- [x] Reviews workflow validated in browser
- [x] Calibration workflow validated in browser
- [x] PIP workflow validated in browser
- [~] Permission boundaries validated in browser
- [x] Dead-end routes or broken screens identified
- [x] Trust-breaking UX issues identified and fixed

Notes:
- the current live role walkthrough was completed on `localhost` using the sandbox-backed Supabase auth and sandbox Postgres path
- deeper manager/report workflow validation still depends on active cycle submissions, not just roster/reporting setup
- the current vanilla containment pass removed visible Tracks, standalone Succession, and peer/upward review entry points from the main sandbox surface
- obvious help-center and dashboard shortcuts now point only at vanilla-scope workflows for the active role
- reporting is now constrained to operational cycle views instead of exposing the broader analytics-style tab set in the shared sandbox
- unfinished review-packet and improvement-plan placeholder affordances are hidden from the visible sandbox surface
- reduced-surface browser verification is complete for Employee, Manager, HR Admin, and Super Admin on `localhost`
- sandbox help now stays role-specific in browser instead of showing internal presentation-mode fallback copy
- visible first-impression copy issues found during the role walkthrough, such as the manager landing highlight grammar bug, were corrected
- a fresh browser pass on the updated Milestone 4 workflows confirmed the review queue, calibration admin path, and improvement-plan list render cleanly after the latest schema changes
- the manager review dashboard now reflects real direct-report count even before HR generates cycle submissions, preventing a trust-breaking `Team size 0` mismatch against the sandbox org
- browser validation on `localhost` confirmed the Morgan theme applies on the live sandbox sign-in and authenticated Goals workspace, including shell navigation, CTA styling, cards, and form controls
- a follow-up browser pass on `localhost` confirmed the refined Morgan shell and home dashboard now use restrained black/neutral structure with red only as targeted emphasis, keeping the visible product premium and enterprise-focused instead of decorative
- restricted calibration is now opt-in instead of defaulting on for Super Admin session creation, and HR still sees the restricted toggle disabled with explanatory copy
- stable date formatting now prevents hydration mismatches on the live review-packet and improvement-plan detail pages during browser walkthroughs
- sandbox scenario data now supports live self review, manager review, released packet, calibration create/place/finalize, and PIP checkpoint validation on `localhost`
- stable date formatting now also prevents hydration mismatches on the live goals workspace during employee and manager browser validation
- the live goals browser pass covered employee creation/edit/submit, manager request-changes/approve, employee resubmission, approved-goal lock behavior, and approved-goal progress updates
- a pilot-readiness browser pass across Employee, Manager, HR Admin, and Super Admin confirmed the role landings and core workflow entry points still feel coherent after Milestone 4 tightening
- a second-pass browser audit confirmed the regrouped sidebar reads cleanly for Super Admin and Manager, and the cumulative-role cleanup kept HR admin review/goals entry points intact while preserving manager-team access where reporting lines exist
- review task surfaces now switch between start/continue/view language based on submission state, HR review-cycle tables now avoid raw sandbox IDs and enum-style transition labels, and the deferred calibration export placeholder is no longer visible in the live sandbox path
- the Help entry is now hidden from the primary navigation pending clearer product requirements, so the shell focuses on actionable workflows instead of a low-value placeholder destination

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

- [x] HR users can log in
- [x] one realistic org is configured
- [x] one review cycle exists
- [x] goals flow works end-to-end
- [x] review flow works end-to-end
- [x] calibration flow works end-to-end
- [x] succession/risk outputs can be captured
- [x] PIP can be created and updated
- [x] non-vanilla or unfinished features are hidden
- [~] major UX issues are addressed
- [~] major permission issues are resolved

Notes:
- no pilot-blocking issues remain in the active localhost sandbox path for the vanilla workflows validated so far
- remaining work before handoff is mostly non-blocking polish and deferred hardening, not broken critical-path workflow behavior

Definition of done:
- HR can perform realistic mock runs without relying on manual workaround processes
