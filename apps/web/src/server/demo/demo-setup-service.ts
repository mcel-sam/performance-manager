import {
  CalibrationBucket,
  CompetencyDimensionKey,
  CycleStatus,
  CycleVisibilityPolicy,
  EvidenceType,
  EvidenceVisibility,
  ReviewQuestionType,
  ReviewRelationship,
  ReviewSubmissionStatus,
  ScorecardMetricKey,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { demoOrgId, type DemoAccountHint } from "@/server/demo/demo-auth-service";
import { requireDemoMode } from "@/server/demo/demo-mode";

const demoUsers = {
  hrAdmin: "user_hr_admin_1",
  calibrator: "user_calibrator_1",
  manager: "user_manager_1",
  employee: "user_employee_1",
  peer: "user_peer_1",
} as const;

const demoEmployees = {
  hrAdmin: "emp_hr_admin_1",
  calibrator: "emp_calibrator_1",
  manager: "emp_manager_1",
  employee: "emp_employee_1",
  peer: "emp_peer_1",
} as const;

const demoCycleId = "cycle_seed_draft_1";
const demoTemplateId = "template_default_1";
const demoCalibrationSessionId = "calibration_session_seed_1";
const demoImprovementPlanId = "improvement_plan_seed_1";

const scorecardMetrics = [
  { metricKey: ScorecardMetricKey.QUALITY_OF_WORK, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.COMMUNICATION, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ACCOUNTABILITY, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.RELATIONSHIP_BUILDING, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.RESULTS_DRIVEN, weightPercent: 20 },
  { metricKey: ScorecardMetricKey.ATTITUDE, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.SERVICE_ORIENTED, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ADAPTABILITY, weightPercent: 10 },
] as const;

const competencyQuestions = [
  {
    id: "template_q_comp_values",
    prompt: "Values / Culture Alignment",
    dimensionKey: CompetencyDimensionKey.VALUES_CULTURE_ALIGNMENT,
  },
  {
    id: "template_q_comp_judgment",
    prompt: "Judgment & Decision-Making",
    dimensionKey: CompetencyDimensionKey.JUDGMENT_DECISION_MAKING,
  },
  {
    id: "template_q_comp_safety",
    prompt: "Safety & Compliance",
    dimensionKey: CompetencyDimensionKey.SAFETY_COMPLIANCE,
  },
  {
    id: "template_q_comp_technical",
    prompt: "Technical Skills",
    dimensionKey: CompetencyDimensionKey.TECHNICAL_SKILLS,
  },
  {
    id: "template_q_comp_quality",
    prompt: "Quality of Work",
    dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK,
  },
  {
    id: "template_q_comp_communication",
    prompt: "Communication",
    dimensionKey: CompetencyDimensionKey.COMMUNICATION,
  },
  {
    id: "template_q_comp_accountability",
    prompt: "Accountability",
    dimensionKey: CompetencyDimensionKey.ACCOUNTABILITY,
  },
  {
    id: "template_q_comp_relationship",
    prompt: "Relationship Building",
    dimensionKey: CompetencyDimensionKey.RELATIONSHIP_BUILDING,
  },
  {
    id: "template_q_comp_results",
    prompt: "Results Driven",
    dimensionKey: CompetencyDimensionKey.RESULTS_DRIVEN,
  },
  {
    id: "template_q_comp_attitude",
    prompt: "Attitude",
    dimensionKey: CompetencyDimensionKey.ATTITUDE,
  },
  {
    id: "template_q_comp_service",
    prompt: "Service Oriented",
    dimensionKey: CompetencyDimensionKey.SERVICE_ORIENTED,
  },
  {
    id: "template_q_comp_adaptability",
    prompt: "Adaptability",
    dimensionKey: CompetencyDimensionKey.ADAPTABILITY,
  },
] as const;

const demoSetupStepSchema = z.enum(["org", "cycle", "calibration", "improvement-plan", "all"]);
export type DemoSetupStep = z.infer<typeof demoSetupStepSchema>;

export function parseDemoSetupStep(input: unknown): DemoSetupStep {
  return demoSetupStepSchema.parse(input);
}

export async function runDemoSetup(step: DemoSetupStep): Promise<{ step: DemoSetupStep }> {
  requireDemoMode();

  if (step === "org" || step === "all") {
    await ensureDemoOrgAndUsers();
  }

  if (step === "cycle" || step === "all") {
    await ensureDemoCycleAndReviewArtifacts();
  }

  if (step === "calibration" || step === "all") {
    await ensureDemoCalibrationSession();
  }

  if (step === "improvement-plan" || step === "all") {
    await ensureDemoImprovementPlan();
  }

  return { step };
}

export function getDemoAccountHints(): DemoAccountHint[] {
  requireDemoMode();
  return [
    {
      role: UserRole.HR_ADMIN,
      email: "hr-admin@example.com",
      password: "demo-hr-admin",
      label: "HR Admin",
    },
    {
      role: UserRole.CALIBRATOR,
      email: "calibrator@example.com",
      password: "demo-calibrator",
      label: "Calibrator",
    },
    {
      role: UserRole.MANAGER,
      email: "manager@example.com",
      password: "demo-manager",
      label: "Manager",
    },
    {
      role: UserRole.EMPLOYEE,
      email: "employee@example.com",
      password: "demo-employee",
      label: "Employee",
    },
  ];
}

async function ensureDemoOrgAndUsers() {
  await prisma.org.upsert({
    where: { id: demoOrgId },
    update: { name: "Demo Performance Org" },
    create: { id: demoOrgId, name: "Demo Performance Org" },
  });

  const users = [
    { id: demoUsers.hrAdmin, email: "hr-admin@example.com", role: UserRole.HR_ADMIN },
    { id: demoUsers.calibrator, email: "calibrator@example.com", role: UserRole.CALIBRATOR },
    { id: demoUsers.manager, email: "manager@example.com", role: UserRole.MANAGER },
    { id: demoUsers.employee, email: "employee@example.com", role: UserRole.EMPLOYEE },
    { id: demoUsers.peer, email: "peer@example.com", role: UserRole.EMPLOYEE },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { orgId: demoOrgId, email: user.email, role: user.role },
      create: { id: user.id, orgId: demoOrgId, email: user.email, role: user.role },
    });
  }

  const employees = [
    {
      id: demoEmployees.hrAdmin,
      userId: demoUsers.hrAdmin,
      firstName: "Harper",
      lastName: "Admin",
      department: "People Operations",
      title: "HR Admin",
      managerId: null,
    },
    {
      id: demoEmployees.calibrator,
      userId: demoUsers.calibrator,
      firstName: "Casey",
      lastName: "Calibrator",
      department: "People Operations",
      title: "Calibration Partner",
      managerId: demoEmployees.hrAdmin,
    },
    {
      id: demoEmployees.manager,
      userId: demoUsers.manager,
      firstName: "Morgan",
      lastName: "Manager",
      department: "Engineering",
      title: "Engineering Manager",
      managerId: demoEmployees.hrAdmin,
    },
    {
      id: demoEmployees.employee,
      userId: demoUsers.employee,
      firstName: "Elliot",
      lastName: "Employee",
      department: "Engineering",
      title: "Software Engineer",
      managerId: demoEmployees.manager,
    },
    {
      id: demoEmployees.peer,
      userId: demoUsers.peer,
      firstName: "Parker",
      lastName: "Peer",
      department: "Engineering",
      title: "QA Engineer",
      managerId: demoEmployees.manager,
    },
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { id: employee.id },
      update: {
        orgId: demoOrgId,
        userId: employee.userId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        title: employee.title,
        managerId: employee.managerId,
      },
      create: {
        id: employee.id,
        orgId: demoOrgId,
        userId: employee.userId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        title: employee.title,
        managerId: employee.managerId,
      },
    });
  }
}

async function ensureDemoCycleAndReviewArtifacts() {
  await ensureDemoOrgAndUsers();

  await prisma.reviewTemplate.upsert({
    where: { id: demoTemplateId },
    update: {
      orgId: demoOrgId,
      name: "Default Performance Template",
      description: "Demo template for Milestone 5 workflows",
      isDefault: true,
    },
    create: {
      id: demoTemplateId,
      orgId: demoOrgId,
      name: "Default Performance Template",
      description: "Demo template for Milestone 5 workflows",
      isDefault: true,
    },
  });

  await prisma.reviewTemplateQuestion.upsert({
    where: { id: "template_q_1" },
    update: {
      orgId: demoOrgId,
      templateId: demoTemplateId,
      prompt: "What impact did this employee create this cycle?",
      questionType: ReviewQuestionType.TEXT,
      dimensionKey: null,
      isRequired: true,
      sortOrder: 1,
    },
    create: {
      id: "template_q_1",
      orgId: demoOrgId,
      templateId: demoTemplateId,
      prompt: "What impact did this employee create this cycle?",
      questionType: ReviewQuestionType.TEXT,
      dimensionKey: null,
      isRequired: true,
      sortOrder: 1,
    },
  });

  await prisma.reviewTemplateQuestion.upsert({
    where: { id: "template_q_2" },
    update: {
      orgId: demoOrgId,
      templateId: demoTemplateId,
      prompt: "What growth areas should this employee focus on?",
      questionType: ReviewQuestionType.TEXT,
      dimensionKey: null,
      isRequired: true,
      sortOrder: 2,
    },
    create: {
      id: "template_q_2",
      orgId: demoOrgId,
      templateId: demoTemplateId,
      prompt: "What growth areas should this employee focus on?",
      questionType: ReviewQuestionType.TEXT,
      dimensionKey: null,
      isRequired: true,
      sortOrder: 2,
    },
  });

  for (const [index, question] of competencyQuestions.entries()) {
    await prisma.reviewTemplateQuestion.upsert({
      where: { id: question.id },
      update: {
        orgId: demoOrgId,
        templateId: demoTemplateId,
        prompt: question.prompt,
        questionType: ReviewQuestionType.SCALE_1_TO_5,
        dimensionKey: question.dimensionKey,
        isRequired: false,
        sortOrder: index + 10,
      },
      create: {
        id: question.id,
        orgId: demoOrgId,
        templateId: demoTemplateId,
        prompt: question.prompt,
        questionType: ReviewQuestionType.SCALE_1_TO_5,
        dimensionKey: question.dimensionKey,
        isRequired: false,
        sortOrder: index + 10,
      },
    });
  }

  await prisma.reviewCycle.upsert({
    where: { id: demoCycleId },
    update: {
      orgId: demoOrgId,
      name: "Seed Draft Cycle",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      status: CycleStatus.DRAFT,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 1,
      upwardReviewCount: 0,
      templateId: demoTemplateId,
    },
    create: {
      id: demoCycleId,
      orgId: demoOrgId,
      name: "Seed Draft Cycle",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      status: CycleStatus.DRAFT,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 1,
      upwardReviewCount: 0,
      templateId: demoTemplateId,
    },
  });

  for (const metric of scorecardMetrics) {
    await prisma.reviewCycleScorecardMetric.upsert({
      where: {
        cycleId_metricKey: {
          cycleId: demoCycleId,
          metricKey: metric.metricKey,
        },
      },
      update: {
        orgId: demoOrgId,
        weightPercent: metric.weightPercent,
      },
      create: {
        orgId: demoOrgId,
        cycleId: demoCycleId,
        metricKey: metric.metricKey,
        weightPercent: metric.weightPercent,
      },
    });
  }

  const packetSeed = [
    {
      id: "packet_seed_hr_admin_1",
      subjectEmployeeId: demoEmployees.hrAdmin,
      snapshotDepartment: "People Operations",
      snapshotTitle: "HR Admin",
      snapshotManagerEmployeeId: null,
      snapshotManagerName: null,
    },
    {
      id: "packet_seed_manager_1",
      subjectEmployeeId: demoEmployees.manager,
      snapshotDepartment: "Engineering",
      snapshotTitle: "Engineering Manager",
      snapshotManagerEmployeeId: demoEmployees.hrAdmin,
      snapshotManagerName: "Harper Admin",
    },
    {
      id: "packet_seed_employee_1",
      subjectEmployeeId: demoEmployees.employee,
      snapshotDepartment: "Engineering",
      snapshotTitle: "Software Engineer",
      snapshotManagerEmployeeId: demoEmployees.manager,
      snapshotManagerName: "Morgan Manager",
    },
    {
      id: "packet_seed_peer_1",
      subjectEmployeeId: demoEmployees.peer,
      snapshotDepartment: "Engineering",
      snapshotTitle: "QA Engineer",
      snapshotManagerEmployeeId: demoEmployees.manager,
      snapshotManagerName: "Morgan Manager",
    },
  ];

  for (const packet of packetSeed) {
    await prisma.reviewPacket.upsert({
      where: { id: packet.id },
      update: {
        orgId: demoOrgId,
        cycleId: demoCycleId,
        subjectEmployeeId: packet.subjectEmployeeId,
        snapshotDepartment: packet.snapshotDepartment,
        snapshotTitle: packet.snapshotTitle,
        snapshotManagerEmployeeId: packet.snapshotManagerEmployeeId,
        snapshotManagerName: packet.snapshotManagerName,
      },
      create: {
        id: packet.id,
        orgId: demoOrgId,
        cycleId: demoCycleId,
        subjectEmployeeId: packet.subjectEmployeeId,
        snapshotDepartment: packet.snapshotDepartment,
        snapshotTitle: packet.snapshotTitle,
        snapshotManagerEmployeeId: packet.snapshotManagerEmployeeId,
        snapshotManagerName: packet.snapshotManagerName,
      },
    });
  }

  const submissionSeed = [
    {
      id: "submission_seed_employee_self_1",
      packetId: "packet_seed_employee_1",
      subjectEmployeeId: demoEmployees.employee,
      reviewerEmployeeId: demoEmployees.employee,
      relationship: ReviewRelationship.SELF,
    },
    {
      id: "submission_seed_employee_manager_1",
      packetId: "packet_seed_employee_1",
      subjectEmployeeId: demoEmployees.employee,
      reviewerEmployeeId: demoEmployees.manager,
      relationship: ReviewRelationship.MANAGER,
    },
    {
      id: "submission_seed_employee_peer_1",
      packetId: "packet_seed_employee_1",
      subjectEmployeeId: demoEmployees.employee,
      reviewerEmployeeId: demoEmployees.peer,
      relationship: ReviewRelationship.PEER,
    },
    {
      id: "submission_seed_manager_self_1",
      packetId: "packet_seed_manager_1",
      subjectEmployeeId: demoEmployees.manager,
      reviewerEmployeeId: demoEmployees.manager,
      relationship: ReviewRelationship.SELF,
    },
    {
      id: "submission_seed_manager_upward_1",
      packetId: "packet_seed_manager_1",
      subjectEmployeeId: demoEmployees.manager,
      reviewerEmployeeId: demoEmployees.employee,
      relationship: ReviewRelationship.UPWARD,
    },
    {
      id: "submission_seed_manager_upward_2",
      packetId: "packet_seed_manager_1",
      subjectEmployeeId: demoEmployees.manager,
      reviewerEmployeeId: demoEmployees.peer,
      relationship: ReviewRelationship.UPWARD,
    },
  ];

  for (const submission of submissionSeed) {
    await prisma.reviewSubmission.upsert({
      where: { id: submission.id },
      update: {
        orgId: demoOrgId,
        cycleId: demoCycleId,
        packetId: submission.packetId,
        subjectEmployeeId: submission.subjectEmployeeId,
        reviewerEmployeeId: submission.reviewerEmployeeId,
        relationship: submission.relationship,
        status: ReviewSubmissionStatus.NOT_STARTED,
        submittedAt: null,
      },
      create: {
        id: submission.id,
        orgId: demoOrgId,
        cycleId: demoCycleId,
        packetId: submission.packetId,
        subjectEmployeeId: submission.subjectEmployeeId,
        reviewerEmployeeId: submission.reviewerEmployeeId,
        relationship: submission.relationship,
        status: ReviewSubmissionStatus.NOT_STARTED,
        submittedAt: null,
      },
    });
  }

  await prisma.evidenceItem.upsert({
    where: { id: "evidence_seed_1" },
    update: {
      orgId: demoOrgId,
      subjectEmployeeId: demoEmployees.employee,
      authorEmployeeId: demoEmployees.manager,
      type: EvidenceType.FEEDBACK,
      visibility: EvidenceVisibility.MANAGER_ONLY,
      content: "Great cross-team collaboration and ownership this month.",
      occurredAt: new Date("2026-02-20T12:00:00.000Z"),
    },
    create: {
      id: "evidence_seed_1",
      orgId: demoOrgId,
      subjectEmployeeId: demoEmployees.employee,
      authorEmployeeId: demoEmployees.manager,
      type: EvidenceType.FEEDBACK,
      visibility: EvidenceVisibility.MANAGER_ONLY,
      content: "Great cross-team collaboration and ownership this month.",
      occurredAt: new Date("2026-02-20T12:00:00.000Z"),
    },
  });
}

async function ensureDemoCalibrationSession() {
  await ensureDemoCycleAndReviewArtifacts();

  const defaultPerformanceAxis = [
    {
      bucket: CalibrationBucket.LOW,
      label: "Needs support",
      description: "Consistently below this cycle's expectations.",
    },
    {
      bucket: CalibrationBucket.MEDIUM,
      label: "Meets expectations",
      description: "Delivers solid results at the expected level.",
    },
    {
      bucket: CalibrationBucket.HIGH,
      label: "Exceeds expectations",
      description: "Delivers standout results beyond expected scope.",
    },
  ];

  const defaultPotentialAxis = [
    {
      bucket: CalibrationBucket.LOW,
      label: "Current scope",
      description: "Effective in the current scope with limited near-term expansion.",
    },
    {
      bucket: CalibrationBucket.MEDIUM,
      label: "Growth ready",
      description: "Can take broader scope with coaching and support.",
    },
    {
      bucket: CalibrationBucket.HIGH,
      label: "Accelerated growth",
      description: "Shows strong readiness for larger and more complex scope.",
    },
  ];

  await prisma.calibrationSession.upsert({
    where: { id: demoCalibrationSessionId },
    update: {
      orgId: demoOrgId,
      cycleId: demoCycleId,
      name: "Core Engineering Calibration",
      roleGroup: "Core Engineering",
      description: "Seeded calibration session for demo mode.",
      performanceAxisConfig: defaultPerformanceAxis,
      potentialAxisConfig: defaultPotentialAxis,
      isFinalized: false,
      finalizedAt: null,
    },
    create: {
      id: demoCalibrationSessionId,
      orgId: demoOrgId,
      cycleId: demoCycleId,
      name: "Core Engineering Calibration",
      roleGroup: "Core Engineering",
      description: "Seeded calibration session for demo mode.",
      performanceAxisConfig: defaultPerformanceAxis,
      potentialAxisConfig: defaultPotentialAxis,
      isFinalized: false,
      finalizedAt: null,
    },
  });

  const participants = [demoUsers.hrAdmin, demoUsers.calibrator, demoUsers.manager];
  for (const userId of participants) {
    await prisma.calibrationSessionParticipant.upsert({
      where: {
        sessionId_userId: {
          sessionId: demoCalibrationSessionId,
          userId,
        },
      },
      update: { orgId: demoOrgId },
      create: {
        orgId: demoOrgId,
        sessionId: demoCalibrationSessionId,
        userId,
      },
    });
  }

  const placements = [
    {
      id: "calibration_placement_employee_1",
      employeeId: demoEmployees.employee,
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.MEDIUM,
    },
    {
      id: "calibration_placement_peer_1",
      employeeId: demoEmployees.peer,
      performanceBucket: CalibrationBucket.MEDIUM,
      potentialBucket: CalibrationBucket.HIGH,
    },
    {
      id: "calibration_placement_manager_1",
      employeeId: demoEmployees.manager,
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.HIGH,
    },
  ];

  for (const placement of placements) {
    await prisma.calibrationPlacement.upsert({
      where: { id: placement.id },
      update: {
        orgId: demoOrgId,
        sessionId: demoCalibrationSessionId,
        employeeId: placement.employeeId,
        performanceBucket: placement.performanceBucket,
        potentialBucket: placement.potentialBucket,
      },
      create: {
        id: placement.id,
        orgId: demoOrgId,
        sessionId: demoCalibrationSessionId,
        employeeId: placement.employeeId,
        performanceBucket: placement.performanceBucket,
        potentialBucket: placement.potentialBucket,
      },
    });
  }
}

async function ensureDemoImprovementPlan() {
  await ensureDemoOrgAndUsers();

  await prisma.improvementPlan.upsert({
    where: { id: demoImprovementPlanId },
    update: {
      orgId: demoOrgId,
      subjectEmployeeId: demoEmployees.employee,
      managerEmployeeId: demoEmployees.manager,
      hrOwnerEmployeeId: demoEmployees.hrAdmin,
      createdByUserId: demoUsers.hrAdmin,
      title: "Q2 Performance Support Plan",
      expectations:
        "Improve delivery predictability and communication with stakeholders over the next quarter.",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-06-30T00:00:00.000Z"),
    },
    create: {
      id: demoImprovementPlanId,
      orgId: demoOrgId,
      subjectEmployeeId: demoEmployees.employee,
      managerEmployeeId: demoEmployees.manager,
      hrOwnerEmployeeId: demoEmployees.hrAdmin,
      createdByUserId: demoUsers.hrAdmin,
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
      orgId: demoOrgId,
      planId: demoImprovementPlanId,
      title: "Improve sprint commitment reliability",
      description: "Maintain at least 90% sprint commitment accuracy for two consecutive cycles.",
      sortOrder: 1,
    },
    create: {
      id: "improvement_plan_goal_seed_1",
      orgId: demoOrgId,
      planId: demoImprovementPlanId,
      title: "Improve sprint commitment reliability",
      description: "Maintain at least 90% sprint commitment accuracy for two consecutive cycles.",
      sortOrder: 1,
    },
  });

  await prisma.improvementPlanGoal.upsert({
    where: { id: "improvement_plan_goal_seed_2" },
    update: {
      orgId: demoOrgId,
      planId: demoImprovementPlanId,
      title: "Raise stakeholder communication consistency",
      description: "Send weekly progress updates and risks to stakeholders with clear owners.",
      sortOrder: 2,
    },
    create: {
      id: "improvement_plan_goal_seed_2",
      orgId: demoOrgId,
      planId: demoImprovementPlanId,
      title: "Raise stakeholder communication consistency",
      description: "Send weekly progress updates and risks to stakeholders with clear owners.",
      sortOrder: 2,
    },
  });

  await prisma.improvementPlanCheckIn.upsert({
    where: { id: "improvement_plan_checkin_seed_1" },
    update: {
      orgId: demoOrgId,
      planId: demoImprovementPlanId,
      authorUserId: demoUsers.manager,
      content:
        "Initial coaching sync completed. Weekly planning and stakeholder updates will be tracked from this week.",
      checkInAt: new Date("2026-04-08T16:00:00.000Z"),
    },
    create: {
      id: "improvement_plan_checkin_seed_1",
      orgId: demoOrgId,
      planId: demoImprovementPlanId,
      authorUserId: demoUsers.manager,
      content:
        "Initial coaching sync completed. Weekly planning and stakeholder updates will be tracked from this week.",
      checkInAt: new Date("2026-04-08T16:00:00.000Z"),
    },
  });
}
