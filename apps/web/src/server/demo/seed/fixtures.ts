import {
  CalibrationBucket,
  CompetencyDimensionKey,
  CycleVisibilityPolicy,
  EvidenceType,
  EvidenceVisibility,
  ImprovementPlanStatus,
  ReviewQuestionType,
  ScorecardMetricKey,
  UserRole,
} from "@prisma/client";

import {
  demoCalibrationSessionId,
  demoCycleId,
  demoImprovementPlanId,
  demoOrgId,
  demoTemplateId,
} from "@/server/demo/demo-constants";
import type {
  DemoImprovementPlanSeed,
  DemoPerson,
  DemoQuestion,
  DemoStoryKey,
  DemoStoryProfile,
  DimensionRatingSeed,
  ScorecardMetricSeed,
} from "@/server/demo/seed/types";

const allDimensions = Object.values(CompetencyDimensionKey);

function buildRatings(
  defaultValue: DimensionRatingSeed,
  overrides: Partial<Record<CompetencyDimensionKey, DimensionRatingSeed>> = {},
): Record<CompetencyDimensionKey, DimensionRatingSeed> {
  const ratings = Object.fromEntries(
    allDimensions.map((dimensionKey) => [dimensionKey, defaultValue]),
  ) as Record<CompetencyDimensionKey, DimensionRatingSeed>;

  for (const [dimensionKey, value] of Object.entries(overrides)) {
    ratings[dimensionKey as CompetencyDimensionKey] = value;
  }

  return ratings;
}

export const demoPeople: DemoPerson[] = [
  {
    userId: "user_hr_admin_1",
    employeeId: "emp_hr_admin_1",
    email: "harper.quinn@ironcrest.example",
    role: UserRole.HR_ADMIN,
    firstName: "Harper",
    lastName: "Quinn",
    department: "Admin/Finance",
    title: "Office Admin",
    managerEmployeeId: null,
    includeInCycle: false,
    storyKey: "MANAGER_SOLID",
  },
  {
    userId: "user_calibrator_1",
    employeeId: "emp_calibrator_1",
    email: "casey.romero@ironcrest.example",
    role: UserRole.CALIBRATOR,
    firstName: "Casey",
    lastName: "Romero",
    department: "Admin/Finance",
    title: "Project Coordinator",
    managerEmployeeId: "emp_hr_admin_1",
    includeInCycle: false,
    storyKey: "MANAGER_SOLID",
  },
  {
    userId: "user_manager_1",
    employeeId: "emp_manager_1",
    email: "morgan.patel@ironcrest.example",
    role: UserRole.MANAGER,
    firstName: "Morgan",
    lastName: "Patel",
    department: "Operations",
    title: "Site Supervisor",
    managerEmployeeId: "emp_hr_admin_1",
    includeInCycle: true,
    storyKey: "MANAGER_SOLID",
  },
  {
    userId: "user_manager_2",
    employeeId: "emp_manager_2",
    email: "jordan.blake@ironcrest.example",
    role: UserRole.MANAGER,
    firstName: "Jordan",
    lastName: "Blake",
    department: "Projects",
    title: "Foreman",
    managerEmployeeId: "emp_hr_admin_1",
    includeInCycle: true,
    storyKey: "MANAGER_SOLID",
  },
  {
    userId: "user_employee_1",
    employeeId: "emp_employee_1",
    email: "elliot.barnes@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Elliot",
    lastName: "Barnes",
    department: "Operations",
    title: "Foreman",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "HIGH_PERFORMER_COACHED",
  },
  {
    userId: "user_employee_2",
    employeeId: "emp_employee_2",
    email: "maya.chen@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Maya",
    lastName: "Chen",
    department: "Safety",
    title: "Safety Coordinator",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "SAFETY_INCIDENT_LEARNING",
  },
  {
    userId: "user_employee_3",
    employeeId: "emp_employee_3",
    email: "priya.das@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Priya",
    lastName: "Das",
    department: "Projects",
    title: "Project Coordinator",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "IMPROVEMENT_TRENDING",
  },
  {
    userId: "user_employee_4",
    employeeId: "emp_employee_4",
    email: "noah.bennett@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Noah",
    lastName: "Bennett",
    department: "Projects",
    title: "Journeyman",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "NEW_EMPLOYEE_LIMITED_OBSERVATION",
  },
  {
    userId: "user_employee_5",
    employeeId: "emp_employee_5",
    email: "lucas.ford@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Lucas",
    lastName: "Ford",
    department: "Maintenance",
    title: "Equipment Operator",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "AT_RISK_PERFORMER",
  },
  {
    userId: "user_employee_6",
    employeeId: "emp_employee_6",
    email: "aisha.rahman@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Aisha",
    lastName: "Rahman",
    department: "Admin/Finance",
    title: "Dispatcher",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "STEADY_CONTRIBUTOR",
  },
  {
    userId: "user_employee_7",
    employeeId: "emp_employee_7",
    email: "owen.reyes@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Owen",
    lastName: "Reyes",
    department: "Operations",
    title: "Foreman",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "STRONG_OPERATOR",
  },
  {
    userId: "user_employee_8",
    employeeId: "emp_employee_8",
    email: "sofia.kim@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Sofia",
    lastName: "Kim",
    department: "Operations",
    title: "Site Supervisor",
    managerEmployeeId: "emp_manager_1",
    includeInCycle: true,
    storyKey: "STEADY_CONTRIBUTOR",
  },
  {
    userId: "user_employee_9",
    employeeId: "emp_employee_9",
    email: "javier.morales@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Javier",
    lastName: "Morales",
    department: "Maintenance",
    title: "Equipment Operator",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "IMPROVEMENT_TRENDING",
  },
  {
    userId: "user_employee_10",
    employeeId: "emp_employee_10",
    email: "hannah.lewis@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Hannah",
    lastName: "Lewis",
    department: "Projects",
    title: "Journeyman",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "STRONG_OPERATOR",
  },
  {
    userId: "user_employee_11",
    employeeId: "emp_employee_11",
    email: "marcus.reed@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Marcus",
    lastName: "Reed",
    department: "Safety",
    title: "Safety Coordinator",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "EXCEPTIONAL_OPERATOR",
  },
  {
    userId: "user_employee_12",
    employeeId: "emp_employee_12",
    email: "chloe.nguyen@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Chloe",
    lastName: "Nguyen",
    department: "Admin/Finance",
    title: "Office Admin",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "NEW_EMPLOYEE_LIMITED_OBSERVATION",
  },
  {
    userId: "user_employee_13",
    employeeId: "emp_employee_13",
    email: "bianca.alvarez@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Bianca",
    lastName: "Alvarez",
    department: "Safety",
    title: "Safety Coordinator",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "STRONG_OPERATOR",
  },
  {
    userId: "user_employee_14",
    employeeId: "emp_employee_14",
    email: "daniel.ortiz@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Daniel",
    lastName: "Ortiz",
    department: "Projects",
    title: "Project Coordinator",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "STEADY_CONTRIBUTOR",
  },
  {
    userId: "user_employee_15",
    employeeId: "emp_employee_15",
    email: "leila.haddad@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Leila",
    lastName: "Haddad",
    department: "Operations",
    title: "Foreman",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "AT_RISK_PERFORMER",
  },
  {
    userId: "user_employee_16",
    employeeId: "emp_employee_16",
    email: "carter.singh@ironcrest.example",
    role: UserRole.EMPLOYEE,
    firstName: "Carter",
    lastName: "Singh",
    department: "Maintenance",
    title: "Equipment Operator",
    managerEmployeeId: "emp_manager_2",
    includeInCycle: true,
    storyKey: "EXCEPTIONAL_OPERATOR",
  },
];

export const demoQuestions: DemoQuestion[] = [
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

export const scorecardMetrics: ScorecardMetricSeed[] = [
  { metricKey: ScorecardMetricKey.QUALITY_OF_WORK, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.COMMUNICATION, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ACCOUNTABILITY, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.RELATIONSHIP_BUILDING, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.RESULTS_DRIVEN, weightPercent: 20 },
  { metricKey: ScorecardMetricKey.ATTITUDE, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.SERVICE_ORIENTED, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ADAPTABILITY, weightPercent: 10 },
];

export const demoStoryProfiles: Record<DemoStoryKey, DemoStoryProfile> = {
  HIGH_PERFORMER_COACHED: {
    key: "HIGH_PERFORMER_COACHED",
    impactSelf:
      "Led the North Yard retrofit handoff and reduced subcontractor rework through daily huddle follow-through.",
    impactManager:
      "Delivered exceeding-level outcomes on schedule recovery and stakeholder confidence while mentoring junior crews.",
    growthFocus:
      "Continue coaching concise executive-ready updates while maintaining high delivery standards.",
    selfRatings: buildRatings(4, {
      [CompetencyDimensionKey.COMMUNICATION]: 3,
      [CompetencyDimensionKey.ATTITUDE]: 5,
      [CompetencyDimensionKey.RESULTS_DRIVEN]: 5,
    }),
    managerRatings: buildRatings(5, {
      [CompetencyDimensionKey.COMMUNICATION]: 4,
    }),
    evidenceTemplates: [
      {
        type: EvidenceType.FEEDBACK,
        visibility: EvidenceVisibility.ORG_VISIBLE,
        content:
          "Client PM praised Elliot for resolving a crane sequencing conflict before it impacted the pour schedule.",
        attachToQuestionId: "template_q_comp_results",
      },
      {
        type: EvidenceType.VALUE_RECOGNITION,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content:
          "Crew recognition noted Elliot's mentorship during two high-risk weekend shutdown windows.",
        attachToQuestionId: "template_q_comp_service",
      },
      {
        type: EvidenceType.ONE_ON_ONE,
        visibility: EvidenceVisibility.MANAGER_ONLY,
        content:
          "Coaching note: tighten update summaries to one-page risk briefs for project leadership.",
        attachToQuestionId: "template_q_comp_communication",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.HIGH,
      justification:
        "Performance and leadership impact were calibrated upward after reviewing cross-project evidence.",
      finalSourceCalibration: true,
    },
  },
  IMPROVEMENT_TRENDING: {
    key: "IMPROVEMENT_TRENDING",
    impactSelf:
      "Improved permit-closeout tracking and turned around weekly plan reliability with manager coaching.",
    impactManager:
      "Progress is visible month-over-month; communication remains the main growth edge while delivery is improving.",
    growthFocus:
      "Maintain risk communication cadence and continue tightening stakeholder handoff quality.",
    selfRatings: buildRatings(3, {
      [CompetencyDimensionKey.QUALITY_OF_WORK]: 4,
      [CompetencyDimensionKey.RESULTS_DRIVEN]: 4,
      [CompetencyDimensionKey.COMMUNICATION]: 3,
    }),
    managerRatings: buildRatings(4, {
      [CompetencyDimensionKey.RELATIONSHIP_BUILDING]: 3,
      [CompetencyDimensionKey.COMMUNICATION]: 3,
      [CompetencyDimensionKey.RESULTS_DRIVEN]: 4,
    }),
    evidenceTemplates: [
      {
        type: EvidenceType.ONE_ON_ONE,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content:
          "Manager check-in confirms Priya has maintained a four-week streak of on-time stakeholder updates.",
        attachToQuestionId: "template_q_comp_communication",
      },
      {
        type: EvidenceType.GOAL,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content:
          "Goal checkpoint: permit response turnaround dropped from 4 days to 1.5 days.",
        attachToQuestionId: "template_q_2",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.MEDIUM,
      potentialBucket: CalibrationBucket.HIGH,
      justification:
        "Improvement trajectory and coaching uptake support medium performance with high growth potential.",
    },
  },
  SAFETY_INCIDENT_LEARNING: {
    key: "SAFETY_INCIDENT_LEARNING",
    impactSelf:
      "Led corrective actions after a near-miss and standardized toolbox-talk follow-up across shifts.",
    impactManager:
      "Demonstrated accountability after the safety incident; quality and communication remain under active coaching.",
    growthFocus:
      "Sustain safety gains while improving close-out documentation quality.",
    selfRatings: buildRatings(3, {
      [CompetencyDimensionKey.SAFETY_COMPLIANCE]: 4,
      [CompetencyDimensionKey.RESULTS_DRIVEN]: 2,
      [CompetencyDimensionKey.COMMUNICATION]: 3,
      [CompetencyDimensionKey.QUALITY_OF_WORK]: 3,
    }),
    managerRatings: buildRatings(3, {
      [CompetencyDimensionKey.SAFETY_COMPLIANCE]: 4,
      [CompetencyDimensionKey.RESULTS_DRIVEN]: 2,
      [CompetencyDimensionKey.COMMUNICATION]: 3,
      [CompetencyDimensionKey.QUALITY_OF_WORK]: 3,
    }),
    evidenceTemplates: [
      {
        type: EvidenceType.UPDATE,
        visibility: EvidenceVisibility.ORG_VISIBLE,
        content:
          "Safety observation: scaffold access near-miss closed with revised pre-task checklist and crew retraining.",
        attachToQuestionId: "template_q_comp_safety",
      },
      {
        type: EvidenceType.FEEDBACK,
        visibility: EvidenceVisibility.MANAGER_ONLY,
        content:
          "Site lead feedback: documentation quality improved, but incident close-out notes still need consistency.",
        attachToQuestionId: "template_q_comp_quality",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.MEDIUM,
      potentialBucket: CalibrationBucket.MEDIUM,
      justification:
        "Balanced view: strong safety learning response with moderate execution consistency.",
    },
  },
  NEW_EMPLOYEE_LIMITED_OBSERVATION: {
    key: "NEW_EMPLOYEE_LIMITED_OBSERVATION",
    impactSelf:
      "Onboarded mid-cycle and supported daily coordination while ramping into site execution standards.",
    impactManager:
      "Observation window is limited; additional cycle time is needed for confidence on several competencies.",
    growthFocus:
      "Complete onboarding milestones and build evidence for technical and planning competencies.",
    selfRatings: buildRatings("NOT_OBS", {
      [CompetencyDimensionKey.COMMUNICATION]: 3,
      [CompetencyDimensionKey.ATTITUDE]: 3,
      [CompetencyDimensionKey.SERVICE_ORIENTED]: 3,
    }),
    managerRatings: buildRatings("NOT_OBS", {
      [CompetencyDimensionKey.COMMUNICATION]: 3,
      [CompetencyDimensionKey.ATTITUDE]: 3,
      [CompetencyDimensionKey.SERVICE_ORIENTED]: 3,
    }),
    evidenceTemplates: [
      {
        type: EvidenceType.UPDATE,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content:
          "New employee onboarding milestone completed for permit workflow and daily shift reporting.",
      },
      {
        type: EvidenceType.ONE_ON_ONE,
        visibility: EvidenceVisibility.MANAGER_ONLY,
        content:
          "Manager note: too few observation points this cycle for full competency scoring confidence.",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.LOW,
      potentialBucket: CalibrationBucket.HIGH,
      justification:
        "Placement reflects limited observation this cycle with strong long-term growth signal.",
    },
  },
  STEADY_CONTRIBUTOR: {
    key: "STEADY_CONTRIBUTOR",
    impactSelf:
      "Delivered reliable day-to-day execution and met handoff commitments without escalation.",
    impactManager:
      "Consistent execution across assigned scope with predictable follow-through.",
    growthFocus:
      "Increase proactive risk communication and broaden ownership on cross-trade dependencies.",
    selfRatings: buildRatings(3),
    managerRatings: buildRatings(3),
    evidenceTemplates: [
      {
        type: EvidenceType.UPDATE,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content: "Weekly update showed stable completion rates and on-time dispatch handoffs.",
      },
      {
        type: EvidenceType.FEEDBACK,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content: "Foreman feedback highlighted dependable coverage during staffing gaps.",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.MEDIUM,
      potentialBucket: CalibrationBucket.MEDIUM,
      justification: "Steady contributor with consistent, reliable execution.",
    },
  },
  STRONG_OPERATOR: {
    key: "STRONG_OPERATOR",
    impactSelf:
      "Exceeded daily production targets and maintained high-quality handoffs with maintenance teams.",
    impactManager:
      "Strong execution consistency and clear ownership on field coordination.",
    growthFocus:
      "Develop coaching skills for newer crew members and formalize issue-escalation summaries.",
    selfRatings: buildRatings(4),
    managerRatings: buildRatings(4),
    evidenceTemplates: [
      {
        type: EvidenceType.FEEDBACK,
        visibility: EvidenceVisibility.ORG_VISIBLE,
        content:
          "Project superintendent noted strong trade coordination that prevented a two-day schedule slip.",
      },
      {
        type: EvidenceType.GOAL,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content: "Goal progress: maintained 95% on-time close-out of assigned work packages.",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.MEDIUM,
      justification: "Consistent high execution with room to grow into broader leadership scope.",
    },
  },
  EXCEPTIONAL_OPERATOR: {
    key: "EXCEPTIONAL_OPERATOR",
    impactSelf:
      "Consistently led complex workstreams with zero safety exceptions and ahead-of-plan delivery.",
    impactManager:
      "Top performer this cycle with standout ownership, quality, and cross-team influence.",
    growthFocus:
      "Take on cross-site mentoring and lead standard work adoption for new teams.",
    selfRatings: buildRatings(5, {
      [CompetencyDimensionKey.COMMUNICATION]: 4,
    }),
    managerRatings: buildRatings(5),
    evidenceTemplates: [
      {
        type: EvidenceType.VALUE_RECOGNITION,
        visibility: EvidenceVisibility.ORG_VISIBLE,
        content: "Recognition: led a zero-rework shutdown sequence across two critical systems.",
      },
      {
        type: EvidenceType.FEEDBACK,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content: "Client sponsor praised proactive issue resolution and reliable execution under pressure.",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.HIGH,
      justification: "Exceptional cycle impact and readiness for expanded scope.",
    },
  },
  AT_RISK_PERFORMER: {
    key: "AT_RISK_PERFORMER",
    impactSelf:
      "Faced recurring execution misses and is working with the manager to stabilize core responsibilities.",
    impactManager:
      "Needs immediate consistency on accountability, communication, and completion quality.",
    growthFocus:
      "Rebuild execution discipline with weekly goals and tighter manager checkpoints.",
    selfRatings: buildRatings(2, {
      [CompetencyDimensionKey.COMMUNICATION]: 1,
      [CompetencyDimensionKey.ACCOUNTABILITY]: 1,
      [CompetencyDimensionKey.RESULTS_DRIVEN]: 1,
    }),
    managerRatings: buildRatings(2, {
      [CompetencyDimensionKey.COMMUNICATION]: 1,
      [CompetencyDimensionKey.ACCOUNTABILITY]: 1,
      [CompetencyDimensionKey.RESULTS_DRIVEN]: 1,
    }),
    evidenceTemplates: [
      {
        type: EvidenceType.ONE_ON_ONE,
        visibility: EvidenceVisibility.MANAGER_ONLY,
        content: "Coaching note: missed handoff commitments three times in the past month.",
      },
      {
        type: EvidenceType.UPDATE,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content: "Recovery plan requires daily checklist completion and supervisor sign-off.",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.LOW,
      potentialBucket: CalibrationBucket.LOW,
      justification: "Current-cycle outcomes require sustained remediation before scope expansion.",
    },
  },
  MANAGER_SOLID: {
    key: "MANAGER_SOLID",
    impactSelf:
      "Managed competing crews effectively and kept stakeholder communication on schedule.",
    impactManager:
      "Solid people leadership with strong delivery governance this cycle.",
    growthFocus:
      "Continue developing upward delegation and next-level succession coaching.",
    selfRatings: buildRatings(4, {
      [CompetencyDimensionKey.COMMUNICATION]: 4,
    }),
    managerRatings: buildRatings(4, {
      [CompetencyDimensionKey.COMMUNICATION]: 4,
    }),
    evidenceTemplates: [
      {
        type: EvidenceType.FEEDBACK,
        visibility: EvidenceVisibility.SHARED_WITH_SUBJECT,
        content: "Director feedback highlighted clear decision framing during change-order escalations.",
      },
      {
        type: EvidenceType.ONE_ON_ONE,
        visibility: EvidenceVisibility.MANAGER_ONLY,
        content: "Leadership check-in documented stronger delegation and coaching cadence.",
      },
    ],
    calibration: {
      performanceBucket: CalibrationBucket.HIGH,
      potentialBucket: CalibrationBucket.MEDIUM,
      justification: "Reliable leadership performance with room for broader strategic scope.",
    },
  },
};

export const calibrationParticipants = [
  "user_hr_admin_1",
  "user_calibrator_1",
  "user_manager_1",
  "user_manager_2",
] as const;

export const peerAssignments: Array<{
  id: string;
  subjectEmployeeId: string;
  reviewerEmployeeId: string;
}> = [
  {
    id: "submission_seed_peer_1",
    subjectEmployeeId: "emp_employee_1",
    reviewerEmployeeId: "emp_employee_7",
  },
  {
    id: "submission_seed_peer_2",
    subjectEmployeeId: "emp_employee_2",
    reviewerEmployeeId: "emp_employee_13",
  },
  {
    id: "submission_seed_peer_3",
    subjectEmployeeId: "emp_employee_3",
    reviewerEmployeeId: "emp_employee_10",
  },
  {
    id: "submission_seed_peer_4",
    subjectEmployeeId: "emp_employee_11",
    reviewerEmployeeId: "emp_employee_2",
  },
  {
    id: "submission_seed_peer_5",
    subjectEmployeeId: "emp_employee_14",
    reviewerEmployeeId: "emp_employee_6",
  },
];

export const upwardAssignments: Array<{
  id: string;
  subjectEmployeeId: string;
  reviewerEmployeeId: string;
}> = [
  {
    id: "submission_seed_upward_manager_1",
    subjectEmployeeId: "emp_manager_1",
    reviewerEmployeeId: "emp_employee_1",
  },
  {
    id: "submission_seed_upward_manager_2",
    subjectEmployeeId: "emp_manager_2",
    reviewerEmployeeId: "emp_employee_10",
  },
];

export const demoImprovementPlans: DemoImprovementPlanSeed[] = [
  {
    id: demoImprovementPlanId,
    subjectEmployeeId: "emp_employee_3",
    managerEmployeeId: "emp_manager_1",
    title: "Communication Reliability Improvement Plan",
    expectations:
      "Sustain weekly stakeholder updates, reduce rework handoffs, and close risk items on schedule.",
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    endDate: new Date("2026-08-15T00:00:00.000Z"),
    status: ImprovementPlanStatus.ACTIVE,
    goals: [
      {
        id: "improvement_plan_goal_seed_1",
        title: "Weekly stakeholder brief",
        description:
          "Ship a Friday risk and mitigation brief with zero missed weeks for the next eight weeks.",
        sortOrder: 1,
      },
      {
        id: "improvement_plan_goal_seed_2",
        title: "Permit close-out turnaround",
        description: "Keep permit close-out turnaround under 2 business days for six consecutive weeks.",
        sortOrder: 2,
      },
    ],
    checkIns: [
      {
        id: "improvement_plan_checkin_seed_1",
        authorUserId: "user_manager_1",
        content:
          "Week 2: update cadence is consistent and handoff quality has improved versus the prior month.",
        status: ImprovementPlanStatus.ACTIVE,
        checkInAt: new Date("2026-04-15T16:00:00.000Z"),
      },
      {
        id: "improvement_plan_checkin_seed_2",
        authorUserId: "user_manager_1",
        content:
          "Week 5: permit close-out response times are holding and stakeholder escalations dropped.",
        status: ImprovementPlanStatus.ACTIVE,
        checkInAt: new Date("2026-05-06T16:00:00.000Z"),
      },
    ],
  },
  {
    id: "improvement_plan_seed_2",
    subjectEmployeeId: "emp_employee_1",
    managerEmployeeId: "emp_manager_1",
    title: "Executive Communication Coaching Plan",
    expectations:
      "Maintain top delivery outcomes while sharpening concise executive-level communication.",
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-08-31T00:00:00.000Z"),
    status: ImprovementPlanStatus.ACTIVE,
    goals: [
      {
        id: "improvement_plan_goal_seed_3",
        title: "One-page risk brief discipline",
        description:
          "Submit one-page risk briefs for major handoffs with action owners and next-step due dates.",
        sortOrder: 1,
      },
    ],
    checkIns: [
      {
        id: "improvement_plan_checkin_seed_3",
        authorUserId: "user_manager_1",
        content:
          "Coaching update: executive brief quality improved while delivery outcomes remain in the top band.",
        status: ImprovementPlanStatus.ACTIVE,
        checkInAt: new Date("2026-06-20T15:30:00.000Z"),
      },
    ],
  },
];

export const performanceAxis = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Needs support",
    description: "Consistently below this cycle's expectations.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Meets expectations",
    description: "Delivers consistent outcomes in the expected scope.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Exceeds expectations",
    description: "Delivers standout outcomes with strong ownership and influence.",
  },
];

export const potentialAxis = [
  {
    bucket: CalibrationBucket.LOW,
    label: "Current scope",
    description: "Effective at current scope with limited near-term expansion.",
  },
  {
    bucket: CalibrationBucket.MEDIUM,
    label: "Growth ready",
    description: "Can take broader scope with coaching and support.",
  },
  {
    bucket: CalibrationBucket.HIGH,
    label: "Accelerated growth",
    description: "Shows readiness for significantly broader scope.",
  },
];

export const demoCycleConfig = {
  id: demoCycleId,
  orgId: demoOrgId,
  templateId: demoTemplateId,
  name: "Annual Review 2026",
  visibilityPolicy: CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE,
  startDate: new Date("2026-01-01T00:00:00.000Z"),
  endDate: new Date("2026-12-31T00:00:00.000Z"),
  peerReviewCount: 1,
  upwardReviewCount: 1,
} as const;

export const demoCalibrationConfig = {
  id: demoCalibrationSessionId,
  name: "Annual Review 2026 Calibration — Construction Cohort",
  roleGroup: "Construction Operations Cohort",
  description:
    "Calibration cohort for operations, safety, maintenance, and project teams.",
} as const;
