-- AlterTable
ALTER TABLE "CalibrationSession" ADD COLUMN     "performanceAxisConfig" JSONB,
ADD COLUMN     "potentialAxisConfig" JSONB,
ADD COLUMN     "roleGroup" TEXT;

-- CreateTable
CREATE TABLE "CalibrationSessionParticipant" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationSessionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalibrationSessionParticipant_orgId_idx" ON "CalibrationSessionParticipant"("orgId");

-- CreateIndex
CREATE INDEX "CalibrationSessionParticipant_sessionId_idx" ON "CalibrationSessionParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "CalibrationSessionParticipant_userId_idx" ON "CalibrationSessionParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationSessionParticipant_sessionId_userId_key" ON "CalibrationSessionParticipant"("sessionId", "userId");

-- AddForeignKey
ALTER TABLE "CalibrationSessionParticipant" ADD CONSTRAINT "CalibrationSessionParticipant_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationSessionParticipant" ADD CONSTRAINT "CalibrationSessionParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CalibrationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationSessionParticipant" ADD CONSTRAINT "CalibrationSessionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
