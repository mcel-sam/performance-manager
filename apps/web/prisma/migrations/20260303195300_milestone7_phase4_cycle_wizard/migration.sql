-- CreateEnum
CREATE TYPE "PeerAssignmentMode" AS ENUM ('HR_ASSIGNED', 'NOMINATION');

-- AlterTable
ALTER TABLE "ReviewCycle" ADD COLUMN     "managerReviewDueAt" TIMESTAMP(3),
ADD COLUMN     "peerAssignmentMode" "PeerAssignmentMode" NOT NULL DEFAULT 'HR_ASSIGNED',
ADD COLUMN     "peerReviewDueAt" TIMESTAMP(3),
ADD COLUMN     "selfReviewDueAt" TIMESTAMP(3),
ADD COLUMN     "upwardReviewDueAt" TIMESTAMP(3),
ADD COLUMN     "upwardReviewsForManagersOnly" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ReviewSubmission" ADD COLUMN     "dueAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ReviewSubmission_cycleId_dueAt_idx" ON "ReviewSubmission"("cycleId", "dueAt");
