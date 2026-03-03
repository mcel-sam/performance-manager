# Content Audit (Milestone 8 Phase 2)

Date: 2026-03-03  
Scope: Core UX surfaces listed in `PLAN.md` Milestone 8 Phase 2.

## Reviews list (`/performance/reviews`)
| Category | Decision |
| --- | --- |
| Primary goal | Help participants identify the next review action quickly. |
| Primary content required | Task table (cycle, subject, relationship, status, due date, action). |
| Secondary/supporting content | Short page description and empty-state guidance. |
| Hide behind details | Role/debug metadata not needed for day-to-day usage. |
| Remove | Redundant "Viewing as ..." metadata in header. |

## Write review (`/performance/reviews/:cycleId/write/:submissionId`)
| Category | Decision |
| --- | --- |
| Primary goal | Complete required responses with low friction and clear progress. |
| Primary content required | Question prompts, answer controls, section progress, submit action, save state. |
| Secondary/supporting content | Submit guidance and selected-answer context. |
| Hide behind details | Full submission metadata (cycle/subject/reviewer/relationship) and full selected prompt text. |
| Remove | Always-expanded context blocks that reduce scannability. |

## Packet view (`/performance/reviews/:cycleId/packet/:employeeId`)
| Category | Decision |
| --- | --- |
| Primary goal | Read submissions and answer context for one subject in one cycle. |
| Primary content required | Packet summary, submissions/answers, evidence counts, tabs. |
| Secondary/supporting content | Visibility guidance and return-to-task action. |
| Hide behind details | Deep policy explanation and navigation aids not needed in main reading flow. |
| Remove | Avoid duplicated navigation widgets where shell + action links already exist. |

## Calibration (`/performance/calibration/:sessionId`)
| Category | Decision |
| --- | --- |
| Primary goal | Place participants and review packet context quickly. |
| Primary content required | 9-box grid, selected participant context, move controls, lock status. |
| Secondary/supporting content | "What is calibration?" helper and axis definitions. |
| Hide behind details | Extended help copy once user is actively placing participants. |
| Remove | Any duplicated nav/context blocks that compete with grid workspace. |

## My Team (`/performance/team-reviews`)
| Category | Decision |
| --- | --- |
| Primary goal | Show manager workload and direct-report status at a glance. |
| Primary content required | Team totals, status snapshot, direct-report table, drill-in actions. |
| Secondary/supporting content | Empty-state coaching and KPI explanation copy. |
| Hide behind details | Non-critical secondary stats not tied to immediate action. |
| Remove | Labels or controls that duplicate row-level actions. |

## Reporting (`/admin/performance/reporting`)
| Category | Decision |
| --- | --- |
| Primary goal | Let HR inspect progress/outcomes by cycle and filters. |
| Primary content required | Cycle selector, filters, KPIs/charts, employee table, exports. |
| Secondary/supporting content | KPI tooltips and chart interpretation hints. |
| Hide behind details | Technical definitions and edge-case notes. |
| Remove | Duplicate chart controls that do not change interpretation. |

## Implemented in Phase 2
- Redesigned write-review evidence panel to progressive disclosure:
  - compact context card by default with explicit "Show details"
  - compact selected-answer summary with optional full prompt expansion
  - search within evidence list for current type
  - clearer spacing and grouped card rhythm
- Removed redundant review-list header debug metadata (`Viewing as ...`) from participant flow.
