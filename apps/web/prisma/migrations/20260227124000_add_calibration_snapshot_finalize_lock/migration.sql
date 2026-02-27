-- CreateTable
CREATE TABLE "CalibrationSnapshot" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationSnapshot_sessionId_key" ON "CalibrationSnapshot"("sessionId");

-- CreateIndex
CREATE INDEX "CalibrationSnapshot_orgId_idx" ON "CalibrationSnapshot"("orgId");

-- AddForeignKey
ALTER TABLE "CalibrationSnapshot" ADD CONSTRAINT "CalibrationSnapshot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationSnapshot" ADD CONSTRAINT "CalibrationSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CalibrationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
