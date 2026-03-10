-- Oracle extended: AZTEC ORACLE (SAFE mode)
CREATE TABLE IF NOT EXISTS "OracleAdvisory" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'SAFE',
    "confidence" DOUBLE PRECISION,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleAdvisory_pkey" PRIMARY KEY ("id")
);
