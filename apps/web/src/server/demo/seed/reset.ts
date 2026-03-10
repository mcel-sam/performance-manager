import { prisma } from "@/server/db/prisma";

export async function wipeAllLocalData() {
  await prisma.$transaction(async (tx) => {
    await tx.answerEvidenceLink.deleteMany();
    await tx.successionNote.deleteMany();
    await tx.successionCandidateSnapshot.deleteMany();
    await tx.successionCandidate.deleteMany();
    await tx.successionPlanCollaborator.deleteMany();
    await tx.successionPlanAllowedManager.deleteMany();
    await tx.successionPlan.deleteMany();
    await tx.position.deleteMany();
    await tx.reviewAnswer.deleteMany();
    await tx.scorecardMetricResult.deleteMany();
    await tx.reviewSubmission.deleteMany();
    await tx.reviewPacket.deleteMany();
    await tx.reviewCycleScorecardMetric.deleteMany();
    await tx.evidenceItem.deleteMany();
    await tx.calibrationPlacement.deleteMany();
    await tx.calibrationSnapshot.deleteMany();
    await tx.calibrationSessionParticipant.deleteMany();
    await tx.calibrationSession.deleteMany();
    await tx.improvementPlanCheckIn.deleteMany();
    await tx.improvementPlanGoal.deleteMany();
    await tx.improvementPlan.deleteMany();
    await tx.auditEvent.deleteMany();
    await tx.reviewCycle.deleteMany();
    await tx.reviewTemplateQuestion.deleteMany();
    await tx.reviewTemplate.deleteMany();
    await tx.employee.deleteMany();
    await tx.user.deleteMany();
    await tx.org.deleteMany();
  });
}
