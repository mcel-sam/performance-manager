-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SuccessionVisibilityScope" AS ENUM ('HR_ONLY', 'MANAGERS_IN_SCOPE');

-- CreateEnum
CREATE TYPE "SuccessionReadiness" AS ENUM ('READY_NOW', 'ONE_TO_TWO_YEARS', 'THREE_TO_FIVE_YEARS', 'FUTURE');

-- CreateEnum
CREATE TYPE "SuccessionAssessmentLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SuccessionNoteVisibility" AS ENUM ('HR_ONLY', 'PLAN_VIEWERS');

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT,
    "incumbentEmployeeId" TEXT,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "status" "PositionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionPlan" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "ownerEmployeeId" TEXT NOT NULL,
    "visibilityScope" "SuccessionVisibilityScope" NOT NULL DEFAULT 'MANAGERS_IN_SCOPE',
    "reviewCadence" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionPlanCollaborator" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuccessionPlanCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionPlanAllowedManager" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "managerEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuccessionPlanAllowedManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionCandidate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "candidateEmployeeId" TEXT NOT NULL,
    "readiness" "SuccessionReadiness" NOT NULL,
    "riskOfLoss" "SuccessionAssessmentLevel",
    "confidence" "SuccessionAssessmentLevel",
    "proposedByRole" "UserRole" NOT NULL,
    "proposedByEmployeeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessionCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionNote" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "authorEmployeeId" TEXT NOT NULL,
    "authorRole" "UserRole" NOT NULL,
    "visibility" "SuccessionNoteVisibility" NOT NULL DEFAULT 'PLAN_VIEWERS',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessionNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessionCandidateSnapshot" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "cycleId" TEXT,
    "scorecardOverallRating" INTEGER,
    "scorecardPercent" DOUBLE PRECISION,
    "finalRatingSource" "FinalRatingSource",
    "calibrationPerformanceBucket" "CalibrationBucket",
    "calibrationPotentialBucket" "CalibrationBucket",
    "snapshotDepartment" TEXT,
    "snapshotTitle" TEXT,
    "snapshotManagerEmployeeId" TEXT,
    "snapshotManagerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessionCandidateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Position_orgId_idx" ON "Position"("orgId");

-- CreateIndex
CREATE INDEX "Position_orgId_department_idx" ON "Position"("orgId", "department");

-- CreateIndex
CREATE INDEX "Position_orgId_status_idx" ON "Position"("orgId", "status");

-- CreateIndex
CREATE INDEX "Position_incumbentEmployeeId_idx" ON "Position"("incumbentEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessionPlan_positionId_key" ON "SuccessionPlan"("positionId");

-- CreateIndex
CREATE INDEX "SuccessionPlan_orgId_idx" ON "SuccessionPlan"("orgId");

-- CreateIndex
CREATE INDEX "SuccessionPlan_ownerEmployeeId_idx" ON "SuccessionPlan"("ownerEmployeeId");

-- CreateIndex
CREATE INDEX "SuccessionPlan_orgId_visibilityScope_idx" ON "SuccessionPlan"("orgId", "visibilityScope");

-- CreateIndex
CREATE INDEX "SuccessionPlanCollaborator_orgId_idx" ON "SuccessionPlanCollaborator"("orgId");

-- CreateIndex
CREATE INDEX "SuccessionPlanCollaborator_employeeId_idx" ON "SuccessionPlanCollaborator"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessionPlanCollaborator_planId_employeeId_key" ON "SuccessionPlanCollaborator"("planId", "employeeId");

-- CreateIndex
CREATE INDEX "SuccessionPlanAllowedManager_orgId_idx" ON "SuccessionPlanAllowedManager"("orgId");

-- CreateIndex
CREATE INDEX "SuccessionPlanAllowedManager_managerEmployeeId_idx" ON "SuccessionPlanAllowedManager"("managerEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessionPlanAllowedManager_planId_managerEmployeeId_key" ON "SuccessionPlanAllowedManager"("planId", "managerEmployeeId");

-- CreateIndex
CREATE INDEX "SuccessionCandidate_orgId_idx" ON "SuccessionCandidate"("orgId");

-- CreateIndex
CREATE INDEX "SuccessionCandidate_planId_sortOrder_idx" ON "SuccessionCandidate"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX "SuccessionCandidate_candidateEmployeeId_idx" ON "SuccessionCandidate"("candidateEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessionCandidate_planId_candidateEmployeeId_key" ON "SuccessionCandidate"("planId", "candidateEmployeeId");

-- CreateIndex
CREATE INDEX "SuccessionNote_orgId_idx" ON "SuccessionNote"("orgId");

-- CreateIndex
CREATE INDEX "SuccessionNote_candidateId_createdAt_idx" ON "SuccessionNote"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "SuccessionNote_authorEmployeeId_idx" ON "SuccessionNote"("authorEmployeeId");

-- CreateIndex
CREATE INDEX "SuccessionCandidateSnapshot_orgId_idx" ON "SuccessionCandidateSnapshot"("orgId");

-- CreateIndex
CREATE INDEX "SuccessionCandidateSnapshot_candidateId_idx" ON "SuccessionCandidateSnapshot"("candidateId");

-- CreateIndex
CREATE INDEX "SuccessionCandidateSnapshot_cycleId_idx" ON "SuccessionCandidateSnapshot"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessionCandidateSnapshot_candidateId_cycleId_key" ON "SuccessionCandidateSnapshot"("candidateId", "cycleId");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_incumbentEmployeeId_fkey" FOREIGN KEY ("incumbentEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlan" ADD CONSTRAINT "SuccessionPlan_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlan" ADD CONSTRAINT "SuccessionPlan_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlan" ADD CONSTRAINT "SuccessionPlan_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlanCollaborator" ADD CONSTRAINT "SuccessionPlanCollaborator_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlanCollaborator" ADD CONSTRAINT "SuccessionPlanCollaborator_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SuccessionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlanCollaborator" ADD CONSTRAINT "SuccessionPlanCollaborator_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlanAllowedManager" ADD CONSTRAINT "SuccessionPlanAllowedManager_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlanAllowedManager" ADD CONSTRAINT "SuccessionPlanAllowedManager_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SuccessionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionPlanAllowedManager" ADD CONSTRAINT "SuccessionPlanAllowedManager_managerEmployeeId_fkey" FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidate" ADD CONSTRAINT "SuccessionCandidate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidate" ADD CONSTRAINT "SuccessionCandidate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SuccessionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidate" ADD CONSTRAINT "SuccessionCandidate_candidateEmployeeId_fkey" FOREIGN KEY ("candidateEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidate" ADD CONSTRAINT "SuccessionCandidate_proposedByEmployeeId_fkey" FOREIGN KEY ("proposedByEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionNote" ADD CONSTRAINT "SuccessionNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionNote" ADD CONSTRAINT "SuccessionNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "SuccessionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionNote" ADD CONSTRAINT "SuccessionNote_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidateSnapshot" ADD CONSTRAINT "SuccessionCandidateSnapshot_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidateSnapshot" ADD CONSTRAINT "SuccessionCandidateSnapshot_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "SuccessionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessionCandidateSnapshot" ADD CONSTRAINT "SuccessionCandidateSnapshot_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
