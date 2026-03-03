# TYBELOS Voice & Meeting Orchestration — Release Artefatti

**Prodotto:** AI AZTEC + AZTEC ORACLE (SAFE)  
**Feature:** TYBELOS Voice  
**Identità:** TYBELOS (non rinominabile)

---

## 1. Checklist

| Step | Status | Note |
|------|--------|------|
| `pnpm install` | ✅ | Dipendenze installate |
| `tsc --noEmit` | ✅ | Build typecheck OK |
| `prisma migrate deploy` | ⚠️ | Richiede PostgreSQL attivo (localhost:5432) |
| Unit tests | ⚠️ | Richiede DB attivo |
| E2E tests | ⚠️ | Richiede DB attivo |

**Per eseguire il runbook completo:**
```bash
# Avvia Postgres (Docker)
docker compose up -d

# Oppure imposta DATABASE_URL verso un'istanza Postgres esistente
export DATABASE_URL="postgresql://user:pass@host:5432/ai_aztec"
```

---

## 2. Migrations (ordine)

1. `00000000000000_baseline` — Organizations, Users, Projects, Tasks, Milestones
2. `20240901000000_add_oracle_extended` — OracleConfig, OracleMode
3. `20240908000000_add_oracle_voice` — OracleVoiceSession, OracleVoiceChunk, OracleTranscriptSegment, OracleSpeakerProfile, OracleVoiceprint, OracleMeetingEvent, OracleMeetingArtifact

Percorso completo: `packages/db/prisma/migrations/`

---

## 3. Patch

**File:** `FINAL-DIFF-ORACLE-VOICE.patch`

Unified diff applicabile con:
```bash
git apply FINAL-DIFF-ORACLE-VOICE.patch
```

---

## 4. Zip

**File:** `ai-aztec-oracle-voice-complete.zip`

Contenuto: monorepo completo escludendo node_modules, dist, .next, .git, coverage, .turbo.

---

## 5. SHA-256

```
eb487511056fbde521e74e05f86e177890640bb9f3b2c992aacb96dfd9f98865  ai-aztec-oracle-voice-complete.zip
```

---

## Runbook (DB vuoto)

```bash
# 1. Installa
pnpm install

# 2. DB
cd packages/db && npx prisma generate && npx prisma migrate deploy && cd ../..

# 3. Typecheck
cd apps/api && tsc --noEmit && cd ../..

# 4. Unit tests
cd apps/api && pnpm jest oracle-voice.unit.spec.ts --testPathPattern oracle-voice && cd ../..

# 5. E2E tests
cd apps/api && pnpm jest oracle-voice.e2e-spec.ts --testPathPattern oracle-voice && cd ../..
```

---

## Env

```
VOICE_ENABLED=true
VOICE_PROVIDER=deterministic
DIARIZATION_PROVIDER=deterministic
SPEAKER_ID_PROVIDER=deterministic
VOICE_MATCH_THRESHOLD=0.85
VOICE_STORAGE=local
```
