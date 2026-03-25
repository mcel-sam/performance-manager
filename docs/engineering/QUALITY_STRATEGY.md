# QUALITY_STRATEGY.md

# Trellis — Quality Strategy

## 1. Purpose

This document defines how Trellis should be validated during rapid development.

The goal is to maintain a strong balance between:
- speed
- confidence
- UX quality
- cost-aware validation

Trellis is currently in a fast-moving build phase. Quality strategy should support shipping quickly without letting critical workflows become unreliable, confusing, or untrustworthy.

---

## 2. Quality Principles

### 2.1 Validate by risk, not by habit
Not every change needs the same depth of validation.

Use lighter checks for:
- small copy changes
- isolated UI fixes
- simple refactors
- low-risk internal cleanup

Use deeper checks for:
- auth
- permissions
- workflow state changes
- calibration
- PIP
- review flows
- cross-role visibility
- sandbox handoff readiness

### 2.2 Prefer targeted checks during development
During active implementation, validate only the areas affected by the current change unless the change has broader risk.

### 2.3 Batch expensive validation
Do not run full end-to-end recursive browser reviews after every small change.

Instead:
- do cheap checks while building
- do targeted Playwright validation after meaningful changes
- do full browser review before milestone handoff

### 2.4 UX quality is part of quality
A flow is not high quality if it technically works but is:
- confusing
- visually rough
- inconsistent
- missing key state feedback
- hard to trust

---

## 3. Validation Levels

## Level 1 — Lightweight validation
Use for low-risk changes.

Examples:
- text changes
- spacing/layout cleanup
- small component tweaks
- non-sensitive UI refactors
- documentation updates

Expected checks:
- code compiles
- no obvious lint/type breakage
- manual sanity check if user-facing

## Level 2 — Targeted functional validation
Use for normal feature work.

Examples:
- workflow UI updates
- form changes
- service changes within one module
- route changes for one feature
- moderate refactors

Expected checks:
- local/manual feature verification
- targeted browser validation for changed flow
- relevant type/lint/test checks
- permission sanity check if applicable

## Level 3 — High-sensitivity validation
Use for high-risk changes.

Examples:
- auth
- permissions
- review state changes
- calibration logic
- restricted visibility
- PIP workflow
- cross-role access behavior
- data mutations affecting multiple steps

Expected checks:
- targeted Playwright flow validation
- role-based visibility review
- error-state review
- state transition verification
- regression check for adjacent critical paths

## Level 4 — Milestone / handoff validation
Use before:
- HR sandbox handoff
- major demo
- production-like deployment checkpoint
- major feature completion

Expected checks:
- broad browser pass across major workflows
- recursive workflow inspection of current dev/sandbox build
- high-priority role validation
- trust-breaking UX issue review
- navigation review
- empty/loading/error state review
- major regression sweep

---

## 4. Playwright Strategy

## 4.1 When to use Playwright
Playwright should be used for:
- critical end-to-end flows
- role-specific validation
- workflow regression checks
- sandbox handoff validation
- recursive inspection of the dev or sandbox build

## 4.2 When not to use Playwright
Do not use Playwright for every tiny change.

Avoid Playwright for:
- trivial documentation changes
- tiny copy fixes
- isolated internal cleanup with no user-facing effect
- ultra-small styling edits unless they affect usability

## 4.3 Preferred Playwright usage pattern
Use Playwright in three ways:

### A. Targeted flow check
Run after meaningful feature work.

Examples:
- submit goals
- approve goals
- complete self review
- complete manager review
- open calibration
- create PIP

### B. Role-based access check
Run when permissions or navigation may have changed.

Examples:
- manager sees only direct-report actions
- employee cannot access admin surfaces
- leadership/restricted views are hidden correctly

### C. Recursive build review
Run before handoff or milestone review.

Examples:
- move through major workflows screen by screen
- inspect broken states
- inspect dead ends
- inspect confusing UI transitions
- inspect layout trustworthiness and completion level

---

## 5. UX Quality Review Strategy

## 5.1 When to do a UX review
Do a UX review when:
- a workflow is functionally complete
- a screen is likely to be used heavily
- the flow is HR-facing or trust-sensitive
- a milestone handoff is approaching

## 5.2 What to review
A UX review should check:
- page hierarchy
- clarity of actions
- label quality
- layout consistency
- spacing consistency
- form ergonomics
- visual noise
- loading states
- empty states
- error states
- success feedback
- workflow continuity

## 5.3 UX severity levels
### Low severity
- minor spacing inconsistency
- weak copy
- mild visual roughness

### Medium severity
- confusing hierarchy
- inconsistent button placement
- avoidable friction in a common flow

### High severity
- trust-breaking screen quality
- unclear next steps
- misleading workflow states
- severe inconsistency in sensitive HR flows

High-severity UX issues should block sandbox handoff if they affect core workflows.

---

## 6. Role-Based Validation

Because Trellis is role-sensitive, all meaningful workflow validation should consider role context.

Roles to validate:
- Employee
- Manager
- HR Admin
- Super Admin

At minimum, validation should confirm:
- each role lands in the correct experience
- each role sees the correct navigation
- sensitive actions are unavailable where they should be
- restricted views do not leak through alternate routes or partial UI

---

## 7. High-Priority Flows

The following flows should receive the highest validation priority:

1. authentication and login
2. dashboard landing by role
3. goals workflow
4. review workflow
5. calibration workflow
6. PIP workflow
7. navigation and permissions
8. empty/error/loading states in core workflows

These are the flows most likely to affect trust in the HR sandbox.

---

## 8. Validation Frequency

## During active implementation
- use lightweight or targeted checks only
- do not run full recursive sweeps after every change

## After meaningful feature completion
- run targeted Playwright validation for that feature
- verify adjacent states if risk is moderate/high

## Before HR sandbox handoff
- run a broad recursive browser review
- validate major workflows by role
- review trust-breaking UX issues
- ensure unfinished features are hidden

---

## 9. Cost-Control Rules

To keep quality work efficient:

### Do
- start with the cheapest valid check
- escalate only if risk justifies it
- batch related browser checks
- reuse prior validation context when possible
- focus expensive checks on high-value flows

### Do not
- run a full browser sweep after every minor edit
- repeat the same validation with no meaningful change
- over-test low-risk cosmetic edits
- spend major validation cost on out-of-scope features

---

## 10. Handoff Readiness Criteria

A workflow is ready for sandbox handoff when:
- it works end-to-end
- permissions are correct
- major states are handled
- the browser flow does not break
- the UX is clear enough not to confuse HR users
- trust-breaking rough edges have been removed
- unfinished adjacent features are hidden

---

## 11. Bug and Issue Prioritization

## Critical
- broken login
- permission leak
- broken core submission flow
- restricted data visible to wrong role
- calibration or PIP failure
- severe trust-breaking UX issue in core workflow

## High
- broken state transition
- missing role-specific action
- dead-end core workflow screen
- broken release/handoff flow
- major layout or clarity issue in heavily used screen

## Medium
- moderate usability friction
- inconsistent labels
- weak form ergonomics
- avoidable confusion with recoverable impact

## Low
- cosmetic roughness
- small copy issues
- minor alignment inconsistencies

---

## 12. Definition of Quality for Current Phase

For the current Trellis phase, quality means:
- core workflows are usable
- permissions are reliable
- sandbox behavior feels real
- major UX issues are addressed
- validation depth is proportional to risk
- quality work does not slow the team unnecessarily

This is not “perfect polish at all costs.”
This is “high-confidence progress with sensible validation.”