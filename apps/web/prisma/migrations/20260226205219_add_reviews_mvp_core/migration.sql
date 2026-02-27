-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'LOCKED', 'RELEASED');

-- CreateEnum
CREATE TYPE "CycleVisibilityPolicy" AS ENUM ('MANAGER_ONLY', 'EMPLOYEE_AFTER_RELEASE');

-- CreateEnum
CREATE TYPE "ReviewRelationship" AS ENUM ('SELF', 'MANAGER', 'PEER', 'UPWARD');

-- CreateEnum
CREATE TYPE "ReviewSubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('FEEDBACK', 'UPDATE', 'ONE_ON_ONE', 'GOAL', 'VALUE_RECOGNITION');

-- CreateEnum
CREATE TYPE "EvidenceVisibility" AS ENUM ('PRIVATE', 'MANAGER_ONLY', 'SHARED_WITH_SUBJECT', 'ORG_VISIBLE');

-- CreateTable
CREATE TABLE "ReviewTemplate" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTemplateQuestion" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewTemplateQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCycle" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
    "visibilityPolicy" "CycleVisibilityPolicy" NOT NULL DEFAULT 'EMPLOYEE_AFTER_RELEASE',
    "selfReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "managerReviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "peerReviewCount" INTEGER NOT NULL DEFAULT 0,
    "upwardReviewCount" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewPacket" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "subjectEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewPacket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSubmission" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "subjectEmployeeId" TEXT NOT NULL,
    "reviewerEmployeeId" TEXT NOT NULL,
    "relationship" "ReviewRelationship" NOT NULL,
    "status" "ReviewSubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAnswer" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "subjectEmployeeId" TEXT NOT NULL,
    "authorEmployeeId" TEXT,
    "type" "EvidenceType" NOT NULL,
    "visibility" "EvidenceVisibility" NOT NULL DEFAULT 'PRIVATE',
    "content" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerEvidenceLink" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "evidenceItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerEvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewTemplate_orgId_idx" ON "ReviewTemplate"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTemplate_orgId_name_key" ON "ReviewTemplate"("orgId", "name");

-- CreateIndex
CREATE INDEX "ReviewTemplateQuestion_orgId_idx" ON "ReviewTemplateQuestion"("orgId");

-- CreateIndex
CREATE INDEX "ReviewTemplateQuestion_templateId_sortOrder_idx" ON "ReviewTemplateQuestion"("templateId", "sortOrder");

-- CreateIndex
CREATE INDEX "ReviewCycle_orgId_idx" ON "ReviewCycle"("orgId");

-- CreateIndex
CREATE INDEX "ReviewCycle_orgId_status_idx" ON "ReviewCycle"("orgId", "status");

-- CreateIndex
CREATE INDEX "ReviewPacket_orgId_idx" ON "ReviewPacket"("orgId");

-- CreateIndex
CREATE INDEX "ReviewPacket_cycleId_idx" ON "ReviewPacket"("cycleId");

-- CreateIndex
CREATE INDEX "ReviewPacket_subjectEmployeeId_idx" ON "ReviewPacket"("subjectEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPacket_cycleId_subjectEmployeeId_key" ON "ReviewPacket"("cycleId", "subjectEmployeeId");

-- CreateIndex
CREATE INDEX "ReviewSubmission_orgId_idx" ON "ReviewSubmission"("orgId");

-- CreateIndex
CREATE INDEX "ReviewSubmission_cycleId_status_idx" ON "ReviewSubmission"("cycleId", "status");

-- CreateIndex
CREATE INDEX "ReviewSubmission_subjectEmployeeId_idx" ON "ReviewSubmission"("subjectEmployeeId");

-- CreateIndex
CREATE INDEX "ReviewSubmission_reviewerEmployeeId_idx" ON "ReviewSubmission"("reviewerEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSubmission_cycleId_subjectEmployeeId_reviewerEmployee_key" ON "ReviewSubmission"("cycleId", "subjectEmployeeId", "reviewerEmployeeId", "relationship");

-- CreateIndex
CREATE INDEX "ReviewAnswer_orgId_idx" ON "ReviewAnswer"("orgId");

-- CreateIndex
CREATE INDEX "ReviewAnswer_submissionId_idx" ON "ReviewAnswer"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewAnswer_submissionId_questionId_key" ON "ReviewAnswer"("submissionId", "questionId");

-- CreateIndex
CREATE INDEX "EvidenceItem_orgId_idx" ON "EvidenceItem"("orgId");

-- CreateIndex
CREATE INDEX "EvidenceItem_subjectEmployeeId_type_idx" ON "EvidenceItem"("subjectEmployeeId", "type");

-- CreateIndex
CREATE INDEX "AnswerEvidenceLink_orgId_idx" ON "AnswerEvidenceLink"("orgId");

-- CreateIndex
CREATE INDEX "AnswerEvidenceLink_evidenceItemId_idx" ON "AnswerEvidenceLink"("evidenceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerEvidenceLink_answerId_evidenceItemId_key" ON "AnswerEvidenceLink"("answerId", "evidenceItemId");

-- CreateIndex
CREATE INDEX "AuditEvent_orgId_createdAt_idx" ON "AuditEvent"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_idx" ON "AuditEvent"("actorUserId");

-- AddForeignKey
ALTER TABLE "ReviewTemplate" ADD CONSTRAINT "ReviewTemplate_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTemplateQuestion" ADD CONSTRAINT "ReviewTemplateQuestion_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTemplateQuestion" ADD CONSTRAINT "ReviewTemplateQuestion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReviewTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReviewTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewPacket" ADD CONSTRAINT "ReviewPacket_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewPacket" ADD CONSTRAINT "ReviewPacket_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewPacket" ADD CONSTRAINT "ReviewPacket_subjectEmployeeId_fkey" FOREIGN KEY ("subjectEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSubmission" ADD CONSTRAINT "ReviewSubmission_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSubmission" ADD CONSTRAINT "ReviewSubmission_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSubmission" ADD CONSTRAINT "ReviewSubmission_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "ReviewPacket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSubmission" ADD CONSTRAINT "ReviewSubmission_subjectEmployeeId_fkey" FOREIGN KEY ("subjectEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSubmission" ADD CONSTRAINT "ReviewSubmission_reviewerEmployeeId_fkey" FOREIGN KEY ("reviewerEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAnswer" ADD CONSTRAINT "ReviewAnswer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAnswer" ADD CONSTRAINT "ReviewAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ReviewSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewAnswer" ADD CONSTRAINT "ReviewAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ReviewTemplateQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_subjectEmployeeId_fkey" FOREIGN KEY ("subjectEmployeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerEvidenceLink" ADD CONSTRAINT "AnswerEvidenceLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerEvidenceLink" ADD CONSTRAINT "AnswerEvidenceLink_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "ReviewAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerEvidenceLink" ADD CONSTRAINT "AnswerEvidenceLink_evidenceItemId_fkey" FOREIGN KEY ("evidenceItemId") REFERENCES "EvidenceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
