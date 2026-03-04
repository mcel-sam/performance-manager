# Content Audit (Milestone 9 Phase 3)

Date: 2026-03-04  
Scope: Core pages listed in `PLAN.md` Milestone 9 Phase 3.

## Reviews list (`/performance/reviews`)
| Category | Decision |
| --- | --- |
| Primary goal | Let users find and open the next review task in one scan. |
| Primary content | Task table (cycle, subject, relationship, status, due date, action). |
| Secondary/supporting | Short page framing copy and empty-state guidance. |
| Hide behind details | Policy explanations and non-actionable metadata. |
| Remove | Extra navigation/context blocks that duplicate shell navigation. |

## Write review (`/performance/reviews/:cycleId/write/:submissionId`)
| Category | Decision |
| --- | --- |
| Primary goal | Complete required responses with clear progress and low friction. |
| Primary content | Sectioned questions, autosave state, submit action, evidence attach controls. |
| Secondary/supporting | Submit guidance and compact context summary. |
| Hide behind details | Full cycle/subject/reviewer metadata and full selected prompt text. |
| Remove | Redundant breadcrumb/nav block now covered by focus shell controls. |

## Packet view (`/performance/reviews/:cycleId/packet/:employeeId`)
| Category | Decision |
| --- | --- |
| Primary goal | Read packet content quickly for one subject and cycle. |
| Primary content | Submission answers, evidence counts, packet tabs, visibility hint. |
| Secondary/supporting | Compact back action and cycle status chip. |
| Hide behind details | Deep policy/legal copy not needed during packet reading. |
| Remove | Left-side navigation card that duplicated shell/back navigation. |

## Calibration (`/performance/calibration/:sessionId`)
| Category | Decision |
| --- | --- |
| Primary goal | Place participants and inspect context without leaving the grid workflow. |
| Primary content | 9-box matrix, participant context drawer, placement controls, lock/finalize state. |
| Secondary/supporting | Axis definitions and helper copy. |
| Hide behind details | Extended methodology guidance during active editing. |
| Remove | Any repeated nav containers that compete with matrix workspace. |

## My Team (`/performance/team-reviews`)
| Category | Decision |
| --- | --- |
| Primary goal | Help managers act on direct-report status from one hub. |
| Primary content | KPI cards, direct-report table, right-side drilldown drawer. |
| Secondary/supporting | Insights blocks and contextual summary badges. |
| Hide behind details | Timeline/audit context inside drawer tabs. |
| Remove | Duplicate profile panels replaced by standardized right drawer. |

## Reporting (`/admin/performance/reporting`)
| Category | Decision |
| --- | --- |
| Primary goal | Let HR slice results quickly and drill into outliers. |
| Primary content | Filter bar, charts, drilldowns, employee table, exports. |
| Secondary/supporting | Legend text and chart interpretation hints. |
| Hide behind details | Drilldown context split into Overview/Timeline/Audit tabs. |
| Remove | One-off filter layouts replaced by shared filter bar + chips. |

## Phase 3 implementation notes
- Deep-work routes now lean on focus shell controls and compact actions instead of repeated local nav blocks.
- Packet view moved from split nav/content layout to single content-first column with compact controls.
- Write-review breadcrumb block removed because focus shell already provides route context and back navigation.
