-- CreateEnum
DO $$ BEGIN
 CREATE TYPE "OracleMode" AS ENUM ('SAFE', 'ADVISORY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "oracle_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" "OracleMode" NOT NULL DEFAULT 'SAFE',
    "provider" TEXT NOT NULL DEFAULT 'deterministic',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oracle_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "oracle_configs_organizationId_key" ON "oracle_configs"("organizationId");
