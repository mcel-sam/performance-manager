# SANDBOX_PILOT.md

# Trellis — Sandbox Pilot Guide

## 1. Purpose

This document defines the scope and usage of the Trellis sandbox pilot.

The sandbox exists so the HR team can run realistic mock performance workflows before Trellis moves toward production hardening.

The sandbox is intended to:
- validate the Vanilla Build workflows
- test role-based access and behavior
- confirm the system feels usable and trustworthy
- identify gaps before production-ready rollout

This is not a full production launch and not a feature-complete HR platform.

---

## 2. Pilot Goals

The sandbox pilot is intended to answer the following questions:

1. Can HR run a complete review-cycle workflow inside Trellis?
2. Can employees and managers complete the expected review steps clearly?
3. Can Super Admin run 9-box calibration and capture succession/risk outcomes?
4. Can HR and managers run a structured PIP process?
5. Does the product feel coherent, realistic, and usable enough for the next stage?

---

## 3. Pilot Scope

The sandbox pilot includes the following workflows:

- Goals + Measures
- Self Review
- Manager Review
- 9-Box Calibration
- Succession outputs from calibration
- Risk outputs from calibration
- PIP with 30/60/90-day checkpoints

The pilot does **not** include:
- Peer reviews
- Upward reviews
- Continuous feedback feed
- Compensation workflows
- Broad standalone succession planning module
- Advanced analytics explorer
- AI-generated recommendations

---

## 4. Pilot Environment

The sandbox is a shared testing environment.

### Key characteristics
- deployed on Azure
- uses sandbox-safe authentication
- uses real sandbox user accounts
- behaves like a real system as much as possible
- hides out-of-scope or unfinished features

### Important note
The sandbox is **not** a fake demo mode.
It should be used as a realistic trial environment for the current Trellis workflows.

---

## 5. Pilot Roles

The pilot supports four active roles:

- Employee
- Manager
- HR Admin
- Super Admin

### Role intent
- Employees complete self-service performance workflows
- Managers approve goals, complete reviews, and support PIP
- HR Admin manages cycles and operational workflow
- Super Admin governs calibration and restricted talent outputs

---

## 6. Pilot User Setup

The sandbox should include:
- one realistic organization
- real sandbox accounts
- role assignments
- reporting lines
- at least one active review cycle

### Recommended data setup
Include:
- at least one HR Admin
- at least one Super Admin
- at least two managers
- several employees mapped to those managers
- one or more users suitable for calibration and PIP testing

This should feel like a real organizational structure, not a random set of logins.

---

## 7. What HR Should Test

HR should test the system as a complete workflow, not as isolated screens.

### Recommended test flow
1. Log in as the appropriate role
2. Review the role-specific landing experience
3. Create or review the active review cycle
4. Complete the goals workflow
5. Complete self review and manager review
6. Run calibration as Super Admin
7. Capture succession and risk outputs
8. Create and update a PIP
9. Review visibility, usability, and clarity across the process

---

## 8. Suggested Role-Based Test Scenarios

## 8.1 Employee
Test whether the employee can:
- log in successfully
- view only employee-relevant navigation
- create and submit goals
- revise goals after manager requests changes
- update goal progress during allowed windows
- complete self review
- view released review materials where allowed

Questions to ask:
- Is the workflow clear?
- Is it obvious what to do next?
- Is anything confusing or missing?

## 8.2 Manager
Test whether the manager can:
- view direct-report workflows
- approve or request changes to goals
- complete manager reviews
- participate in in-scope talent discussions where allowed
- support PIP checkpoints

Questions to ask:
- Are team actions easy to find?
- Is report scope clear?
- Are the screens too cluttered or too thin?

## 8.3 HR Admin
Test whether the HR Admin can:
- create and manage review cycles
- manage templates and timelines
- monitor progress
- oversee operational workflow
- oversee PIP process

Questions to ask:
- Can HR operate the cycle without spreadsheets or manual workaround steps?
- Is it easy to see what is incomplete or blocked?
- Are admin actions obvious?

## 8.4 Super Admin
Test whether the Super Admin can:
- access restricted talent workflows
- run calibration
- finalize calibration
- capture succession outputs
- capture risk outputs
- access leadership-team restricted data where applicable

Questions to ask:
- Does calibration feel controlled and usable?
- Is sensitive information presented clearly without clutter?
- Are privileged actions obvious but protected?

---

## 9. What Good Looks Like

The sandbox pilot is successful if:

- users can log in reliably
- each role sees the correct navigation and workflow
- goals flow works end-to-end
- reviews work end-to-end
- calibration works end-to-end
- succession and risk outputs can be captured
- PIP can be created and updated
- unfinished features are hidden
- the UI feels trustworthy and coherent
- HR can imagine using this without relying on side spreadsheets

---

## 10. Known Limitations

The sandbox should be presented honestly.

Typical limitations may include:
- temporary sandbox authentication instead of production SSO
- temporary data setup
- incomplete production hardening
- limited analytics/reporting
- hidden future-state modules
- UI roughness still being refined

These limitations should be documented clearly so testers focus on the right things.

---

## 11. Feedback Guidance

Feedback from the pilot should be grouped into:

### Workflow issues
Examples:
- cannot complete a step
- missing action
- blocked state
- wrong role access

### UX issues
Examples:
- confusing labels
- unclear next step
- cluttered screen
- hard-to-read form
- poor information hierarchy

### Policy / process issues
Examples:
- workflow doesn’t match HR process
- wrong visibility model
- missing step in review or calibration
- unclear ownership of an action

### Bugs
Examples:
- broken page
- failed submission
- wrong data shown
- state not saved correctly

---

## 12. Feedback Prioritization

### Critical
- login broken
- permission leak
- core workflow broken
- calibration or PIP unusable
- major trust-breaking issue

### High
- confusing core workflow
- wrong visibility by role
- missing action in active workflow
- dead-end page in major flow

### Medium
- moderate friction
- poor wording
- weak layout hierarchy
- inconsistent UI pattern

### Low
- cosmetic issue
- minor spacing/copy issue
- non-blocking polish request

---

## 13. Out-of-Scope Feedback

Some feedback may be valid but still out of scope for the current pilot.

Examples:
- peer reviews
- upward reviews
- compensation workflows
- advanced analytics
- broad future-state HR platform requests

These should be captured, but not allowed to derail the Vanilla Build pilot.

---

## 14. Pilot Readiness Checklist

Before handing the sandbox to HR, confirm:

- sandbox is deployed and reachable
- users can log in
- role assignments are correct
- one realistic org exists
- one active cycle exists
- core workflows are usable
- non-vanilla features are hidden
- major permission issues are resolved
- major UX issues in core flows are addressed

---

## 15. Pilot Decisions Locked

The following pilot assumptions are active unless explicitly changed:

- the sandbox is for realistic mock runs
- sandbox auth is temporary and separate from production auth
- the pilot focuses on vanilla workflows only
- the pilot is role-sensitive
- unfinished or out-of-scope features should be hidden
- feedback should prioritize workflow quality, permissions, and trust

---

## 16. Exit Criteria

The sandbox pilot can be considered successful when:
- HR can complete realistic mock runs
- the team has confidence in the core workflow structure
- major permission issues are resolved
- major UX confusion in core flows is addressed
- Trellis is ready to move into the next stage of hardening and rollout planning