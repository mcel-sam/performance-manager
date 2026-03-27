ALTER TABLE "CalibrationSession"
ADD COLUMN "isRestricted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "CalibrationSession_orgId_isRestricted_idx"
ON "CalibrationSession"("orgId", "isRestricted");
