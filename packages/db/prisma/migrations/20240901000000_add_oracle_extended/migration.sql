-- CreateTable
CREATE TABLE "OracleProjectConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OracleProjectConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OracleProjectConfig_projectId_key" ON "OracleProjectConfig"("projectId");
