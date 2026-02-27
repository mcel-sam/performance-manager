import {
  PrismaClient,
  CalibrationBucket,
  CycleVisibilityPolicy,
  CycleStatus,
  EvidenceType,
  EvidenceVisibility,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orgId = "org_demo_1";
  const users = {
    hrAdmin: "user_hr_admin_1",
    manager: "user_manager_1",
    employee: "user_employee_1",
    peer: "user_peer_1",
  };

  const employees = {
    hrAdmin: "emp_hr_admin_1",
    manager: "emp_manager_1",
    employee: "emp_employee_1",
    peer: "emp_peer_1",
  };

  await prisma.org.upsert({
    where: { id: orgId },
    update: { name: "Demo Performance Org" },
    create: {
      id: orgId,
      name: "Demo Performance Org",
    },
  });

  await prisma.user.upsert({
    where: { id: users.hrAdmin },
    update: { orgId, email: "hr-admin@example.com", role: UserRole.HR_ADMIN },
    create: {
      id: users.hrAdmin,
      orgId,
      email: "hr-admin@example.com",
      role: UserRole.HR_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { id: users.manager },
    update: { orgId, email: "manager@example.com", role: UserRole.MANAGER },
    create: {
      id: users.manager,
      orgId,
      email: "manager@example.com",
      role: UserRole.MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { id: users.employee },
    update: { orgId, email: "employee@example.com", role: UserRole.EMPLOYEE },
    create: {
      id: users.employee,
      orgId,
      email: "employee@example.com",
      role: UserRole.EMPLOYEE,
    },
  });

  await prisma.user.upsert({
    where: { id: users.peer },
    update: { orgId, email: "peer@example.com", role: UserRole.EMPLOYEE },
    create: {
      id: users.peer,
      orgId,
      email: "peer@example.com",
      role: UserRole.EMPLOYEE,
    },
  });

  await prisma.employee.upsert({
    where: { id: employees.hrAdmin },
    update: {
      orgId,
      userId: users.hrAdmin,
      firstName: "Harper",
      lastName: "Admin",
      managerId: null,
    },
    create: {
      id: employees.hrAdmin,
      orgId,
      userId: users.hrAdmin,
      firstName: "Harper",
      lastName: "Admin",
      managerId: null,
    },
  });

  await prisma.employee.upsert({
    where: { id: employees.manager },
    update: {
      orgId,
      userId: users.manager,
      firstName: "Morgan",
      lastName: "Manager",
      managerId: employees.hrAdmin,
    },
    create: {
      id: employees.manager,
      orgId,
      userId: users.manager,
      firstName: "Morgan",
      lastName: "Manager",
      managerId: employees.hrAdmin,
    },
  });

  await prisma.employee.upsert({
    where: { id: employees.employee },
    update: {
      orgId,
      userId: users.employee,
      firstName: "Elliot",
      lastName: "Employee",
      managerId: employees.manager,
    },
    create: {
      id: employees.employee,
      orgId,
      userId: users.employee,
      firstName: "Elliot",
      lastName: "Employee",
      managerId: employees.manager,
    },
  });

  await prisma.employee.upsert({
    where: { id: employees.peer },
    update: {
      orgId,
      userId: users.peer,
      firstName: "Parker",
      lastName: "Peer",
      managerId: employees.manager,
    },
    create: {
      id: employees.peer,
      orgId,
      userId: users.peer,
      firstName: "Parker",
      lastName: "Peer",
      managerId: employees.manager,
    },
  });

  const templateId = "template_default_1";
  await prisma.reviewTemplate.upsert({
    where: { id: templateId },
    update: {
      orgId,
      name: "Default Performance Template",
      description: "Baseline template for Milestone 1 development",
      isDefault: true,
    },
    create: {
      id: templateId,
      orgId,
      name: "Default Performance Template",
      description: "Baseline template for Milestone 1 development",
      isDefault: true,
    },
  });

  await prisma.reviewTemplateQuestion.upsert({
    where: { id: "template_q_1" },
    update: {
      orgId,
      templateId,
      prompt: "What impact did this employee create this cycle?",
      isRequired: true,
      sortOrder: 1,
    },
    create: {
      id: "template_q_1",
      orgId,
      templateId,
      prompt: "What impact did this employee create this cycle?",
      isRequired: true,
      sortOrder: 1,
    },
  });

  await prisma.reviewTemplateQuestion.upsert({
    where: { id: "template_q_2" },
    update: {
      orgId,
      templateId,
      prompt: "What growth areas should this employee focus on?",
      isRequired: true,
      sortOrder: 2,
    },
    create: {
      id: "template_q_2",
      orgId,
      templateId,
      prompt: "What growth areas should this employee focus on?",
      isRequired: true,
      sortOrder: 2,
    },
  });

  await prisma.reviewCycle.upsert({
    where: { id: "cycle_seed_draft_1" },
    update: {
      orgId,
      name: "Seed Draft Cycle",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      status: CycleStatus.DRAFT,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 1,
      upwardReviewCount: 0,
      templateId,
    },
    create: {
      id: "cycle_seed_draft_1",
      orgId,
      name: "Seed Draft Cycle",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      status: CycleStatus.DRAFT,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 1,
      upwardReviewCount: 0,
      templateId,
    },
  });

  const packetIds = {
    hrAdmin: "packet_seed_hr_admin_1",
    manager: "packet_seed_manager_1",
    employee: "packet_seed_employee_1",
    peer: "packet_seed_peer_1",
  };

  await prisma.reviewPacket.upsert({
    where: { id: packetIds.hrAdmin },
    update: {
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.hrAdmin,
    },
    create: {
      id: packetIds.hrAdmin,
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.hrAdmin,
    },
  });

  await prisma.reviewPacket.upsert({
    where: { id: packetIds.manager },
    update: {
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.manager,
    },
    create: {
      id: packetIds.manager,
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.manager,
    },
  });

  await prisma.reviewPacket.upsert({
    where: { id: packetIds.employee },
    update: {
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.employee,
    },
    create: {
      id: packetIds.employee,
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.employee,
    },
  });

  await prisma.reviewPacket.upsert({
    where: { id: packetIds.peer },
    update: {
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.peer,
    },
    create: {
      id: packetIds.peer,
      orgId,
      cycleId: "cycle_seed_draft_1",
      subjectEmployeeId: employees.peer,
    },
  });

  const submissionSeed = [
    {
      id: "submission_seed_employee_self_1",
      packetId: packetIds.employee,
      subjectEmployeeId: employees.employee,
      reviewerEmployeeId: employees.employee,
      relationship: ReviewRelationship.SELF,
    },
    {
      id: "submission_seed_employee_manager_1",
      packetId: packetIds.employee,
      subjectEmployeeId: employees.employee,
      reviewerEmployeeId: employees.manager,
      relationship: ReviewRelationship.MANAGER,
    },
    {
      id: "submission_seed_employee_peer_1",
      packetId: packetIds.employee,
      subjectEmployeeId: employees.employee,
      reviewerEmployeeId: employees.peer,
      relationship: ReviewRelationship.PEER,
    },
    {
      id: "submission_seed_manager_self_1",
      packetId: packetIds.manager,
      subjectEmployeeId: employees.manager,
      reviewerEmployeeId: employees.manager,
      relationship: ReviewRelationship.SELF,
    },
    {
      id: "submission_seed_manager_upward_1",
      packetId: packetIds.manager,
      subjectEmployeeId: employees.manager,
      reviewerEmployeeId: employees.employee,
      relationship: ReviewRelationship.UPWARD,
    },
    {
      id: "submission_seed_manager_upward_2",
      packetId: packetIds.manager,
      subjectEmployeeId: employees.manager,
      reviewerEmployeeId: employees.peer,
      relationship: ReviewRelationship.UPWARD,
    },
    {
      id: "submission_seed_peer_self_1",
      packetId: packetIds.peer,
      subjectEmployeeId: employees.peer,
      reviewerEmployeeId: employees.peer,
      relationship: ReviewRelationship.SELF,
    },
    {
      id: "submission_seed_peer_manager_1",
      packetId: packetIds.peer,
      subjectEmployeeId: employees.peer,
      reviewerEmployeeId: employees.manager,
      relationship: ReviewRelationship.MANAGER,
    },
  ];

  for (const submission of submissionSeed) {
    await prisma.reviewSubmission.upsert({
      where: { id: submission.id },
      update: {
        orgId,
        cycleId: "cycle_seed_draft_1",
        packetId: submission.packetId,
        subjectEmployeeId: submission.subjectEmployeeId,
        reviewerEmployeeId: submission.reviewerEmployeeId,
        relationship: submission.relationship,
        status: ReviewSubmissionStatus.NOT_STARTED,
      },
      create: {
        id: submission.id,
        orgId,
        cycleId: "cycle_seed_draft_1",
        packetId: submission.packetId,
        subjectEmployeeId: submission.subjectEmployeeId,
        reviewerEmployeeId: submission.reviewerEmployeeId,
        relationship: submission.relationship,
        status: ReviewSubmissionStatus.NOT_STARTED,
      },
    });
  }

  const calibrationSessionId = "calibration_session_seed_1";
  await prisma.calibrationSession.upsert({
    where: { id: calibrationSessionId },
    update: {
      orgId,
      cycleId: "cycle_seed_draft_1",
      name: "Core Engineering Calibration",
      description: "Seeded calibration session for Milestone 2 development.",
      isFinalized: false,
      finalizedAt: null,
    },
    create: {
      id: calibrationSessionId,
      orgId,
      cycleId: "cycle_seed_draft_1",
      name: "Core Engineering Calibration",
      description: "Seeded calibration session for Milestone 2 development.",
      isFinalized: false,
      finalizedAt: null,
    },
  });

  const calibrationPlacements = [
    {
      id: "calibration_placement_employee_1",
      employeeId: employees.employee,
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.MEDIUM,
    },
    {
      id: "calibration_placement_peer_1",
      employeeId: employees.peer,
      performanceBucket: CalibrationBucket.MEDIUM,
      potentialBucket: CalibrationBucket.HIGH,
    },
    {
      id: "calibration_placement_manager_1",
      employeeId: employees.manager,
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.HIGH,
    },
  ];

  for (const placement of calibrationPlacements) {
    await prisma.calibrationPlacement.upsert({
      where: { id: placement.id },
      update: {
        orgId,
        sessionId: calibrationSessionId,
        employeeId: placement.employeeId,
        performanceBucket: placement.performanceBucket,
        potentialBucket: placement.potentialBucket,
      },
      create: {
        id: placement.id,
        orgId,
        sessionId: calibrationSessionId,
        employeeId: placement.employeeId,
        performanceBucket: placement.performanceBucket,
        potentialBucket: placement.potentialBucket,
      },
    });
  }

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_1" },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.FEEDBACK,
      visibility: EvidenceVisibility.MANAGER_ONLY,
      content: "Great cross-team collaboration and ownership this month.",
      occurredAt: new Date("2026-02-20T12:00:00.000Z"),
    },
    create: {
      id: "evidence_seed_1",
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.FEEDBACK,
      visibility: EvidenceVisibility.MANAGER_ONLY,
      content: "Great cross-team collaboration and ownership this month.",
      occurredAt: new Date("2026-02-20T12:00:00.000Z"),
    },
  });

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_2" },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.employee,
      type: EvidenceType.UPDATE,
      visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
      content: "Completed migration rollout for the reporting service.",
      occurredAt: new Date("2026-02-12T15:30:00.000Z"),
    },
    create: {
      id: "evidence_seed_2",
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.employee,
      type: EvidenceType.UPDATE,
      visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
      content: "Completed migration rollout for the reporting service.",
      occurredAt: new Date("2026-02-12T15:30:00.000Z"),
    },
  });

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_3" },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.GOAL,
      visibility: EvidenceVisibility.MANAGER_ONLY,
      content: "Quarterly objective delivered ahead of schedule.",
      occurredAt: new Date("2026-01-29T09:00:00.000Z"),
    },
    create: {
      id: "evidence_seed_3",
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.GOAL,
      visibility: EvidenceVisibility.MANAGER_ONLY,
      content: "Quarterly objective delivered ahead of schedule.",
      occurredAt: new Date("2026-01-29T09:00:00.000Z"),
    },
  });

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_4" },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.ONE_ON_ONE,
      visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
      content: "Monthly 1:1 captured clear ownership and communication improvements.",
      occurredAt: new Date("2026-02-06T10:00:00.000Z"),
    },
    create: {
      id: "evidence_seed_4",
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.ONE_ON_ONE,
      visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
      content: "Monthly 1:1 captured clear ownership and communication improvements.",
      occurredAt: new Date("2026-02-06T10:00:00.000Z"),
    },
  });

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_5" },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.peer,
      type: EvidenceType.VALUE_RECOGNITION,
      visibility: EvidenceVisibility.ORG_VISIBLE,
      content: "Recognized for demonstrating customer-first behavior during incident response.",
      occurredAt: new Date("2026-02-03T08:45:00.000Z"),
    },
    create: {
      id: "evidence_seed_5",
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.peer,
      type: EvidenceType.VALUE_RECOGNITION,
      visibility: EvidenceVisibility.ORG_VISIBLE,
      content: "Recognized for demonstrating customer-first behavior during incident response.",
      occurredAt: new Date("2026-02-03T08:45:00.000Z"),
    },
  });

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_6" },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.FEEDBACK,
      visibility: EvidenceVisibility.PRIVATE,
      content: "Private manager draft note for calibration preparation.",
      occurredAt: new Date("2026-02-01T09:15:00.000Z"),
    },
    create: {
      id: "evidence_seed_6",
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.manager,
      type: EvidenceType.FEEDBACK,
      visibility: EvidenceVisibility.PRIVATE,
      content: "Private manager draft note for calibration preparation.",
      occurredAt: new Date("2026-02-01T09:15:00.000Z"),
    },
  });

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_7" },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.employee,
      type: EvidenceType.GOAL,
      visibility: EvidenceVisibility.PRIVATE,
      content: "Drafted a private self-reflection note on stretch-goal execution.",
      occurredAt: new Date("2026-01-20T13:00:00.000Z"),
    },
    create: {
      id: "evidence_seed_7",
      orgId,
      subjectEmployeeId: employees.employee,
      authorEmployeeId: employees.employee,
      type: EvidenceType.GOAL,
      visibility: EvidenceVisibility.PRIVATE,
      content: "Drafted a private self-reflection note on stretch-goal execution.",
      occurredAt: new Date("2026-01-20T13:00:00.000Z"),
    },
  });

  const improvementPlanId = "improvement_plan_seed_1";
  await prisma.improvementPlan.upsert({
    where: { id: improvementPlanId },
    update: {
      orgId,
      subjectEmployeeId: employees.employee,
      managerEmployeeId: employees.manager,
      hrOwnerEmployeeId: employees.hrAdmin,
      createdByUserId: users.hrAdmin,
      title: "Q2 Performance Support Plan",
      expectations:
        "Improve delivery predictability and communication with stakeholders over the next quarter.",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
    },
    create: {
      id: improvementPlanId,
      orgId,
      subjectEmployeeId: employees.employee,
      managerEmployeeId: employees.manager,
      hrOwnerEmployeeId: employees.hrAdmin,
      createdByUserId: users.hrAdmin,
      title: "Q2 Performance Support Plan",
      expectations:
        "Improve delivery predictability and communication with stakeholders over the next quarter.",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
    },
  });

  await prisma.improvementPlanGoal.upsert({
    where: { id: "improvement_plan_goal_seed_1" },
    update: {
      orgId,
      planId: improvementPlanId,
      title: "Improve sprint commitment reliability",
      description: "Maintain at least 90% sprint commitment accuracy for two consecutive cycles.",
      sortOrder: 1,
    },
    create: {
      id: "improvement_plan_goal_seed_1",
      orgId,
      planId: improvementPlanId,
      title: "Improve sprint commitment reliability",
      description: "Maintain at least 90% sprint commitment accuracy for two consecutive cycles.",
      sortOrder: 1,
    },
  });

  await prisma.improvementPlanGoal.upsert({
    where: { id: "improvement_plan_goal_seed_2" },
    update: {
      orgId,
      planId: improvementPlanId,
      title: "Raise stakeholder communication consistency",
      description: "Send weekly progress updates and risks to stakeholders with clear owners.",
      sortOrder: 2,
    },
    create: {
      id: "improvement_plan_goal_seed_2",
      orgId,
      planId: improvementPlanId,
      title: "Raise stakeholder communication consistency",
      description: "Send weekly progress updates and risks to stakeholders with clear owners.",
      sortOrder: 2,
    },
  });

  await prisma.improvementPlanCheckIn.upsert({
    where: { id: "improvement_plan_checkin_seed_1" },
    update: {
      orgId,
      planId: improvementPlanId,
      authorUserId: users.manager,
      content:
        "Initial coaching sync completed. Weekly planning and stakeholder updates will be tracked from this week.",
      status: "DRAFT",
      outcome: null,
      checkInAt: new Date("2026-04-08T16:00:00.000Z"),
    },
    create: {
      id: "improvement_plan_checkin_seed_1",
      orgId,
      planId: improvementPlanId,
      authorUserId: users.manager,
      content:
        "Initial coaching sync completed. Weekly planning and stakeholder updates will be tracked from this week.",
      status: "DRAFT",
      outcome: null,
      checkInAt: new Date("2026-04-08T16:00:00.000Z"),
    },
  });

  console.log("Seed completed", {
    orgId,
    adminUserId: users.hrAdmin,
    adminEmployeeId: employees.hrAdmin,
    seedCycleId: "cycle_seed_draft_1",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
