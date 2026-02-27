# Architecture — Performance Management System (v0.1)

**Status:** Draft (living document)  
**Last updated:** 2026-02-26  
**Source of truth for “how to work here”:** `/AGENTS.md`  
**Source of truth for “what we’re building”:** `/docs/product/PRD.md`

---

## 1) Overview

This system is a greenfield Performance Management product built for an Azure-native environment.

### MVP modules
- Review Cycles
- Review Writing (autosave)
- Review Packets (subject-centric bundle)
- Evidence Panel (context + attach evidence to answers)
- Calibration (9-box + snapshots)
- Improvement Plans (timeline + audit log)

### High-level goals
- Fast iteration with a consistent UX
- Strong security defaults (server-side RBAC + relationship-based permissions)
- Auditability for sensitive actions
- Clean separation of concerns so we can split services later if needed

---

## 2) System context diagram (conceptual)

**Client**
- Web browser (Employees, Managers, HR Admins)

**Application**
- Next.js app (`/apps/web`)
  - UI routes (App Router)
  - API routes (Route Handlers) for MVP

**Data**
- PostgreSQL (primary database)
- Blob storage (attachments) — Azure Storage

**Identity & secrets**
- GitHub Actions OIDC for deploy-time auth
- Managed Identity for runtime access
- Azure Key Vault for secrets

**Observability**
- Azure Log Analytics / Application Insights (OpenTelemetry-compatible logging)

---

## 3) Deployment architecture (Azure)

### Environments
- `dev` (automatic deploy on merge to `main`)
- `staging` (manual or release-tag deploy later)
- `prod` (manual approval + release strategy later)

### Core Azure resources (per environment)
- Resource Group
- Azure Container Registry (ACR)
- Container Apps Environment
- Container App (web)
- Postgres Flexible Server
- Key Vault
- Log Analytics (+ optionally Application Insights)

### CI/CD
- GitHub Actions:
  - CI: lint/typecheck/test on PRs
  - Deploy: build Docker image -> push to ACR -> update Container App image to commit SHA
- Auth: OIDC / Workload Identity Federation (no long-lived secrets)

---

## 4) Repository structure

```
/AGENTS.md
/README.md
/PLAN.md
/docs
  /adr
  /architecture
    ARCHITECTURE.md
  /product
    PRD.md
/infra
  /terraform
    /modules
    /env
      /dev
/apps
  /web
/packages
  /types
```


### Code boundary rules (important)
- UI components live under `apps/web/src/components/*`
- Route Handlers live under `apps/web/src/app/api/*`
- All business logic and DB access must live under:
  - `apps/web/src/server/*`
  - This keeps API routes thin and prevents “logic spaghetti”
- Shared DTOs/types must live in `packages/types` and be imported by both UI and server.

## UI system & guidance conventions

### Design system location
- UI primitives live in: `apps/web/src/components/ui/*`
- Layout components live in: `apps/web/src/components/layout/*`
- Feature/page components live in: `apps/web/src/components/features/*` (or colocated with routes)

### UX standards
- All pages use a standard `PageHeader` (title + optional subtitle + primary CTA slot).
- Loading/empty/error states must use shared components (`Skeleton`, `EmptyState`).
- Right-side drawers are standard for contextual inspection.
- Tooltips and helper text should be concise (1–2 lines) and accessible (keyboard + aria).

### Help & onboarding
- A persistent Help entry point exists in the app shell.
- `/help` is the canonical help page; contextual guidance appears on core flows.
---

## 5) Application architecture (Next.js)

### App Router
- `apps/web/src/app/*` contains page routes and layouts
- Use route groups to keep concerns separated:
  - `(app)` for authenticated application shell
  - `(public)` for public/unauth screens (if any)

### Server layer
`apps/web/src/server/*` should be organized by domain modules:

- `server/auth/*`
- `server/permissions/*`
- `server/audit/*`
- `server/db/*` (Prisma client + helpers)
- `server/reviews/*`
- `server/evidence/*`
- `server/calibration/*`
- `server/improvement-plans/*`

**Rule:** API routes call server services; server services call repositories (Prisma queries).

### API layer (Route Handlers)
- Validate input with Zod
- Enforce authorization
- Call domain services
- Return consistent JSON response shapes
- Emit audit events for mutations

---

## 6) Data architecture (PostgreSQL + Prisma)

### Why relational
The domain is heavily relational and requires strong integrity:
- Cycle → Packets → Submissions → Answers
- Evidence links to answers
- Calibration sessions tie to packets and produce snapshots
- Improvement plans have timelines and audit logs

### Migration strategy
- All schema changes are made through Prisma migrations.
- Migration folders are committed to source control.
- No manual schema edits in shared environments.

### Data partitioning
- Every table includes `org_id` (or has a parent relationship that includes org).
- All queries must scope by org and permission constraints.

---

## 7) Authorization & permission model

### Roles (baseline)
- EMPLOYEE
- MANAGER
- HR_ADMIN
- CALIBRATOR (optional)

### Enforcement principles
- Server-side enforcement for every read/write.
- Never trust client-supplied identifiers without verifying access.
- Relationship-based checks are required (self, manager-of, reviewer-of, calibrator participant, HR admin).
- Visibility policies apply to packets and submissions based on cycle settings.

### Evidence visibility
Evidence items have a visibility level (private, manager-only, shared-with-subject, org-visible).
Counts and lists must not leak existence of items the user cannot access.

---

## 8) Audit logging

### Purpose
- Compliance and traceability for sensitive actions
- Debugging and historical reference

### Requirements
- Every meaningful mutation creates an audit event:
  - cycle status transitions
  - submission submit/return
  - evidence attach/detach
  - calibration move/finalize
  - improvement plan status changes/check-ins

### Storage
- `audit_events` table (immutable append-only semantics)
- Include actor, action, entity type/id, timestamp, and metadata JSON (redacted as needed)

---

## 9) Evidence model

### Evidence sources (MVP)
Evidence can be seeded or come from initial internal modules later:
- Feedback
- Updates
- 1:1 notes
- Goals/OKRs
- Values recognition

### Evidence behaviors
- Show counts by type in the right panel
- Drill-in to list
- Attach evidence to an answer
- Audit log attaches/detaches
- Respect visibility permissions

---

## 10) Calibration (9-box) architecture

### Objects
- CalibrationSession (ties to cycle and cohort)
- Placement (packet_id -> x_bucket/y_bucket + notes)
- Snapshot (immutable JSON on finalize)

### Finalize behavior
- Freeze placements (read-only after finalize)
- Write final outcomes back to packets (bucket or rating, depending on implementation)
- Emit audit event

### Accessibility
- Provide a non-drag alternative to move placements (dropdown or “Move to box” control).

---

## 11) Improvement plans architecture

### Objects
- ImprovementPlan (subject, owners, dates, status)
- Goals/expectations list
- Check-in timeline entries
- Attachments
- Audit events

### Status transitions
- Draft → Active → Completed (successful/unsuccessful) / Extended / Cancelled

### Sensitivity controls
- Default visibility: subject + manager + HR
- Optional “private manager note” can be added later; keep the model extensible.

---

## 12) Observability & reliability

### Logging
- Structured logs
- Correlation ID per request
- Avoid PII in logs

### Metrics (later)
- Request rates, latency, error rate
- Review cycle completion throughput during deadlines

### Resilience
- Fail gracefully on downstream issues (DB or Key Vault)
- Clear user-facing error states (do not expose internal stack traces)

---

## 13) Future evolution (planned)

### Likely next services
- Background worker for:
  - scheduled reminders
  - exports (PDF)
  - nightly rollups/analytics
  - email/notification fanout

### Potential split
If the system grows:
- Split API to `/services/api` (NestJS or equivalent) using the same DB and shared types.

### Networking hardening
- Private endpoints for Postgres and Key Vault
- VNET integration for Container Apps environment

---

## 14) Operational runbook (starter)

### Local run
- `apps/web`: `npm run dev`
- local Postgres via `docker-compose.yml`
- Prisma migrations: `npx prisma migrate dev`

### Deploy
- Merge PR to `main`
- GitHub Action builds/pushes image and updates Container App

### Rollback (basic)
- Container Apps supports revision history; rollback by switching active revision (to be documented in infra runbook later).

---

## 15) Open questions
- Auth source: Entra ID only, or additional identity providers later?
- Small-N privacy threshold (analytics and counts)?
- Rating model (numeric scale vs buckets first)?
- Evidence sources: build internal modules vs integrate external tools?

---