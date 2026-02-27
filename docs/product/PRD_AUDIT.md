# PRD Completion Audit (v2) — MVP Scope (Milestones 0–3)

_Last audited: 2026-02-27_

## Summary
- Core MVP paths are implemented across Milestones 0–3: foundation, reviews, packet/calibration core flow, and improvement plans.
- Several requirements are intentionally partial and now grouped as follow-on work (UX completeness, calibration notes/export, optional write-back, plan list UX).
- No critical PLAN drift remains from prior audits; the main remaining work is explicit and mostly unchecked in follow-on milestones.

## 1) Traceability Matrix (PRD -> Status -> Evidence)

| PRD Ref | Requirement | Status | Evidence (files/routes/endpoints) | Notes |
|---|---|---|---|---|
| §8 Roles/Permissions | Server-side role/relationship enforcement | Complete | `apps/web/src/server/reviews/*`, `apps/web/src/server/calibration/*`, `apps/web/src/server/improvement-plans/*` | Core read/write service methods enforce authz in server layer. |
| §8 Evidence visibility | Visibility-filtered evidence reads/counts | Complete | `apps/web/src/server/evidence/evidence-service.ts`, `GET /api/evidence` | Includes no-leak filtering and tests. |
| A1 | Create review cycle | Complete | `POST /api/admin/performance/review-cycles`, `createReviewCycle` in `admin-cycle-service.ts`, UI `/admin/performance/review-cycles/new` | Draft cycle creation implemented with validation. |
| A1 | Generate packets/submissions | Complete | `POST /api/admin/performance/review-cycles/:cycleId/generate`, `generateCycleArtifacts` | Creates packet/submission artifacts per cycle configuration. |
| A1 | Cycle status transitions Draft->Active->Locked->Released | Complete | `PATCH /api/admin/performance/review-cycles/:cycleId/status`, `transitionReviewCycleStatus` | Transition rules + tests implemented. |
| A2 | Participant review task list | Complete | UI `/performance/reviews`, `GET /api/performance/reviews/tasks`, `listAssignedReviewTasks` | Shows cycle, subject, relationship, status. |
| B1 | Write screen 3-panel pattern | Partial | UI `/performance/reviews/:cycleId/write/:submissionId`, `write-review-form.tsx` | Core paneling exists; broader phase-nav/context enhancements pending. |
| B1 | Required indicators + progress summary | Complete | `write-review-form.tsx` (`Required progress: x/y`) | Progress summary implemented. |
| B1 | Rich text answers | Partial | `write-review-form.tsx` (textarea-based) | Rich text editor not implemented (deferred). |
| B2 | Autosave with debounce and visible save states | Complete | `autosaveReviewAnswer`, `PATCH /api/performance/reviews/:cycleId/submissions/:submissionId/answers`, `write-review-form.tsx` | "Saving.../Saved" behavior implemented. |
| B2 | Submit validation with first-invalid focus/scroll | Complete | `submitReviewSubmission`, `POST /api/performance/reviews/:cycleId/submissions/:submissionId/submit`, `write-review-form.tsx` (`scrollIntoView`) | Missing required answers block submit and focus first missing field. |
| B2 | Lock after submit | Complete | `participant-review-service.ts` status checks + read-only UI state | Post-submit edits blocked server-side and UI-side. |
| B3 | Evidence drill-in + attach/detach | Complete | `GET /api/evidence`, `POST/DELETE /api/review-answers/:answerId/evidence-links...`, `evidence-service.ts`, `write-review-form.tsx` | Attach/detach flow and chips implemented. |
| C1 | Packet fetch with permission gating | Complete | `GET /api/performance/reviews/:cycleId/packet/:employeeId`, `getReviewPacket` | Subject visibility policy + manager/HR access enforced. |
| C1 | Packet summary/evidence/previous-cycle comparison experience | Partial | `review-packet-view.tsx` | Summary + previous-cycle are placeholders; no deeper rating/comparison engine yet. |
| D1 | Calibration session creation | Complete | UI `/admin/performance/calibration/new`, list `/admin/performance/calibration`, `POST/GET /api/performance/calibration`, `createCalibrationSession` | Includes cycle/cohort/axes/participants and create audit event. |
| D2 | Calibration workspace + placement moves | Complete | UI `/performance/calibration/:sessionId`, `GET /api/performance/calibration/:sessionId`, `PATCH /api/performance/calibration/:sessionId/placements/:employeeId`, `moveCalibrationPlacement` | Accessible non-drag move controls implemented. |
| D2 | Right drawer notes/justifications | Partial | `calibration-session-view.tsx` | Packet summary/link + tabs exist; notes/justifications not yet implemented. |
| D3 | Finalize snapshot and lock | Complete | `POST /api/performance/calibration/:sessionId/finalize`, `finalizeCalibrationSession`, `CalibrationSnapshot` | Finalize stores snapshot and locks session. |
| D3 | Snapshot export placeholder | Partial | No calibration export route found | Planned follow-on. |
| D3 | Optional write-back final bucket/rating | Out of scope | No stable write-back model/endpoint implemented | Explicitly optional in PRD and PLAN follow-on. |
| E1 | Improvement plan create with goals/dates/status model | Complete | `POST /api/performance/improvement-plans`, schema models, `createImprovementPlan` | Manager/HR creation path implemented. |
| E2 | Improvement plan detail timeline + check-ins | Complete | UI `/performance/improvement-plans/:planId`, `POST /api/performance/improvement-plans/:planId/checkins` | Timeline, check-ins, loading/empty/error states implemented. |
| E2 | Audit view + export placeholder action | Complete | `GET /api/performance/improvement-plans/:planId/audit`, `GET /api/performance/improvement-plans/:planId/export`, detail UI tab/button | Export returns placeholder behavior (501). |
| E3 | Audit events for plan create/status/goal-date edits/check-ins | Partial | `improvement-plan-service.ts`, `PATCH /api/performance/improvement-plans/:planId` | Goal/date edit auditing now implemented; check-in edit flow not implemented. |
| §10 Audit logging | Sensitive mutation logging across modules | Partial | Review/cycle/evidence/calibration/improvement-plan services | Major flows audited; submission return and check-in edit flows are not present. |
| §10 Notifications | Dashboard task surfacing | Partial | Home page `apps/web/src/app/page.tsx`, tasks at `/performance/reviews` | Home does not yet show personalized task feed/due-soon indicators. |
| §10 Accessibility | Keyboard and non-drag alternatives | Partial | Form keyboard support + calibration move dropdowns | Core alternative controls exist; broader ARIA/UX polish remains. |
| §10 Performance | Avoid N+1, indexed queries | Partial | Prisma schema indexes + service query patterns | Reasonable baseline; no explicit perf budget instrumentation in repo. |

## 2) Remaining Gaps (Ranked by Impact)

1. Write-review UX completeness (phase nav breadth, contextual right-panel profile info, editor richness decision).
2. Packet deeper synthesis (beyond placeholders): stronger summary/rating/comparison behavior.
3. Calibration decision context completeness: notes/justifications capture in right drawer.
4. Calibration artifact portability: snapshot export/download placeholder endpoint + UI action.
5. Improvement-plan completeness: check-in edit flow (and audit events for edits) if required by compliance workflow.
6. Dashboard productivity loop: personalized assigned tasks/due-soon surfacing on home.
7. Optional finalized calibration write-back into packet stable fields (if product confirms in MVP+).

## 3) PLAN.md Consistency Audit

### Checked items lacking implementation
- No high-confidence false positives found in checked milestone items reviewed for Milestones 0–3.

### Implemented work not checked off
- No major implemented-but-unchecked items found in active milestone sections.

### Minor consistency notes
- `Milestone 3` acceptance says users can "view plans" while `/performance/improvement-plans` list UI is still a follow-on (`Milestone 3.1`). Current implementation supports detail-page viewing via known plan IDs/links, but discoverable list UX is still pending.
- Remaining unchecked items are now correctly grouped under follow-on milestones (`1.6`, `2 follow-on`, `3.1`), which aligns with `AGENTS.md` plan-tracking guidance.

## 4) Recommended Next Milestone

## Milestone 4 — UX Completion + Operational Hardening

Scoped tasks (8):
1. Add write-review expanded phase nav entries (Tasks, Self, Upward, Packet where allowed).
2. Add write-review right-panel subject/reviewer context block (role/track/title summary).
3. Decide editor scope and implement either improved textarea tooling or lightweight rich-text editor (no heavy engine unless required).
4. Add calibration right-drawer notes/justifications persistence with audit-safe metadata handling.
5. Add calibration snapshot export placeholder endpoint and UI trigger (permission-gated).
6. Add `/performance/improvement-plans` list page with loading/empty/error and permission gating.
7. Add improvement-plan check-in edit endpoint (if product confirms) with audit event coverage.
8. Add dashboard "My tasks" module with due-soon badges sourced from review task data.

Suggested acceptance checks for Milestone 4:
- All new endpoints include Zod validation + server-side permissions.
- New mutations write audit events with non-sensitive metadata.
- New UI routes include loading/empty/error states.
- `lint`, `typecheck`, `test`, `build` pass in `apps/web`.
