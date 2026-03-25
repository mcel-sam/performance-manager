# ENVIRONMENT_MATRIX.md

# Trellis — Environment Matrix

## 1. Purpose

This document defines the active environment strategy for Trellis.

It exists to keep the team aligned on:
- what environments exist
- what each environment is for
- what auth and database strategy each environment uses
- what shortcuts are allowed or forbidden
- what level of quality and operational confidence is expected

This document should reduce confusion between local development behavior, sandbox behavior, and future production behavior.

---

## 2. Active Environments

Trellis currently recognizes three environment tiers:

- Local
- Sandbox
- Production

Production may not be fully active yet, but it should still be defined as the target state.

---

## 3. Environment Summary

| Environment | Purpose | Auth | Database | Users | Shared? | Notes |
|---|---|---|---|---|---|---|
| Local | Developer build/test environment | Local/dev-safe auth flow | Local or dev Postgres | Test/dev users | No | Fast iteration, developer shortcuts allowed |
| Sandbox | HR testing and mock runs | Supabase Auth | Sandbox Postgres | Real sandbox users | Yes | Must behave like a real system |
| Production | Live organizational usage | Microsoft Entra ID | Azure Database for PostgreSQL | Real users | Yes | Enterprise-ready environment |

---

## 4. Local Environment

## 4.1 Purpose
The local environment exists for:
- development
- debugging
- low-risk experimentation
- component and workflow implementation
- fast iteration

## 4.2 Allowed characteristics
Local may allow:
- local-only auth shortcuts
- seeded test data
- developer-oriented reset flows
- direct DB inspection
- rapid environment resets
- incomplete feature testing

## 4.3 Forbidden assumptions
Local must not be treated as proof that the shared sandbox is safe or complete.

Local behavior may differ from shared environments in:
- auth provider
- available data
- secret management
- operational stability

## 4.4 Quality expectation
Local should be good enough to:
- build features
- run targeted checks
- validate logic before pushing to shared environments

Local does not need production-grade operational constraints.

---

## 5. Sandbox Environment

## 5.1 Purpose
The sandbox environment exists for:
- HR testing
- realistic mock runs
- end-to-end workflow validation
- role-based behavior validation
- internal feedback before production hardening

## 5.2 Core principle
Sandbox must behave like a real system.

It is not a toy demo environment and should not expose developer-only shortcuts to shared users.

## 5.3 Auth strategy
Sandbox uses:
- Supabase Auth

Requirements:
- real login accounts
- stable role mapping in the application
- no public role-switching UI
- no dev-only reset/login shortcuts exposed to shared users

## 5.4 Database strategy
Sandbox uses:
- sandbox-grade Postgres

Requirements:
- realistic relational data
- persistent enough for testing cycles
- isolated from local and future production

## 5.5 User expectations
Sandbox users are:
- HR test users
- managers
- employees
- super admin testers

These are real sandbox accounts, not temporary fake role toggles.

## 5.6 Operational expectations
Sandbox should support:
- stable login
- realistic workflow behavior
- clear role-based access
- safe environment updates
- believable product behavior

## 5.7 Forbidden behavior
Sandbox must not expose:
- local developer impersonation shortcuts
- dev-only demo reset routes
- unrestricted role switching
- broken or obviously fake workflow paths

## 5.8 Quality expectation
Sandbox should be:
- stable enough for mock runs
- polished enough to build trust
- scoped tightly to vanilla workflows
- validated in browser before handoff

---

## 6. Production Environment

## 6.1 Purpose
Production exists for live organizational usage.

## 6.2 Auth strategy
Production should use:
- Microsoft Entra ID

Requirements:
- SSO-based login
- stable identity mapping
- enterprise-ready session behavior
- secure integration with the Trellis user model

## 6.3 Database strategy
Production should use:
- Azure Database for PostgreSQL

Requirements:
- production-grade reliability
- secure connectivity
- backup and recovery planning
- migration discipline

## 6.4 Operational expectations
Production should support:
- stable releases
- secure secrets handling
- operational monitoring
- auditability
- controlled rollout and recovery

## 6.5 Quality expectation
Production should satisfy:
- strong permission confidence
- hardened auth behavior
- audit coverage for sensitive workflows
- stable deployment and incident response expectations

---

## 7. Auth Matrix

| Environment | Auth Provider | Notes |
|---|---|---|
| Local | Local/dev-safe auth flow or equivalent | Can include development shortcuts if isolated to local use |
| Sandbox | Supabase Auth | Temporary but real shared auth path |
| Production | Microsoft Entra ID | Long-term enterprise auth path |

### Auth principles
- auth provider choice may vary by environment
- application role and organization mapping must remain application-controlled
- provider identity does not replace server-side authorization

---

## 8. Database Matrix

| Environment | Database Strategy | Notes |
|---|---|---|
| Local | Local or dev Postgres | Fast iteration and testing |
| Sandbox | Sandbox Postgres | Shared realistic data for HR testing |
| Production | Azure Database for PostgreSQL | Long-term production database target |

### Database principles
- all environments should preserve the same broad relational model
- sandbox should behave close to production in schema and workflow behavior
- local data may be more disposable than sandbox or production data

---

## 9. Feature Exposure Matrix

| Capability | Local | Sandbox | Production |
|---|---|---|---|
| Developer shortcuts | Allowed if local-only | Not allowed | Not allowed |
| Real user accounts | Optional | Required | Required |
| Vanilla workflows | Required | Required | Required |
| Incomplete features visible | Allowed for development | No | No |
| Restricted talent workflows | Testable | Required if in scope | Required |
| Fake demo behavior | Acceptable only for isolated local use | No | No |

---

## 10. Secrets and Config

## 10.1 Local
- `.env`-style local config is acceptable
- local secrets must not be committed
- local config may be developer-specific

## 10.2 Sandbox
- sandbox secrets must be managed as shared environment secrets
- secrets should not be embedded in code or checked into the repo
- sandbox config should be stable enough for repeatable deployments

## 10.3 Production
- production secrets must use managed secret handling
- production config must be tightly controlled
- production secret access should be restricted and auditable where possible

---

## 11. Shortcut Policy

## 11.1 Local
Allowed:
- dev login shortcuts
- role toggling for local debugging
- seeded data resets
- temporary developer workflows

## 11.2 Sandbox
Forbidden:
- local dev auth shortcuts
- public role switching
- reset endpoints meant only for local demo use
- any shortcut that weakens trust in the sandbox

## 11.3 Production
Forbidden:
- all developer shortcuts
- all fake/demo auth behavior
- all unsafe debugging shortcuts

---

## 12. Validation Expectations by Environment

## Local
Expected:
- targeted checks
- local debugging
- iterative validation
- low-cost testing during build

## Sandbox
Expected:
- role-based browser validation
- end-to-end workflow validation
- trust and UX review
- handoff readiness checks

## Production
Expected:
- hardened deployment checks
- controlled rollout validation
- operational monitoring
- production incident readiness

---

## 13. Deployment Expectations by Environment

## Local
- manual startup is acceptable
- direct configuration is acceptable
- instability is tolerable during active development

## Sandbox
- deployment should be repeatable
- config should be controlled
- updates should not be chaotic
- shared usage must be respected

## Production
- deployment should be traceable
- rollback/recovery expectations should be defined
- release confidence should be higher than sandbox
- operational ownership should be clear

---

## 14. Data Expectations by Environment

## Local
- disposable data is acceptable
- synthetic users are acceptable
- resettable workflows are acceptable

## Sandbox
- realistic org structure is required
- realistic roles are required
- realistic workflow data is required
- data should support believable HR mock runs

## Production
- live organizational data
- real identity and permission boundaries
- production retention and backup expectations

---

## 15. Promotion Path

Current intended path:

1. Build and validate locally
2. Deploy and validate in sandbox
3. Harden auth, database, and operations
4. Move to production-ready environment

### Current Trellis-specific path
- local development may use local-safe auth and test workflows
- sandbox uses Supabase Auth and realistic shared testing
- production later moves to Entra ID and Azure PostgreSQL

---

## 16. Current Environment Decisions

The following decisions are active unless explicitly changed:

- Local, Sandbox, and Production are the three active environment tiers
- Sandbox is the current shared validation target
- Sandbox uses Supabase Auth
- Production uses Microsoft Entra ID
- Production database target is Azure Database for PostgreSQL
- Sandbox must behave like a real system
- Developer shortcuts are local-only
- Incomplete or unstable features must not be exposed in sandbox