# Trellis — Execution Plan
**Status:** Active  
**Scope:** Vanilla Build + HR Sandbox  
**Owner:** Sammy  
**Last Updated:** 2026-03-24

---

## 1. Purpose

This document is the active execution plan for Trellis.

It replaces the earlier prototype-era planning doc as the source of truth for what is being built next. The goal is to deliver a focused vanilla build of Trellis and deploy a sandbox version for HR to run realistic mock performance cycles.

This plan is intentionally narrow and execution-oriented.

---

## 2. Current Milestone

## Milestone: Vanilla Build + HR Sandbox

### Objective
Deploy a sandbox version of Trellis within the next 2 days so the HR team can perform mock runs of the performance process using realistic workflows.

### Outcome
HR should be able to:
- log into Trellis with sandbox-safe accounts
- access a realistic org structure
- create and manage review cycles
- set and approve goals
- complete self and manager reviews
- run 9-box calibration
- identify succession and risk outputs
- create and track PIPs

---

## 3. Product Scope Locked for Vanilla Build

The vanilla build includes only the core workflows needed for a structured annual performance process.

### In Scope
1. Goals + Measures
2. Reviews
3. 9-Box Calibration
4. Succession Planning Outputs
5. Risk Assessment Outputs
6. Performance Improvement Plans (PIP)
7. Role-based permissions
8. Auditability for sensitive actions
9. Sandbox deployment for HR pilot

### Out of Scope
- Peer reviews
- Upward reviews
- Continuous feedback feed
- Full standalone succession planning module
- Compensation planning
- AI-generated ratings or recommendations
- Advanced analytics explorer
- Entra ID for the immediate sandbox milestone

---

## 4. Product Definition

Trellis is a performance management system designed to create a clear, fair structure for growth.

The vanilla build focuses on four connected workflows:
- Goals define direction
- Reviews assess progress
- Calibration aligns standards
- PIPs provide support when performance is off track

This version is not a broad HR platform. It is a focused performance system for running a structured annual cycle.

---

## 5. Roles

### Employee
- create and submit goals
- respond to manager-requested changes
- update goal progress during check-in windows
- complete self review
- view released review packet where allowed
- participate in PIP check-ins

### Manager
- review and approve goals
- request changes to goals
- complete manager reviews for direct reports
- participate in calibration where allowed
- provide PIP feedback and checkpoint updates

### HR Admin
- create and manage review cycles
- configure review templates and timelines
- oversee operational workflow
- monitor completion and compliance
- oversee PIP process

### Super Admin
- full access to sensitive workflows
- lead and finalize 9-box calibration
- access leadership-team review cycles
- override locked goals in special cases
- capture succession and risk outputs
- manage restricted org-level talent decisions

---

## 6. Vanilla Build Requirements

## 6.1 Goals + Measures

### Rules
- each employee may have a maximum of 5 goals
- goals can be either:
  - Performance Goal
  - Development Goal
- goals are created by the employee
- goals are not final until approved by the manager
- manager may request revisions
- employee must revise and resubmit if changes are requested
- approved goals are locked
- goals may only be fully changed after approval by Super Admin in exceptional scope-change cases
- progress updates and comments are only allowed during configured review/check-in windows

### Build Intent
This is not a free-form OKR system. It is a governed annual goal workflow tied to the review cycle.

---

## 6.2 Reviews

### Review Types
- Self Review
- Manager Review

### Rules
- employees review themselves first
- managers review direct reports after self review is available
- HR controls templates and questions
- review packet becomes visible to employee only after release according to cycle rules

### Review Content
The review content should capture:
- accomplishments and business results
- progress against goals
- strengths
- development opportunities
- leadership behaviors
- future growth potential
- career interests where appropriate

The uploaded talent review reference should be used as inspiration for content fields and prompts, but not copied rigidly as product structure.

---

## 6.3 9-Box Calibration

### Rules
- calibration occurs after reviews
- calibration is led by Super Admin
- managers participate in relevant calibration sessions
- only Super Admin can view restricted leadership-team review cycles
- finalized calibration results become read-only
- calibration generates downstream outputs for succession and risk

### Model
- X-axis: Performance
- Y-axis: Potential / Leadership Potential

### Intent
This is a restricted, high-trust workflow. It must be tightly permissioned and auditable.

---

## 6.4 Succession Planning Outputs

Succession planning is part of the vanilla build only as an output of calibration.

### Required Outputs
- emergency backup
- ready now
- ready future
- readiness notes
- development actions before readiness

### Intent
This is not a broad workforce planning module in vanilla. It is a structured talent outcome captured after calibration.

---

## 6.5 Risk Assessment Outputs

Calibration should also capture risk insights.

### Required Outputs
- organizational risk level
- individual retention risk level
- concern summary
- suggested action

### Intent
These outputs help leadership identify talent concerns and intervene appropriately.

---

## 6.6 PIP

### Rules
- PIP begins after review and/or calibration identifies the need
- manager owns performance feedback
- HR oversees the process
- employee participates in the process
- standard checkpoints happen at:
  - 30 days
  - 60 days
  - 90 days

### Required Data
- employee
- manager
- HR owner
- expectations
- start date
- checkpoint dates
- checkpoint notes
- status
- final outcome

### Statuses
- Draft
- Active
- Completed
- Extended
- Cancelled

---

## 7. Deployment Strategy

## Immediate Sandbox Strategy
To hit the HR testing deadline, Trellis will first be deployed as a sandbox environment on Azure.

### Sandbox decisions
- sandbox authentication will use Supabase Auth
- sandbox will behave like a real system, not a fake demo mode
- users will have real accounts
- org structure, roles, review cycles, and workflows should behave as close to production as possible
- dev-only demo login, role-switching, or reset flows must not be used in the shared sandbox

## Production Direction Later
After sandbox validation:
- auth moves to Microsoft Entra ID
- database moves to Azure Database for PostgreSQL
- production infrastructure remains Azure-based

---

## 8. Workstreams

## Workstream 1 — Product Scope Alignment
Goal: align the prototype to the vanilla build.

### Tasks
- lock vanilla scope
- remove ambiguity around roles
- remove peer/upward reviews from visible scope
- collapse succession into calibration outputs
- reframe goals into governed annual workflow
- tighten PIP flow

---

## Workstream 2 — Auth and Access
Goal: make sandbox login safe and usable.

### Tasks
- replace dev-only demo auth path for sandbox
- implement sandbox-safe login flow
- create sandbox users
- assign application roles correctly
- verify access boundaries by role

---

## Workstream 3 — Data Model and Permissions
Goal: ensure the product model supports vanilla requirements.

### Tasks
- confirm role model
- add or revise goal approval states
- enforce goal locking rules
- confirm review packet structure
- confirm calibration output structure
- confirm PIP checkpoint model
- verify audit logging for sensitive actions

---

## Workstream 4 — Reviews and Templates
Goal: make review workflows usable for HR pilot.

### Tasks
- finalize self review questions
- finalize manager review questions
- connect review content to goal progress
- ensure packet release rules are implemented
- validate review completion flow

---

## Workstream 5 — Calibration and Talent Outputs
Goal: make the 9-box workflow operational.

### Tasks
- finalize 9-box placement model
- define placement prompts
- implement rationale capture
- capture succession outputs
- capture risk outputs
- restrict leadership visibility

---

## Workstream 6 — PIP
Goal: support the improvement process after calibration.

### Tasks
- implement create/edit/manage PIP
- support 30/60/90 checkpoints
- support manager and HR ownership
- ensure employee-facing visibility is appropriate
- verify audit trail

---

## Workstream 7 — Sandbox Launch
Goal: deploy a usable HR pilot environment.

### Tasks
- stand up sandbox environment
- configure secrets and env vars
- provision database
- create org and users
- load reporting lines
- create one review cycle
- validate end-to-end flow
- hand off testing instructions to HR

---

## Workstream 8 — UX + QA Hardening
Goal: validate the current dev build and improve the HR-facing experience before sandbox handoff.

### Tasks
- review the dev branch/build end-to-end
- use Playwright-based flows to inspect critical workflows
- identify broken, incomplete, or inconsistent states
- improve workflow clarity, layout, and usability
- polish the UI for HR pilot readiness

## 8A. Execution Model

Trellis should be executed through milestone-based delivery, not through one large autonomous implementation pass.

### How execution works
- `PLAN.md` defines the active milestone sequence
- `docs/engineering/IMPLEMENTATION_CHECKLIST.md` defines the detailed task backlog within those milestones
- work should be completed one implementation slice at a time
- each slice should be small enough to implement, review, and validate cleanly
- after each slice, the result should be verified before moving to the next one

### Why this approach is used
This keeps the project:
- fast-moving
- reviewable
- lower risk
- easier to steer
- less wasteful than broad autonomous execution

### Slice rules
Each implementation slice should be:
- coherent
- high-leverage
- testable
- aligned with the current docs
- narrow enough to avoid unnecessary file churn

Examples of good slices:
- sandbox auth integration
- sandbox DB cutover
- sandbox bootstrap users and org mapping
- hide non-vanilla navigation
- align calibration role model
- tighten reviews to self + manager only

### Relationship to the implementation checklist
The implementation checklist is the detailed working backlog.
The milestone plan defines the order in which that backlog should be executed.

## 8B. Active Milestone Sequence

The current Trellis execution sequence is milestone-based.

Only one milestone should be treated as the active implementation focus at a time.

### Milestone 1 — Sandbox Identity and Data Foundation
Goal: make the sandbox real, shared, and role-testable.

Includes:
- sandbox auth integration
- Supabase Postgres cutover
- sandbox bootstrap data
- user to app-user mapping
- org memberships
- roles
- reporting lines
- basic role-based access verification

### Milestone 2 — Vanilla Scope Containment
Goal: make the app feel intentional and safe for HR sandbox use.

Includes:
- hide non-vanilla navigation and modules
- remove peer and upward review surfaces
- hide standalone succession, tracks, and reporting surfaces where out of scope
- remove visible demo-only entry points

### Milestone 3 — Role and Permission Alignment
Goal: align the implementation with the current Trellis role model and restricted access rules.

Includes:
- align roles to Employee, Manager, HR Admin, and Super Admin
- replace lingering Calibrator semantics where necessary
- tighten calibration restrictions
- tighten leadership-team access rules
- verify server-side enforcement of sensitive permissions

### Milestone 4 — Workflow Tightening
Goal: make the implemented workflows match the Vanilla Build definition.

Includes:
- goals workflow tightening
- review scope tightening
- calibration output tightening
- succession and risk output alignment
- PIP alignment to the 30/60/90-day model

### Milestone 5 — QA and UX Hardening
Goal: make the product trustworthy and usable for the HR pilot.

Includes:
- Playwright-based validation
- role-based browser walkthroughs
- fixing trust-breaking workflow issues
- critical-path UX polish
- final sandbox handoff readiness review

## 8C. Current Active Milestone

### Active milestone
Milestone 1 — Sandbox Identity and Data Foundation

### Current implementation slice
Sandbox bootstrap data and role mapping

### Definition of success for the current slice
- authenticated users map to Trellis app users
- app users map to organization memberships
- organization memberships map to roles
- at least one manager/direct-report relationship exists
- the sandbox supports realistic role-based testing without demo-only identity shortcuts

### Next slice after this
Basic role-based access verification

## 9. Immediate 2-Day Launch Plan

## Day 1
### Platform
- create sandbox deployment environment on Azure
- configure sandbox database
- set all required environment variables
- confirm successful deployment

### Auth
- implement Supabase Auth for the sandbox
- disable dev-only demo access in deployed sandbox
- create HR test users and role assignments
- verify login flow for each role

### Data Setup
- create sandbox org
- create managers, employees, HR admin, and super admin
- load reporting lines
- verify permissions

### Scope Control
- hide unfinished or out-of-scope modules
- expose only vanilla build workflows
- ensure navigation is clean and trustworthy

## Day 2
### Workflow Setup
- create one active annual review cycle
- configure goal-setting window
- configure check-in / review windows
- configure self and manager review templates

### End-to-End QA
- review the dev build against vanilla scope
- use Playwright-based flows to validate critical workflows
- employee creates goals
- manager requests changes
- employee resubmits
- manager approves
- employee submits self review
- manager submits review
- super admin runs calibration
- super admin records succession and risk outputs
- HR and manager create a PIP

### HR Handoff
- provide login instructions
- provide testing guide
- provide known limitations
- provide issue collection path

## 10. What Will Be Hidden or Deferred

The following should be hidden from sandbox users or deferred from active implementation unless already required for core flows:

- peer review
- upward review
- broad succession module beyond calibration outputs
- continuous feedback feed
- non-essential analytics surfaces
- advanced settings not needed for HR pilot
- premium or future-state modules not required for vanilla

---

## 11. Risks

### Risk 1 — Current prototype includes broader scope than vanilla
This may create confusion in UI, docs, and implementation priorities.

### Mitigation
- hide non-vanilla features
- update docs to reflect current truth
- treat vanilla PRD as source of truth

### Risk 2 — Dev-only demo auth is not suitable for shared sandbox
This could create unsafe or confusing pilot access.

### Mitigation
- implement sandbox-safe auth path
- use real user accounts
- disable dev-only shortcuts in sandbox

### Risk 3 — Roles and permission boundaries may be inconsistent
Because Trellis includes sensitive data, any permission leak is serious.

### Mitigation
- review all server-side authorization
- test each role explicitly
- verify restricted leadership and calibration access

### Risk 4 — 2-day timeline is short
There may not be time to perfect every workflow.

### Mitigation
- prioritize usability over completeness
- lock scope hard
- ship only workflows HR needs for mock runs

---

## 12. Decisions Locked

The following decisions are now locked for the vanilla build unless explicitly changed:

- Roles are Employee, Manager, HR Admin, and Super Admin
- Goals are annual and governed
- Maximum 5 goals per employee per cycle
- Goal types are Performance and Development
- Reviews are Self + Manager only
- Calibration is 9-box and Super-Admin-led
- Only Super Admin can access restricted leadership-team calibration and review visibility
- Succession planning is a calibration output
- Risk assessment is a calibration output
- PIP uses a 30/60/90-day structure
- Sandbox is deployed first on Azure
- Sandbox authentication uses Supabase Auth
- Sandbox must behave like a real system, not a fake demo mode
- Entra ID comes later for production
- Production database target is Azure PostgreSQL
- The dev build must be validated end-to-end before HR sandbox handoff



## 13. Definition of Done for This Milestone

This milestone is complete when:

- Trellis sandbox is deployed
- HR can log in with sandbox-safe accounts
- role-based permissions work correctly
- one review cycle can be run end-to-end
- employees can set goals and managers can approve them
- self and manager reviews can be completed
- super admin can run 9-box calibration
- succession and risk outputs can be captured
- PIP can be created and tracked
- HR can conduct realistic mock runs without relying on spreadsheets or manual workaround docs

---

## 14. Next Step After This Milestone

After the sandbox pilot is validated, the next milestone will be:

## Milestone: Production Hardening
- move auth to Entra ID
- move DB to Azure PostgreSQL
- harden infra and secrets management
- tighten audit and permissions
- prepare production rollout path