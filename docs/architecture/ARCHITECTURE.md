# Trellis — Architecture
**Status:** Active  
**System:** Trellis  
**Scope:** Vanilla Build + Sandbox Rollout Path  
**Last Updated:** 2026-03-24

---

# 1. Purpose

This document defines the technical architecture of Trellis.

Trellis is implemented as a web-based performance management system with a modular monolith architecture, a relational data model, strict server-side authorization, and environment-specific authentication and deployment strategies.

This document is intentionally technical. It describes system structure, runtime behavior, data and security boundaries, deployment topology, and engineering constraints. Product scope, workflow semantics, and UX content should be defined in the PRD and related product documents.

---

# 2. Architectural Goals

The architecture of Trellis is designed to satisfy the following goals:

1. **Support a structured performance-management domain** without introducing unnecessary distributed-system complexity.
2. **Maintain strong permission boundaries** for sensitive HR and talent data.
3. **Keep business logic modular** so the system can evolve cleanly over time.
4. **Support a fast sandbox rollout** without compromising the long-term production direction.
5. **Preserve auditability** for all sensitive operations.
6. **Allow infrastructure evolution** from sandbox-grade dependencies to enterprise-ready Azure-native services.

---

# 3. System Context

Trellis is a single web application deployed to Azure, backed by a relational database and an external authentication provider.

At runtime, the system consists of:

- a browser-based frontend
- a server-side application layer
- a relational database
- an authentication provider
- environment/configuration management
- observability and logging infrastructure
- optional background/scheduled job execution where required

Trellis is not designed as a microservice system for the Vanilla Build. It is designed as a **modular monolith**.

---

# 4. Architecture Style

## 4.1 Modular monolith

Trellis should be implemented as a modular monolith with clear domain boundaries inside a single deployable application.

### Rationale
A modular monolith is the correct tradeoff at this stage because it provides:

- lower operational complexity
- simpler deployment and debugging
- transactional consistency across related workflows
- easier schema evolution
- faster iteration speed
- fewer cross-service coordination problems

### Constraints
- domain logic must remain separated in code
- API handlers must remain thin
- authorization must be centralized and reusable
- shared infrastructure concerns must not be duplicated across modules

---

# 5. Runtime Topology

## 5.1 Core runtime components

### Frontend
Responsible for:
- route rendering
- forms and workflow screens
- role-aware navigation
- presentation-only state
- client-side input validation

The frontend must not be treated as a trust boundary.

### Server application
Responsible for:
- request handling
- authentication/session resolution
- authorization enforcement
- workflow/state transitions
- domain orchestration
- transactional writes
- audit event generation

### Database
Responsible for:
- durable persistence
- relational integrity
- transactional consistency
- queryable history and operational records

### Authentication provider
Responsible for:
- identity verification
- login/session initiation
- basic identity claims

The application remains responsible for:
- organization membership
- application role mapping
- reporting-line normalization
- effective permissions

---

# 6. Environments

Trellis supports three primary environments.

## 6.1 Local
Used for development and debugging.

Characteristics:
- local or developer-scoped database
- local secrets or dev env vars
- developer-only shortcuts allowed
- relaxed operational constraints
- fixture/test data acceptable

## 6.2 Sandbox
Used for realistic internal testing and mock runs.

Characteristics:
- deployed, shared environment
- sandbox-safe authentication
- real user accounts
- realistic data shape
- no developer-only impersonation/reset paths
- production-like application behavior wherever possible

## 6.3 Production
Used for live organizational usage.

Characteristics:
- enterprise authentication
- production database and secrets
- locked-down access
- production monitoring and backups
- operational controls for security and recovery

---

# 7. Authentication Architecture

## 7.1 Sandbox authentication
For the short-term sandbox rollout, Trellis may use a temporary auth provider such as Supabase Auth.

This is acceptable only for sandbox use and must satisfy the following conditions:

- users authenticate through real accounts
- role switching is not exposed through the UI
- local demo shortcuts are disabled
- authorization remains application-controlled
- sandbox auth is isolated from production auth

## 7.2 Production authentication
Production should use Microsoft Entra ID.

Production auth requirements:
- SSO support
- stable identity mapping
- enterprise-ready session flow
- compatibility with Azure deployment practices
- clean mapping into the Trellis application user model

## 7.3 Identity model
Authentication and authorization are separate concerns.

The identity model should include:

- **Auth Identity**: the identity returned by the auth provider
- **Application User**: the internal user record
- **Organization Membership**: the mapping between user and organization
- **Application Role**: Employee / Manager / HR Admin / Super Admin
- **Reporting Relationships**: the normalized primary manager chain used to derive direct reports, peers, and broader reporting trees for scoped access

The application must not rely solely on provider claims to determine business access.

### Reporting hierarchy rule
Trellis should treat the immediate manager relationship as the stored source of truth for hierarchy.

That means:

- direct reports are modeled explicitly from the primary manager chain
- broader reports are derived from repeated manager -> direct-report relationships
- Microsoft Entra ID may provide the upstream manager relationship in production, but Trellis still owns permission evaluation and workflow scope

---

# 8. Authorization Architecture

Authorization is a server-side concern and must be enforced on all sensitive reads and writes.

## 8.1 Authorization inputs
Authorization decisions should evaluate:

- authenticated identity
- organization membership
- application role
- subject relationship
- workflow state
- restricted cohort status
- environment constraints where relevant

## 8.2 Authorization model
A centralized permission layer should be used to avoid duplicated access logic across route handlers and UI code.

Authorization should support decisions such as:

- whether a user can view a record
- whether a user can mutate a record
- whether a state transition is allowed
- whether a record belongs to a restricted cohort
- whether access depends on manager-subordinate relationships

## 8.3 Trust boundaries
The client is never trusted for:
- role declarations
- record scope
- workflow-state assumptions
- org membership assertions

All final enforcement must occur on the server.

---

# 9. Domain Module Boundaries

Trellis should organize application logic into domain-aligned modules.

Recommended module boundaries:

- `auth`
- `org`
- `permissions`
- `cycles`
- `goals`
- `reviews`
- `calibration`
- `pip`
- `audit`

Additional modules may exist if justified, but the system should avoid unnecessary fragmentation.

## 9.1 Module responsibilities

### `auth`
- session resolution
- provider integration
- identity normalization

### `org`
- organizations
- memberships
- employee profiles
- reporting lines and derived direct-report/report relationships
- restricted cohort markers

### `permissions`
- reusable access rules
- policy evaluation
- authorization helpers

### `cycles`
- review-cycle lifecycle
- stage transitions
- time windows
- packet orchestration entrypoints

### `goals`
- goal persistence
- goal submission state
- approval/revision transitions
- goal window enforcement

### `reviews`
- review templates
- review packets
- submission flows
- release behavior

### `calibration`
- calibration sessions
- placements
- snapshots
- restricted visibility rules
- talent outputs

### `pip`
- improvement plans
- checkpoint timelines
- status transitions

### `audit`
- audit event generation
- audit event persistence
- audit query utilities

---

# 10. Application Layering

Trellis should follow a layered architecture.

## 10.1 Presentation layer
Contains:
- pages
- layouts
- forms
- components
- client-side view state

Rules:
- may format or present data
- may perform non-authoritative client validation
- must not implement final business rules

## 10.2 Transport / handler layer
Contains:
- route handlers
- request parsing
- schema validation
- session retrieval
- service invocation
- error mapping

Rules:
- keep thin
- do not embed workflow logic
- do not duplicate permission logic

## 10.3 Domain service layer
Contains:
- business rules
- transition logic
- orchestration across records
- invariant enforcement

This is the main home for application behavior.

## 10.4 Persistence layer
Contains:
- ORM models
- repository/query helpers
- transactional persistence logic
- schema-adjacent query composition

Rules:
- persistence concerns should remain separate from orchestration concerns where practical

---

# 11. Data Architecture

## 11.1 Primary database model
Trellis uses a relational database as the system of record.

This is the correct choice because the domain requires:

- strong relational integrity
- transactional state changes
- scoped access across multiple record types
- durable audit history
- structured querying for operational workflows

## 11.2 Database technology path
- **Sandbox:** sandbox-grade Postgres is acceptable
- **Production:** Azure Database for PostgreSQL

## 11.3 Core entity families
The exact schema may evolve, but the architecture assumes the following entity families:

### Identity and org
- Organization
- User
- OrganizationMembership
- EmployeeProfile
- ReportingLine

### Workflow control
- ReviewCycle
- WorkflowStage / stage metadata where needed

### Goals
- Goal
- GoalMeasure
- GoalComment or equivalent activity/history records

### Reviews
- ReviewTemplate
- ReviewPacket
- ReviewSubmission

### Calibration and talent outputs
- CalibrationSession
- CalibrationPlacement
- CalibrationSnapshot
- SuccessionOutput
- RiskOutput

### Performance intervention
- ImprovementPlan
- ImprovementPlanCheckpoint
- ImprovementPlanEvent

### System accountability
- AuditEvent

## 11.4 Data constraints
All domain records should be:

- organization-scoped
- created through explicit state transitions where applicable
- queryable by role and scope
- auditable when sensitive
- immutable after finalization where required by workflow

---

# 12. State Transition Architecture

Trellis is a workflow-heavy system and relies on controlled state transitions.

State transitions must be enforced in domain services, not inferred from the UI.

Examples of state-managed entities include:
- review cycles
- goals
- review packets/submissions
- calibration sessions
- improvement plans

## 12.1 Transition rules
Every transition should:

- validate current state
- validate actor permission
- validate related business preconditions
- persist changes transactionally
- emit audit records when sensitive

## 12.2 Immutability rules
Some records should become immutable after certain transitions.

Examples:
- finalized calibration snapshots
- locked review states where applicable
- approved or overridden goal forms depending on business rules

Immutability should be enforced at the application/service layer and supported by clear persistence patterns.

---

# 13. Audit Architecture

Auditability is a first-class technical requirement.

## 13.1 Why audit exists
Audit records are required for:
- accountability
- operational debugging
- compliance posture
- trust in talent-management decisions
- reconstructing sensitive workflow history

## 13.2 Audit scope
The system should emit audit events for all high-sensitivity mutations, including:

- goal submission and approval actions
- review submission and release actions
- calibration placement/finalization changes
- succession/risk output changes
- improvement-plan lifecycle events
- privileged administrative overrides

## 13.3 Audit record shape
Audit records should capture:
- actor
- organization
- action type
- target entity type
- target entity identifier
- timestamp
- structured metadata
- before/after diff where practical

---

# 14. API Architecture

The API should be domain-oriented and service-backed.

## 14.1 Design principles
- domain-grouped endpoints
- validated request payloads
- thin handlers
- service-layer orchestration
- typed responses where possible
- consistent error mapping

## 14.2 Suggested endpoint grouping
Examples:
- `/api/auth/*`
- `/api/org/*`
- `/api/cycles/*`
- `/api/goals/*`
- `/api/reviews/*`
- `/api/calibration/*`
- `/api/pip/*`

The exact transport framework is secondary; the domain boundary discipline is primary.

## 14.3 Transactions
Multi-step mutations should use transactions where the workflow requires atomic consistency.

Examples:
- submission + audit creation
- finalization + snapshot persistence
- role-sensitive state transitions

---

# 15. Frontend Architecture

The frontend should remain simple, role-aware, and service-backed.

## 15.1 Responsibilities
- render workflow screens
- collect input
- reflect server-derived state
- provide role-appropriate navigation
- display actionable errors clearly

## 15.2 Constraints
- avoid duplicating backend workflow logic
- avoid trusting client-only role state
- prefer server-derived visibility for sensitive surfaces
- keep shared UI primitives reusable

## 15.3 UX architecture note
Visual design systems, interaction polish, and UX execution standards should be documented outside this file, for example in:
- `AGENTS.md`
- `docs/engineering/FRONTEND_STANDARDS.md`
- `docs/engineering/QUALITY_STRATEGY.md`

This architecture document defines system structure, not visual style guidance.

---

# 16. Deployment Architecture

## 16.1 Hosting direction
Trellis is intended to be hosted on Azure.

Sandbox and production should share the same broad hosting shape where practical, even if auth and database providers differ temporarily.

## 16.2 Configuration
Configuration must be environment-driven.

This includes:
- auth provider configuration
- database connection strings
- app URLs
- secrets
- environment flags
- logging/monitoring configuration

## 16.3 Secret handling
Secrets must never be hardcoded in the repository.

Use environment-specific secret management appropriate to deployment stage:
- local `.env` for development
- managed secret/config handling for shared environments
- Azure-native secret management for production

---

# 17. Observability Architecture

Trellis should support at least the following observability layers:

## 17.1 Application logging
Used for:
- request tracing
- operational diagnostics
- deployment issue debugging
- workflow failure triage

## 17.2 Error monitoring
Used for:
- runtime exceptions
- failed background tasks
- unexpected application states

## 17.3 Audit inspection
Used for:
- high-sensitivity mutation review
- access investigation
- operational accountability

## 17.4 Environment visibility
Used for:
- confirming environment configuration
- deployment verification
- release troubleshooting

---

# 18. Security Architecture

Trellis handles sensitive talent data and must be designed accordingly.

## 18.1 Sensitive data domains
The following should be treated as highly sensitive:
- calibration records
- succession outputs
- risk outputs
- improvement plans
- leadership-team records
- review content where policy requires restricted visibility

## 18.2 Security requirements
- server-side authorization on every sensitive path
- least-privilege role access
- organization scoping on all business records
- audit trail for sensitive mutations
- no developer shortcuts in shared environments
- environment isolation between local, sandbox, and production

## 18.3 Restricted cohort handling
The architecture must support restricted cohorts such as leadership populations whose records require tighter access controls than standard manager/employee workflows.

Restricted cohort logic must be centralized and reusable.

---

# 19. Testing Architecture

Testing should follow a layered approach.

## 19.1 Unit tests
Focus on:
- service-level business rules
- permission decisions
- state transition logic
- validation helpers

## 19.2 Integration tests
Focus on:
- route-to-service behavior
- database-backed workflow correctness
- auth/permission enforcement
- transactional behavior

## 19.3 End-to-end tests
Focus on:
- critical user journeys
- role-specific access flows
- deployed-environment regression coverage

Playwright is the preferred tool for browser-level end-to-end validation.

A deeper browser-inspection or recursive environment-review workflow should be documented in `AGENTS.md` or a dedicated engineering/testing document, not here.

---

# 20. Engineering Constraints

The following constraints are architectural, not optional preferences:

1. The client is not a trust boundary.
2. Authorization must be server-enforced.
3. All sensitive records must be organization-scoped.
4. Workflow transitions must be explicit and service-controlled.
5. Finalized records that require immutability must not be silently editable.
6. Sandbox-specific shortcuts must not leak into shared environments.
7. Domain modules must remain separated even though deployment is monolithic.



# 21. Architecture Decisions

The following decisions are active unless explicitly changed:

- Trellis is a modular monolith.
- Trellis uses a relational database as the system of record.
- Sandbox and production are separate environments.
- Sandbox may use temporary auth.
- Production auth should use Microsoft Entra ID.
- Production database should use Azure Database for PostgreSQL.
- Authorization is server-enforced.
- Auditability is required for sensitive mutations.
- Restricted cohort access must be supported centrally.
- End-to-end testing should use Playwright.
