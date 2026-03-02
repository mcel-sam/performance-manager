# Milestone 5 Audit — HR Scorecard + Analytics-ready Data Foundations + Demo Login

Date: 2026-03-02  
Scope audited: `PLAN.md` Milestone 5 (Phases 1–4), `docs/product/PRD.md`, `docs/architecture/ARCHITECTURE.md`, and implementation in `apps/web`.

## Short summary
Milestone 5 is **implemented end-to-end across Phases 1–4** and aligns with PRD/architecture direction for scorecard-ready data, deterministic scoring, reference-input handling for peer/upward reviews, and development-only demo login/setup.

Main gaps are test-depth gaps, not feature-blocking gaps:
- no dedicated unit tests for demo auth/setup services/endpoints
- Playwright covers manager submit path and demo login, but does not assert persisted scorecard values directly

---

## Phase-by-phase checklist with evidence

### Phase 1 — Data Model + Cycle Scorecard Config

| Plan item | Status | Evidence |
|---|---|---|
| `dimension_key` + scale question type support | Complete | `apps/web/prisma/schema.prisma` (`ReviewQuestionType`, `CompetencyDimensionKey`, `ReviewTemplateQuestion.questionType`, `ReviewTemplateQuestion.dimensionKey`) |
| Store N/A / Not Observed state | Complete | `apps/web/prisma/schema.prisma` (`ReviewAnswer.notObserved`, `ReviewAnswer.scaleRating`), migration `apps/web/prisma/migrations/20260302182913_add_scorecard_data_foundations/migration.sql` |
| Cycle scorecard config table (`metricKey`, `weightPercent`) | Complete | `apps/web/prisma/schema.prisma` (`ReviewCycleScorecardMetric`), migration adds table + indexes |
| Packet score fields (`totalScorecardPercent`, `scorecardOverallRating`, `finalRatingSource`) | Complete | `apps/web/prisma/schema.prisma` (`ReviewPacket` fields), migration alters `ReviewPacket` |
| Per-metric analytics-ready result storage | Complete | `apps/web/prisma/schema.prisma` (`ScorecardMetricResult`), migration creates table + unique/indexes |
| Snapshot org attributes on packet | Complete | `apps/web/prisma/schema.prisma` (`snapshotDepartment`, `snapshotTitle`, `snapshotManagerEmployeeId`, `snapshotManagerName`), packet generation snapshot write in `apps/web/src/server/reviews/admin-cycle-service.ts` |
| Validation: weights sum to 100 | Complete | `apps/web/src/server/scorecard/scorecard-config.ts` (`validateScorecardMetricConfig`), test `apps/web/src/server/scorecard/scorecard-config.test.ts` |
| Validation: metric key whitelist | Complete | `apps/web/src/server/scorecard/scorecard-config.ts` (allowed keys + duplicate/missing checks), tests in same file |
| N/A behavior consistency (stored + excluded rule path exists) | Complete | save/submit handling in `apps/web/src/server/reviews/participant-review-service.ts`; scoring exclusion in `apps/web/src/server/scorecard/scorecard-service.ts`; UI copy in `apps/web/src/components/reviews/write-review-form.tsx` |

### Phase 2 — Scorecard Computation Engine + Tests

| Plan item | Status | Evidence |
|---|---|---|
| Compute blended from Self + Manager | Complete | `apps/web/src/server/scorecard/scorecard-service.ts` (`recomputePacketScorecard`, query filters `SELF` + `MANAGER`, blend formula) |
| Apply weights + compute total % + map rating thresholds | Complete | `apps/web/src/server/scorecard/scorecard-service.ts` (`weightedPercent`, `mapScorecardPercentToRating`) |
| Persist packet-level derived score | Complete | `apps/web/src/server/scorecard/scorecard-service.ts` (`reviewPacket.update`) |
| Persist per-metric derived results | Complete | `apps/web/src/server/scorecard/scorecard-service.ts` (`scorecardMetricResult.upsert`) |
| Recompute trigger on manager submit | Complete | `apps/web/src/server/reviews/participant-review-service.ts` (`shouldRecomputeScorecardOnSubmissionSubmit` + `recomputePacketScorecard`) |
| Calibration override support (`CALIBRATION` source) | Complete | preserve-in-recompute logic in `apps/web/src/server/scorecard/scorecard-service.ts`; finalize write-back in `apps/web/src/server/calibration/calibration-session-service.ts` (`reviewPacket.updateMany`) |
| Formula + threshold + boundary + N/A tests | Complete | `apps/web/src/server/scorecard/scorecard-service.test.ts` (boundaries `90/89/80/79/70/60/<60`, weighted/blended, not-observed exclusion) |

### Phase 3 — Peer/Upward as Reference Input (No weighting)

| Plan item | Status | Evidence |
|---|---|---|
| Peer/upward submissions can store ratings/comments | Complete | scale/notObserved autosave/submit rules in `apps/web/src/server/reviews/participant-review-service.ts`; UI controls in `apps/web/src/components/reviews/write-review-form.tsx` |
| Label peer/upward as reference input | Complete | `apps/web/src/components/reviews/review-packet-view.tsx` (`Badge` with "Reference input") |
| Scorecard ignores peer/upward by default | Complete | `apps/web/src/server/scorecard/scorecard-service.ts` (query includes only SELF/MANAGER), test `scorecard-service.test.ts` (`ignores peer and upward inputs`) |
| Permission tests for peer/upward visibility rules | Complete | `apps/web/src/server/reviews/__tests__/review-packet-service.test.ts` (`denies peer reviewer from opening full packet`, unrelated employee denial) |

### Phase 4 — Demo Mode UI + Sample Role Logins

| Plan item | Status | Evidence |
|---|---|---|
| DEMO_MODE guard (dev-only) | Complete | `apps/web/src/server/demo/demo-mode.ts` (`DEMO_MODE=true` and `NODE_ENV=development`) |
| Demo setup UI page and actions | Complete | route `apps/web/src/app/demo/setup/page.tsx`, UI `apps/web/src/components/demo/demo-setup-panel.tsx` |
| Demo setup creates org/users/cycle/calibration/plan | Complete | `apps/web/src/server/demo/demo-setup-service.ts` (`ensureDemoOrgAndUsers`, `ensureDemoCycleAndReviewArtifacts`, `ensureDemoCalibrationSession`, `ensureDemoImprovementPlan`) and endpoint `apps/web/src/app/api/demo/setup/route.ts` |
| Demo auth with sample role credentials | Complete | hints + credential matching in `apps/web/src/server/demo/demo-auth-service.ts`; endpoint `apps/web/src/app/api/demo/login/route.ts`; page `apps/web/src/app/demo/login/page.tsx`; form `apps/web/src/components/demo/demo-login-form.tsx` |
| Demo-only routes/endpoints visibility | Complete | `notFound()` gating on demo pages; `requireDemoMode()` in demo APIs |
| Playwright switched to demo setup + demo login | Complete | `apps/web/e2e/helpers/demo.ts`, `apps/web/e2e/core-flows.spec.ts`, `apps/web/e2e/home-navigation.spec.ts`, `apps/web/playwright.config.ts` |

---

## Gaps and risks

1. **No dedicated unit tests for demo auth/setup services and demo API handlers.**  
   Current coverage is mainly E2E-path coverage (`/demo/login` + `/api/demo/setup` in smoke flow), but no isolated unit tests for invalid credentials, missing seeded users, or per-step setup behavior.

2. **Playwright does not directly assert scorecard persistence outputs.**  
   E2E validates manager write/submit flow and app behavior after demo login, but does not currently verify `ReviewPacket.totalScorecardPercent`, `scorecardOverallRating`, or per-metric records after submit.

3. **Scorecard trigger behavior is tested at helper level, not full submit integration assertion.**  
   `shouldRecomputeScorecardOnSubmissionSubmit` is unit-tested, and submit path calls it in service code, but there is no explicit submit-service test asserting recompute invocation side effects.

---

## Test coverage confirmation (requested)

### Unit tests
- **Core scorecard flow:** **Covered**  
  Evidence: `apps/web/src/server/scorecard/scorecard-config.test.ts`, `apps/web/src/server/scorecard/scorecard-service.test.ts`.
- **Demo login:** **Not directly unit-tested**  
  No dedicated `demo-auth-service` or `api/demo/login` unit tests found.

### Playwright tests
- **Demo login:** **Covered**  
  `apps/web/e2e/helpers/demo.ts` logs in through `/demo/login` and is used by both smoke specs.
- **Core scorecard flow:** **Partially covered**  
  Manager submit path is covered in `apps/web/e2e/core-flows.spec.ts` (`write review autosave and submit locks the submission`), but scorecard numeric outputs are not asserted in-browser/API checks.

### Current run status in this audit
- `cd apps/web && npm test`: PASS (13 files, 81 tests)
- `cd apps/web && npm run test:e2e`: PASS (6 tests)

