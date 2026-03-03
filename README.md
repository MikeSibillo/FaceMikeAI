# AI AZTEC Monorepo

pnpm workspace with Turbo. Baseline + Oracle voice schema, NestJS API, JWT auth, admin guard, audit interceptor, org middleware.

## Setup

```bash
pnpm install
cp .env.example .env  # Edit DATABASE_URL, JWT_SECRET
pnpm build
```

## Commands

- `pnpm build` – Build all packages
- `pnpm dev` – Watch mode
- `pnpm db:generate` – Generate Prisma client
- `pnpm db:migrate` – Deploy migrations
- `pnpm db:push` – Push schema (dev)

## Structure

- `packages/db` – Prisma schema, migrations (baseline → oracle extended → oracle voice)
- `apps/api` – NestJS app, `src/oracle/voice/` module