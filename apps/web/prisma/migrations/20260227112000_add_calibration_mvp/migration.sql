-- CreateEnum
CREATE TYPE "CalibrationBucket" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "CalibrationSession" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationPlacement" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "performanceBucket" "CalibrationBucket" NOT NULL DEFAULT 'MEDIUM',
    "potentialBucket" "CalibrationBucket" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalibrationSession_orgId_idx" ON "CalibrationSession"("orgId");

-- CreateIndex
CREATE INDEX "CalibrationSession_cycleId_idx" ON "CalibrationSession"("cycleId");

-- CreateIndex
CREATE INDEX "CalibrationSession_orgId_isFinalized_idx" ON "CalibrationSession"("orgId", "isFinalized");

-- CreateIndex
CREATE INDEX "CalibrationPlacement_orgId_idx" ON "CalibrationPlacement"("orgId");

-- CreateIndex
CREATE INDEX "CalibrationPlacement_sessionId_idx" ON "CalibrationPlacement"("sessionId");

-- CreateIndex
CREATE INDEX "CalibrationPlacement_employeeId_idx" ON "CalibrationPlacement"("employeeId");

-- CreateIndex
CREATE INDEX "CalibrationPlacement_sessionId_performanceBucket_potentialBucket_idx" ON "CalibrationPlacement"("sessionId", "performanceBucket", "potentialBucket");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationPlacement_sessionId_employeeId_key" ON "CalibrationPlacement"("sessionId", "employeeId");

-- AddForeignKey
ALTER TABLE "CalibrationSession" ADD CONSTRAINT "CalibrationSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationSession" ADD CONSTRAINT "CalibrationSession_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationPlacement" ADD CONSTRAINT "CalibrationPlacement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationPlacement" ADD CONSTRAINT "CalibrationPlacement_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CalibrationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalibrationPlacement" ADD CONSTRAINT "CalibrationPlacement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
