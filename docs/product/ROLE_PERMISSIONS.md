# ROLE_PERMISSIONS.md

# Trellis — Role Permissions

## 1. Purpose

This document defines the active role and permission model for the Trellis Vanilla Build.

It is the product-facing source of truth for:
- what each role can do
- what each role can view
- what each role cannot access
- where restrictions must be especially strict

This document should be used alongside:
- `ARCHITECTURE.md` for technical authorization architecture
- `IMPLEMENTATION_CHECKLIST.md` for build execution
- `QUALITY_STRATEGY.md` for validation
- `AGENTS.md` for agent behavior

---

## 2. Active Roles

The Vanilla Build supports four roles:

- Employee
- Manager
- HR Admin
- Super Admin

No other role should be exposed as a first-class product role in the Vanilla Build.

---

## 3. Permission Model Principles

### 3.1 Server-side enforcement
All permissions must be enforced on the server.
UI hiding is helpful for usability, but it is not sufficient for security.

### 3.2 Organization scope
All records must be scoped to an organization.
A user should never access records from another organization.

### 3.3 Relationship-aware access
Some permissions depend on reporting relationships, not just role.

Examples:
- managers can act on direct reports
- employees can access only their own records
- some restricted leadership data is not visible to standard managers

### 3.4 Restricted talent workflows
The following workflows are highly sensitive and must be tightly controlled:
- calibration
- succession outputs
- risk outputs
- PIP
- leadership-team review data

### 3.5 Least privilege
Users should only see the minimum data and actions required to do their job.

---

## 4. Role Definitions

## 4.1 Employee
Primary purpose:
- manage own goals
- complete own self review
- view own released materials
- participate in own PIP workflow where applicable

## 4.2 Manager
Primary purpose:
- approve and review direct reports
- participate in team talent workflows where allowed
- support performance improvement for direct reports

## 4.3 HR Admin
Primary purpose:
- operate and oversee review cycles
- manage templates and workflow setup
- monitor operational progress
- oversee PIP process

## 4.4 Super Admin
Primary purpose:
- govern restricted talent workflows
- control and finalize calibration
- access restricted leadership-team talent data
- manage succession and risk outputs
- perform privileged overrides

---

## 5. Global Permissions by Role

| Capability | Employee | Manager | HR Admin | Super Admin |
|---|---|---|---|---|
| Log in to Trellis | Yes | Yes | Yes | Yes |
| Access own org only | Yes | Yes | Yes | Yes |
| View own profile/context | Yes | Yes | Yes | Yes |
| Access admin-only areas | No | No | Yes | Yes |
| Access restricted leadership talent data | No | No | Limited by policy | Yes |
| Perform privileged override actions | No | No | No | Yes |

---

## 6. Goals Permissions

## 6.1 Employee
Can:
- create own draft goals
- edit own draft goals
- submit own goals
- revise own goals after manager requests changes
- update progress during allowed windows
- add goal comments during allowed windows
- view own goals and goal history where supported

Cannot:
- approve goals
- override locked goals
- edit locked approved goals outside allowed rules
- access goals for other employees

## 6.2 Manager
Can:
- view goals for direct reports
- approve goals for direct reports
- request changes to goals for direct reports
- view progress updates for direct reports
- comment where workflow allows

Cannot:
- approve goals outside report scope
- override locked goals
- act as super-admin for exceptional goal changes

## 6.3 HR Admin
Can:
- view cycle-level goal progress and operational state where permitted
- monitor completion and process status

Cannot by default:
- approve goals on behalf of managers
- override locked goals unless explicitly elevated outside vanilla scope

## 6.4 Super Admin
Can:
- view goals where access is permitted by org-level role
- override locked goals in exceptional scope-change cases
- audit and investigate goal state where required

### Goal-specific restrictions
- maximum 5 total goals per employee per cycle
- only two goal types:
  - Performance
  - Development
- approved goals are locked
- full post-approval goal replacement is Super Admin only

---

## 7. Reviews Permissions

## 7.1 Employee
Can:
- complete own self review
- view own draft and submitted self review as allowed
- view released review packet where allowed
- view own goal context inside review experience where provided

Cannot:
- complete manager review
- view other employees’ review packets
- access calibration notes or talent outputs

## 7.2 Manager
Can:
- complete manager reviews for direct reports
- view self review content for direct reports where workflow allows
- access review packets for direct reports within scope
- participate in review-related decision flow for direct reports

Cannot:
- complete reviews outside report scope
- access restricted leadership-team review cycles unless explicitly allowed

## 7.3 HR Admin
Can:
- create and manage review cycles
- configure review templates
- monitor review completion
- oversee operational review workflow
- access review-cycle reporting and status

Cannot by default:
- write manager reviews on behalf of all managers unless explicitly designed
- access every restricted review artifact if visibility is intentionally limited

## 7.4 Super Admin
Can:
- access reviews across the organization where required
- access restricted leadership-team review cycles
- investigate review outcomes in sensitive workflows

### Review-specific restrictions
- Vanilla Build supports only:
  - Self Review
  - Manager Review
- Peer review and upward review are out of scope
- Employee packet visibility occurs only after release rules are met

---

## 8. Calibration Permissions

Calibration is one of the most sensitive workflows in Trellis.

## 8.1 Employee
Cannot:
- access calibration
- view placement
- view calibration notes
- view succession outputs
- view risk outputs

## 8.2 Manager
Can:
- participate in calibration for in-scope employees where allowed
- view relevant employee context required for calibration discussion
- contribute discussion input or rationale where workflow allows

Cannot:
- finalize calibration
- access calibration for out-of-scope populations
- access restricted leadership-team calibration by default

## 8.3 HR Admin
Can:
- support calibration operations where allowed by policy
- access operational workflow context where appropriate

Cannot by default:
- finalize calibration
- access restricted leadership-team calibration unless explicitly allowed by product policy

## 8.4 Super Admin
Can:
- create and govern calibration sessions
- access all required calibration cohorts
- access restricted leadership-team calibration
- move placements where workflow allows
- finalize calibration
- manage post-calibration outcomes

### Calibration-specific restrictions
- only Super Admin can finalize calibration
- finalized calibration is read-only
- leadership-team calibration visibility is restricted
- calibration outcomes feed succession and risk outputs

---

## 9. Succession Output Permissions

Succession outputs are generated from calibration and are highly sensitive.

## 9.1 Employee
Cannot:
- access succession outputs
- view readiness planning
- view emergency backup / ready-now / ready-future records

## 9.2 Manager
Can:
- view succession-related information only if explicitly included in the calibration process and permitted by policy

Cannot by default:
- broadly access succession outputs across the organization
- access restricted leadership succession data

## 9.3 HR Admin
Can:
- access succession outputs only where policy and workflow explicitly allow it

Cannot assume unrestricted access by default.

## 9.4 Super Admin
Can:
- create, update, and view succession outputs
- access restricted succession planning data
- manage readiness classifications and notes

### Succession-specific restrictions
- succession outputs are not a public employee-facing feature
- succession outputs must be tightly permissioned
- vanilla build treats succession as a calibration output, not a standalone broad module

---

## 10. Risk Output Permissions

Risk outputs are sensitive and should be treated similarly to succession outputs.

## 10.1 Employee
Cannot:
- access risk outputs
- view retention risk assessments
- view internal concern summaries

## 10.2 Manager
Can:
- access risk-related outputs only where explicitly allowed by policy and workflow

Cannot by default:
- access broad organizational risk data
- access restricted leadership risk data

## 10.3 HR Admin
Can:
- access risk outputs where policy and workflow explicitly allow it

## 10.4 Super Admin
Can:
- create, update, and view risk outputs
- manage risk classifications and actions
- access restricted organizational and leadership risk views

---

## 11. PIP Permissions

PIP is a sensitive workflow with shared responsibility between manager and HR.

## 11.1 Employee
Can:
- view their own PIP information where product policy allows
- participate in their own PIP process
- review their own checkpoint-related information where shown

Cannot:
- access other employees’ PIPs
- modify administrative or restricted PIP decisions beyond allowed participation

## 11.2 Manager
Can:
- create or co-manage PIPs for direct reports where workflow allows
- provide checkpoint feedback
- update progress and notes for direct reports
- view active and historical PIP information for in-scope employees

Cannot:
- manage PIPs outside report scope
- access restricted leadership PIP data without authorization

## 11.3 HR Admin
Can:
- oversee PIP workflows
- view and monitor PIP status
- participate in creation and management of PIPs
- support checkpoint tracking and process oversight

## 11.4 Super Admin
Can:
- access PIP workflows across the organization where needed
- review sensitive or escalated PIP cases
- investigate privileged concerns in PIP history

### PIP-specific restrictions
- PIP should be tightly permissioned
- PIP actions should be auditable
- manager + HR shared oversight is required in the vanilla model

---

## 12. Review Cycle Permissions

## 12.1 Employee
Can:
- view cycle stages relevant to their own participation
- act in stages where they are expected to participate

Cannot:
- create or configure cycles
- alter cycle rules or timing

## 12.2 Manager
Can:
- participate in stages tied to direct reports
- monitor team progress where allowed

Cannot:
- create or configure organization-wide cycles unless explicitly granted outside vanilla scope

## 12.3 HR Admin
Can:
- create review cycles
- configure timelines
- configure templates
- monitor cycle progress
- manage operational workflow

## 12.4 Super Admin
Can:
- access and govern cycles across the organization
- access restricted cycles tied to leadership populations
- intervene in sensitive cycle scenarios where required

---

## 13. Audit and Override Permissions

## 13.1 Audit visibility
Audit visibility should be restricted according to sensitivity.

At minimum:
- privileged workflow audit visibility belongs to HR Admin and Super Admin where appropriate
- sensitive restricted-cohort audit visibility belongs to Super Admin

## 13.2 Override actions
Privileged override actions should be minimal.

Vanilla Build assumption:
- locked goal override is Super Admin only
- calibration finalization is Super Admin only
- restricted leadership talent access is Super Admin only unless policy explicitly widens access

---

## 14. Frontend Visibility Rules

The frontend should reflect permissions clearly.

### General UI rules
- do not show actions users cannot perform
- do not expose unfinished or restricted modules
- do not tease unavailable functionality
- do not leak restricted information through badges, summaries, counts, or previews

### Role-specific visibility rules
- Employee sees only self-service workflows
- Manager sees direct-report workflows and team-relevant actions
- HR Admin sees operational admin surfaces
- Super Admin sees restricted talent-governance surfaces

Frontend hiding is a usability rule, not the actual security boundary.

---

## 15. Validation Expectations

The following must be validated for every major role-sensitive workflow:

- correct role landing experience
- correct navigation visibility
- correct record visibility
- correct action availability
- correct denial of restricted actions
- no alternate-route leakage of restricted information

Validation should include:
- backend authorization testing
- browser-level role checks
- restricted cohort verification where applicable

---

## 16. Explicit Non-Permissions

The following are explicitly not allowed in Vanilla Build unless requirements change:

- Employee access to calibration results
- Employee access to succession outputs
- Employee access to risk outputs
- Manager finalization of calibration
- Broad manager access outside direct-report scope
- Default unrestricted HR Admin access to all restricted leadership talent data
- Peer review as an active workflow
- Upward review as an active workflow

---

## 17. Active Role Decisions

The following decisions are active unless explicitly changed:

- Active roles are Employee, Manager, HR Admin, and Super Admin
- Super Admin owns calibration finalization
- Super Admin owns restricted leadership-team access
- HR Admin owns cycle setup and operational workflow management
- Managers act within report scope
- Employees act only on their own records
- Succession and risk outputs are restricted talent data
- Server-side enforcement is mandatory