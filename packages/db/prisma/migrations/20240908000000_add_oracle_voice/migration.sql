-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "VoiceSessionMode" AS ENUM ('MODE_PA', 'MODE_DL', 'MODE_GC', 'MODE_SME');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "VoiceSessionStatus" AS ENUM ('ACTIVE', 'CLOSED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "MeetingEventType" AS ENUM ('ACTION_ITEM', 'DECISION_PROPOSAL', 'RISK_FLAG', 'MODE_CHANGE', 'INSIGHT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "ArtifactType" AS ENUM ('MINUTES', 'DECISIONS', 'LEGAL_ACT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_voice_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "mode" "VoiceSessionMode" NOT NULL DEFAULT 'MODE_PA',
    "status" "VoiceSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "correlationId" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oracle_voice_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_voice_chunks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/wav',
    "storageKey" TEXT,
    "bytesSha256" TEXT NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oracle_voice_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_transcript_segments" (
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

    CONSTRAINT "oracle_transcript_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_speaker_profiles" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roleLabel" TEXT,
    "organizationId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oracle_speaker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_voiceprints" (
    "id" TEXT NOT NULL,
    "speakerProfileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "embeddingBase64" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oracle_voiceprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_meeting_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "MeetingEventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "emittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oracle_meeting_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_meeting_artifacts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "contentMarkdown" TEXT,
    "contentJson" JSONB,
    "checksumSha256" TEXT,
    "generatedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oracle_meeting_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oracle_voice_sessions_correlationId_key" ON "oracle_voice_sessions"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oracle_voice_chunks_sessionId_chunkIndex_key" ON "oracle_voice_chunks"("sessionId", "chunkIndex");

-- AddForeignKey (idempotent: only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oracle_voice_sessions_projectId_fkey'
  ) THEN
    ALTER TABLE "oracle_voice_sessions" ADD CONSTRAINT "oracle_voice_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oracle_voice_chunks_sessionId_fkey'
  ) THEN
    ALTER TABLE "oracle_voice_chunks" ADD CONSTRAINT "oracle_voice_chunks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "oracle_voice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oracle_transcript_segments_sessionId_fkey'
  ) THEN
    ALTER TABLE "oracle_transcript_segments" ADD CONSTRAINT "oracle_transcript_segments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "oracle_voice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oracle_transcript_segments_chunkId_fkey'
  ) THEN
    ALTER TABLE "oracle_transcript_segments" ADD CONSTRAINT "oracle_transcript_segments_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "oracle_voice_chunks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oracle_voiceprints_speakerProfileId_fkey'
  ) THEN
    ALTER TABLE "oracle_voiceprints" ADD CONSTRAINT "oracle_voiceprints_speakerProfileId_fkey" FOREIGN KEY ("speakerProfileId") REFERENCES "oracle_speaker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oracle_meeting_events_sessionId_fkey'
  ) THEN
    ALTER TABLE "oracle_meeting_events" ADD CONSTRAINT "oracle_meeting_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "oracle_voice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'oracle_meeting_artifacts_sessionId_fkey'
  ) THEN
    ALTER TABLE "oracle_meeting_artifacts" ADD CONSTRAINT "oracle_meeting_artifacts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "oracle_voice_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
