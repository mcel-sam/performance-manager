# PRD Audit — MVP Scope (Milestones 0–3)

_Last audited: 2026-02-27_

## Summary
- **Core MVP delivery is largely complete:** Milestones 0, 1, 1.5, 2, and 3 have implemented vertical slices with passing quality gates.
- **Recent progress closed prior gaps:** calibration session creation (D1), packet essentials placeholders (C1 partial), write-review submit UX hardening (B2), and improvement-plan goal/date audit coverage (E3 partial) are now implemented.
- **What remains is follow-on scope:** the remaining unchecked work is concentrated in explicit post-MVP/follow-on items in `PLAN.md` (details below).

## Traceability Matrix

### Permissions and visibility model (PRD §8)
| PRD ref | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| §8 Roles | HR Admin can access all key modules | **Complete** | `apps/web/src/server/reviews/*`, `apps/web/src/server/calibration/calibration-session-service.ts`, `apps/web/src/server/improvement-plans/improvement-plan-service.ts` | Services consistently allow `HR_ADMIN` scope. |
| §8 Relationship access | Manager can access direct-report packet/calibration scope | **Complete** | `getReviewPacket` in `apps/web/src/server/reviews/review-packet-service.ts`; `resolveSessionPermission` in `apps/web/src/server/calibration/calibration-session-service.ts` | Manager-of-subject and managed-cohort checks are enforced server-side. |
| §8 Cycle visibility policy | Manager-only vs employee-after-release | **Complete** | `assertPacketAccess` in `apps/web/src/server/reviews/review-packet-service.ts`; `CycleVisibilityPolicy` in `apps/web/prisma/schema.prisma` | Subject packet visibility is correctly gated by cycle status + policy. |
| §8 Evidence visibility | Private/manager/shared/org visibility enforced server-side | **Complete** | `resolveEvidenceAccess`, `buildEvidenceWhere`, `canViewEvidenceItem` in `apps/web/src/server/evidence/evidence-service.ts`; `GET /api/evidence` route | Counts and item lists are filtered by visibility rules. |

### A) Review Cycles (PRD §9A)
| PRD ref | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| A1 | Create cycle (name, dates, review mix, visibility; MVP org-wide scope acceptable) | **Complete** | UI: `/admin/performance/review-cycles/new` (`apps/web/src/app/admin/performance/review-cycles/new/page.tsx`, `apps/web/src/components/admin/review-cycle-create-form.tsx`); API/service: `createReviewCycle` in `apps/web/src/server/reviews/admin-cycle-service.ts` | Participant scope is effectively org-wide via generation logic. |
| A1 | Generate packets/submissions (one packet per subject, one submission per reviewer/subject) | **Complete** | `generateCycleArtifacts` in `apps/web/src/server/reviews/admin-cycle-service.ts`; route `POST /api/admin/performance/review-cycles/:cycleId/generate` | Generates packet + submission records by relationship type. |
| A1 AC | Draft → Active → Locked → Released transitions | **Complete** | `transitionReviewCycleStatus` + `nextCycleStatusMap` in `apps/web/src/server/reviews/admin-cycle-service.ts`; route `PATCH /api/admin/performance/review-cycles/:cycleId/status`; UI actions in `apps/web/src/components/admin/review-cycles-table.tsx` | Transition ordering enforced with 409 on invalid transitions. |
| A2 | Participant task list fields + open write screen | **Complete** | UI route `/performance/reviews` (`apps/web/src/app/performance/reviews/page.tsx`); service `listAssignedReviewTasks`; route `GET /api/performance/reviews/tasks` | Shows cycle, subject, relationship, status, due date; links to write screen. |
| A2 AC | Loads quickly, permissioned, resume in-progress drafts | **Complete** | Service scoping in `listAssignedReviewTasks`; autosave in `autosaveReviewAnswer` | Drafts are persisted and reloaded via `getWriteReviewData`. |

### B) Review Writing (PRD §9B)
| PRD ref | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| B1 | Left nav phases relevant to user (tasks/self/upward/packet links) | **Partial** | `/performance/reviews/[cycleId]/write/[submissionId]/page.tsx` | Left nav currently has tasks + current submission context only. |
| B1 | Center questions with rich text, required indicators, progress summary | **Partial** | `apps/web/src/components/reviews/write-review-form.tsx` | Required indicators and progress summary are implemented; rich text editor remains deferred. |
| B1 | Right panel overview + role info + evidence counts/drill-in | **Partial** | `write-review-form.tsx`; evidence APIs in `apps/web/src/server/evidence/evidence-service.ts` | Evidence counts/drill-in implemented; overview/role-track-title summary not implemented. |
| B2 | Autosave with debounce and visible Saving → Saved | **Complete** | Debounced autosave + status label in `write-review-form.tsx`; `autosaveReviewAnswer` service | Behavior implemented and surfaced in UI. |
| B2 | Submit validates required questions and blocks incomplete | **Complete** | `submitReviewSubmission` in `apps/web/src/server/reviews/participant-review-service.ts`; route `POST /api/performance/reviews/:cycleId/submissions/:submissionId/submit` | Returns validation error with missing question IDs. |
| B2 | Scroll/focus to first invalid question on submit failure | **Complete** | `apps/web/src/components/reviews/write-review-form.tsx` | Submit validation now focuses and scrolls to the first missing required answer and keeps inline error state. |
| B2 | Lock editing after submit | **Complete** | Read-only behavior in `write-review-form.tsx`; submission status enforcement in `autosaveReviewAnswer` and evidence attach logic | Post-submit edits are blocked server-side and disabled in UI. |
| B3 | Evidence drill-in list by type (time filter optional) | **Complete** | `GET /api/evidence`; `listEvidenceForSubject`; right panel in `write-review-form.tsx` | Type drill-in implemented; time range filter remains optional/not implemented. |
| B3 | Attach evidence to answer + chips + detach | **Complete** | `POST /api/review-answers/:answerId/evidence-links`; `DELETE /api/review-answers/:answerId/evidence-links/:evidenceItemId`; `write-review-form.tsx` | End-to-end attach/detach UI and persistence present. |
| B3 AC | Attach is audited + visibility respected | **Complete** | `attachEvidenceToAnswer`, `detachEvidenceFromAnswer`, `listEvidenceForSubject`; tests in `apps/web/src/server/evidence/__tests__/evidence-service.test.ts` | Includes no-leak visibility test coverage. |

### C) Review Packet (PRD §9C)
| PRD ref | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| C1 | Packet submissions + answers (read-only semantics) | **Complete** | UI `/performance/reviews/[cycleId]/packet/[employeeId]`; service `getReviewPacket`; route `GET /api/performance/reviews/:cycleId/packet/:employeeId` | Submissions/answers are rendered and read-only. |
| C1 | Overall summary/rating/evidence summary/previous-cycle comparison tab | **Partial** | Packet page in `apps/web/src/app/performance/reviews/[cycleId]/packet/[employeeId]/page.tsx` | Core packet list exists; summary/rating/evidence aggregate/previous-cycle tab are not fully implemented. |
| C1 AC | Permission gated + no hidden submission leakage | **Complete** | `assertPacketAccess` in `apps/web/src/server/reviews/review-packet-service.ts`; tests in `apps/web/src/server/reviews/__tests__/review-packet-service.test.ts` | HR, manager-of-subject, employee-after-release policy enforced. |

### D) Calibration (PRD §9D)
| PRD ref | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| D1 | Admin session creation (cycle + cohort/participants + axes config) | **Complete** | UI: `apps/web/src/app/admin/performance/calibration/new/page.tsx`; list: `apps/web/src/app/admin/performance/calibration/page.tsx`; API/service: `apps/web/src/app/api/performance/calibration/route.ts`, `apps/web/src/server/calibration/calibration-admin-service.ts` | Session creation/listing is implemented with HR admin/CALIBRATOR gating and create audit events. |
| D2 | 9-box workspace with cohort placements | **Complete** | UI route `/performance/calibration/[sessionId]`; `CalibrationSessionView`; `getCalibrationSessionData` | Grid and placements render with selectable members. |
| D2 | Permissioned movement (drag/drop or accessible alternative) | **Partial** | `PATCH /api/performance/calibration/:sessionId/placements/:employeeId`; `moveCalibrationPlacement`; dropdown controls in `CalibrationSessionView` | Accessible move control implemented; drag/drop not implemented. |
| D2 | Right panel summary + packet link + This/Previous tabs + notes/justifications | **Partial** | `CalibrationSessionView` right drawer | Summary/link/tabs implemented; notes/justification capture not implemented. |
| D3 | Finalize creates immutable snapshot (placements + notes + participants + timestamp) | **Complete** | `finalizeCalibrationSession` + `buildCalibrationSnapshotPayload`; `CalibrationSnapshot` model/migrations | Snapshot includes placements/participants/timestamp; notes currently empty array placeholder. |
| D3 | Finalize locks session read-only | **Complete** | Server lock checks in `moveCalibrationPlacement`; finalized UI state in `CalibrationSessionView` | Post-finalize moves return read-only error. |
| D3 | Snapshot export/download placeholder | **Partial** | Snapshot persisted in DB; no calibration export endpoint found | Placeholder export not yet exposed for calibration snapshots. |
| D3 | Optional write-back to packet final fields | **Out of scope** | No final bucket/rating write-back fields or service logic in schema/services | PRD marks this as optional. |

### E) Improvement Plans (PRD §9E)
| PRD ref | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| E1 | Create plan with subject/manager/HR/date/goals-expectations | **Complete** | `createImprovementPlan` service; `POST /api/performance/improvement-plans`; schema models in `apps/web/prisma/schema.prisma` | Required fields and goal list validation are present. |
| E1 | Status lifecycle (`draft -> active -> completed(success/unsuccess) -> extended/cancelled`) | **Complete** | `transitionImprovementPlanStatus`; transition rules in `allowedStatusTransitions` | Transition enforcement + outcome validation implemented. |
| E2 | Plan detail timeline with author/timestamp/note/status/outcome (+ attachment placeholder) | **Complete** | UI `/performance/improvement-plans/[planId]`; component `improvement-plan-detail-view.tsx`; check-ins API | Attachment area is explicitly placeholder text. |
| E2 | Actions: audit log and export | **Complete** | `GET /api/performance/improvement-plans/:planId/audit`; `GET /api/performance/improvement-plans/:planId/export`; UI action buttons | Export intentionally returns 501 placeholder JSON. |
| E3 | Immutable audit events for create/status/goal-date edits/check-in create-edit | **Partial** | `apps/web/src/server/improvement-plans/improvement-plan-service.ts`; `apps/web/src/app/api/performance/improvement-plans/[planId]/route.ts` | Goal/date edit auditing is now implemented; check-in edit flow is still not implemented. |
| E3 | HR can view full audit log | **Complete** | `listImprovementPlanAuditEvents` authorization logic | HR has full org scope. |
| E3 AC | Sensitive plan access enforced | **Complete** | `canAccessPlan`, `buildPlanScopeWhere` in `improvement-plan-service.ts`; related tests | Subject/manager/HR scoping enforced server-side. |

### Cross-cutting requirements (PRD §10)
| PRD ref | Requirement | Status | Evidence | Notes |
|---|---|---|---|---|
| §10 Audit logging | Log sensitive mutations (cycle transitions, submission submit/return, evidence attach/detach, calibration move/finalize, plan transitions/updates) | **Partial** | Audit writes in `admin-cycle-service.ts`, `participant-review-service.ts`, `evidence-service.ts`, `calibration-session-service.ts`, `improvement-plan-service.ts` | Submit is logged; “return submission” flow is not implemented. |
| §10 Notifications | In-app tasks on dashboard (+ optional due soon) | **Partial** | Home page `apps/web/src/app/page.tsx`; tasks route `/performance/reviews` | Task list exists in reviews page; home/dashboard does not yet surface assigned tasks. |
| §10 Accessibility | Keyboard flow + accessible calibration move alternative + ARIA labeling | **Partial** | Keyboard-friendly forms and non-drag move controls in `write-review-form.tsx`, `calibration-session-view.tsx` | Alternative move controls exist; explicit ARIA labeling is limited. |
| §10 Performance | Fast pages, avoid N+1, indexed common lists | **Partial** | Prisma indexes in `apps/web/prisma/schema.prisma`; capped evidence list (`DEFAULT_EVIDENCE_LIMIT`) | Indexing and capped lists exist; no explicit performance budgets/measurement evidence found. |
| §10 Security | Server-side permission checks on every read/write; no count leakage | **Complete** | Permission checks across `src/server/*`; evidence no-leak logic/tests in `evidence-service` | Core APIs consistently enforce authz and avoid evidence count leakage. |

### Milestone checkpoint rollup (PRD §12)
| PRD milestone | Target scope | Status | Evidence |
|---|---|---|---|
| Milestone 0 | Foundation scaffold + DB + health + reviews empty | **Complete** | Root infra files (`docker-compose.yml`, `Dockerfile`, `.github/workflows/ci.yml`), Prisma init/migrations, `GET /api/health`, `/performance/reviews` |
| Milestone 1 | Reviews MVP | **Complete** | Admin cycle APIs/UI, tasks list, write/autosave/submit, evidence attach/detach, corresponding tests |
| Milestone 2 | Packets + Calibration | **Partial** | Packet view, calibration session creation, calibration workspace, and finalize snapshot are implemented | Remaining partial items are follow-on UX/export/write-back enhancements, not core flow gaps. |
| Milestone 3 | Improvement Plans MVP | **Complete** | Create/list/detail/check-ins/status/audit/export placeholder APIs + detail UI + tests |

## Gaps and inconsistencies

### Product/implementation gaps
- **Review packet remains partially complete** (PRD C1): summary/rating and previous-cycle comparison are placeholder-level, not full comparative analysis.
- **Write-review UX remains partially complete** (PRD B1): left phase nav breadth and richer editor/context blocks are still pending follow-on.
- **Calibration remains partially complete** (PRD D2/D3): participant notes/justifications and snapshot export placeholder are not implemented.
- **Improvement-plan audit completeness remains partial** (PRD E3): goal/date edit auditing is done, but check-in edit flow/audit is still absent.
- **Dashboard task surfacing is still partial** (PRD §10 notifications): home/dashboard does not yet show personalized due/assigned task feed.

### PLAN.md mismatches
- Prior checkbox/status mismatches are now reconciled in `PLAN.md`.
- Remaining unchecked items are grouped into explicit follow-on milestones (1.6, 2 follow-on, 3.1), matching `AGENTS.md` plan-tracking guidance.

### Remaining unchecked PLAN.md items (current)
1. Milestone 1.6 follow-on:
   - Expand write-review left phase navigation beyond task context
   - Add richer editor experience for answers (if product confirms)
   - Add right-panel reviewer/subject context summary on write-review screen
2. Milestone 2 follow-on:
   - Optional write-back of finalized bucket/rating to packet stable fields
   - Add calibration participant notes/justifications in right drawer
   - Add calibration snapshot export/download placeholder endpoint
3. Milestone 3.1 follow-on:
   - Add `/performance/improvement-plans` list route
   - Add incremental UX polish beyond MVP placeholders

## Top 5 highest-impact next tasks (minimal scope creep)

1. **Complete write-review follow-on UX (Milestone 1.6)**
   - Expand left phase nav, add contextual right-panel reviewer/subject summary, and confirm editor direction.
2. **Implement calibration notes/justification capture**
   - Add lightweight notes in the right drawer with audit-safe metadata handling.
3. **Add calibration snapshot export placeholder**
   - Expose a permission-gated endpoint/UI action similar to improvement-plan export placeholder.
4. **Ship improvement-plan list route**
   - Add `/performance/improvement-plans` list UI and navigation entry for non-seed flow usage.
5. **Decide and implement optional calibration write-back**
   - If retained for MVP+, persist finalized bucket/rating back to packet stable fields with audit coverage.
