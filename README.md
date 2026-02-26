# Performance Manager

Performance Management System monorepo for reviews, calibration, and improvement plans.

## Repository layout

- `apps/web` - Next.js application (App Router UI + Route Handlers API)
- `packages/types` - shared DTOs and contract types
- `infra/terraform` - Terraform stacks and modules
- `docs` - product, architecture, and ADR documentation

## Core docs

- Product requirements: `docs/product/PRD.md`
- Architecture: `docs/architecture/ARCHITECTURE.md`
- ADR stack decision: `docs/adr/0001-stack.md`
- Repo coding rules: `AGENTS.md`

## Milestone 0 features

- Local PostgreSQL dev database via `docker-compose.yml`
- Prisma schema + migration baseline (`Org`, `User`, `Employee`)
- Health route: `GET /api/health`
- Reviews foundation page: `GET /performance/reviews`
- Root Dockerfile for local image build/run
- PR CI workflow (`.github/workflows/ci.yml`)

## Local setup

1. Start Postgres from repo root:

```bash
docker compose up -d
```

2. Install app dependencies and migrate DB:

```bash
cd apps/web
cp .env.example .env.local
npm install
npx prisma migrate dev
```

3. Run the app:

```bash
npm run dev
```

4. Open the milestone routes:

- `http://localhost:3000/api/health`
- `http://localhost:3000/performance/reviews`

## Quality gates

Run from `apps/web`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Containerization

Dockerfile location: repo root (`/Dockerfile`)

Build and run from repo root:

```bash
docker build -t performance-manager .
docker run --rm -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/perf?schema=public \
  performance-manager
```

## Notes

- Do not commit secrets. Use `.env.local` for local development.
- Keep API routes thin and put reusable server logic in `apps/web/src/server/*`.
- Commit Prisma migrations for every schema change.
