# ADR 0001 — Initial stack and deployment approach

**Status:** Accepted  
**Date:** 2026-02-26  
**Deciders:** Product/Engineering  
**Context:** Greenfield repo for a Performance Management system (reviews, packets, evidence, calibration, improvement plans).

---

## Context

We are building a new Performance Management product from scratch in an Azure-native company.  
We want:
- Fast iteration on UI + backend logic
- Strong security defaults (RBAC, audit logging)
- Clear scalability path
- Repeatable infrastructure via IaC
- A setup that works well with coding agents (Codex) and reduces ambiguity

The product domain is highly relational (cycles → packets → submissions → answers, evidence links, calibration snapshots, improvement plan timelines), and includes sensitive data requiring strict server-side permission checks and auditable changes.

---

## Decision

We will use the following baseline stack for MVP and early iterations:

### Application
- **Next.js (App Router) + TypeScript** as the primary application in `/apps/web`
- Backend implemented initially using **Next.js Route Handlers** (`/app/api/*`)
- Shared contracts/types in `/packages/types`

### Data
- **PostgreSQL** as the primary database
- **Prisma** as the ORM + schema/migration tool

### Infrastructure and deployment
- **Terraform** as the Infrastructure as Code tool in `/infra/terraform`
- **Azure Container Apps** as the deployment target for the Next.js application
- **Azure Container Registry (ACR)** to store container images
- **GitHub Actions** for CI/CD:
  - CI on pull requests (lint/typecheck/test)
  - Deploy on merge to `main`
  - Azure authentication via **OIDC / Workload Identity Federation** (no long-lived secrets)

### Secrets and identity
- Runtime secrets stored in **Azure Key Vault**
- Applications access Key Vault via **Managed Identity**
- No secrets committed to the repository

---

## Rationale

### Why Next.js (App Router)
- Provides a strong UI framework with routing/layout conventions suited to app-like screens (reviews, calibration, plans).
- Supports full-stack iteration (UI + API in one deployable) for faster MVP delivery.
- TypeScript enables strong compile-time guardrails, especially helpful when using coding agents.

### Why Route Handlers for backend (initially)
- Reduces early complexity: one codebase, one deployment.
- Enables fast feature development while we validate workflows and data model.
- We can split into a dedicated API service later if needed without invalidating product work.

### Why PostgreSQL
- Excellent fit for relational domain and transactional integrity (packets/submissions/answers, audit logs).
- Strong indexing and query capabilities for list views and reporting foundations.

### Why Prisma
- Schema-as-code + migrations reduces schema drift across developers and environments.
- Type-safe queries improve correctness and speed of iteration.
- Works well with TypeScript and helps agents avoid invalid queries.

### Why Terraform
- Aligns with org preference and provides consistent, reviewable IaC.
- Strong ecosystem for Azure resources and reusable modules.

### Why Azure Container Apps
- Container-first deployment well-suited to Next.js SSR and server runtime.
- Scales and operates with lower overhead than Kubernetes for MVP.
- Works cleanly with ACR and GitHub Actions.

### Why GitHub Actions + OIDC
- Secure automation with short-lived credentials (OIDC).
- Simple “merge to main → deploy” flow that supports rapid iteration.

---

## Consequences

### Positive
- Fast MVP velocity with fewer moving parts.
- Strong security baseline (no secrets in repo; managed identity; server-side permissions).
- Repeatable environment creation via Terraform.
- Clear path to grow (add workers/jobs, split services, add more infra modules).

### Negative / tradeoffs
- Next.js Route Handlers can become crowded as the product grows; we must enforce clean boundaries (`/src/server/*`) to avoid a monolith.
- Some workloads (scheduled reminders, heavy exports) will likely require a separate worker service later.
- Prisma may not cover every complex reporting query; we may use raw SQL for specific analytics needs.

---

## Guardrails / follow-ups

1. Enforce server-side authorization for all endpoints (no client-side security).
2. Implement audit logging for all sensitive mutations from day one.
3. Create Terraform module structure:
   - `modules/acr`, `modules/containerapp`, `modules/postgres`, `modules/keyvault`, `modules/observability`
4. Add CI workflow:
   - lint/typecheck/test/build
5. Add deploy workflow:
   - build/push image to ACR
   - update Container App image tag to commit SHA
6. Revisit “split API service” decision when any of these occur:
   - multiple clients beyond web
   - significant background processing
   - scaling/security boundaries require separation

---

## Alternatives considered (not chosen)

- **App Service** instead of Container Apps: simpler in some orgs, but less container-native and less flexible for multi-service growth.
- **Static Web Apps**: can be limiting for SSR-heavy authenticated app flows.
- **Separate backend (NestJS) from day one**: stronger separation but slower initial iteration.
- **Drizzle/Kysely instead of Prisma**: more SQL-explicit, but less “schema + migrations + type safety” integration out of the box.

---

## References
- Repo guidance: `/AGENTS.md`
- Product spec: `/docs/product/PRD.md`