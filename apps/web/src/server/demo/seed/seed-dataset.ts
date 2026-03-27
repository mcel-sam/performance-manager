import {
  CycleStatus,
  FinalRatingSource,
  PositionStatus,
  ReviewRelationship,
  ReviewSubmissionStatus,
  ReviewQuestionType,
  SuccessionAssessmentLevel,
  SuccessionNoteVisibility,
  SuccessionReadiness,
  SuccessionVisibilityScope,
  UserRole,
  type CompetencyDimensionKey,
} from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import {
  demoCycleId,
  demoOrgId,
  demoTemplateId,
} from "@/server/demo/demo-constants";
import {
  calibrationParticipants,
  demoCalibrationConfig,
  demoCycleConfig,
  demoImprovementPlans,
  demoPeople,
  demoQuestions,
  demoStoryProfiles,
  performanceAxis,
  potentialAxis,
  scorecardMetrics,
} from "@/server/demo/seed/fixtures";
import type {
  DemoPerson,
  DemoQuestion,
  DemoSeedSummary,
  DemoStoryProfile,
  DimensionRatingSeed,
} from "@/server/demo/seed/types";
import { recomputePacketScorecard } from "@/server/scorecard/scorecard-service";

interface DemoSubmissionSeed {
  id: string;
  packetId: string;
  subjectEmployeeId: string;
  reviewerEmployeeId: string;
  relationship: ReviewRelationship;
  status: ReviewSubmissionStatus;
  dueAt: Date | null;
  submittedAt: Date | null;
}

interface EvidenceAttachmentTarget {
  subjectEmployeeId: string;
  questionId: string;
  evidenceItemId: string;
}

interface DemoSuccessionNoteSeed {
  id: string;
  authorEmployeeId: string;
  authorRole: UserRole;
  visibility: SuccessionNoteVisibility;
  body: string;
}

interface DemoSuccessionCandidateSeed {
  id: string;
  candidateEmployeeId: string;
  readiness: SuccessionReadiness;
  riskOfLoss: SuccessionAssessmentLevel | null;
  confidence: SuccessionAssessmentLevel | null;
  proposedByEmployeeId: string;
  proposedByRole: UserRole;
  sortOrder: number;
  notes: DemoSuccessionNoteSeed[];
}

interface DemoSuccessionPositionSeed {
  id: string;
  title: string;
  department: string;
  location: string | null;
  incumbentEmployeeId: string | null;
  isCritical: boolean;
  status: PositionStatus;
  ownerEmployeeId: string;
  visibilityScope: SuccessionVisibilityScope;
  reviewCadence: string;
  notes: string;
  collaboratorEmployeeIds: string[];
  allowedManagerEmployeeIds: string[];
  candidates: DemoSuccessionCandidateSeed[];
}

const dimensionLabel: Record<CompetencyDimensionKey, string> = {
  VALUES_CULTURE_ALIGNMENT: "values and culture alignment",
  JUDGMENT_DECISION_MAKING: "judgment and decision-making",
  SAFETY_COMPLIANCE: "safety and compliance",
  TECHNICAL_SKILLS: "technical execution",
  QUALITY_OF_WORK: "quality of work",
  COMMUNICATION: "communication",
  ACCOUNTABILITY: "accountability",
  RELATIONSHIP_BUILDING: "relationship building",
  RESULTS_DRIVEN: "results delivery",
  ATTITUDE: "attitude and professionalism",
  SERVICE_ORIENTED: "service mindset",
  ADAPTABILITY: "adaptability",
};

const demoSuccessionPositions: DemoSuccessionPositionSeed[] = [
  {
    id: "position_seed_ops_superintendent",
    title: "Operations Superintendent",
    department: "Operations",
    location: "Edmonton",
    incumbentEmployeeId: "emp_manager_1",
    isCritical: true,
    status: PositionStatus.ACTIVE,
    ownerEmployeeId: "emp_manager_1",
    visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
    reviewCadence: "Quarterly",
    notes:
      "Backfill pressure is highest during peak civil season. Bench depth should stay above two viable successors.",
    collaboratorEmployeeIds: ["emp_hr_admin_1"],
    allowedManagerEmployeeIds: ["emp_manager_1"],
    candidates: [
      {
        id: "succession_candidate_seed_ops_elliot",
        candidateEmployeeId: "emp_employee_1",
        readiness: SuccessionReadiness.READY_NOW,
        riskOfLoss: SuccessionAssessmentLevel.LOW,
        confidence: SuccessionAssessmentLevel.HIGH,
        proposedByEmployeeId: "emp_hr_admin_1",
        proposedByRole: UserRole.HR_ADMIN,
        sortOrder: 1,
        notes: [
          {
            id: "succession_note_seed_ops_elliot_hr",
            authorEmployeeId: "emp_hr_admin_1",
            authorRole: UserRole.HR_ADMIN,
            visibility: SuccessionNoteVisibility.HR_ONLY,
            body:
              "Ready-now if paired with a senior PM mentor for the first 60 days. Strong delivery credibility with crews.",
          },
        ],
      },
      {
        id: "succession_candidate_seed_ops_owen",
        candidateEmployeeId: "emp_employee_7",
        readiness: SuccessionReadiness.ONE_TO_TWO_YEARS,
        riskOfLoss: SuccessionAssessmentLevel.MEDIUM,
        confidence: SuccessionAssessmentLevel.MEDIUM,
        proposedByEmployeeId: "emp_manager_1",
        proposedByRole: UserRole.MANAGER,
        sortOrder: 2,
        notes: [
          {
            id: "succession_note_seed_ops_owen_mgr",
            authorEmployeeId: "emp_manager_1",
            authorRole: UserRole.MANAGER,
            visibility: SuccessionNoteVisibility.PLAN_VIEWERS,
            body:
              "Strong field credibility and coaching presence. Needs broader budget exposure before moving into the superintendent bench.",
          },
        ],
      },
    ],
  },
  {
    id: "position_seed_projects_manager",
    title: "Projects Manager",
    department: "Projects",
    location: "Edmonton",
    incumbentEmployeeId: "emp_manager_2",
    isCritical: true,
    status: PositionStatus.ACTIVE,
    ownerEmployeeId: "emp_manager_2",
    visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
    reviewCadence: "Quarterly",
    notes:
      "Needs a successor who can lead cross-trade planning meetings and stabilize complex schedule recoveries.",
    collaboratorEmployeeIds: ["emp_hr_admin_1"],
    allowedManagerEmployeeIds: ["emp_manager_1", "emp_manager_2"],
    candidates: [
      {
        id: "succession_candidate_seed_projects_priya",
        candidateEmployeeId: "emp_employee_3",
        readiness: SuccessionReadiness.ONE_TO_TWO_YEARS,
        riskOfLoss: SuccessionAssessmentLevel.MEDIUM,
        confidence: SuccessionAssessmentLevel.MEDIUM,
        proposedByEmployeeId: "emp_manager_1",
        proposedByRole: UserRole.MANAGER,
        sortOrder: 1,
        notes: [
          {
            id: "succession_note_seed_projects_priya_mgr",
            authorEmployeeId: "emp_manager_1",
            authorRole: UserRole.MANAGER,
            visibility: SuccessionNoteVisibility.PLAN_VIEWERS,
            body:
              "Priya is not ready-now, but she is already coordinating downstream dependencies better than most current leads.",
          },
        ],
      },
      {
        id: "succession_candidate_seed_projects_daniel",
        candidateEmployeeId: "emp_employee_14",
        readiness: SuccessionReadiness.READY_NOW,
        riskOfLoss: SuccessionAssessmentLevel.LOW,
        confidence: SuccessionAssessmentLevel.HIGH,
        proposedByEmployeeId: "emp_hr_admin_1",
        proposedByRole: UserRole.HR_ADMIN,
        sortOrder: 2,
        notes: [],
      },
    ],
  },
  {
    id: "position_seed_safety_director",
    title: "Safety Lead",
    department: "Safety",
    location: "Red Deer",
    incumbentEmployeeId: "emp_employee_11",
    isCritical: true,
    status: PositionStatus.ACTIVE,
    ownerEmployeeId: "emp_hr_admin_1",
    visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
    reviewCadence: "Monthly",
    notes:
      "Coverage depends on keeping one ready-now coordinator and one medium-term successor in flight because incident-response leadership is a known pinch point.",
    collaboratorEmployeeIds: ["emp_manager_2"],
    allowedManagerEmployeeIds: ["emp_manager_1", "emp_manager_2"],
    candidates: [
      {
        id: "succession_candidate_seed_safety_maya",
        candidateEmployeeId: "emp_employee_2",
        readiness: SuccessionReadiness.READY_NOW,
        riskOfLoss: SuccessionAssessmentLevel.MEDIUM,
        confidence: SuccessionAssessmentLevel.HIGH,
        proposedByEmployeeId: "emp_hr_admin_1",
        proposedByRole: UserRole.HR_ADMIN,
        sortOrder: 1,
        notes: [],
      },
      {
        id: "succession_candidate_seed_safety_bianca",
        candidateEmployeeId: "emp_employee_13",
        readiness: SuccessionReadiness.ONE_TO_TWO_YEARS,
        riskOfLoss: SuccessionAssessmentLevel.LOW,
        confidence: SuccessionAssessmentLevel.MEDIUM,
        proposedByEmployeeId: "emp_manager_2",
        proposedByRole: UserRole.MANAGER,
        sortOrder: 2,
        notes: [],
      },
    ],
  },
  {
    id: "position_seed_maintenance_manager",
    title: "Maintenance Manager",
    department: "Maintenance",
    location: "Fort Saskatchewan",
    incumbentEmployeeId: "emp_employee_16",
    isCritical: true,
    status: PositionStatus.ACTIVE,
    ownerEmployeeId: "emp_manager_2",
    visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
    reviewCadence: "Quarterly",
    notes:
      "This role currently has no viable ready-now bench. Gap should remain visible in reporting and export views.",
    collaboratorEmployeeIds: ["emp_hr_admin_1"],
    allowedManagerEmployeeIds: ["emp_manager_2"],
    candidates: [],
  },
  {
    id: "position_seed_dispatch_lead",
    title: "Dispatch Lead",
    department: "Admin/Finance",
    location: "Edmonton",
    incumbentEmployeeId: "emp_employee_6",
    isCritical: false,
    status: PositionStatus.ACTIVE,
    ownerEmployeeId: "emp_hr_admin_1",
    visibilityScope: SuccessionVisibilityScope.HR_ONLY,
    reviewCadence: "Semi-annual",
    notes:
      "This plan stays HR-only while the support structure is being redesigned and not every manager should see the slate yet.",
    collaboratorEmployeeIds: [],
    allowedManagerEmployeeIds: [],
    candidates: [
      {
        id: "succession_candidate_seed_dispatch_chloe",
        candidateEmployeeId: "emp_employee_12",
        readiness: SuccessionReadiness.THREE_TO_FIVE_YEARS,
        riskOfLoss: SuccessionAssessmentLevel.LOW,
        confidence: SuccessionAssessmentLevel.MEDIUM,
        proposedByEmployeeId: "emp_hr_admin_1",
        proposedByRole: UserRole.HR_ADMIN,
        sortOrder: 1,
        notes: [
          {
            id: "succession_note_seed_dispatch_chloe_hr",
            authorEmployeeId: "emp_hr_admin_1",
            authorRole: UserRole.HR_ADMIN,
            visibility: SuccessionNoteVisibility.HR_ONLY,
            body:
              "Suitable for long-term bench depth, but still too early to open visibility beyond HR while process redesign continues.",
          },
        ],
      },
    ],
  },
  {
    id: "position_seed_field_training_lead",
    title: "Field Training Lead",
    department: "Operations",
    location: "Leduc",
    incumbentEmployeeId: "emp_employee_15",
    isCritical: false,
    status: PositionStatus.ACTIVE,
    ownerEmployeeId: "emp_manager_1",
    visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
    reviewCadence: "Quarterly",
    notes:
      "Bench should focus on coachability and credibility with site leads more than immediate line-management readiness.",
    collaboratorEmployeeIds: ["emp_hr_admin_1"],
    allowedManagerEmployeeIds: ["emp_manager_1"],
    candidates: [
      {
        id: "succession_candidate_seed_training_noah",
        candidateEmployeeId: "emp_employee_4",
        readiness: SuccessionReadiness.FUTURE,
        riskOfLoss: SuccessionAssessmentLevel.LOW,
        confidence: SuccessionAssessmentLevel.LOW,
        proposedByEmployeeId: "emp_manager_1",
        proposedByRole: UserRole.MANAGER,
        sortOrder: 1,
        notes: [],
      },
    ],
  },
];

const portrait = (group: "men" | "women", index: number) =>
  `https://randomuser.me/api/portraits/${group}/${index}.jpg`;

const demoAvatarByEmployeeId: Record<string, string> = {
  emp_hr_admin_1: portrait("women", 68),
  emp_super_admin_1: portrait("women", 44),
  emp_manager_1: portrait("men", 32),
  emp_manager_2: portrait("men", 45),
  emp_employee_1: portrait("men", 36),
  emp_employee_2: portrait("women", 65),
  emp_employee_3: portrait("women", 28),
  emp_employee_4: portrait("men", 52),
  emp_employee_5: portrait("men", 41),
  emp_employee_6: portrait("women", 48),
  emp_employee_7: portrait("men", 54),
  emp_employee_8: portrait("women", 33),
  emp_employee_9: portrait("men", 57),
  emp_employee_10: portrait("women", 62),
  emp_employee_11: portrait("men", 67),
  emp_employee_12: portrait("women", 71),
  emp_employee_13: portrait("women", 58),
  emp_employee_14: portrait("men", 71),
  emp_employee_15: portrait("women", 75),
  emp_employee_16: portrait("men", 61),
};

export async function seedDemoData(): Promise<DemoSeedSummary> {
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

  await prisma.orgMembership.createMany({
    data: demoPeople.map((person) => ({
      orgId: demoOrgId,
      userId: person.userId,
      role: person.role,
      isActive: true,
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
      avatarUrl: demoAvatarByEmployeeId[person.employeeId] ?? null,
      managerId: null,
    })),
  });

  for (const person of demoPeople) {
    if (!person.managerEmployeeId) {
      continue;
    }

    await prisma.employee.update({
      where: { id: person.employeeId },
      data: { managerId: person.managerEmployeeId },
    });
  }

  await prisma.reviewTemplate.create({
    data: {
      id: demoTemplateId,
      orgId: demoOrgId,
      name: "Annual Review 2026 Template",
      description:
        "Construction performance template covering delivery, safety, communication, and coaching outcomes.",
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
      id: demoCycleConfig.id,
      orgId: demoCycleConfig.orgId,
      name: demoCycleConfig.name,
      startDate: demoCycleConfig.startDate,
      endDate: demoCycleConfig.endDate,
      status: CycleStatus.ACTIVE,
      visibilityPolicy: demoCycleConfig.visibilityPolicy,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: demoCycleConfig.peerReviewCount,
      upwardReviewCount: demoCycleConfig.upwardReviewCount,
      templateId: demoCycleConfig.templateId,
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
    const manager = subject.managerEmployeeId ? personByEmployeeId.get(subject.managerEmployeeId) : null;

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

  const submissions = buildSubmissions(reviewedPeople, packetIdBySubjectEmployeeId);

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
      dueAt: submission.dueAt,
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

  const { evidenceItems, attachmentTargets } = buildEvidenceRows(reviewedPeople, personByEmployeeId);
  await prisma.evidenceItem.createMany({ data: evidenceItems });

  const evidenceLinks = await createEvidenceLinks(attachmentTargets);

  await prisma.calibrationSession.create({
    data: {
      id: demoCalibrationConfig.id,
      orgId: demoOrgId,
      cycleId: demoCycleId,
      name: demoCalibrationConfig.name,
      roleGroup: demoCalibrationConfig.roleGroup,
      description: demoCalibrationConfig.description,
      performanceAxisConfig: performanceAxis,
      potentialAxisConfig: potentialAxis,
      isFinalized: false,
      finalizedAt: null,
    },
  });

  await prisma.calibrationSessionParticipant.createMany({
    data: calibrationParticipants.map((userId) => ({
      orgId: demoOrgId,
      sessionId: demoCalibrationConfig.id,
      userId,
    })),
  });

  await prisma.calibrationPlacement.createMany({
    data: reviewedPeople.map((person, index) => {
      const storyProfile = demoStoryProfiles[person.storyKey];
      return {
        id: `calibration_placement_seed_${index + 1}`,
        orgId: demoOrgId,
        sessionId: demoCalibrationConfig.id,
        employeeId: person.employeeId,
        performanceBucket: storyProfile.calibration.performanceBucket,
        potentialBucket: storyProfile.calibration.potentialBucket,
        justificationNote: storyProfile.calibration.justification,
      };
    }),
  });

  const userIdByEmployeeId = new Map(
    demoPeople.map((person) => [person.employeeId, person.userId]),
  );

  for (const plan of demoImprovementPlans) {
    await prisma.improvementPlan.create({
      data: {
        id: plan.id,
        orgId: demoOrgId,
        subjectEmployeeId: plan.subjectEmployeeId,
        managerEmployeeId: plan.managerEmployeeId,
        hrOwnerEmployeeId: "emp_hr_admin_1",
        createdByUserId: "user_hr_admin_1",
        title: plan.title,
        expectations: plan.expectations,
        startDate: plan.startDate,
        endDate: plan.endDate,
        status: plan.status,
      },
    });

    await prisma.improvementPlanGoal.createMany({
      data: plan.goals.map((goal) => ({
        id: goal.id,
        orgId: demoOrgId,
        planId: plan.id,
        title: goal.title,
        description: goal.description,
        sortOrder: goal.sortOrder,
      })),
    });

    await prisma.improvementPlanCheckIn.createMany({
      data: plan.checkIns.map((checkIn) => ({
        id: checkIn.id,
        orgId: demoOrgId,
        planId: plan.id,
        authorUserId: checkIn.authorUserId,
        content: checkIn.content,
        status: checkIn.status,
        checkInAt: checkIn.checkInAt,
      })),
    });

    const managerUserId = userIdByEmployeeId.get(plan.managerEmployeeId);
    if (managerUserId) {
      await prisma.auditEvent.create({
        data: {
          orgId: demoOrgId,
          actorUserId: managerUserId,
          action: "IMPROVEMENT_PLAN_STATUS_CHANGED",
          entityType: "ImprovementPlan",
          entityId: plan.id,
          metadata: {
            status: plan.status,
            seeded: true,
          },
        },
      });
    }
  }

  for (const packet of packetRows) {
    await recomputePacketScorecard(packet.id, {
      userId: "user_hr_admin_1",
      orgId: demoOrgId,
      role: UserRole.HR_ADMIN,
    });
  }

  const calibrationOverrideSubjectIds = reviewedPeople
    .filter((person) => demoStoryProfiles[person.storyKey].calibration.finalSourceCalibration)
    .map((person) => person.employeeId);

  if (calibrationOverrideSubjectIds.length > 0) {
    await prisma.reviewPacket.updateMany({
      where: {
        orgId: demoOrgId,
        cycleId: demoCycleId,
        subjectEmployeeId: {
          in: calibrationOverrideSubjectIds,
        },
      },
      data: {
        finalRatingSource: FinalRatingSource.CALIBRATION,
      },
    });
  }

  const successionSummary = await seedSuccessionData();

  await prisma.auditEvent.create({
    data: {
      orgId: demoOrgId,
      actorUserId: "user_hr_admin_1",
      action: "DEMO_DATA_RESET",
      entityType: "Org",
      entityId: demoOrgId,
      metadata: {
        cycleId: demoCycleId,
        submissions: submissions.length,
        evidenceItems: evidenceItems.length,
        evidenceLinks: evidenceLinks,
        calibrationOverrides: calibrationOverrideSubjectIds.length,
        successionPositions: successionSummary.positions,
        successionCandidates: successionSummary.candidates,
        successionNotes: successionSummary.notes,
      },
    },
  });

  return {
    users: demoPeople.length,
    employees: demoPeople.length,
    packets: packetRows.length,
    submissions: submissions.length,
    answers: answerRows.length,
    evidenceItems: evidenceItems.length,
    evidenceLinks: evidenceLinks,
  };
}

function buildSubmissions(
  reviewedPeople: DemoPerson[],
  packetIdBySubjectEmployeeId: Map<string, string>,
): DemoSubmissionSeed[] {
  const submissions: DemoSubmissionSeed[] = [];

  for (const subject of reviewedPeople) {
    const packetId = packetIdBySubjectEmployeeId.get(subject.employeeId);
    if (!packetId) {
      continue;
    }

    const selfStatus = getSelfSubmissionStatus(subject.employeeId);
    submissions.push({
      id: getSelfSubmissionId(subject.employeeId),
      packetId,
      subjectEmployeeId: subject.employeeId,
      reviewerEmployeeId: subject.employeeId,
      relationship: ReviewRelationship.SELF,
      status: selfStatus,
      dueAt: new Date("2026-11-18T23:59:59.999Z"),
      submittedAt: toSubmittedAt(selfStatus, "2026-11-18T15:00:00.000Z"),
    });

    if (subject.managerEmployeeId) {
      const managerStatus = getManagerSubmissionStatus(subject.employeeId);
      submissions.push({
        id: getManagerSubmissionId(subject.employeeId),
        packetId,
        subjectEmployeeId: subject.employeeId,
        reviewerEmployeeId: subject.managerEmployeeId,
        relationship: ReviewRelationship.MANAGER,
        status: managerStatus,
        dueAt: new Date("2026-11-22T23:59:59.999Z"),
        submittedAt: toSubmittedAt(managerStatus, "2026-11-22T16:00:00.000Z"),
      });
    }
  }

  return submissions;
}

function toSubmittedAt(status: ReviewSubmissionStatus, isoDate: string): Date | null {
  if (status === ReviewSubmissionStatus.SUBMITTED) {
    return new Date(isoDate);
  }

  return null;
}

function getSelfSubmissionStatus(subjectEmployeeId: string): ReviewSubmissionStatus {
  if (subjectEmployeeId === "emp_employee_4") {
    return ReviewSubmissionStatus.IN_PROGRESS;
  }

  if (subjectEmployeeId === "emp_employee_5") {
    return ReviewSubmissionStatus.NOT_STARTED;
  }

  return ReviewSubmissionStatus.SUBMITTED;
}

function getManagerSubmissionStatus(subjectEmployeeId: string): ReviewSubmissionStatus {
  if (subjectEmployeeId === "emp_employee_1") {
    return ReviewSubmissionStatus.IN_PROGRESS;
  }

  if (subjectEmployeeId === "emp_employee_9") {
    return ReviewSubmissionStatus.RETURNED;
  }

  if (subjectEmployeeId === "emp_employee_5" || subjectEmployeeId === "emp_employee_15") {
    return ReviewSubmissionStatus.NOT_STARTED;
  }

  return ReviewSubmissionStatus.SUBMITTED;
}

function buildEvidenceRows(
  reviewedPeople: DemoPerson[],
  personByEmployeeId: Map<string, DemoPerson>,
): {
  evidenceItems: Array<{
    id: string;
    orgId: string;
    subjectEmployeeId: string;
    authorEmployeeId: string;
    type:
      | "FEEDBACK"
      | "UPDATE"
      | "ONE_ON_ONE"
      | "GOAL"
      | "GOAL_UPDATE"
      | "VALUE_RECOGNITION";
    visibility: "PRIVATE" | "MANAGER_ONLY" | "SHARED_WITH_SUBJECT" | "ORG_VISIBLE";
    content: string;
    occurredAt: Date;
  }>;
  attachmentTargets: EvidenceAttachmentTarget[];
} {
  let evidenceIndex = 0;
  const evidenceItems: Array<{
    id: string;
    orgId: string;
    subjectEmployeeId: string;
    authorEmployeeId: string;
    type:
      | "FEEDBACK"
      | "UPDATE"
      | "ONE_ON_ONE"
      | "GOAL"
      | "GOAL_UPDATE"
      | "VALUE_RECOGNITION";
    visibility: "PRIVATE" | "MANAGER_ONLY" | "SHARED_WITH_SUBJECT" | "ORG_VISIBLE";
    content: string;
    occurredAt: Date;
  }> = [];
  const attachmentTargets: EvidenceAttachmentTarget[] = [];

  for (const person of reviewedPeople) {
    const storyProfile = demoStoryProfiles[person.storyKey];
    const authorEmployeeId = person.managerEmployeeId ?? "emp_hr_admin_1";

    storyProfile.evidenceTemplates.forEach((template, templateIndex) => {
      evidenceIndex += 1;
      const evidenceItemId = `evidence_seed_${evidenceIndex}`;
      const manager = person.managerEmployeeId
        ? personByEmployeeId.get(person.managerEmployeeId)
        : null;
      const managerName = manager ? `${manager.firstName} ${manager.lastName}` : "HR";

      evidenceItems.push({
        id: evidenceItemId,
        orgId: demoOrgId,
        subjectEmployeeId: person.employeeId,
        authorEmployeeId,
        type: template.type,
        visibility: template.visibility,
        content: `${template.content} (${person.firstName} ${person.lastName} • reviewed by ${managerName}).`,
        occurredAt: new Date(Date.UTC(2026, templateIndex % 12, ((evidenceIndex - 1) % 26) + 1, 14, 0, 0)),
      });

      if (template.attachToQuestionId) {
        attachmentTargets.push({
          subjectEmployeeId: person.employeeId,
          questionId: template.attachToQuestionId,
          evidenceItemId,
        });
      }
    });
  }

  return {
    evidenceItems,
    attachmentTargets,
  };
}

async function createEvidenceLinks(attachmentTargets: EvidenceAttachmentTarget[]): Promise<number> {
  if (attachmentTargets.length === 0) {
    return 0;
  }

  const questionIds = Array.from(new Set(attachmentTargets.map((target) => target.questionId)));

  const managerAnswers = await prisma.reviewAnswer.findMany({
    where: {
      submission: {
        orgId: demoOrgId,
        cycleId: demoCycleId,
        relationship: ReviewRelationship.MANAGER,
      },
      questionId: {
        in: questionIds,
      },
    },
    select: {
      id: true,
      questionId: true,
      submission: {
        select: {
          subjectEmployeeId: true,
        },
      },
    },
  });

  const answerIdBySubjectQuestion = new Map(
    managerAnswers.map((answer) => [
      `${answer.submission.subjectEmployeeId}:${answer.questionId}`,
      answer.id,
    ]),
  );

  const links = attachmentTargets
    .map((target) => {
      const answerId = answerIdBySubjectQuestion.get(`${target.subjectEmployeeId}:${target.questionId}`);
      if (!answerId) {
        return null;
      }

      return {
        orgId: demoOrgId,
        answerId,
        evidenceItemId: target.evidenceItemId,
      };
    })
    .filter((link): link is { orgId: string; answerId: string; evidenceItemId: string } => link !== null);

  if (links.length === 0) {
    return 0;
  }

  await prisma.answerEvidenceLink.createMany({
    data: links,
    skipDuplicates: true,
  });

  return links.length;
}

async function seedSuccessionData(): Promise<{
  positions: number;
  candidates: number;
  notes: number;
}> {
  const packets = await prisma.reviewPacket.findMany({
    where: {
      orgId: demoOrgId,
      cycleId: demoCycleId,
    },
    select: {
      subjectEmployeeId: true,
      cycleId: true,
      scorecardOverallRating: true,
      totalScorecardPercent: true,
      finalRatingSource: true,
      snapshotDepartment: true,
      snapshotTitle: true,
      snapshotManagerEmployeeId: true,
      snapshotManagerName: true,
    },
  });

  const packetByEmployeeId = new Map(
    packets.map((packet) => [packet.subjectEmployeeId, packet]),
  );

  const calibrationPlacements = await prisma.calibrationPlacement.findMany({
    where: {
      orgId: demoOrgId,
      sessionId: demoCalibrationConfig.id,
    },
    select: {
      employeeId: true,
      performanceBucket: true,
      potentialBucket: true,
    },
  });

  const calibrationByEmployeeId = new Map(
    calibrationPlacements.map((placement) => [placement.employeeId, placement]),
  );

  let candidateCount = 0;
  let noteCount = 0;

  for (const positionSeed of demoSuccessionPositions) {
    const position = await prisma.position.create({
      data: {
        id: positionSeed.id,
        orgId: demoOrgId,
        title: positionSeed.title,
        department: positionSeed.department,
        location: positionSeed.location,
        incumbentEmployeeId: positionSeed.incumbentEmployeeId,
        isCritical: positionSeed.isCritical,
        status: positionSeed.status,
        plan: {
          create: {
            orgId: demoOrgId,
            ownerEmployeeId: positionSeed.ownerEmployeeId,
            visibilityScope: positionSeed.visibilityScope,
            reviewCadence: positionSeed.reviewCadence,
            notes: positionSeed.notes,
            collaborators: {
              create: positionSeed.collaboratorEmployeeIds.map((employeeId) => ({
                orgId: demoOrgId,
                employeeId,
              })),
            },
            allowedManagers: {
              create: positionSeed.allowedManagerEmployeeIds.map((managerEmployeeId) => ({
                orgId: demoOrgId,
                managerEmployeeId,
              })),
            },
          },
        },
      },
      select: {
        plan: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!position.plan) {
      continue;
    }

    for (const candidateSeed of positionSeed.candidates) {
      const candidate = await prisma.successionCandidate.create({
        data: {
          id: candidateSeed.id,
          orgId: demoOrgId,
          planId: position.plan.id,
          candidateEmployeeId: candidateSeed.candidateEmployeeId,
          readiness: candidateSeed.readiness,
          riskOfLoss: candidateSeed.riskOfLoss,
          confidence: candidateSeed.confidence,
          proposedByRole: candidateSeed.proposedByRole,
          proposedByEmployeeId: candidateSeed.proposedByEmployeeId,
          sortOrder: candidateSeed.sortOrder,
        },
      });

      candidateCount += 1;

      const packet = packetByEmployeeId.get(candidateSeed.candidateEmployeeId);
      const calibration = calibrationByEmployeeId.get(candidateSeed.candidateEmployeeId);

      if (packet) {
        await prisma.successionCandidateSnapshot.create({
          data: {
            orgId: demoOrgId,
            candidateId: candidate.id,
            cycleId: packet.cycleId,
            scorecardOverallRating: packet.scorecardOverallRating,
            scorecardPercent: packet.totalScorecardPercent,
            finalRatingSource: packet.finalRatingSource,
            calibrationPerformanceBucket: calibration?.performanceBucket ?? null,
            calibrationPotentialBucket: calibration?.potentialBucket ?? null,
            snapshotDepartment: packet.snapshotDepartment,
            snapshotTitle: packet.snapshotTitle,
            snapshotManagerEmployeeId: packet.snapshotManagerEmployeeId,
            snapshotManagerName: packet.snapshotManagerName,
          },
        });
      }

      for (const noteSeed of candidateSeed.notes) {
        await prisma.successionNote.create({
          data: {
            id: noteSeed.id,
            orgId: demoOrgId,
            candidateId: candidate.id,
            authorEmployeeId: noteSeed.authorEmployeeId,
            authorRole: noteSeed.authorRole,
            visibility: noteSeed.visibility,
            body: noteSeed.body,
          },
        });
        noteCount += 1;
      }
    }
  }

  return {
    positions: demoSuccessionPositions.length,
    candidates: candidateCount,
    notes: noteCount,
  };
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
  const storyProfile = demoStoryProfiles[subject.storyKey];

  if (question.questionType === ReviewQuestionType.TEXT) {
    if (question.id === "template_q_1") {
      if (relationship === ReviewRelationship.SELF) {
        return {
          responseText: storyProfile.impactSelf,
          scaleRating: null,
          notObserved: false,
        };
      }

      if (relationship === ReviewRelationship.MANAGER) {
        return {
          responseText: storyProfile.impactManager,
          scaleRating: null,
          notObserved: false,
        };
      }

      if (relationship === ReviewRelationship.PEER) {
        return {
          responseText: `Peer perspective: ${subject.firstName} improved crew coordination and shared updates reliably this cycle.`,
          scaleRating: null,
          notObserved: false,
        };
      }

      return {
        responseText: `Upward feedback from ${reviewer.firstName}: ${subject.firstName} provided clear direction and removed blockers quickly when escalations surfaced.`,
        scaleRating: null,
        notObserved: false,
      };
    }

    if (relationship === ReviewRelationship.UPWARD) {
      return {
        responseText: `Upward growth recommendation: keep weekly context-setting updates concise and explicit on priorities.`,
        scaleRating: null,
        notObserved: false,
      };
    }

    return {
      responseText: storyProfile.growthFocus,
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

  const ratingSeed = resolveRatingSeed(storyProfile, question.dimensionKey, relationship);

  if (ratingSeed === "NOT_OBS") {
    return {
      responseText: `${subject.firstName} had limited direct observation on ${dimensionLabel[question.dimensionKey]} for this relationship context.`,
      scaleRating: null,
      notObserved: true,
    };
  }

  return {
    responseText: `${subject.firstName} demonstrated ${dimensionLabel[question.dimensionKey]} through construction delivery, safety planning, and team handoffs this cycle.`,
    scaleRating: ratingSeed,
    notObserved: false,
  };
}

function resolveRatingSeed(
  storyProfile: DemoStoryProfile,
  dimensionKey: CompetencyDimensionKey,
  relationship: ReviewRelationship,
): DimensionRatingSeed {
  if (relationship === ReviewRelationship.SELF) {
    return storyProfile.selfRatings[dimensionKey];
  }

  if (relationship === ReviewRelationship.MANAGER) {
    return storyProfile.managerRatings[dimensionKey];
  }

  const managerSeed = storyProfile.managerRatings[dimensionKey];
  if (managerSeed === "NOT_OBS") {
    return "NOT_OBS";
  }

  if (relationship === ReviewRelationship.PEER) {
    return clampRating(managerSeed);
  }

  if (dimensionKey === "TECHNICAL_SKILLS") {
    return "NOT_OBS";
  }

  return clampRating(managerSeed - 1);
}

function clampRating(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)));
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
