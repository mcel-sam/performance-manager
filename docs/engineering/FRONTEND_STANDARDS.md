# FRONTEND_STANDARDS.md

# Trellis — Frontend Standards

## 1. Purpose

This document defines the frontend implementation standards for Trellis.

Trellis is an HR-facing performance management system. The frontend must feel:
- trustworthy
- structured
- calm
- professional
- clear under pressure

Frontend quality is not just visual polish. It includes:
- information hierarchy
- interaction clarity
- permission-aware rendering
- predictable workflow behavior
- usability across sensitive flows

These standards are intended to help Trellis move quickly while still producing a product that feels intentional and high-quality.

---

## 2. Frontend Principles

### 2.1 Clarity over cleverness
The UI should be immediately understandable.
Do not optimize for novelty, complexity, or flashy interactions.

### 2.2 Serious product tone
Trellis supports sensitive HR workflows.
The interface should feel stable, professional, and trustworthy.

Avoid:
- overly playful UI
- unnecessary animation
- trendy but distracting patterns
- cluttered dashboards
- excessive visual density

### 2.3 Workflow first
The frontend should make it easy for a user to understand:
- where they are
- what they need to do
- what is blocked
- what has already happened
- what happens next

### 2.4 Consistency builds trust
Users should not have to relearn patterns between goals, reviews, calibration, and PIP.

### 2.5 Permission-aware by design
The UI must reflect the user’s actual role and access level.
Do not tease unavailable features or expose misleading actions.

---

## 3. Design Goals for Trellis

The product should feel:

- clean
- modern
- focused
- calm
- structured
- high-trust
- low-friction

The product should not feel:

- crowded
- overly decorative
- startup-gimmicky
- experimental
- noisy
- ambiguous

---

## 4. Layout Standards

## 4.1 Page structure
Each page should clearly communicate:
- page purpose
- current context
- primary action
- supporting information
- status where relevant

A typical page should have:
1. page title and context
2. key summary or status area
3. primary workflow content
4. secondary details below or to the side
5. clear next actions

## 4.2 Width and density
Prefer layouts that breathe.

Guidelines:
- avoid over-compressing information
- do not cram too many cards/widgets into one screen
- prefer fewer, clearer sections over dense dashboards
- use whitespace intentionally to separate meaning

## 4.3 Section hierarchy
Use strong hierarchy between:
- primary content
- secondary content
- supporting metadata
- admin-only details

Users should be able to scan a page and understand what matters first.

---

## 5. Navigation Standards

## 5.1 Role-aware navigation
Navigation must adapt by role.

Only show sections that are:
- relevant
- accessible
- sufficiently complete

If a module is unfinished or out of scope, hide it.

## 5.2 Predictable IA
Primary navigation should stay stable across the app.
Do not move important actions into inconsistent locations between modules.

## 5.3 Keep navigation shallow
Avoid making users click through too many layers to complete frequent tasks.

## 5.4 Title and route clarity
Route names, page titles, and nav labels should be plain and explicit.

Prefer:
- Goals
- Reviews
- Calibration
- Improvement Plans

Avoid vague names that require training or interpretation.

---

## 6. Forms and Input Standards

## 6.1 Form ergonomics
Forms should be easy to complete, review, and correct.

Guidelines:
- group related inputs
- keep labels close to fields
- use helpful helper text only where needed
- avoid overly long uninterrupted forms
- break long workflows into understandable sections

## 6.2 Labels
Labels should be explicit and human-readable.

Prefer:
- “Goal title”
- “What changed?”
- “Manager comments”
- “Review summary”

Avoid:
- internal jargon
- ambiguous one-word labels
- technical field names exposed directly

## 6.3 Required vs optional
Required and optional fields should be obvious.

## 6.4 Validation behavior
Validation should be:
- clear
- specific
- near the relevant field
- non-hostile

Error messages should explain what needs fixing.

## 6.5 Submit actions
Primary form actions should be obvious and consistently placed.

Examples:
- Save draft
- Submit goals
- Request changes
- Approve goals
- Finalize calibration

Do not make users guess which button is the real action.

---

## 7. Workflow UI Standards

## 7.1 Make status visible
Workflow-heavy screens should clearly show:
- current state
- previous state if relevant
- blocked state if applicable
- next expected action

## 7.2 Use progressive disclosure
Do not show every possible detail at once.
Expose deeper details when they support the current task.

## 7.3 Keep next actions obvious
A user should not have to search for what to do next.

## 7.4 Reduce cognitive load
Particularly in reviews, calibration, and PIP:
- avoid overwhelming the screen
- separate primary decisions from secondary context
- make the decision path feel controlled

---

## 8. Content Presentation Standards

## 8.1 Information hierarchy
Content should be organized so the most important information appears first.

Typical order:
1. current task or status
2. main decision/supporting content
3. metadata
4. historical or secondary detail

## 8.2 Long-form content
Reviews, comments, rationale, and plans may contain long text.

Long-form content should be displayed with:
- readable line lengths
- clear section headings
- spacing between blocks
- visual distinction between authored sections

## 8.3 Tables and lists
Use tables only when comparison matters.
Do not use tables as a default layout for everything.

For operational lists:
- make row actions clear
- make row status visible
- support scanning by status, owner, and deadline

---

## 9. Component Standards

## 9.1 Reuse patterns
Prefer a small number of reusable patterns for:
- page headers
- cards
- forms
- status badges
- timeline entries
- empty states
- action bars
- side panels
- confirmation dialogs

## 9.2 Component consistency
Buttons, badges, cards, tables, and forms should feel like one system.

## 9.3 Avoid component sprawl
Do not create slightly different one-off versions of the same pattern unless necessary.

---

## 10. State Design Standards

## 10.1 Empty states
Every important empty state should answer:
- what this area is for
- why it is empty
- what the user can do next

## 10.2 Loading states
Loading states should feel intentional, not broken.

Use:
- skeletons
- stable layout placeholders
- lightweight progress feedback

Avoid jarring layout shifts.

## 10.3 Error states
Error states should:
- explain what failed
- avoid blamey language
- suggest a recovery path when possible

## 10.4 Success states
Users should receive clear feedback when an important action succeeds.

Examples:
- goals submitted
- review saved
- calibration finalized
- PIP checkpoint recorded

---

## 11. Role-Specific UX Expectations

## 11.1 Employee
Employee experience should feel:
- simple
- focused
- guided

Employees should not see unnecessary admin complexity.

## 11.2 Manager
Manager screens should prioritize:
- team tasks
- pending actions
- direct-report workflows
- clarity around approvals and reviews

## 11.3 HR Admin
HR screens should prioritize:
- operational control
- cycle status
- template management
- workflow visibility
- process oversight

## 11.4 Super Admin
Super Admin screens may expose more power, but should still feel controlled and intentional.
Sensitive actions should be clearly separated and guarded.

---

## 12. Calibration UX Standards

Calibration is one of the most sensitive workflows in Trellis.

The calibration experience should feel:
- focused
- deliberate
- low-noise
- easy to discuss live

Guidelines:
- show the 9-box clearly
- make placement state obvious
- keep rationale easy to review/edit
- keep supporting employee context accessible without overcrowding the screen
- distinguish draft vs finalized state clearly
- emphasize restricted visibility where relevant

Avoid turning calibration into a cluttered analytics dashboard.

---

## 13. PIP UX Standards

PIP flows should feel:
- structured
- serious
- supportive
- easy to track over time

Guidelines:
- show current plan status clearly
- show upcoming checkpoints clearly
- keep notes readable
- make the timeline easy to scan
- distinguish plan metadata from checkpoint history
- avoid visually punitive or alarming design language

---

## 14. Copy and Tone Standards

The UI copy should be:
- plain
- professional
- calm
- direct

Avoid:
- buzzwords
- vague corporate filler
- overly cheerful system language in serious workflows
- technical implementation terms exposed to end users

Prefer:
- “Request changes”
- “Submit review”
- “Review cycle closed”
- “No goals submitted yet”

over vague or decorative wording.

---

## 15. Accessibility and Readability Standards

At minimum, Trellis frontend work should support:
- clear heading structure
- readable contrast
- clear focus states
- keyboard-friendly interaction where practical
- descriptive labels
- understandable validation messaging

Do not rely only on color to communicate important states.

---

## 16. Responsive Behavior Standards

Trellis is primarily a desktop-oriented workflow application, but layouts should still degrade gracefully on smaller screens.

Guidelines:
- preserve readability
- avoid broken overflow
- keep primary actions accessible
- collapse secondary information before compromising core workflow clarity

Do not optimize mobile at the expense of desktop workflow quality unless explicitly required.

---

## 17. Implementation Expectations

Frontend work should:
- use reusable patterns where possible
- keep business logic out of presentation components
- use server-derived permissions and state
- avoid duplicating workflow rules in the client
- preserve consistency across modules

Frontend implementation is not complete if:
- the workflow technically works
- but the page is confusing
- actions are unclear
- states are inconsistent
- trust is weakened

---

## 18. Review Checklist for Frontend Work

Before considering frontend work complete, check:

- Is the page purpose obvious?
- Is the main action obvious?
- Is the layout calm and readable?
- Are states clear?
- Are empty/loading/error states handled?
- Is the language clear and professional?
- Is the screen consistent with the rest of Trellis?
- Is the screen appropriate for the user’s role?
- Is sensitive information shown only where it should be?
- Does the workflow feel trustworthy?

---

## 19. Current Biases for Trellis UI

Frontend work should currently bias toward:
- polishing high-frequency workflows
- improving clarity over adding flourish
- removing friction from goals, reviews, calibration, and PIP
- making sandbox-facing screens feel production-intentional
- hiding incomplete or unstable surfaces

Frontend work should currently bias against:
- large redesigns without workflow validation
- excessive visual experimentation
- one-off custom patterns
- exposing future-state modules prematurely