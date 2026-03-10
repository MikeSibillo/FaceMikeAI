# TYBELOS Voice — Runbook (DB vuoto)

## Prerequisiti
- PostgreSQL 15+ in esecuzione (es. `docker compose up -d postgres`)
- Node.js 18+
- pnpm

## Variabili d'ambiente
Copia `apps/api/.env.example` in `apps/api/.env` e imposta:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aztec"
VOICE_ENABLED=true
VOICE_PROVIDER=deterministic
DIARIZATION_PROVIDER=deterministic
SPEAKER_ID_PROVIDER=deterministic
VOICE_MATCH_THRESHOLD=0.85
VOICE_STORAGE=local
```

## Runbook

1. **pnpm install**
   ```bash
   pnpm install
   ```

2. **Prisma generate + migrate**
   ```bash
   cd packages/db && npx prisma generate && npx prisma migrate deploy && cd ../..
   ```

3. **TypeScript check**
   ```bash
   cd apps/api && tsc --noEmit && cd ../..
   ```

4. **Unit tests**
   ```bash
   cd apps/api && pnpm jest oracle-voice.unit.spec.ts --testPathPattern oracle-voice && cd ../..
   ```

5. **E2E tests**
   ```bash
   cd apps/api && pnpm jest oracle-voice.e2e-spec.ts --config ./test/jest-e2e.json --testPathPattern oracle-voice && cd ../..
   ```

## Migrations (ordine)
1. `00000000000000_baseline`
2. `20240901000000_add_oracle_extended`
3. `20240908000000_add_oracle_voice`

## Seed opzionale
```bash
cd packages/db && npx prisma db seed
```
