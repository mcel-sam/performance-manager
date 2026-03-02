import {
  CalibrationBucket,
  CompetencyDimensionKey,
  CycleStatus,
  CycleVisibilityPolicy,
  EvidenceType,
  EvidenceVisibility,
  ImprovementPlanStatus,
  ReviewQuestionType,
  ReviewRelationship,
  ReviewSubmissionStatus,
  ScorecardMetricKey,
  UserRole,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  demoCalibrationSessionId,
  demoCycleId,
  demoImprovementPlanId,
  demoOrgId,
  demoTemplateId,
} from "@/server/demo/demo-constants";
import { assertDemoMode } from "@/server/demo/demo-mode";
import { recomputePacketScorecard } from "@/server/scorecard/scorecard-service";

interface DemoResetResult {
  seededAt: string;
  summary: {
    users: number;
    employees: number;
    packets: number;
    submissions: number;
    answers: number;
    evidenceItems: number;
    evidenceLinks: number;
  };
}

interface DemoPerson {
  userId: string;
  employeeId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  department: string;
  title: string;
  managerEmployeeId: string | null;
  includeInCycle: boolean;
}

interface DemoQuestion {
  id: string;
  prompt: string;
  questionType: ReviewQuestionType;
  dimensionKey: CompetencyDimensionKey | null;
  isRequired: boolean;
  sortOrder: number;
}

interface DemoSubmissionSeed {
  id: string;
  packetId: string;
  subjectEmployeeId: string;
  reviewerEmployeeId: string;
  relationship: ReviewRelationship;
  status: ReviewSubmissionStatus;
  submittedAt: Date | null;
}

const demoPeople: DemoPerson[] = [
  {
    userId: "user_hr_admin_1",
    employeeId: "emp_hr_admin_1",
    email: "harper.quinn@ironcrest.example",
    role: UserRole.HR_ADMIN,
    firstName: "Harper",
    lastName: "Quinn",
    department: "People Operations",
    title: "HR Director",
    managerEmployeeId: null,
    includeInCycle: false,
  },
  {
    userId: "user_calibrator_1",
    employeeId: "emp_calibrator_1",
    email: "casey.romero@ironcrest.example",
    role: UserRole.CALIBRATOR,
    firstName: "Casey",
    lastName: "Romero",
    department: "People Operations",
    title: "Talent Calibration Lead",
    managerEmployeeId: "emp_hr_admin_1",
    includeInCycle: false,
  },
  {
    userId: "user_manager_1",
    employeeId: "emp_manager_1",
    email: "morgan.patel@ironcrest.example",
    role: UserRole.MANAGER,
    firstName: "Morgan",
    lastName: "Patel",
    department: "Operations",
    title: "Regional Operations Manager",
    managerEmployeeId: "emp_hr_admin_1",
    includeInCycle: true,
  },
  {
    userId: "user_manager_2",
    employeeId: "emp_manager_2",
    email: "jordan.blake@ironcrest.example",
    role: UserRole.MANAGER,
    firstName: "Jordan",
    lastName: "Blake",
    department: "Field Operations",
    title: "Construction Manager",
    managerEmployeeId: "emp_hr_admin_1",
    includeInCycle: true,
  },
  {
    userId: "user_employee_1",
    employeeId: "emp_employee_1",
    email: "elliot.barnes@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Elliot",
    lastName: "Barnes",
    department: "Project Controls",
    title: "Project Engineer",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
  },
  {
    userId: "user_employee_2",
    employeeId: "emp_employee_2",
    email: "maya.chen@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Maya",
    lastName: "Chen",
    department: "Safety & Compliance",
    title: "Safety Coordinator",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
  },
  {
    userId: "user_employee_3",
    employeeId: "emp_employee_3",
    email: "noah.bennett@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Noah",
    lastName: "Bennett",
    department: "Quality",
    title: "Quality Inspector",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
  },
  {
    userId: "user_employee_4",
    employeeId: "emp_employee_4",
    email: "priya.das@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Priya",
    lastName: "Das",
    department: "Procurement",
    title: "Procurement Specialist",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
  },
  {
    userId: "user_employee_5",
    employeeId: "emp_employee_5",
    email: "lucas.ford@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Lucas",
    lastName: "Ford",
    department: "Planning",
    title: "Project Scheduler",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
  },
  {
    userId: "user_employee_6",
    employeeId: "emp_employee_6",
    email: "aisha.rahman@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Aisha",
    lastName: "Rahman",
    department: "Project Controls",
    title: "Cost Analyst",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
  },
  {
    userId: "user_employee_7",
    employeeId: "emp_employee_7",
    email: "owen.reyes@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Owen",
    lastName: "Reyes",
    department: "Field Operations",
    title: "Site Superintendent",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
  },
  {
    userId: "user_employee_8",
    employeeId: "emp_employee_8",
    email: "sofia.kim@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Sofia",
    lastName: "Kim",
    department: "Field Operations",
    title: "Foreman",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
  },
  {
    userId: "user_employee_9",
    employeeId: "emp_employee_9",
    email: "javier.morales@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Javier",
    lastName: "Morales",
    department: "Equipment",
    title: "Equipment Coordinator",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
  },
  {
    userId: "user_employee_10",
    employeeId: "emp_employee_10",
    email: "hannah.lewis@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Hannah",
    lastName: "Lewis",
    department: "Concrete",
    title: "Concrete Crew Lead",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
  },
  {
    userId: "user_employee_11",
    employeeId: "emp_employee_11",
    email: "marcus.reed@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Marcus",
    lastName: "Reed",
    department: "Electrical",
    title: "Electrical Lead",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
  },
  {
    userId: "user_employee_12",
    employeeId: "emp_employee_12",
    email: "chloe.nguyen@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Chloe",
    lastName: "Nguyen",
    department: "Field Operations",
    title: "Apprentice Carpenter",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
  },
];

const demoQuestions: DemoQuestion[] = [
  {
    id: "template_q_1",
    prompt: "What impact did this employee deliver this year?",
    questionType: ReviewQuestionType.TEXT,
    dimensionKey: null,
    isRequired: true,
    sortOrder: 1,
  },
  {
    id: "template_q_2",
    prompt: "What growth priorities should this employee focus on next year?",
    questionType: ReviewQuestionType.TEXT,
    dimensionKey: null,
    isRequired: true,
    sortOrder: 2,
  },
  {
    id: "template_q_comp_values",
    prompt: "Values / Culture Alignment",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.VALUES_CULTURE_ALIGNMENT,
    isRequired: false,
    sortOrder: 10,
  },
  {
    id: "template_q_comp_judgment",
    prompt: "Judgment & Decision-Making",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.JUDGMENT_DECISION_MAKING,
    isRequired: false,
    sortOrder: 11,
  },
  {
    id: "template_q_comp_safety",
    prompt: "Safety & Compliance",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.SAFETY_COMPLIANCE,
    isRequired: false,
    sortOrder: 12,
  },
  {
    id: "template_q_comp_technical",
    prompt: "Technical Skills",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.TECHNICAL_SKILLS,
    isRequired: false,
    sortOrder: 13,
  },
  {
    id: "template_q_comp_quality",
    prompt: "Quality of Work",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.QUALITY_OF_WORK,
    isRequired: false,
    sortOrder: 14,
  },
  {
    id: "template_q_comp_communication",
    prompt: "Communication",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.COMMUNICATION,
    isRequired: false,
    sortOrder: 15,
  },
  {
    id: "template_q_comp_accountability",
    prompt: "Accountability",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.ACCOUNTABILITY,
    isRequired: false,
    sortOrder: 16,
  },
  {
    id: "template_q_comp_relationship",
    prompt: "Relationship Building",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.RELATIONSHIP_BUILDING,
    isRequired: false,
    sortOrder: 17,
  },
  {
    id: "template_q_comp_results",
    prompt: "Results Driven",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.RESULTS_DRIVEN,
    isRequired: false,
    sortOrder: 18,
  },
  {
    id: "template_q_comp_attitude",
    prompt: "Attitude",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.ATTITUDE,
    isRequired: false,
    sortOrder: 19,
  },
  {
    id: "template_q_comp_service",
    prompt: "Service Oriented",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.SERVICE_ORIENTED,
    isRequired: false,
    sortOrder: 20,
  },
  {
    id: "template_q_comp_adaptability",
    prompt: "Adaptability",
    questionType: ReviewQuestionType.SCALE_1_TO_5,
    dimensionKey: CompetencyDimensionKey.ADAPTABILITY,
    isRequired: false,
    sortOrder: 21,
  },
];

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

const performanceAxis = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Needs support",
    description: "Consistently below this cycle's expectations.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Meets expectations",
    description: "Delivers consistent results at expected scope.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Exceeds expectations",
    description: "Delivers standout outcomes with strong ownership.",
  },
];

const potentialAxis = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Current scope",
    description: "Effective in current role with limited short-term expansion.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Growth ready",
    description: "Can stretch into broader scope with coaching.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Accelerated growth",
    description: "Ready for expanded scope and complex assignments.",
  },
];

const evidenceTemplates: Array<{
  type: EvidenceType;
  visibility: EvidenceVisibility;
  content: string;
}> = [
  {
    type: EvidenceType.FEEDBACK,
    visibility: EvidenceVisibility.MANAGER_ONLY,
    content: "Client superintendent praised proactive daily risk communication before concrete pours.",
  },
  {
    type: EvidenceType.UPDATE,
    visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
    content: "Weekly project update captured schedule recovery and punch-list burn-down progress.",
  },
  {
    type: EvidenceType.ONE_ON_ONE,
    visibility: EvidenceVisibility.MANAGER_ONLY,
    content: "1:1 notes documented improved handoff planning between field and procurement teams.",
  },
  {
    type: EvidenceType.GOAL,
    visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
    content: "Goal progress: reduced equipment downtime by tightening preventive maintenance checks.",
  },
  {
    type: EvidenceType.VALUE_RECOGNITION,
    visibility: EvidenceVisibility.ORG_VISIBLE,
    content: "Kudos: stepped in to mentor two new crew members during a compressed delivery window.",
  },
  {
    type: EvidenceType.UPDATE,
    visibility: EvidenceVisibility.ORG_VISIBLE,
    content: "Safety observation: corrected incomplete fall-protection setup before work resumed.",
  },
  {
    type: EvidenceType.FEEDBACK,
    visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
    content: "Peer feedback highlighted clear subcontractor communication during scope changes.",
  },
  {
    type: EvidenceType.ONE_ON_ONE,
    visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
    content: "1:1 note captured stronger labor planning and more accurate forecasting.",
  },
  {
    type: EvidenceType.GOAL,
    visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
    content: "Goal milestone achieved: standardized pre-task safety briefing checklist on active sites.",
  },
  {
    type: EvidenceType.FEEDBACK,
    visibility: EvidenceVisibility.MANAGER_ONLY,
    content: "Foreman shared appreciation for calm escalation handling during an urgent equipment outage.",
  },
];

const dimensionLabel: Record<CompetencyDimensionKey, string> = {
  [CompetencyDimensionKey.VALUES_CULTURE_ALIGNMENT]: "values and culture alignment",
  [CompetencyDimensionKey.JUDGMENT_DECISION_MAKING]: "judgment and decision-making",
  [CompetencyDimensionKey.SAFETY_COMPLIANCE]: "safety and compliance",
  [CompetencyDimensionKey.TECHNICAL_SKILLS]: "technical execution",
  [CompetencyDimensionKey.QUALITY_OF_WORK]: "quality of work",
  [CompetencyDimensionKey.COMMUNICATION]: "communication",
  [CompetencyDimensionKey.ACCOUNTABILITY]: "accountability",
  [CompetencyDimensionKey.RELATIONSHIP_BUILDING]: "relationship building",
  [CompetencyDimensionKey.RESULTS_DRIVEN]: "results delivery",
  [CompetencyDimensionKey.ATTITUDE]: "attitude and professionalism",
  [CompetencyDimensionKey.SERVICE_ORIENTED]: "service mindset",
  [CompetencyDimensionKey.ADAPTABILITY]: "adaptability",
};

export async function resetAndSeedDemo(): Promise<DemoResetResult> {
  assertDemoMode();

  const seededAt = new Date();
  await wipeAllLocalData();
  const summary = await seedDemoData();

  return {
    seededAt: seededAt.toISOString(),
    summary,
  };
}

async function wipeAllLocalData() {
  await prisma.$transaction(async (tx) => {
    await tx.answerEvidenceLink.deleteMany();
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

async function seedDemoData(): Promise<DemoResetResult["summary"]> {
  const reviewedPeople = demoPeople.filter((person) => person.includeInCycle);
  const personByEmployeeId = new Map(demoPeople.map((person) => [person.employeeId, person]));

  await prisma.org.create({
    data: {
      id: demoOrgId,
      name: "Ironcrest Construction Group",
    },
  });

  await prisma.user.createMany({
    data: demoPeople.map((person) => ({
      id: person.userId,
      orgId: demoOrgId,
      email: person.email,
      role: person.role,
    })),
  });

  await prisma.employee.createMany({
    data: demoPeople.map((person) => ({
      id: person.employeeId,
      orgId: demoOrgId,
      userId: person.userId,
      firstName: person.firstName,
      lastName: person.lastName,
      department: person.department,
      title: person.title,
      managerId: person.managerEmployeeId,
    })),
  });

  await prisma.reviewTemplate.create({
    data: {
      id: demoTemplateId,
      orgId: demoOrgId,
      name: "Annual Review 2026 Template",
      description:
        "Construction performance template covering delivery quality, safety, communication, and growth.",
      isDefault: true,
    },
  });

  await prisma.reviewTemplateQuestion.createMany({
    data: demoQuestions.map((question) => ({
      id: question.id,
      orgId: demoOrgId,
      templateId: demoTemplateId,
      prompt: question.prompt,
      questionType: question.questionType,
      dimensionKey: question.dimensionKey,
      isRequired: question.isRequired,
      sortOrder: question.sortOrder,
    })),
  });

  await prisma.reviewCycle.create({
    data: {
      id: demoCycleId,
      orgId: demoOrgId,
      name: "Annual Review 2026",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
      status: CycleStatus.ACTIVE,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 1,
      upwardReviewCount: 1,
      templateId: demoTemplateId,
    },
  });

  await prisma.reviewCycleScorecardMetric.createMany({
    data: scorecardMetrics.map((metric) => ({
      orgId: demoOrgId,
      cycleId: demoCycleId,
      metricKey: metric.metricKey,
      weightPercent: metric.weightPercent,
    })),
  });

  const packetRows = reviewedPeople.map((subject) => {
    const manager = subject.managerEmployeeId
      ? personByEmployeeId.get(subject.managerEmployeeId)
      : null;

    return {
      id: getPacketId(subject.employeeId),
      orgId: demoOrgId,
      cycleId: demoCycleId,
      subjectEmployeeId: subject.employeeId,
      snapshotDepartment: subject.department,
      snapshotTitle: subject.title,
      snapshotManagerEmployeeId: manager?.employeeId ?? null,
      snapshotManagerName: manager ? `${manager.firstName} ${manager.lastName}` : null,
    };
  });

  await prisma.reviewPacket.createMany({ data: packetRows });

  const packetIdBySubjectEmployeeId = new Map(
    packetRows.map((packet) => [packet.subjectEmployeeId, packet.id]),
  );

  const submissions: DemoSubmissionSeed[] = [];

  for (const subject of reviewedPeople) {
    const packetId = packetIdBySubjectEmployeeId.get(subject.employeeId);
    if (!packetId) {
      continue;
    }

    submissions.push({
      id: getSelfSubmissionId(subject.employeeId),
      packetId,
      subjectEmployeeId: subject.employeeId,
      reviewerEmployeeId: subject.employeeId,
      relationship: ReviewRelationship.SELF,
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date("2026-11-18T15:00:00.000Z"),
    });

    if (subject.managerEmployeeId) {
      const managerSubmissionId = getManagerSubmissionId(subject.employeeId);
      const inProgress = subject.employeeId === "emp_employee_1";
      submissions.push({
        id: managerSubmissionId,
        packetId,
        subjectEmployeeId: subject.employeeId,
        reviewerEmployeeId: subject.managerEmployeeId,
        relationship: ReviewRelationship.MANAGER,
        status: inProgress ? ReviewSubmissionStatus.IN_PROGRESS : ReviewSubmissionStatus.SUBMITTED,
        submittedAt: inProgress ? null : new Date("2026-11-22T16:00:00.000Z"),
      });
    }
  }

  const peerAssignments: Array<{ id: string; subjectEmployeeId: string; reviewerEmployeeId: string }> = [
    {
      id: "submission_seed_peer_1",
      subjectEmployeeId: "emp_employee_1",
      reviewerEmployeeId: "emp_employee_2",
    },
    {
      id: "submission_seed_peer_2",
      subjectEmployeeId: "emp_employee_2",
      reviewerEmployeeId: "emp_employee_3",
    },
    {
      id: "submission_seed_peer_3",
      subjectEmployeeId: "emp_employee_3",
      reviewerEmployeeId: "emp_employee_4",
    },
    {
      id: "submission_seed_peer_4",
      subjectEmployeeId: "emp_employee_7",
      reviewerEmployeeId: "emp_employee_8",
    },
  ];

  for (const assignment of peerAssignments) {
    const packetId = packetIdBySubjectEmployeeId.get(assignment.subjectEmployeeId);
    if (!packetId) {
      continue;
    }

    submissions.push({
      id: assignment.id,
      packetId,
      subjectEmployeeId: assignment.subjectEmployeeId,
      reviewerEmployeeId: assignment.reviewerEmployeeId,
      relationship: ReviewRelationship.PEER,
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date("2026-11-20T13:15:00.000Z"),
    });
  }

  const upwardAssignments: Array<{ id: string; subjectEmployeeId: string; reviewerEmployeeId: string }> = [
    {
      id: "submission_seed_upward_manager_1",
      subjectEmployeeId: "emp_manager_1",
      reviewerEmployeeId: "emp_employee_1",
    },
    {
      id: "submission_seed_upward_manager_2",
      subjectEmployeeId: "emp_manager_2",
      reviewerEmployeeId: "emp_employee_7",
    },
  ];

  for (const assignment of upwardAssignments) {
    const packetId = packetIdBySubjectEmployeeId.get(assignment.subjectEmployeeId);
    if (!packetId) {
      continue;
    }

    submissions.push({
      id: assignment.id,
      packetId,
      subjectEmployeeId: assignment.subjectEmployeeId,
      reviewerEmployeeId: assignment.reviewerEmployeeId,
      relationship: ReviewRelationship.UPWARD,
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date("2026-11-23T10:30:00.000Z"),
    });
  }

  await prisma.reviewSubmission.createMany({
    data: submissions.map((submission) => ({
      id: submission.id,
      orgId: demoOrgId,
      cycleId: demoCycleId,
      packetId: submission.packetId,
      subjectEmployeeId: submission.subjectEmployeeId,
      reviewerEmployeeId: submission.reviewerEmployeeId,
      relationship: submission.relationship,
      status: submission.status,
      submittedAt: submission.submittedAt,
    })),
  });

  const answerRows = submissions
    .flatMap((submission) =>
      demoQuestions.map((question) => {
        const subject = personByEmployeeId.get(submission.subjectEmployeeId);
        const reviewer = personByEmployeeId.get(submission.reviewerEmployeeId);
        if (!subject || !reviewer) {
          return null;
        }

        const answerContent = buildAnswerContent({
          question,
          relationship: submission.relationship,
          subject,
          reviewer,
        });

        return {
          orgId: demoOrgId,
          submissionId: submission.id,
          questionId: question.id,
          responseText: answerContent.responseText,
          scaleRating: answerContent.scaleRating,
          notObserved: answerContent.notObserved,
        };
      }),
    )
    .filter((answer): answer is NonNullable<typeof answer> => answer !== null);

  await prisma.reviewAnswer.createMany({ data: answerRows });

  const evidenceItems = Array.from({ length: 34 }, (_, index) => {
    const template = evidenceTemplates[index % evidenceTemplates.length];
    const subject = reviewedPeople[index % reviewedPeople.length];

    return {
      id: `evidence_seed_${index + 1}`,
      orgId: demoOrgId,
      subjectEmployeeId: subject.employeeId,
      authorEmployeeId: subject.managerEmployeeId ?? "emp_hr_admin_1",
      type: template.type,
      visibility: template.visibility,
      content: `${template.content} (Project segment ${index + 1}).`,
      occurredAt: new Date(Date.UTC(2026, index % 12, (index % 26) + 1, 14, 0, 0)),
    };
  });

  await prisma.evidenceItem.createMany({ data: evidenceItems });

  const managerSubmissionId = getManagerSubmissionId("emp_employee_1");
  const answerLinkTargets = await prisma.reviewAnswer.findMany({
    where: {
      submissionId: managerSubmissionId,
      questionId: {
        in: [
          "template_q_1",
          "template_q_2",
          "template_q_comp_safety",
          "template_q_comp_quality",
          "template_q_comp_results",
        ],
      },
    },
    select: {
      id: true,
      questionId: true,
    },
  });

  const answerIdByQuestionId = new Map(answerLinkTargets.map((answer) => [answer.questionId, answer.id]));

  const evidenceLinks = [
    { answerId: answerIdByQuestionId.get("template_q_1"), evidenceItemId: "evidence_seed_1" },
    { answerId: answerIdByQuestionId.get("template_q_1"), evidenceItemId: "evidence_seed_5" },
    { answerId: answerIdByQuestionId.get("template_q_2"), evidenceItemId: "evidence_seed_3" },
    { answerId: answerIdByQuestionId.get("template_q_comp_safety"), evidenceItemId: "evidence_seed_6" },
    { answerId: answerIdByQuestionId.get("template_q_comp_quality"), evidenceItemId: "evidence_seed_2" },
    { answerId: answerIdByQuestionId.get("template_q_comp_results"), evidenceItemId: "evidence_seed_4" },
  ].filter(
    (link): link is { answerId: string; evidenceItemId: string } => typeof link.answerId === "string",
  );

  if (evidenceLinks.length > 0) {
    await prisma.answerEvidenceLink.createMany({
      data: evidenceLinks.map((link) => ({
        orgId: demoOrgId,
        answerId: link.answerId,
        evidenceItemId: link.evidenceItemId,
      })),
    });
  }

  await prisma.calibrationSession.create({
    data: {
      id: demoCalibrationSessionId,
      orgId: demoOrgId,
      cycleId: demoCycleId,
      name: "Annual Review 2026 Calibration — Construction Cohort",
      roleGroup: "Operations & Field",
      description:
        "Cross-functional calibration session for operations managers and field leaders.",
      performanceAxisConfig: performanceAxis,
      potentialAxisConfig: potentialAxis,
      isFinalized: false,
      finalizedAt: null,
    },
  });

  await prisma.calibrationSessionParticipant.createMany({
    data: ["user_hr_admin_1", "user_calibrator_1", "user_manager_1", "user_manager_2"].map((userId) => ({
      orgId: demoOrgId,
      sessionId: demoCalibrationSessionId,
      userId,
    })),
  });

  const placementSubjects = [
    "emp_employee_1",
    "emp_employee_2",
    "emp_employee_3",
    "emp_employee_7",
    "emp_employee_8",
    "emp_employee_9",
    "emp_employee_10",
    "emp_employee_11",
    "emp_manager_1",
    "emp_manager_2",
  ];

  await prisma.calibrationPlacement.createMany({
    data: placementSubjects.map((employeeId, index) => ({
      id: `calibration_placement_seed_${index + 1}`,
      orgId: demoOrgId,
      sessionId: demoCalibrationSessionId,
      employeeId,
      performanceBucket:
        index % 3 === 0 ? CalibrationBucket.HIGH : index % 3 === 1 ? CalibrationBucket.MEDIUM : CalibrationBucket.LOW,
      potentialBucket: index % 2 === 0 ? CalibrationBucket.HIGH : CalibrationBucket.MEDIUM,
      justificationNote:
        "Placement reflects delivery consistency, safety leadership, and readiness for broader scope.",
    })),
  });

  await prisma.improvementPlan.create({
    data: {
      id: demoImprovementPlanId,
      orgId: demoOrgId,
      subjectEmployeeId: "emp_employee_1",
      managerEmployeeId: "emp_manager_1",
      hrOwnerEmployeeId: "emp_hr_admin_1",
      createdByUserId: "user_hr_admin_1",
      title: "Annual Review 2026 Performance Support Plan",
      expectations:
        "Improve forecast reliability, stakeholder communication cadence, and proactive risk escalation.",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-07-31T00:00:00.000Z"),
      status: ImprovementPlanStatus.ACTIVE,
    },
  });

  await prisma.improvementPlanGoal.createMany({
    data: [
      {
        id: "improvement_plan_goal_seed_1",
        orgId: demoOrgId,
        planId: demoImprovementPlanId,
        title: "Reduce weekly schedule variance",
        description: "Keep weekly look-ahead schedule variance under 10% for eight consecutive weeks.",
        sortOrder: 1,
      },
      {
        id: "improvement_plan_goal_seed_2",
        orgId: demoOrgId,
        planId: demoImprovementPlanId,
        title: "Improve stakeholder communication",
        description:
          "Publish clear risk and mitigation updates to project stakeholders every Friday.",
        sortOrder: 2,
      },
    ],
  });

  await prisma.improvementPlanCheckIn.create({
    data: {
      id: "improvement_plan_checkin_seed_1",
      orgId: demoOrgId,
      planId: demoImprovementPlanId,
      authorUserId: "user_manager_1",
      content:
        "Initial check-in completed. Weekly communication cadence and risk register template are now in place.",
      status: ImprovementPlanStatus.ACTIVE,
      checkInAt: new Date("2026-04-08T16:00:00.000Z"),
    },
  });

  await prisma.auditEvent.create({
    data: {
      orgId: demoOrgId,
      actorUserId: "user_hr_admin_1",
      action: "DEMO_DATA_RESET",
      entityType: "Org",
      entityId: demoOrgId,
      metadata: {
        cycleId: demoCycleId,
        submissionCount: submissions.length,
        evidenceItemCount: evidenceItems.length,
      },
    },
  });

  for (const packet of packetRows) {
    await recomputePacketScorecard(packet.id, {
      userId: "user_hr_admin_1",
      orgId: demoOrgId,
      role: UserRole.HR_ADMIN,
    });
  }

  return {
    users: demoPeople.length,
    employees: demoPeople.length,
    packets: packetRows.length,
    submissions: submissions.length,
    answers: answerRows.length,
    evidenceItems: evidenceItems.length,
    evidenceLinks: evidenceLinks.length,
  };
}

function getPacketId(subjectEmployeeId: string) {
  if (subjectEmployeeId === "emp_employee_1") {
    return "packet_seed_employee_1";
  }

  if (subjectEmployeeId === "emp_manager_1") {
    return "packet_seed_manager_1";
  }

  return `packet_seed_${subjectEmployeeId}`;
}

function getSelfSubmissionId(subjectEmployeeId: string) {
  if (subjectEmployeeId === "emp_employee_1") {
    return "submission_seed_employee_self_1";
  }

  if (subjectEmployeeId === "emp_manager_1") {
    return "submission_seed_manager_self_1";
  }

  return `submission_seed_${subjectEmployeeId}_self`;
}

function getManagerSubmissionId(subjectEmployeeId: string) {
  if (subjectEmployeeId === "emp_employee_1") {
    return "submission_seed_employee_manager_1";
  }

  return `submission_seed_${subjectEmployeeId}_manager`;
}

function buildAnswerContent(params: {
  question: DemoQuestion;
  relationship: ReviewRelationship;
  subject: DemoPerson;
  reviewer: DemoPerson;
}): {
  responseText: string;
  scaleRating: number | null;
  notObserved: boolean;
} {
  const { question, relationship, subject, reviewer } = params;

  if (question.questionType === ReviewQuestionType.TEXT) {
    if (question.id === "template_q_1") {
      if (relationship === ReviewRelationship.SELF) {
        return {
          responseText:
            `${subject.firstName} delivered stronger weekly planning discipline, reduced schedule slippage, ` +
            `and kept field and office teams aligned around critical path milestones.`,
          scaleRating: null,
          notObserved: false,
        };
      }

      return {
        responseText:
          `${reviewer.firstName} observed that ${subject.firstName} improved delivery reliability, ` +
          `safety communication, and cross-crew coordination on active job sites.`,
        scaleRating: null,
        notObserved: false,
      };
    }

    return {
      responseText:
        `${subject.firstName} should continue strengthening proactive stakeholder updates and ` +
        `handoff quality to reduce rework during tight execution windows.`,
      scaleRating: null,
      notObserved: false,
    };
  }

  if (!question.dimensionKey) {
    return {
      responseText: "No competency dimension configured.",
      scaleRating: null,
      notObserved: false,
    };
  }

  if (
    relationship === ReviewRelationship.UPWARD &&
    question.dimensionKey === CompetencyDimensionKey.TECHNICAL_SKILLS
  ) {
    return {
      responseText:
        `${reviewer.firstName} had limited direct visibility into ${subject.firstName}'s hands-on technical execution this cycle.`,
      scaleRating: null,
      notObserved: true,
    };
  }

  const seed = `${subject.employeeId}:${reviewer.employeeId}:${relationship}:${question.dimensionKey}`;
  let rating = 3 + (hashCode(seed) % 3);

  if (relationship === ReviewRelationship.SELF) {
    rating = clamp(rating - 1, 1, 5);
  }

  if (
    relationship === ReviewRelationship.MANAGER &&
    question.dimensionKey === CompetencyDimensionKey.SAFETY_COMPLIANCE
  ) {
    rating = 5;
  }

  return {
    responseText:
      `${subject.firstName} demonstrated ${dimensionLabel[question.dimensionKey]} through project execution, ` +
      `site coordination, and consistent follow-through with crews and stakeholders.`,
    scaleRating: clamp(rating, 1, 5),
    notObserved: false,
  };
}

function hashCode(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
