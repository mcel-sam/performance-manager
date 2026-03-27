# PEOPLE_CONTEXT_MODEL.md

# Trellis — People Context Model

## 1. Purpose

This document defines how Trellis should model organizational hierarchy and present people context
in the product.

It exists to make one thing explicit:
- Trellis should treat manager/report relationships as a first-class structure
- direct reports are the primary relationship for workflow scope
- broader reports are derived from that same structure, not modeled as a separate permission system
- future Microsoft Entra ID hierarchy can feed this model, but does not replace app-owned access rules

Use this document with:
- `docs/architecture/ARCHITECTURE.md`
- `docs/product/ROLE_PERMISSIONS.md`
- `PLAN.md`

---

## 2. Core Model

Trellis should use a simple reporting hierarchy anchored on the employee record:

- each employee belongs to one organization
- each employee may have one manager in the primary reporting chain
- each manager may have zero or more direct reports
- broader report trees are derived from repeated manager -> direct-report relationships

### Canonical terms

- `manager`
  - the immediate primary manager for an employee
- `direct reports`
  - employees whose `managerId` points to the current employee
- `reports`
  - the broader reporting tree underneath a manager, including direct and indirect descendants
- `peers`
  - employees who share the same manager

### Important rule

`direct reports` are stored explicitly through the primary manager relationship.
`reports` are derived.

This keeps the model simple, aligns with directory-backed org charts, and avoids inventing a
separate parallel hierarchy just for the product.

---

## 3. Why this is the right default

This model scales well because it matches how performance workflows actually operate:

- goal approval happens at the direct-manager layer
- manager reviews are assigned through direct-manager relationships
- manager dashboards are easiest to understand when anchored on direct reports first
- calibration participation often starts from direct-manager scope and expands only when the session requires it
- succession and risk workflows may consider a wider span, but still benefit from the same base tree

It also maps cleanly to likely future enterprise identity sources:

- Microsoft Entra ID can provide the upstream manager relationship
- Trellis can normalize that relationship into its own employee model
- app workflows can then consistently derive direct reports, peers, and broader report trees

---

## 4. Relationship to Entra ID

Production should assume Microsoft Entra ID is the upstream identity source, but not the sole
source of business authorization.

### Entra should provide

- stable user identity
- primary manager relationship where available
- upstream organizational consistency for most employees

### Trellis must still own

- organization membership
- application role assignment
- effective workflow permissions
- exceptions for sensitive workflows
- visibility restrictions for leadership and talent workflows

### Design rule

Import or sync the primary manager relationship from Entra into the Trellis employee model, then
evaluate permissions inside Trellis.

Do not treat "is listed as a manager in Entra" as equivalent to "can access everything below that
user in Trellis."

---

## 5. Data Model Pattern

The default Trellis hierarchy model should be:

- `OrgMembership`
  - user-to-organization mapping
- `Employee`
  - profile record used by workflow systems
- `Employee.managerId`
  - nullable self-reference to the immediate manager

### Derived relationships

From `Employee.managerId`, Trellis can derive:

- current manager
- direct reports
- peers
- one additional level of reports for lightweight context
- full descendant tree when needed for reporting or future org views

### Vanilla-build constraints

For the Vanilla Build:

- support one primary manager relationship only
- do not introduce dotted-line or matrix-reporting complexity into permissions
- keep indirect-report visibility contextual unless a workflow explicitly needs deeper tree access

Possible future extensions:

- delegated coverage manager
- acting manager during leave
- matrix-team metadata for non-authoritative collaboration views

These should remain explicit extensions later, not be mixed into the main manager chain now.

---

## 6. Permission Model Implications

The hierarchy should drive scope in this order:

1. self
2. direct reports
3. wider reports only when the workflow explicitly allows it
4. org-wide elevated access only through role-based policy

### Default permission assumptions

- Employee
  - self only
- Manager
  - self + direct reports
- HR Admin
  - org-wide operational access where allowed by role
- Super Admin
  - org-wide plus restricted workflows

### Important guardrail

Indirect reports should not silently inherit all the same permissions as direct reports.

If a workflow needs broader manager-tree visibility, that rule should be explicit in the service
layer and documented in the product rules.

---

## 7. UI Pattern

The default UI pattern for hierarchy-aware surfaces should be:

### A. People context card

Show lightweight relationship context near the top of the experience:

- manager
- peers when relevant
- direct reports when the viewer manages people
- one additional nested level of reports for quick orientation only

This card is for orientation, not for full org-chart management.

### B. Manager workspaces

Manager-first operational screens should anchor on `direct reports`:

- review queues
- goal approvals
- coaching / improvement-plan entry points

Use `reports` as secondary context when a direct report is also a manager.

### C. Admin people management

Admin people-management screens should edit the primary reporting chain directly:

- employee
- role
- department
- title
- manager

This keeps future Entra sync/mapping straightforward.

### D. Reporting and analytics

HR reporting may aggregate by manager or broader org slices, but the base rollups should still come
from the same manager/report structure.

---

## 8. Product Language

Preferred language in the UI:

- `Direct reports`
- `Reports`
- `Manager`
- `Peers`

Avoid mixing too many overlapping labels such as:

- team
- org snapshot

unless the screen genuinely needs broader non-hierarchical language.

`Team` is acceptable for manager-facing workflow branding like `My Team`, but hierarchy cards and
scoped people components should prefer the more precise reporting terms above.

---

## 9. Implementation Direction

The current Trellis model is already close to this target because:

- employee records already store a primary `managerId`
- multiple services already enforce direct-report scope
- the home people-context surface already shows peers and direct reports

The active implementation direction should therefore be:

1. preserve the current single-manager chain
2. standardize product language around direct reports and reports
3. keep permissions direct-report-first
4. treat Entra as an upstream hierarchy source for production
5. add richer org-chart or delegated-reporting complexity only when a real workflow requires it
