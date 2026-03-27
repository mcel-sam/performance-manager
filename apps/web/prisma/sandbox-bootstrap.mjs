import {
  CompetencyDimensionKey,
  CycleStatus,
  CycleVisibilityPolicy,
  FinalRatingSource,
  GoalCycleCadence,
  GoalCycleStatus,
  GoalStatus,
  GoalType,
  GoalVisibility,
  GoalWorkflowStatus,
  ImprovementPlanCheckInType,
  ImprovementPlanStatus,
  ImprovementPlanTrigger,
  PrismaClient,
  ReviewQuestionType,
  ReviewRelationship,
  ReviewSubmissionStatus,
  ScorecardMetricKey,
} from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { sandboxOrgId, sandboxOrgName, sandboxRoster } from "./sandbox-bootstrap-config.mjs";

const prisma = new PrismaClient();

const placeholderPassword = "replace-with-your-shared-sandbox-password";
const configuredPassword = process.env.SANDBOX_BOOTSTRAP_DEFAULT_PASSWORD?.trim() || "";
const defaultPassword =
  configuredPassword && configuredPassword !== placeholderPassword ? configuredPassword : "";

const sandboxScenario = {
  reviewTemplate: {
    id: "sandbox_review_template_vanilla_1",
    name: "Sandbox Vanilla Review Template",
    description: "Default template for sandbox self and manager review walkthroughs.",
    questions: [
      {
        id: "sandbox_review_question_results",
        prompt: "Describe the most meaningful accomplishments and business results from this review period.",
        questionType: ReviewQuestionType.TEXT,
        dimensionKey: CompetencyDimensionKey.RESULTS_DRIVEN,
        isRequired: true,
        sortOrder: 1,
      },
      {
        id: "sandbox_review_question_growth",
        prompt: "Summarize strengths, development priorities, and the growth support that would help next.",
        questionType: ReviewQuestionType.TEXT,
        dimensionKey: CompetencyDimensionKey.ADAPTABILITY,
        isRequired: true,
        sortOrder: 2,
      },
      {
        id: "sandbox_review_question_leadership",
        prompt: "Rate the consistency of leadership behaviors demonstrated during the cycle.",
        questionType: ReviewQuestionType.SCALE_1_TO_5,
        dimensionKey: CompetencyDimensionKey.COMMUNICATION,
        isRequired: false,
        sortOrder: 3,
      },
      {
        id: "sandbox_review_question_growth_potential",
        prompt: "Rate current readiness for broader scope or increased complexity.",
        questionType: ReviewQuestionType.SCALE_1_TO_5,
        dimensionKey: CompetencyDimensionKey.JUDGMENT_DECISION_MAKING,
        isRequired: false,
        sortOrder: 4,
      },
    ],
  },
  goalCycle: {
    id: "sandbox_goal_cycle_2026_annual",
    name: "Sandbox 2026 Goals",
    cadence: GoalCycleCadence.ANNUAL,
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: new Date("2026-12-31T00:00:00.000Z"),
    status: GoalCycleStatus.ACTIVE,
  },
  goals: [
    {
      id: "sandbox_goal_ted_performance",
      title: "Improve application incident response time",
      description:
        "Reduce average triage time for critical application support incidents by tightening ownership and escalation handoffs.",
      goalType: GoalType.PERFORMANCE,
      status: GoalStatus.ON_TRACK,
      progressPercent: 55,
      workflowStatus: GoalWorkflowStatus.APPROVED,
      visibility: GoalVisibility.TEAM,
      submittedAt: new Date("2026-01-10T17:00:00.000Z"),
      approvedAt: new Date("2026-01-15T17:00:00.000Z"),
      update: {
        id: "sandbox_goal_update_ted_performance",
        note: "Critical incident triage now routes through a shared checklist and incident channel.",
        createdAt: new Date("2026-03-15T17:00:00.000Z"),
      },
    },
    {
      id: "sandbox_goal_ted_development",
      title: "Strengthen stakeholder communication cadence",
      description:
        "Send consistent weekly updates with status, risks, and decisions for the enterprise applications backlog.",
      goalType: GoalType.DEVELOPMENT,
      status: GoalStatus.ON_TRACK,
      progressPercent: 35,
      workflowStatus: GoalWorkflowStatus.APPROVED,
      visibility: GoalVisibility.TEAM,
      submittedAt: new Date("2026-01-10T17:00:00.000Z"),
      approvedAt: new Date("2026-01-15T17:00:00.000Z"),
      update: {
        id: "sandbox_goal_update_ted_development",
        note: "Weekly stakeholder summaries are in place, with risk tracking added for the next cycle.",
        createdAt: new Date("2026-03-12T17:00:00.000Z"),
      },
    },
  ],
  reviewCycles: {
    selfDraft: {
      id: "sandbox_review_cycle_self_active_1",
      packetId: "sandbox_packet_self_active_ted",
      selfSubmissionId: "sandbox_submission_self_active_ted_self",
      managerSubmissionId: "sandbox_submission_self_active_ted_manager",
      name: "Sandbox 2026 Self Review",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      selfReviewDueAt: new Date("2026-03-24T23:59:59.000Z"),
      managerReviewDueAt: new Date("2026-03-31T23:59:59.000Z"),
      status: CycleStatus.ACTIVE,
      packet: {
        totalScorecardPercent: null,
        scorecardOverallRating: null,
        finalRatingSource: null,
      },
    },
    managerReady: {
      id: "sandbox_review_cycle_manager_active_1",
      packetId: "sandbox_packet_manager_active_ted",
      selfSubmissionId: "sandbox_submission_manager_active_ted_self",
      managerSubmissionId: "sandbox_submission_manager_active_ted_manager",
      name: "Sandbox 2026 Manager Review",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
      selfReviewDueAt: new Date("2026-04-10T23:59:59.000Z"),
      managerReviewDueAt: new Date("2026-04-24T23:59:59.000Z"),
      status: CycleStatus.ACTIVE,
      packet: {
        totalScorecardPercent: 81,
        scorecardOverallRating: 3,
        finalRatingSource: FinalRatingSource.SCORECARD,
      },
    },
    releasedPacket: {
      id: "sandbox_review_cycle_released_packet_1",
      packetId: "sandbox_packet_released_ted",
      selfSubmissionId: "sandbox_submission_released_ted_self",
      managerSubmissionId: "sandbox_submission_released_ted_manager",
      name: "Sandbox 2025 Released Packet",
      startDate: new Date("2025-11-01T00:00:00.000Z"),
      endDate: new Date("2025-12-15T00:00:00.000Z"),
      selfReviewDueAt: new Date("2025-11-25T23:59:59.000Z"),
      managerReviewDueAt: new Date("2025-12-05T23:59:59.000Z"),
      status: CycleStatus.RELEASED,
      packet: {
        totalScorecardPercent: 84,
        scorecardOverallRating: 4,
        finalRatingSource: FinalRatingSource.SCORECARD,
      },
    },
    lockedCalibration: {
      id: "sandbox_review_cycle_locked_calibration_1",
      packetId: "sandbox_packet_locked_calibration_ted",
      selfSubmissionId: "sandbox_submission_locked_ted_self",
      managerSubmissionId: "sandbox_submission_locked_ted_manager",
      name: "Sandbox 2026 Calibration Ready",
      startDate: new Date("2026-02-01T00:00:00.000Z"),
      endDate: new Date("2026-02-28T00:00:00.000Z"),
      selfReviewDueAt: new Date("2026-02-14T23:59:59.000Z"),
      managerReviewDueAt: new Date("2026-02-24T23:59:59.000Z"),
      status: CycleStatus.LOCKED,
      packet: {
        totalScorecardPercent: 86,
        scorecardOverallRating: 4,
        finalRatingSource: FinalRatingSource.SCORECARD,
      },
    },
  },
  improvementPlan: {
    id: "sandbox_improvement_plan_ted_1",
    goalIds: [
      "sandbox_improvement_plan_goal_ted_1",
      "sandbox_improvement_plan_goal_ted_2",
    ],
    checkInIds: {
      kickoff: "sandbox_improvement_plan_checkin_ted_1",
      checkpoint30: "sandbox_improvement_plan_checkin_ted_2",
    },
    title: "Ted Tederoff - Performance Support Plan",
    expectations:
      "Improve delivery predictability, issue ownership, and proactive stakeholder communication over the next 90 days.",
    startDate: new Date("2026-02-01T00:00:00.000Z"),
    endDate: new Date("2026-05-05T00:00:00.000Z"),
    status: ImprovementPlanStatus.ACTIVE,
    triggerSource: ImprovementPlanTrigger.REVIEW,
  },
};

const scorecardMetrics = [
  { metricKey: ScorecardMetricKey.QUALITY_OF_WORK, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.COMMUNICATION, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ACCOUNTABILITY, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.RELATIONSHIP_BUILDING, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.RESULTS_DRIVEN, weightPercent: 20 },
  { metricKey: ScorecardMetricKey.ATTITUDE, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.SERVICE_ORIENTED, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ADAPTABILITY, weightPercent: 10 },
];

async function main() {
  const supabaseAdmin = createSupabaseAdminClient();
  const authUsersByEmail = supabaseAdmin ? await loadSupabaseUsersByEmail(supabaseAdmin) : new Map();
  const userRecords = new Map();
  const employeeRecords = new Map();
  const roster = sandboxRoster;

  await prisma.org.upsert({
    where: { id: sandboxOrgId },
    update: { name: sandboxOrgName },
    create: {
      id: sandboxOrgId,
      name: sandboxOrgName,
    },
  });

  for (const person of roster) {
    const authUser = supabaseAdmin
      ? await ensureSupabaseUser(supabaseAdmin, authUsersByEmail, person.email)
      : null;

    const existingUser = await prisma.user.findUnique({
      where: {
        orgId_email: {
          orgId: sandboxOrgId,
          email: person.email,
        },
      },
      select: {
        id: true,
      },
    });

    const user = existingUser
      ? await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            orgId: sandboxOrgId,
            email: person.email,
            role: person.role,
            ...(authUser ? { authIdentityId: authUser.id } : {}),
          },
          select: {
            id: true,
            email: true,
            role: true,
            authIdentityId: true,
          },
        })
      : await prisma.user.create({
          data: {
            id: person.desiredUserId,
            orgId: sandboxOrgId,
            email: person.email,
            role: person.role,
            authIdentityId: authUser?.id ?? null,
          },
          select: {
            id: true,
            email: true,
            role: true,
            authIdentityId: true,
          },
        });

    await prisma.orgMembership.upsert({
      where: {
        orgId_userId: {
          orgId: sandboxOrgId,
          userId: user.id,
        },
      },
      update: {
        role: person.role,
        isActive: true,
      },
      create: {
        orgId: sandboxOrgId,
        userId: user.id,
        role: person.role,
        isActive: true,
      },
    });

    userRecords.set(person.key, user);
  }

  for (const person of roster) {
    const user = userRecords.get(person.key);
    const existingEmployee = await prisma.employee.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
      },
    });

    const employee = existingEmployee
      ? await prisma.employee.update({
          where: { id: existingEmployee.id },
          data: {
            orgId: sandboxOrgId,
            userId: user.id,
            firstName: person.firstName,
            lastName: person.lastName,
            department: person.department,
            title: person.title,
            managerId: null,
          },
          select: {
            id: true,
          },
        })
      : await prisma.employee.create({
          data: {
            id: person.desiredEmployeeId,
            orgId: sandboxOrgId,
            userId: user.id,
            firstName: person.firstName,
            lastName: person.lastName,
            department: person.department,
            title: person.title,
            managerId: null,
          },
          select: {
            id: true,
          },
        });

    employeeRecords.set(person.key, employee);
  }

  for (const person of roster) {
    const employee = employeeRecords.get(person.key);
    const managerId = person.managerKey ? employeeRecords.get(person.managerKey)?.id ?? null : null;

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        managerId,
      },
    });
  }

  const scenarioSummary = await seedSandboxWorkflowScenario({
    userRecords,
    employeeRecords,
  });

  console.log("");
  console.log("Sandbox bootstrap complete");
  console.log(`Organization: ${sandboxOrgName} (${sandboxOrgId})`);
  console.log(`Users: ${roster.length}`);
  console.log(`Supabase auth provisioning: ${supabaseAdmin ? "enabled" : "skipped"}`);
  console.log("");
  console.table(
    roster.map((person) => {
      const user = userRecords.get(person.key);
      const employee = employeeRecords.get(person.key);

      return {
        role: person.role,
        email: person.email,
        userId: user.id,
        employeeId: employee.id,
        authIdentityId: user.authIdentityId ?? "linked-on-first-login",
      };
    }),
  );
  console.log("");
  console.log("Workflow scenario routes");
  console.table(scenarioSummary.routes);
}

async function seedSandboxWorkflowScenario({ userRecords, employeeRecords }) {
  const ted = requireEmployeeRecord(employeeRecords, "tTederoff");
  const elliot = requireEmployeeRecord(employeeRecords, "elliotMah");
  const lisaDesjarlais = requireEmployeeRecord(employeeRecords, "lisaDesjarlais");
  const lisaLetto = requireEmployeeRecord(employeeRecords, "lisaLetto");

  const tedUser = requireUserRecord(userRecords, "tTederoff");
  const elliotUser = requireUserRecord(userRecords, "elliotMah");
  const lisaDesjarlaisUser = requireUserRecord(userRecords, "lisaDesjarlais");
  const lisaLettoUser = requireUserRecord(userRecords, "lisaLetto");

  await upsertScenarioReviewTemplate();
  await upsertScenarioGoalContext({
    tedEmployeeId: ted.id,
  });

  await upsertScenarioReviewCycle(
    sandboxScenario.reviewCycles.selfDraft,
    {
      tedEmployeeId: ted.id,
      elliotEmployeeId: elliot.id,
      tedUserId: tedUser.id,
      elliotUserId: elliotUser.id,
    },
    {
      selfAnswers: [
        {
          id: "sandbox_answer_self_active_ted_q1",
          questionId: sandboxScenario.reviewTemplate.questions[0].id,
          responseText:
            "I stabilized the highest-volume enterprise application queues and cut repeat escalation time by documenting handoffs.",
          scaleRating: null,
          notObserved: false,
        },
      ],
      selfStatus: ReviewSubmissionStatus.IN_PROGRESS,
      selfSubmittedAt: null,
      managerAnswers: [],
      managerStatus: ReviewSubmissionStatus.NOT_STARTED,
      managerSubmittedAt: null,
    },
  );

  await upsertScenarioReviewCycle(
    sandboxScenario.reviewCycles.managerReady,
    {
      tedEmployeeId: ted.id,
      elliotEmployeeId: elliot.id,
      tedUserId: tedUser.id,
      elliotUserId: elliotUser.id,
    },
    {
      selfAnswers: buildCompletedReviewAnswers("sandbox_answer_manager_ready_self", {
        results:
          "I delivered steadier backlog flow for the enterprise applications queue and improved communication around priority shifts.",
        growth:
          "My strengths were calm issue triage and follow-through. I need to tighten weekly stakeholder communication and decision framing.",
        leadershipRating: 4,
        growthRating: 3,
      }),
      selfStatus: ReviewSubmissionStatus.SUBMITTED,
      selfSubmittedAt: new Date("2026-04-09T16:00:00.000Z"),
      managerAnswers: [
        {
          id: "sandbox_answer_manager_ready_manager_q1",
          questionId: sandboxScenario.reviewTemplate.questions[0].id,
          responseText:
            "Ted improved escalation ownership and reduced follow-up churn across support issues, though communication consistency still needs reinforcement.",
          scaleRating: null,
          notObserved: false,
        },
      ],
      managerStatus: ReviewSubmissionStatus.IN_PROGRESS,
      managerSubmittedAt: null,
    },
  );

  await upsertScenarioReviewCycle(
    sandboxScenario.reviewCycles.releasedPacket,
    {
      tedEmployeeId: ted.id,
      elliotEmployeeId: elliot.id,
      tedUserId: tedUser.id,
      elliotUserId: elliotUser.id,
    },
    {
      selfAnswers: buildCompletedReviewAnswers("sandbox_answer_released_self", {
        results:
          "I improved incident ownership, kept weekly delivery notes current, and reduced the number of blocked enterprise application items.",
        growth:
          "My strengths were organization and service orientation. I want to grow my confidence in stakeholder-facing decisions and risk framing.",
        leadershipRating: 4,
        growthRating: 3,
      }),
      selfStatus: ReviewSubmissionStatus.SUBMITTED,
      selfSubmittedAt: new Date("2025-11-24T17:00:00.000Z"),
      managerAnswers: buildCompletedReviewAnswers("sandbox_answer_released_manager", {
        results:
          "Ted delivered stronger reliability across the support queue and improved follow-through on business-critical requests.",
        growth:
          "Ted should continue building communication rigor and move toward more proactive ownership of stakeholder expectations.",
        leadershipRating: 4,
        growthRating: 3,
      }),
      managerStatus: ReviewSubmissionStatus.SUBMITTED,
      managerSubmittedAt: new Date("2025-12-04T18:00:00.000Z"),
    },
  );

  await upsertScenarioReviewCycle(
    sandboxScenario.reviewCycles.lockedCalibration,
    {
      tedEmployeeId: ted.id,
      elliotEmployeeId: elliot.id,
      tedUserId: tedUser.id,
      elliotUserId: elliotUser.id,
    },
    {
      selfAnswers: buildCompletedReviewAnswers("sandbox_answer_locked_self", {
        results:
          "I closed the review period with stronger delivery predictability and cleaner stakeholder updates across the enterprise applications roadmap.",
        growth:
          "I grew in accountability and service orientation, and I still need to improve escalation clarity when priorities shift.",
        leadershipRating: 4,
        growthRating: 4,
      }),
      selfStatus: ReviewSubmissionStatus.SUBMITTED,
      selfSubmittedAt: new Date("2026-02-13T16:00:00.000Z"),
      managerAnswers: buildCompletedReviewAnswers("sandbox_answer_locked_manager", {
        results:
          "Ted closed the cycle with materially stronger issue ownership, better prioritization, and better visibility for stakeholders.",
        growth:
          "Ted has clear growth potential in broader application ownership if communication discipline stays consistent.",
        leadershipRating: 4,
        growthRating: 4,
      }),
      managerStatus: ReviewSubmissionStatus.SUBMITTED,
      managerSubmittedAt: new Date("2026-02-23T17:00:00.000Z"),
    },
  );

  await upsertScenarioImprovementPlan({
    tedEmployeeId: ted.id,
    elliotEmployeeId: elliot.id,
    lisaDesjarlaisEmployeeId: lisaDesjarlais.id,
    elliotUserId: elliotUser.id,
    lisaDesjarlaisUserId: lisaDesjarlaisUser.id,
  });

  return {
    routes: [
      {
        flow: "Self review draft",
        actor: tedUser.email,
        path: `/performance/reviews/${sandboxScenario.reviewCycles.selfDraft.id}/write/${sandboxScenario.reviewCycles.selfDraft.selfSubmissionId}`,
      },
      {
        flow: "Manager review draft",
        actor: elliotUser.email,
        path: `/performance/reviews/${sandboxScenario.reviewCycles.managerReady.id}/write/${sandboxScenario.reviewCycles.managerReady.managerSubmissionId}`,
      },
      {
        flow: "Released packet",
        actor: tedUser.email,
        path: `/performance/reviews/${sandboxScenario.reviewCycles.releasedPacket.id}/packet/${ted.id}`,
      },
      {
        flow: "Calibration creation cycle",
        actor: lisaLettoUser.email,
        path: `/admin/performance/calibration/new`,
      },
      {
        flow: "PIP detail",
        actor: elliotUser.email,
        path: `/performance/improvement-plans/${sandboxScenario.improvementPlan.id}`,
      },
    ],
  };
}

function buildCompletedReviewAnswers(prefix, values) {
  return [
    {
      id: `${prefix}_q1`,
      questionId: sandboxScenario.reviewTemplate.questions[0].id,
      responseText: values.results,
      scaleRating: null,
      notObserved: false,
    },
    {
      id: `${prefix}_q2`,
      questionId: sandboxScenario.reviewTemplate.questions[1].id,
      responseText: values.growth,
      scaleRating: null,
      notObserved: false,
    },
    {
      id: `${prefix}_q3`,
      questionId: sandboxScenario.reviewTemplate.questions[2].id,
      responseText: "Observed consistently through project and stakeholder work this cycle.",
      scaleRating: values.leadershipRating,
      notObserved: false,
    },
    {
      id: `${prefix}_q4`,
      questionId: sandboxScenario.reviewTemplate.questions[3].id,
      responseText: "Ready for broader scope with continued coaching and clearer communication routines.",
      scaleRating: values.growthRating,
      notObserved: false,
    },
  ];
}

async function upsertScenarioReviewTemplate() {
  await prisma.reviewTemplate.upsert({
    where: { id: sandboxScenario.reviewTemplate.id },
    update: {
      orgId: sandboxOrgId,
      name: sandboxScenario.reviewTemplate.name,
      description: sandboxScenario.reviewTemplate.description,
      isDefault: true,
    },
    create: {
      id: sandboxScenario.reviewTemplate.id,
      orgId: sandboxOrgId,
      name: sandboxScenario.reviewTemplate.name,
      description: sandboxScenario.reviewTemplate.description,
      isDefault: true,
    },
  });

  for (const question of sandboxScenario.reviewTemplate.questions) {
    await prisma.reviewTemplateQuestion.upsert({
      where: { id: question.id },
      update: {
        orgId: sandboxOrgId,
        templateId: sandboxScenario.reviewTemplate.id,
        prompt: question.prompt,
        questionType: question.questionType,
        dimensionKey: question.dimensionKey,
        isRequired: question.isRequired,
        sortOrder: question.sortOrder,
      },
      create: {
        id: question.id,
        orgId: sandboxOrgId,
        templateId: sandboxScenario.reviewTemplate.id,
        prompt: question.prompt,
        questionType: question.questionType,
        dimensionKey: question.dimensionKey,
        isRequired: question.isRequired,
        sortOrder: question.sortOrder,
      },
    });
  }
}

async function upsertScenarioGoalContext({ tedEmployeeId }) {
  await prisma.goalCycle.upsert({
    where: { id: sandboxScenario.goalCycle.id },
    update: {
      orgId: sandboxOrgId,
      name: sandboxScenario.goalCycle.name,
      cadence: sandboxScenario.goalCycle.cadence,
      startDate: sandboxScenario.goalCycle.startDate,
      endDate: sandboxScenario.goalCycle.endDate,
      status: sandboxScenario.goalCycle.status,
    },
    create: {
      id: sandboxScenario.goalCycle.id,
      orgId: sandboxOrgId,
      name: sandboxScenario.goalCycle.name,
      cadence: sandboxScenario.goalCycle.cadence,
      startDate: sandboxScenario.goalCycle.startDate,
      endDate: sandboxScenario.goalCycle.endDate,
      status: sandboxScenario.goalCycle.status,
    },
  });

  for (const goal of sandboxScenario.goals) {
    await prisma.goal.upsert({
      where: { id: goal.id },
      update: {
        orgId: sandboxOrgId,
        ownerEmployeeId: tedEmployeeId,
        cycleId: sandboxScenario.goalCycle.id,
        goalType: goal.goalType,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        progressPercent: goal.progressPercent,
        workflowStatus: goal.workflowStatus,
        submittedAt: goal.submittedAt,
        approvedAt: goal.approvedAt,
        visibility: goal.visibility,
      },
      create: {
        id: goal.id,
        orgId: sandboxOrgId,
        ownerEmployeeId: tedEmployeeId,
        cycleId: sandboxScenario.goalCycle.id,
        goalType: goal.goalType,
        title: goal.title,
        description: goal.description,
        status: goal.status,
        progressPercent: goal.progressPercent,
        workflowStatus: goal.workflowStatus,
        submittedAt: goal.submittedAt,
        approvedAt: goal.approvedAt,
        visibility: goal.visibility,
      },
    });

    await prisma.goalUpdate.upsert({
      where: { id: goal.update.id },
      update: {
        orgId: sandboxOrgId,
        goalId: goal.id,
        authorEmployeeId: tedEmployeeId,
        note: goal.update.note,
        snapshotProgressPercent: goal.progressPercent,
        createdAt: goal.update.createdAt,
      },
      create: {
        id: goal.update.id,
        orgId: sandboxOrgId,
        goalId: goal.id,
        authorEmployeeId: tedEmployeeId,
        note: goal.update.note,
        snapshotProgressPercent: goal.progressPercent,
        createdAt: goal.update.createdAt,
      },
    });
  }
}

async function upsertScenarioReviewCycle(cycle, actors, submissionData) {
  await prisma.reviewCycle.upsert({
    where: { id: cycle.id },
    update: {
      orgId: sandboxOrgId,
      name: cycle.name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 0,
      upwardReviewCount: 0,
      selfReviewDueAt: cycle.selfReviewDueAt,
      managerReviewDueAt: cycle.managerReviewDueAt,
      templateId: sandboxScenario.reviewTemplate.id,
    },
    create: {
      id: cycle.id,
      orgId: sandboxOrgId,
      name: cycle.name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
      visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
      selfReviewRequired: true,
      managerReviewRequired: true,
      peerReviewCount: 0,
      upwardReviewCount: 0,
      selfReviewDueAt: cycle.selfReviewDueAt,
      managerReviewDueAt: cycle.managerReviewDueAt,
      templateId: sandboxScenario.reviewTemplate.id,
    },
  });

  for (const metric of scorecardMetrics) {
    await prisma.reviewCycleScorecardMetric.upsert({
      where: {
        cycleId_metricKey: {
          cycleId: cycle.id,
          metricKey: metric.metricKey,
        },
      },
      update: {
        orgId: sandboxOrgId,
        weightPercent: metric.weightPercent,
      },
      create: {
        orgId: sandboxOrgId,
        cycleId: cycle.id,
        metricKey: metric.metricKey,
        weightPercent: metric.weightPercent,
      },
    });
  }

  await prisma.reviewPacket.upsert({
    where: { id: cycle.packetId },
    update: {
      orgId: sandboxOrgId,
      cycleId: cycle.id,
      subjectEmployeeId: actors.tedEmployeeId,
      snapshotDepartment: "Information Technology",
      snapshotTitle: "Application Support and Development",
      snapshotManagerEmployeeId: actors.elliotEmployeeId,
      snapshotManagerName: "Elliot Mah",
      totalScorecardPercent: cycle.packet.totalScorecardPercent,
      scorecardOverallRating: cycle.packet.scorecardOverallRating,
      finalRatingSource: cycle.packet.finalRatingSource,
    },
    create: {
      id: cycle.packetId,
      orgId: sandboxOrgId,
      cycleId: cycle.id,
      subjectEmployeeId: actors.tedEmployeeId,
      snapshotDepartment: "Information Technology",
      snapshotTitle: "Application Support and Development",
      snapshotManagerEmployeeId: actors.elliotEmployeeId,
      snapshotManagerName: "Elliot Mah",
      totalScorecardPercent: cycle.packet.totalScorecardPercent,
      scorecardOverallRating: cycle.packet.scorecardOverallRating,
      finalRatingSource: cycle.packet.finalRatingSource,
    },
  });

  await prisma.reviewSubmission.upsert({
    where: { id: cycle.selfSubmissionId },
    update: {
      orgId: sandboxOrgId,
      cycleId: cycle.id,
      packetId: cycle.packetId,
      subjectEmployeeId: actors.tedEmployeeId,
      reviewerEmployeeId: actors.tedEmployeeId,
      relationship: ReviewRelationship.SELF,
      status: submissionData.selfStatus,
      dueAt: cycle.selfReviewDueAt,
      submittedAt: submissionData.selfSubmittedAt,
    },
    create: {
      id: cycle.selfSubmissionId,
      orgId: sandboxOrgId,
      cycleId: cycle.id,
      packetId: cycle.packetId,
      subjectEmployeeId: actors.tedEmployeeId,
      reviewerEmployeeId: actors.tedEmployeeId,
      relationship: ReviewRelationship.SELF,
      status: submissionData.selfStatus,
      dueAt: cycle.selfReviewDueAt,
      submittedAt: submissionData.selfSubmittedAt,
    },
  });

  await prisma.reviewSubmission.upsert({
    where: { id: cycle.managerSubmissionId },
    update: {
      orgId: sandboxOrgId,
      cycleId: cycle.id,
      packetId: cycle.packetId,
      subjectEmployeeId: actors.tedEmployeeId,
      reviewerEmployeeId: actors.elliotEmployeeId,
      relationship: ReviewRelationship.MANAGER,
      status: submissionData.managerStatus,
      dueAt: cycle.managerReviewDueAt,
      submittedAt: submissionData.managerSubmittedAt,
    },
    create: {
      id: cycle.managerSubmissionId,
      orgId: sandboxOrgId,
      cycleId: cycle.id,
      packetId: cycle.packetId,
      subjectEmployeeId: actors.tedEmployeeId,
      reviewerEmployeeId: actors.elliotEmployeeId,
      relationship: ReviewRelationship.MANAGER,
      status: submissionData.managerStatus,
      dueAt: cycle.managerReviewDueAt,
      submittedAt: submissionData.managerSubmittedAt,
    },
  });

  for (const answer of [...submissionData.selfAnswers, ...submissionData.managerAnswers]) {
    const submissionId = submissionData.selfAnswers.includes(answer)
      ? cycle.selfSubmissionId
      : cycle.managerSubmissionId;

    await prisma.reviewAnswer.upsert({
      where: {
        submissionId_questionId: {
          submissionId,
          questionId: answer.questionId,
        },
      },
      update: {
        orgId: sandboxOrgId,
        responseText: answer.responseText,
        scaleRating: answer.scaleRating,
        notObserved: answer.notObserved,
      },
      create: {
        id: answer.id,
        orgId: sandboxOrgId,
        submissionId,
        questionId: answer.questionId,
        responseText: answer.responseText,
        scaleRating: answer.scaleRating,
        notObserved: answer.notObserved,
      },
    });
  }
}

async function upsertScenarioImprovementPlan({
  tedEmployeeId,
  elliotEmployeeId,
  lisaDesjarlaisEmployeeId,
  elliotUserId,
  lisaDesjarlaisUserId,
}) {
  await prisma.improvementPlan.upsert({
    where: { id: sandboxScenario.improvementPlan.id },
    update: {
      orgId: sandboxOrgId,
      subjectEmployeeId: tedEmployeeId,
      managerEmployeeId: elliotEmployeeId,
      hrOwnerEmployeeId: lisaDesjarlaisEmployeeId,
      createdByUserId: lisaDesjarlaisUserId,
      triggerSource: sandboxScenario.improvementPlan.triggerSource,
      reviewCycleId: sandboxScenario.reviewCycles.releasedPacket.id,
      calibrationSessionId: null,
      title: sandboxScenario.improvementPlan.title,
      expectations: sandboxScenario.improvementPlan.expectations,
      startDate: sandboxScenario.improvementPlan.startDate,
      endDate: sandboxScenario.improvementPlan.endDate,
      status: sandboxScenario.improvementPlan.status,
      outcome: null,
    },
    create: {
      id: sandboxScenario.improvementPlan.id,
      orgId: sandboxOrgId,
      subjectEmployeeId: tedEmployeeId,
      managerEmployeeId: elliotEmployeeId,
      hrOwnerEmployeeId: lisaDesjarlaisEmployeeId,
      createdByUserId: lisaDesjarlaisUserId,
      triggerSource: sandboxScenario.improvementPlan.triggerSource,
      reviewCycleId: sandboxScenario.reviewCycles.releasedPacket.id,
      calibrationSessionId: null,
      title: sandboxScenario.improvementPlan.title,
      expectations: sandboxScenario.improvementPlan.expectations,
      startDate: sandboxScenario.improvementPlan.startDate,
      endDate: sandboxScenario.improvementPlan.endDate,
      status: sandboxScenario.improvementPlan.status,
      outcome: null,
    },
  });

  await prisma.improvementPlanGoal.upsert({
    where: { id: sandboxScenario.improvementPlan.goalIds[0] },
    update: {
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      title: "Improve sprint commitment reliability",
      description: "Maintain at least 90% sprint commitment accuracy for the next two monthly checkpoints.",
      sortOrder: 1,
    },
    create: {
      id: sandboxScenario.improvementPlan.goalIds[0],
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      title: "Improve sprint commitment reliability",
      description: "Maintain at least 90% sprint commitment accuracy for the next two monthly checkpoints.",
      sortOrder: 1,
    },
  });

  await prisma.improvementPlanGoal.upsert({
    where: { id: sandboxScenario.improvementPlan.goalIds[1] },
    update: {
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      title: "Strengthen proactive stakeholder updates",
      description: "Send weekly update summaries with decisions, blockers, and owners for enterprise applications work.",
      sortOrder: 2,
    },
    create: {
      id: sandboxScenario.improvementPlan.goalIds[1],
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      title: "Strengthen proactive stakeholder updates",
      description: "Send weekly update summaries with decisions, blockers, and owners for enterprise applications work.",
      sortOrder: 2,
    },
  });

  await prisma.improvementPlanCheckIn.upsert({
    where: { id: sandboxScenario.improvementPlan.checkInIds.kickoff },
    update: {
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      authorUserId: elliotUserId,
      content:
        "Kickoff meeting completed. Ted agreed to weekly planning discipline, visible risk tracking, and proactive updates to business partners.",
      checkInType: ImprovementPlanCheckInType.NOTE,
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      checkInAt: new Date("2026-02-05T16:00:00.000Z"),
    },
    create: {
      id: sandboxScenario.improvementPlan.checkInIds.kickoff,
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      authorUserId: elliotUserId,
      content:
        "Kickoff meeting completed. Ted agreed to weekly planning discipline, visible risk tracking, and proactive updates to business partners.",
      checkInType: ImprovementPlanCheckInType.NOTE,
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      checkInAt: new Date("2026-02-05T16:00:00.000Z"),
    },
  });

  await prisma.improvementPlanCheckIn.upsert({
    where: { id: sandboxScenario.improvementPlan.checkInIds.checkpoint30 },
    update: {
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      authorUserId: lisaDesjarlaisUserId,
      content:
        "30-day checkpoint: response-time tracking is improving, but stakeholder updates still need more consistency and fewer last-minute escalations.",
      checkInType: ImprovementPlanCheckInType.CHECKPOINT_30,
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      checkInAt: new Date("2026-03-03T16:00:00.000Z"),
    },
    create: {
      id: sandboxScenario.improvementPlan.checkInIds.checkpoint30,
      orgId: sandboxOrgId,
      planId: sandboxScenario.improvementPlan.id,
      authorUserId: lisaDesjarlaisUserId,
      content:
        "30-day checkpoint: response-time tracking is improving, but stakeholder updates still need more consistency and fewer last-minute escalations.",
      checkInType: ImprovementPlanCheckInType.CHECKPOINT_30,
      status: ImprovementPlanStatus.ACTIVE,
      outcome: null,
      checkInAt: new Date("2026-03-03T16:00:00.000Z"),
    },
  });
}

function requireUserRecord(userRecords, key) {
  const user = userRecords.get(key);
  if (!user) {
    throw new Error(`Missing sandbox user for roster key ${key}`);
  }

  return user;
}

function requireEmployeeRecord(employeeRecords, key) {
  const employee = employeeRecords.get(key);
  if (!employee) {
    throw new Error(`Missing sandbox employee for roster key ${key}`);
  }

  return employee;
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  if (configuredPassword === placeholderPassword) {
    throw new Error(
      "SANDBOX_BOOTSTRAP_DEFAULT_PASSWORD is still set to the placeholder value. Set a real shared sandbox password before provisioning Supabase users.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function loadSupabaseUsersByEmail(supabaseAdmin) {
  const usersByEmail = new Map();
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      const email = user.email?.trim().toLowerCase();
      if (email) {
        usersByEmail.set(email, user);
      }
    }

    if (!data.nextPage) {
      return usersByEmail;
    }

    page = data.nextPage;
  }
}

async function ensureSupabaseUser(supabaseAdmin, authUsersByEmail, email) {
  const existingUser = authUsersByEmail.get(email);

  if (existingUser) {
    if (defaultPassword) {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: defaultPassword,
        email_confirm: true,
      });

      if (error) {
        throw error;
      }

      authUsersByEmail.set(email, data.user);
      return data.user;
    }

    return existingUser;
  }

  if (!defaultPassword) {
    throw new Error(
      `Missing SANDBOX_BOOTSTRAP_DEFAULT_PASSWORD for new Supabase user ${email}.`,
    );
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
  });

  if (error) {
    throw error;
  }

  authUsersByEmail.set(email, data.user);
  return data.user;
}

main()
  .catch((error) => {
    console.error("");
    console.error("Sandbox bootstrap failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
