# UX Audit Report

Generated at: 2026-03-04T00:05:06.747Z

Routes audited: 8
Passed checks: 7

## Checks
- Single active nav item (`aria-current="page"`) per route
- Visible page header (`main h1` exists)
- No viewport overflow (`scrollWidth <= clientWidth + 1`)
- No broken empty states (`section.border-dashed` requires title + description)
- No visible `undefined` placeholder text

## Route Results
| Role | Route | Label | Active nav | Header | Overflow | Broken empty states | Undefined text | Screenshot |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HR_ADMIN | `/` | Home | 1 | yes | no | no | no | `test-results/ux-audit/hr_admin-home.png` |
| HR_ADMIN | `/admin/performance/review-cycles` | Review cycles | 1 | yes | no | no | no | `test-results/ux-audit/hr_admin-admin-performance-review-cycles.png` |
| HR_ADMIN | `/admin/performance/reporting?tab=progress` | Reporting | 1 | yes | no | no | no | `test-results/ux-audit/hr_admin-admin-performance-reporting-tab-progress.png` |
| MANAGER | `/performance/reviews` | Review tasks | 1 | yes | no | no | no | `test-results/ux-audit/manager-performance-reviews.png` |
| MANAGER | `/performance/team-reviews` | My Team | 1 | yes | no | no | no | `test-results/ux-audit/manager-performance-team-reviews.png` |
| MANAGER | `/performance/reviews/cycle_seed_draft_1/write/submission_seed_employee_manager_1` | Write review | 1 | yes | yes | no | no | `test-results/ux-audit/manager-performance-reviews-cycle-seed-draft-1-write-submission-seed-employee-manager-1.png` |
| EMPLOYEE | `/performance/reviews` | My reviews | 1 | yes | no | no | no | `test-results/ux-audit/employee-performance-reviews.png` |
| CALIBRATOR | `/performance/calibration/calibration_session_seed_1` | Calibration session | 1 | yes | no | no | no | `test-results/ux-audit/calibrator-performance-calibration-calibration-session-seed-1.png` |
