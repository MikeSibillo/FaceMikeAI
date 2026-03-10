-- TYBELOS Voice & Meeting Orchestration
CREATE TYPE "OracleVoiceSessionMode" AS ENUM ('MODE_PA', 'MODE_DL', 'MODE_GC', 'MODE_SME');
CREATE TYPE "OracleVoiceSessionStatus" AS ENUM ('ACTIVE', 'CLOSED');
CREATE TYPE "OracleMeetingEventType" AS ENUM ('SEGMENT', 'SPEAKER_CHANGE', 'ACTION_ITEM', 'DECISION_PROPOSAL', 'RISK_FLAG', 'MODE_CHANGE', 'INSIGHT', 'UNCERTAIN_SPEAKER');
CREATE TYPE "OracleMeetingArtifactType" AS ENUM ('MINUTES', 'DECISIONS', 'LEGAL_ACT');

CREATE TABLE IF NOT EXISTS "OracleVoiceSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "mode" "OracleVoiceSessionMode" NOT NULL DEFAULT 'MODE_PA',
    "status" "OracleVoiceSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "correlationId" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleVoiceSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OracleVoiceChunk" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/wav',
    "storageKey" TEXT,
    "bytesSha256" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleVoiceChunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OracleTranscriptSegment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chunkId" TEXT NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "speakerLabel" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "speakerName" TEXT,
    "speakerConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleTranscriptSegment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OracleSpeakerProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roleLabel" TEXT,
    "organizationId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleSpeakerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OracleVoiceprint" (
    "id" TEXT NOT NULL,
    "speakerProfileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "embeddingBase64" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleVoiceprint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OracleMeetingEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "OracleMeetingEventType" NOT NULL,
    "payload" JSONB,
    "emittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleMeetingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OracleMeetingArtifact" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "OracleMeetingArtifactType" NOT NULL,
    "contentMarkdown" TEXT,
    "contentJson" JSONB,
    "checksumSha256" TEXT,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "OracleMeetingArtifact_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "OracleVoiceChunk" ADD CONSTRAINT "OracleVoiceChunk_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OracleTranscriptSegment" ADD CONSTRAINT "OracleTranscriptSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OracleTranscriptSegment" ADD CONSTRAINT "OracleTranscriptSegment_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "OracleVoiceChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OracleVoiceprint" ADD CONSTRAINT "OracleVoiceprint_speakerProfileId_fkey" FOREIGN KEY ("speakerProfileId") REFERENCES "OracleSpeakerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OracleMeetingEvent" ADD CONSTRAINT "OracleMeetingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "OracleMeetingArtifact" ADD CONSTRAINT "OracleMeetingArtifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
