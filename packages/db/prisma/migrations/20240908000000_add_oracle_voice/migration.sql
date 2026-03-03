-- TYBELOS Voice & Meeting Orchestration - Oracle Voice Models
-- Run on fresh DB: prisma migrate deploy

-- CreateTable
CREATE TABLE "OracleVoiceSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "projectId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'MODE_PA',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "correlationId" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleVoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleVoiceChunk" (
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

-- CreateTable
CREATE TABLE "OracleSpeakerProfile" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roleLabel" TEXT,
    "organizationId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleSpeakerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleVoiceprint" (
    "id" TEXT NOT NULL,
    "speakerProfileId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'deterministic',
    "embeddingEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "OracleVoiceprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleTranscriptSegment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "chunkId" TEXT,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "speakerLabel" TEXT NOT NULL DEFAULT 'SPEAKER_1',
    "text" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "speakerName" TEXT,
    "speakerConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleTranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleMeetingEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "emittedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleMeetingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleMeetingArtifact" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contentMarkdown" TEXT,
    "contentJson" JSONB,
    "checksum" TEXT,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "OracleMeetingArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OracleVoiceChunk_sessionId_idx" ON "OracleVoiceChunk"("sessionId");
CREATE INDEX "OracleSpeakerProfile_organizationId_idx" ON "OracleSpeakerProfile"("organizationId");
CREATE INDEX "OracleVoiceprint_speakerProfileId_idx" ON "OracleVoiceprint"("speakerProfileId");
CREATE INDEX "OracleTranscriptSegment_sessionId_idx" ON "OracleTranscriptSegment"("sessionId");
CREATE INDEX "OracleTranscriptSegment_chunkId_idx" ON "OracleTranscriptSegment"("chunkId");
CREATE INDEX "OracleMeetingEvent_sessionId_idx" ON "OracleMeetingEvent"("sessionId");
CREATE INDEX "OracleMeetingArtifact_sessionId_idx" ON "OracleMeetingArtifact"("sessionId");

-- AddForeignKey
ALTER TABLE "OracleVoiceChunk" ADD CONSTRAINT "OracleVoiceChunk_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OracleVoiceprint" ADD CONSTRAINT "OracleVoiceprint_speakerProfileId_fkey" FOREIGN KEY ("speakerProfileId") REFERENCES "OracleSpeakerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OracleTranscriptSegment" ADD CONSTRAINT "OracleTranscriptSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OracleTranscriptSegment" ADD CONSTRAINT "OracleTranscriptSegment_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "OracleVoiceChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OracleMeetingEvent" ADD CONSTRAINT "OracleMeetingEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OracleMeetingArtifact" ADD CONSTRAINT "OracleMeetingArtifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OracleVoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
