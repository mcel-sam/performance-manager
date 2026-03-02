-- CreateEnum
CREATE TYPE "ReviewQuestionType" AS ENUM ('TEXT', 'SCALE_1_TO_5');

-- CreateEnum
CREATE TYPE "CompetencyDimensionKey" AS ENUM ('VALUES_CULTURE_ALIGNMENT', 'JUDGMENT_DECISION_MAKING', 'SAFETY_COMPLIANCE', 'TECHNICAL_SKILLS', 'QUALITY_OF_WORK', 'COMMUNICATION', 'ACCOUNTABILITY', 'RELATIONSHIP_BUILDING', 'RESULTS_DRIVEN', 'ATTITUDE', 'SERVICE_ORIENTED', 'ADAPTABILITY');

-- CreateEnum
CREATE TYPE "ScorecardMetricKey" AS ENUM ('QUALITY_OF_WORK', 'COMMUNICATION', 'ACCOUNTABILITY', 'RELATIONSHIP_BUILDING', 'RESULTS_DRIVEN', 'ATTITUDE', 'SERVICE_ORIENTED', 'ADAPTABILITY');

-- CreateEnum
CREATE TYPE "FinalRatingSource" AS ENUM ('SCORECARD', 'CALIBRATION');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "department" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "ReviewAnswer" ADD COLUMN     "notObserved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scaleRating" INTEGER;

-- AlterTable
ALTER TABLE "ReviewPacket" ADD COLUMN     "finalRatingSource" "FinalRatingSource",
ADD COLUMN     "scorecardOverallRating" INTEGER,
ADD COLUMN     "snapshotDepartment" TEXT,
ADD COLUMN     "snapshotManagerEmployeeId" TEXT,
ADD COLUMN     "snapshotManagerName" TEXT,
ADD COLUMN     "snapshotTitle" TEXT,
ADD COLUMN     "totalScorecardPercent" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ReviewTemplateQuestion" ADD COLUMN     "dimensionKey" "CompetencyDimensionKey",
ADD COLUMN     "questionType" "ReviewQuestionType" NOT NULL DEFAULT 'TEXT';

-- CreateTable
CREATE TABLE "ReviewCycleScorecardMetric" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "metricKey" "ScorecardMetricKey" NOT NULL,
    "weightPercent" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCycleScorecardMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScorecardMetricResult" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "metricKey" "ScorecardMetricKey" NOT NULL,
    "selfRating" INTEGER,
    "managerRating" INTEGER,
    "selfNotObserved" BOOLEAN NOT NULL DEFAULT false,
    "managerNotObserved" BOOLEAN NOT NULL DEFAULT false,
    "blendedRating" DOUBLE PRECISION,
    "weightPercent" DOUBLE PRECISION NOT NULL,
    "weightedPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScorecardMetricResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewCycleScorecardMetric_orgId_idx" ON "ReviewCycleScorecardMetric"("orgId");

-- CreateIndex
CREATE INDEX "ReviewCycleScorecardMetric_cycleId_idx" ON "ReviewCycleScorecardMetric"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCycleScorecardMetric_cycleId_metricKey_key" ON "ReviewCycleScorecardMetric"("cycleId", "metricKey");

-- CreateIndex
CREATE INDEX "ScorecardMetricResult_orgId_idx" ON "ScorecardMetricResult"("orgId");

-- CreateIndex
CREATE INDEX "ScorecardMetricResult_packetId_idx" ON "ScorecardMetricResult"("packetId");

-- CreateIndex
CREATE UNIQUE INDEX "ScorecardMetricResult_packetId_metricKey_key" ON "ScorecardMetricResult"("packetId", "metricKey");

-- CreateIndex
CREATE INDEX "ReviewPacket_cycleId_scorecardOverallRating_idx" ON "ReviewPacket"("cycleId", "scorecardOverallRating");

-- CreateIndex
CREATE INDEX "ReviewTemplateQuestion_templateId_dimensionKey_idx" ON "ReviewTemplateQuestion"("templateId", "dimensionKey");

-- AddForeignKey
ALTER TABLE "ReviewCycleScorecardMetric" ADD CONSTRAINT "ReviewCycleScorecardMetric_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycleScorecardMetric" ADD CONSTRAINT "ReviewCycleScorecardMetric_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScorecardMetricResult" ADD CONSTRAINT "ScorecardMetricResult_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScorecardMetricResult" ADD CONSTRAINT "ScorecardMetricResult_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "ReviewPacket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
