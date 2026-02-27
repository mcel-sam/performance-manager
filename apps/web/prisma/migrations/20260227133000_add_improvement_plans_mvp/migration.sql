-- CreateEnum
CREATE TYPE "ImprovementPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'EXTENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ImprovementPlanOutcome" AS ENUM ('SUCCESSFUL', 'UNSUCCESSFUL');

-- CreateTable
CREATE TABLE "ImprovementPlan" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "subjectEmployeeId" TEXT NOT NULL,
    "managerEmployeeId" TEXT NOT NULL,
    "hrOwnerEmployeeId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expectations" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ImprovementPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "outcome" "ImprovementPlanOutcome",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImprovementPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprovementPlanGoal" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImprovementPlanGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImprovementPlanCheckIn" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImprovementPlanCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImprovementPlan_orgId_idx" ON "ImprovementPlan"("orgId");

-- CreateIndex
CREATE INDEX "ImprovementPlan_orgId_status_idx" ON "ImprovementPlan"("orgId", "status");

-- CreateIndex
CREATE INDEX "ImprovementPlan_subjectEmployeeId_idx" ON "ImprovementPlan"("subjectEmployeeId");

-- CreateIndex
CREATE INDEX "ImprovementPlan_managerEmployeeId_idx" ON "ImprovementPlan"("managerEmployeeId");

-- CreateIndex
CREATE INDEX "ImprovementPlan_hrOwnerEmployeeId_idx" ON "ImprovementPlan"("hrOwnerEmployeeId");

-- CreateIndex
CREATE INDEX "ImprovementPlanGoal_orgId_idx" ON "ImprovementPlanGoal"("orgId");

-- CreateIndex
CREATE INDEX "ImprovementPlanGoal_planId_sortOrder_idx" ON "ImprovementPlanGoal"("planId", "sortOrder");

-- CreateIndex
CREATE INDEX "ImprovementPlanCheckIn_orgId_idx" ON "ImprovementPlanCheckIn"("orgId");

-- CreateIndex
CREATE INDEX "ImprovementPlanCheckIn_planId_checkInAt_idx" ON "ImprovementPlanCheckIn"("planId", "checkInAt");

-- CreateIndex
CREATE INDEX "ImprovementPlanCheckIn_authorUserId_idx" ON "ImprovementPlanCheckIn"("authorUserId");

-- AddForeignKey
ALTER TABLE "ImprovementPlan" ADD CONSTRAINT "ImprovementPlan_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlan" ADD CONSTRAINT "ImprovementPlan_subjectEmployeeId_fkey" FOREIGN KEY ("subjectEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlan" ADD CONSTRAINT "ImprovementPlan_managerEmployeeId_fkey" FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlan" ADD CONSTRAINT "ImprovementPlan_hrOwnerEmployeeId_fkey" FOREIGN KEY ("hrOwnerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlan" ADD CONSTRAINT "ImprovementPlan_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlanGoal" ADD CONSTRAINT "ImprovementPlanGoal_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlanGoal" ADD CONSTRAINT "ImprovementPlanGoal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ImprovementPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlanCheckIn" ADD CONSTRAINT "ImprovementPlanCheckIn_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlanCheckIn" ADD CONSTRAINT "ImprovementPlanCheckIn_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ImprovementPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImprovementPlanCheckIn" ADD CONSTRAINT "ImprovementPlanCheckIn_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
