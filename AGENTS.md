# AGENTS.md

# Trellis — Agent Operating Guide

## 1. Purpose

This document defines how AI agents should operate inside the Trellis repository.

Trellis is in a rapid development phase. Agents should optimize for:
- fast iteration
- correct implementation
- strong permission discipline
- polished UX on core workflows
- low process overhead
- cost-aware tool and sub-agent usage

The goal is not maximal agent orchestration. The goal is effective progress with a good balance between speed, quality, and cost.

---

## 2. Operating Mode

Trellis is currently being built in a fast-moving phase for the Vanilla Build and HR sandbox rollout.

### Working assumptions
- scope is now clearer, but implementation is still evolving
- UX still needs refinement
- sandbox readiness matters more than perfect process
- the immediate goal is to make the product coherent, usable, and trustworthy

### Therefore
Agents should favor:
- direct progress
- vertical implementation
- selective delegation
- frequent validation
- minimal overhead

Agents should avoid:
- over-orchestration
- unnecessary sub-agent fan-out
- creating multiple parallel deep dives for small tasks
- process-heavy branching and PR behavior during active build mode

---

## 3. Branch and PR Strategy

## 3.1 Current rule
Do **not** require a new PR for every phase of work.

During rapid development, agents should work on the active development branch unless explicitly instructed otherwise.

### Default workflow
- work directly on the active dev path
- make logically grouped changes
- validate before moving on
- batch changes into meaningful checkpoints
- use PRs only when a body of work is stable enough for real review

## 3.2 Use PRs when
- a feature is stable and reviewable
- a refactor is risky
- auth/security-sensitive changes need formal review
- infra/deployment changes need traceability
- production hardening begins

Agents should not block progress by insisting on PR creation unless explicitly told to do so.

---

## 4. Core Principles

### 4.1 Use the latest source of truth
Agents must align work to:
- `PLAN.md`
- `ARCHITECTURE.md`
- the active Vanilla Build PRD

If older docs conflict with newer docs, use the newer source of truth. [refer section 5]

### 4.2 Prefer evolution over rebuild
Unless explicitly instructed otherwise, agents should evolve the existing Trellis codebase.

### 4.3 Work in complete slices
Prefer meaningful vertical slices:
- UI
- API
- domain logic
- permissions
- state handling
- validation
- browser verification

Avoid shipping UI-only or API-only fragments that look complete but are not usable.

### 4.4 Preserve architecture while moving fast
Even in rapid development:
- route handlers stay thin
- business logic stays in services/domain code
- permissions are enforced server-side
- module boundaries are respected
- sensitive changes are auditable

### 4.5 Hide incomplete surfaces
If a workflow is incomplete or out of vanilla scope, hide or disable it rather than exposing broken UI.

---

## 5. Document Routing Guide

Agents should use the following documents as the source of truth depending on the task.

### Product scope and behavior
Use:
- `docs/product/PRD.md`
- `docs/product/REVIEW_CONTENT_MODEL.md`
- `docs/product/ROLE_PERMISSIONS.md`
- `docs/product/SANDBOX_PILOT.md`

Use these for:
- what Trellis should do
- what is in scope vs out of scope
- what content should be captured in reviews/calibration/succession/risk
- what each role should and should not be able to do
- what the sandbox is intended to validate

### Execution and sequencing
Use:
- `PLAN.md`
- `docs/engineering/IMPLEMENTATION_CHECKLIST.md`

Use these for:
- what phase the project is in
- what the current milestone is
- what should be built next
- what is required for sandbox readiness
- what is deferred

### Technical architecture
Use:
- `ARCHITECTURE.md`
- `docs/engineering/ENVIRONMENT_MATRIX.md`

Use these for:
- system boundaries
- environment strategy
- auth and database direction
- module boundaries
- deployment model
- security and authorization architecture

### Agent workflow and cost-aware execution
Use:
- `AGENTS.md`

Use this for:
- how to operate in the repo
- when to use sub-agents
- when to stay single-agent
- PR and branch expectations
- how to balance speed, validation, and cost

### Quality and validation
Use:
- `docs/engineering/QUALITY_STRATEGY.md`

Use this for:
- what level of validation is required
- when to use targeted checks
- when to use Playwright
- when to run recursive browser reviews
- what should block sandbox handoff

### Frontend and UX
Use:
- `docs/engineering/FRONTEND_STANDARDS.md`

Use this for:
- how Trellis should feel
- layout and interaction standards
- role-aware navigation expectations
- form, workflow, and state presentation quality

### Conflict-resolution order
If documents appear to conflict, use this priority order:

1. `PLAN.md` for current phase and milestone truth
2. `ARCHITECTURE.md` for technical constraints and system shape
3. `docs/product/PRD.md` for product scope and intended behavior
4. supporting docs for implementation detail within their domain

### Default agent behavior
Before making significant changes, agents should usually read:
- `PLAN.md`
- `ARCHITECTURE.md`
- the most relevant domain-specific supporting doc(s)

Agents should not load every doc for every task.
They should read only the documents relevant to the work being performed.

## 6. Cost-Aware Agent Strategy

## 6.1 Default behavior
Use **one primary agent** by default.

The primary agent should:
- understand the task
- inspect the current implementation
- make the plan
- implement the change
- run lightweight validation
- decide whether specialist help is worth the cost

Do not automatically spawn sub-agents for every task.

## 6.2 Escalation model
Start cheap. Escalate only when needed.

### Level 1 — Single-agent mode
Use for:
- small edits
- straightforward refactors
- copy changes
- wiring existing components
- basic bug fixes
- normal documentation updates
- small UI polish tasks

### Level 2 — Single specialist sub-agent
Use when one area clearly needs deeper focus, such as:
- end-to-end browser validation
- UI/UX refinement
- data model review
- permission debugging

### Level 3 — Multi-sub-agent workflow
Use only for high-value or high-risk work, such as:
- large feature delivery across multiple layers
- auth/permission redesign
- deployment readiness review
- major UX and flow cleanup before HR pilot handoff

Multi-sub-agent work should be deliberate, not default.

## 6.3 Delegation rule
Only delegate when the expected gain is higher than the coordination cost.

Do not create sub-agents just because a tool exists.

---

## 7. Recommended Sub-Agent Roles

The following sub-agent roles are allowed and encouraged when appropriate.

## 7.1 Implementation sub-agent
Use for:
- isolated feature implementation
- refactors within one module
- service-layer changes
- schema-adjacent changes

Best when:
- the task is well-defined
- architecture is already clear
- the work does not need a broad repo-wide decision

## 7.2 Browser QA sub-agent
Use for:
- Playwright-based validation
- recursive inspection of the dev build
- regression checks on critical flows
- role-based workflow verification
- navigation and state validation

Best when:
- a flow is already implemented
- a sandbox handoff is approaching
- a UI appears wired but needs real-world validation

## 7.3 UI / UX refinement sub-agent
Use for:
- layout cleanup
- hierarchy improvement
- form usability
- reducing friction in workflows
- aligning serious HR-product visual tone
- turning rough functionality into polished usability

Best when:
- the flow already works technically
- user trust and clarity matter
- the product is approaching HR-facing review

## 7.4 Architecture / systems review sub-agent
Use for:
- checking whether changes violate architecture
- identifying module-boundary drift
- permission model review
- reviewing data/state transition design

Best when:
- the task touches multiple modules
- a refactor is getting broad
- the implementation may be becoming messy

## 7.5 Product consistency sub-agent
Use for:
- checking alignment with the PRD
- verifying that new behavior matches vanilla scope
- catching out-of-scope features leaking into the app

Best when:
- a feature started broadening beyond intended scope
- the current implementation may reflect older plans

---

## 8. Sub-Agent Usage Rules

## 8.1 When not to use sub-agents
Do not use sub-agents for:
- trivial text changes
- obvious bug fixes
- tiny component edits
- simple route wiring
- work where context transfer would cost more than direct execution

## 8.2 Maximum recommended fan-out
Default maximum: **one sub-agent at a time**

Use two sub-agents only when there is a clear split, for example:
- one agent implements
- one agent validates in browser

Avoid broad parallel fan-out unless the task is genuinely large and time-critical.

## 8.3 Integration responsibility
The primary agent remains responsible for:
- final synthesis
- conflict resolution
- architectural alignment
- deciding what actually ships

Sub-agents are helpers, not the final authority.

## 8.4 Reuse before respawn
If a specialist context already exists, prefer continuing with it rather than spawning a fresh equivalent sub-agent repeatedly.

---

## 9. Expected Agent Workflow

For most tasks, agents should follow this path:

1. understand the request
2. inspect current code and docs
3. decide whether single-agent mode is enough
4. implement the smallest complete solution
5. run low-cost validation
6. escalate to a specialist sub-agent only if needed
7. summarize changes, risks, and next steps

This keeps the workflow efficient and cost-aware.

---

## 10. Browser and End-to-End Validation

## 10.1 Preferred browser validation
Playwright is the preferred approach for browser-level validation.

Use browser validation for:
- critical workflow testing
- role-based access checks
- recursive review of the dev build
- catching broken navigation and trust-breaking UI states
- final checks before HR sandbox handoff

## 10.2 Validation priority
The browser QA sub-agent should prioritize:
- login
- landing dashboards by role
- goals workflow
- reviews workflow
- calibration workflow
- PIP workflow
- empty states
- error states
- restricted visibility boundaries

## 10.3 Cost-aware browser testing
Do not run full recursive browser sweeps after every tiny code change.

Instead:
- use targeted validation during development
- batch larger browser checks after meaningful changes
- run broader recursive inspection before milestone handoff

---

## 11. UI / UX Quality Strategy

## 11.1 UX is part of correctness
A flow is not done if it technically works but is confusing, rough, or hard to trust.

## 11.2 Preferred refinement pattern
Use this order:
1. make the flow work
2. make the permissions correct
3. make the states understandable
4. polish the layout and interactions
5. validate the experience in browser

## 11.3 UI / UX refinement expectations
The UI / UX refinement sub-agent should improve:
- information hierarchy
- spacing consistency
- form ergonomics
- CTA clarity
- role-specific relevance
- readability
- calm, structured presentation

Trellis should feel:
- professional
- serious
- trustworthy
- low-friction
- clear under pressure

## 11.4 Cost-aware design iteration
Do not do massive aesthetic redesigns during active delivery unless explicitly requested.

Prefer:
- focused improvements to high-frequency workflows
- consistency improvements
- clarity improvements
- removal of rough edges

---

## 12. Repo Awareness Expectations

Before making changes, agents should inspect:
- current implementation in the dev branch
- active architecture and plan
- whether the feature already exists partially
- whether the requested work is already possible with adaptation
- whether the product surface should be hidden rather than expanded

Agents should not assume the repo still reflects earlier prototype-era plans.

---

## 13. Coding Expectations

Agents must:
- keep code readable
- prefer explicit logic over clever abstractions
- keep modules focused
- preserve naming consistency
- use types/interfaces where appropriate
- keep workflow transitions clear
- write code that another engineer can continue easily

Agents should avoid:
- premature generic abstractions
- duplicated business rules across layers
- deeply tangled component logic
- overengineering for hypothetical future use cases

---

## 14. Data and Permission Safety

Trellis contains sensitive talent data.

Agents must treat these as high-sensitivity domains:
- reviews
- calibration
- succession outputs
- risk outputs
- PIP
- leadership-team records

### Required rules
- never trust the client for authorization
- verify org scope on sensitive records
- verify manager/report relationships where required
- keep privileged actions auditable
- avoid leaking restricted info through summaries, counts, or side panels

If a change touches access control, prefer an architecture/permissions review before considering it done.

---

## 15. Workflow and State Discipline

Trellis is workflow-heavy. Agents must respect explicit state transitions.

Agents should:
- implement transitions in service/domain logic
- validate preconditions before mutation
- prevent illegal transitions
- preserve immutability where required
- avoid UI-only “fake progression”

If a workflow has multiple states, agents should model them clearly rather than inferring state from scattered UI conditions.

---

## 16. Sandbox Build Rules

For the HR sandbox, agents should assume:
- this is a real test environment, not a toy demo
- sandbox auth must be safe and realistic
- developer shortcuts must not appear in shared environments
- unfinished modules should be hidden
- core flows must feel believable and trustworthy

Before sandbox handoff, prefer one broad validation pass rather than many fragmented partial checks.

---

## 17. Definition of Done for Agent Work

A task is usually done only when:
- implementation works
- permissions are correct
- major states are handled
- the UI is understandable
- the change has been validated appropriately for its risk level
- the result is summarized clearly

For user-facing workflow work, “done” usually means:
- built
- wired
- permissioned
- validated
- polished enough not to break trust

---

## 18. Communication Expectations

Agents should:
- surface risks early
- summarize findings clearly
- propose the smallest strong next step
- avoid creating unnecessary bottlenecks
- keep momentum without becoming sloppy

Agents should not:
- insist on unnecessary ceremony
- over-explain routine work
- repeatedly restate stable project context
- spawn sub-agents without clear reason

---

## 19. Priority Order

When deciding what to improve next, agents should generally prioritize:

1. broken core workflows
2. auth and permission correctness
3. sandbox readiness
4. review/calibration/PIP usability
5. browser-validated UX polish
6. cleanup and refactor
7. future-facing enhancements

---

## 20. Active Biases for Trellis

Agents working on Trellis should bias toward:
- shipping usable vertical slices
- validating real browser behavior
- improving HR-facing UX quality
- using specialist sub-agents selectively
- keeping cost proportional to task value
- hiding incomplete features
- preserving trust in sensitive workflows

Agents should bias against:
- unnecessary PR churn
- wide sub-agent fan-out
- speculative infra work
- broad redesigns without validation
- exposing half-finished product areas
- expensive validation passes after every minor edit