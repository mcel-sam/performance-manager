CREATE TYPE "GoalType" AS ENUM ('PERFORMANCE', 'DEVELOPMENT');

CREATE TYPE "GoalWorkflowStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'CHANGES_REQUESTED',
  'APPROVED',
  'OVERRIDDEN'
);

ALTER TABLE "Goal"
ADD COLUMN "goalType" "GoalType" NOT NULL DEFAULT 'PERFORMANCE',
ADD COLUMN "workflowStatus" "GoalWorkflowStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "workflowNote" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3);

CREATE INDEX "Goal_orgId_workflowStatus_idx" ON "Goal"("orgId", "workflowStatus");
