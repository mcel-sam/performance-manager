-- CreateEnum
CREATE TYPE "GoalCycleCadence" AS ENUM ('QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "GoalCycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'OFF_TRACK', 'COMPLETE', 'CANCELED');

-- CreateEnum
CREATE TYPE "GoalVisibility" AS ENUM ('ORG', 'TEAM', 'PRIVATE');

-- CreateEnum
CREATE TYPE "KeyResultType" AS ENUM ('PERCENT', 'NUMBER', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "CompetencyAlignmentLabel" AS ENUM ('NONE', 'STRENGTH', 'OPPORTUNITY');

-- CreateTable
CREATE TABLE "TrackGroup" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "trackGroupId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackLevel" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "levelOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competency" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dimensionKey" "CompetencyDimensionKey",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackLevelCompetencyExpectation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "trackLevelId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "expectation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackLevelCompetencyExpectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTrackAssignment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "trackLevelId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTrackAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyAlignmentComment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "employeeTrackAssignmentId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "authorEmployeeId" TEXT NOT NULL,
    "label" "CompetencyAlignmentLabel" NOT NULL DEFAULT 'NONE',
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyAlignmentComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalCycle" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cadence" "GoalCycleCadence" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "GoalCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "ownerEmployeeId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibility" "GoalVisibility" NOT NULL DEFAULT 'TEAM',
    "parentGoalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeyResult" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "KeyResultType" NOT NULL,
    "startValue" DOUBLE PRECISION,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalUpdate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "authorEmployeeId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "progressDelta" DOUBLE PRECISION,
    "snapshotProgressPercent" DOUBLE PRECISION,
    "snapshotCurrentValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalCompetencyLink" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalCompetencyLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalWatcher" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalWatcher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackGroup_orgId_idx" ON "TrackGroup"("orgId");

-- CreateIndex
CREATE INDEX "TrackGroup_orgId_sortOrder_idx" ON "TrackGroup"("orgId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TrackGroup_orgId_slug_key" ON "TrackGroup"("orgId", "slug");

-- CreateIndex
CREATE INDEX "Track_orgId_idx" ON "Track"("orgId");

-- CreateIndex
CREATE INDEX "Track_trackGroupId_idx" ON "Track"("trackGroupId");

-- CreateIndex
CREATE INDEX "Track_orgId_isPublished_idx" ON "Track"("orgId", "isPublished");

-- CreateIndex
CREATE INDEX "Track_trackGroupId_sortOrder_idx" ON "Track"("trackGroupId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Track_orgId_slug_key" ON "Track"("orgId", "slug");

-- CreateIndex
CREATE INDEX "TrackLevel_orgId_idx" ON "TrackLevel"("orgId");

-- CreateIndex
CREATE INDEX "TrackLevel_trackId_idx" ON "TrackLevel"("trackId");

-- CreateIndex
CREATE INDEX "TrackLevel_trackId_levelOrder_idx" ON "TrackLevel"("trackId", "levelOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TrackLevel_trackId_slug_key" ON "TrackLevel"("trackId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "TrackLevel_trackId_levelOrder_key" ON "TrackLevel"("trackId", "levelOrder");

-- CreateIndex
CREATE INDEX "Competency_orgId_idx" ON "Competency"("orgId");

-- CreateIndex
CREATE INDEX "Competency_orgId_dimensionKey_idx" ON "Competency"("orgId", "dimensionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Competency_orgId_slug_key" ON "Competency"("orgId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Competency_orgId_dimensionKey_key" ON "Competency"("orgId", "dimensionKey");

-- CreateIndex
CREATE INDEX "TrackLevelCompetencyExpectation_orgId_idx" ON "TrackLevelCompetencyExpectation"("orgId");

-- CreateIndex
CREATE INDEX "TrackLevelCompetencyExpectation_trackLevelId_idx" ON "TrackLevelCompetencyExpectation"("trackLevelId");

-- CreateIndex
CREATE INDEX "TrackLevelCompetencyExpectation_competencyId_idx" ON "TrackLevelCompetencyExpectation"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackLevelCompetencyExpectation_trackLevelId_competencyId_key" ON "TrackLevelCompetencyExpectation"("trackLevelId", "competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTrackAssignment_employeeId_key" ON "EmployeeTrackAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeTrackAssignment_orgId_idx" ON "EmployeeTrackAssignment"("orgId");

-- CreateIndex
CREATE INDEX "EmployeeTrackAssignment_trackId_idx" ON "EmployeeTrackAssignment"("trackId");

-- CreateIndex
CREATE INDEX "EmployeeTrackAssignment_trackLevelId_idx" ON "EmployeeTrackAssignment"("trackLevelId");

-- CreateIndex
CREATE INDEX "CompetencyAlignmentComment_orgId_idx" ON "CompetencyAlignmentComment"("orgId");

-- CreateIndex
CREATE INDEX "CompetencyAlignmentComment_employeeTrackAssignmentId_idx" ON "CompetencyAlignmentComment"("employeeTrackAssignmentId");

-- CreateIndex
CREATE INDEX "CompetencyAlignmentComment_competencyId_idx" ON "CompetencyAlignmentComment"("competencyId");

-- CreateIndex
CREATE INDEX "CompetencyAlignmentComment_authorEmployeeId_idx" ON "CompetencyAlignmentComment"("authorEmployeeId");

-- CreateIndex
CREATE INDEX "GoalCycle_orgId_idx" ON "GoalCycle"("orgId");

-- CreateIndex
CREATE INDEX "GoalCycle_orgId_status_idx" ON "GoalCycle"("orgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GoalCycle_orgId_name_key" ON "GoalCycle"("orgId", "name");

-- CreateIndex
CREATE INDEX "Goal_orgId_idx" ON "Goal"("orgId");

-- CreateIndex
CREATE INDEX "Goal_ownerEmployeeId_idx" ON "Goal"("ownerEmployeeId");

-- CreateIndex
CREATE INDEX "Goal_cycleId_idx" ON "Goal"("cycleId");

-- CreateIndex
CREATE INDEX "Goal_parentGoalId_idx" ON "Goal"("parentGoalId");

-- CreateIndex
CREATE INDEX "Goal_orgId_cycleId_ownerEmployeeId_idx" ON "Goal"("orgId", "cycleId", "ownerEmployeeId");

-- CreateIndex
CREATE INDEX "Goal_orgId_status_idx" ON "Goal"("orgId", "status");

-- CreateIndex
CREATE INDEX "KeyResult_orgId_idx" ON "KeyResult"("orgId");

-- CreateIndex
CREATE INDEX "KeyResult_goalId_idx" ON "KeyResult"("goalId");

-- CreateIndex
CREATE INDEX "KeyResult_goalId_sortOrder_idx" ON "KeyResult"("goalId", "sortOrder");

-- CreateIndex
CREATE INDEX "GoalUpdate_orgId_idx" ON "GoalUpdate"("orgId");

-- CreateIndex
CREATE INDEX "GoalUpdate_goalId_createdAt_idx" ON "GoalUpdate"("goalId", "createdAt");

-- CreateIndex
CREATE INDEX "GoalUpdate_authorEmployeeId_idx" ON "GoalUpdate"("authorEmployeeId");

-- CreateIndex
CREATE INDEX "GoalCompetencyLink_orgId_idx" ON "GoalCompetencyLink"("orgId");

-- CreateIndex
CREATE INDEX "GoalCompetencyLink_goalId_idx" ON "GoalCompetencyLink"("goalId");

-- CreateIndex
CREATE INDEX "GoalCompetencyLink_competencyId_idx" ON "GoalCompetencyLink"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalCompetencyLink_goalId_competencyId_key" ON "GoalCompetencyLink"("goalId", "competencyId");

-- CreateIndex
CREATE INDEX "GoalWatcher_orgId_idx" ON "GoalWatcher"("orgId");

-- CreateIndex
CREATE INDEX "GoalWatcher_goalId_idx" ON "GoalWatcher"("goalId");

-- CreateIndex
CREATE INDEX "GoalWatcher_userId_idx" ON "GoalWatcher"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalWatcher_goalId_userId_key" ON "GoalWatcher"("goalId", "userId");

-- AddForeignKey
ALTER TABLE "TrackGroup" ADD CONSTRAINT "TrackGroup_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Track" ADD CONSTRAINT "Track_trackGroupId_fkey" FOREIGN KEY ("trackGroupId") REFERENCES "TrackGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLevel" ADD CONSTRAINT "TrackLevel_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLevel" ADD CONSTRAINT "TrackLevel_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLevelCompetencyExpectation" ADD CONSTRAINT "TrackLevelCompetencyExpectation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLevelCompetencyExpectation" ADD CONSTRAINT "TrackLevelCompetencyExpectation_trackLevelId_fkey" FOREIGN KEY ("trackLevelId") REFERENCES "TrackLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackLevelCompetencyExpectation" ADD CONSTRAINT "TrackLevelCompetencyExpectation_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrackAssignment" ADD CONSTRAINT "EmployeeTrackAssignment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrackAssignment" ADD CONSTRAINT "EmployeeTrackAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrackAssignment" ADD CONSTRAINT "EmployeeTrackAssignment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrackAssignment" ADD CONSTRAINT "EmployeeTrackAssignment_trackLevelId_fkey" FOREIGN KEY ("trackLevelId") REFERENCES "TrackLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAlignmentComment" ADD CONSTRAINT "CompetencyAlignmentComment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAlignmentComment" ADD CONSTRAINT "CompetencyAlignmentComment_employeeTrackAssignmentId_fkey" FOREIGN KEY ("employeeTrackAssignmentId") REFERENCES "EmployeeTrackAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAlignmentComment" ADD CONSTRAINT "CompetencyAlignmentComment_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyAlignmentComment" ADD CONSTRAINT "CompetencyAlignmentComment_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCycle" ADD CONSTRAINT "GoalCycle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerEmployeeId_fkey" FOREIGN KEY ("ownerEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "GoalCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_parentGoalId_fkey" FOREIGN KEY ("parentGoalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResult" ADD CONSTRAINT "KeyResult_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeyResult" ADD CONSTRAINT "KeyResult_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalUpdate" ADD CONSTRAINT "GoalUpdate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalUpdate" ADD CONSTRAINT "GoalUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalUpdate" ADD CONSTRAINT "GoalUpdate_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCompetencyLink" ADD CONSTRAINT "GoalCompetencyLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCompetencyLink" ADD CONSTRAINT "GoalCompetencyLink_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalCompetencyLink" ADD CONSTRAINT "GoalCompetencyLink_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalWatcher" ADD CONSTRAINT "GoalWatcher_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalWatcher" ADD CONSTRAINT "GoalWatcher_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalWatcher" ADD CONSTRAINT "GoalWatcher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
