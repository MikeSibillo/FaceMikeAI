# TYBELOS Voice - Runbook (DB vuoto)

## Prerequisiti
- PostgreSQL 16+ in esecuzione (es. `docker compose -f docker-compose.test.yml up -d`)
- Variabile `DATABASE_URL` configurata (es. `postgresql://postgres:postgres@localhost:5432/ai_aztec_test`)

## Comandi

```bash
# 1) Install
pnpm install

# 2) DB: generate + migrate
cd packages/db && npx prisma generate && npx prisma migrate deploy && cd ../..

# 3) TypeScript check
cd apps/api && npx tsc --noEmit && cd ../..

# 4) Unit tests (richiede DB)
cd apps/api && VOICE_ENABLED=true pnpm jest oracle-voice.unit.spec.ts --testPathPattern oracle-voice.unit && cd ../..

# 5) E2E tests (richiede DB)
cd apps/api && VOICE_ENABLED=true pnpm jest oracle-voice.e2e-spec.ts --testPathPattern oracle-voice.e2e && cd ../..
```

## Seed opzionale
```bash
cd packages/db && npx prisma db seed && cd ../..
```

## Env
Copiare `.env.example` in `.env` e impostare:
- `VOICE_ENABLED=true`
- `DATABASE_URL=...`
- `JWT_SECRET=...`
