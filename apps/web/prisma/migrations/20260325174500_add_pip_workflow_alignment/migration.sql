CREATE TYPE "ImprovementPlanTrigger" AS ENUM ('REVIEW', 'CALIBRATION', 'REVIEW_AND_CALIBRATION');

CREATE TYPE "ImprovementPlanCheckInType" AS ENUM ('NOTE', 'CHECKPOINT_30', 'CHECKPOINT_60', 'CHECKPOINT_90', 'STATUS_CHANGE');

ALTER TABLE "ImprovementPlan"
ADD COLUMN "triggerSource" "ImprovementPlanTrigger" NOT NULL DEFAULT 'REVIEW',
ADD COLUMN "reviewCycleId" TEXT,
ADD COLUMN "calibrationSessionId" TEXT;

ALTER TABLE "ImprovementPlanCheckIn"
ADD COLUMN "checkInType" "ImprovementPlanCheckInType" NOT NULL DEFAULT 'NOTE';

CREATE INDEX "ImprovementPlan_reviewCycleId_idx" ON "ImprovementPlan"("reviewCycleId");
CREATE INDEX "ImprovementPlan_calibrationSessionId_idx" ON "ImprovementPlan"("calibrationSessionId");

ALTER TABLE "ImprovementPlan"
ADD CONSTRAINT "ImprovementPlan_reviewCycleId_fkey" FOREIGN KEY ("reviewCycleId") REFERENCES "ReviewCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ImprovementPlan"
ADD CONSTRAINT "ImprovementPlan_calibrationSessionId_fkey" FOREIGN KEY ("calibrationSessionId") REFERENCES "CalibrationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
