import {
  CalibrationBucket,
  CompetencyDimensionKey,
  EvidenceType,
  EvidenceVisibility,
  ImprovementPlanStatus,
  ReviewQuestionType,
  ScorecardMetricKey,
  UserRole,
} from "@prisma/client";

export type DemoStoryKey =
  | "HIGH_PERFORMER_COACHED"
  | "IMPROVEMENT_TRENDING"
  | "SAFETY_INCIDENT_LEARNING"
  | "NEW_EMPLOYEE_LIMITED_OBSERVATION"
  | "STEADY_CONTRIBUTOR"
  | "STRONG_OPERATOR"
  | "EXCEPTIONAL_OPERATOR"
  | "AT_RISK_PERFORMER"
  | "MANAGER_SOLID";

export type DimensionRatingSeed = number | "NOT_OBS";

export interface DemoPerson {
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
  storyKey: DemoStoryKey;
}

export interface DemoQuestion {
  id: string;
  prompt: string;
  questionType: ReviewQuestionType;
  dimensionKey: CompetencyDimensionKey | null;
  isRequired: boolean;
  sortOrder: number;
}

export interface DemoEvidenceTemplate {
  type: EvidenceType;
  visibility: EvidenceVisibility;
  content: string;
  attachToQuestionId?: string;
}

export interface DemoStoryProfile {
  key: DemoStoryKey;
  impactSelf: string;
  impactManager: string;
  growthFocus: string;
  selfRatings: Record<CompetencyDimensionKey, DimensionRatingSeed>;
  managerRatings: Record<CompetencyDimensionKey, DimensionRatingSeed>;
  evidenceTemplates: DemoEvidenceTemplate[];
  calibration: {
    performanceBucket: CalibrationBucket;
    potentialBucket: CalibrationBucket;
    justification: string;
    finalSourceCalibration?: boolean;
  };
}

export interface DemoImprovementPlanSeed {
  id: string;
  subjectEmployeeId: string;
  managerEmployeeId: string;
  title: string;
  expectations: string;
  startDate: Date;
  endDate: Date;
  status: ImprovementPlanStatus;
  goals: Array<{
    id: string;
    title: string;
    description: string;
    sortOrder: number;
  }>;
  checkIns: Array<{
    id: string;
    authorUserId: string;
    content: string;
    status: ImprovementPlanStatus;
    checkInAt: Date;
  }>;
}

export interface DemoSeedSummary {
  users: number;
  employees: number;
  packets: number;
  submissions: number;
  answers: number;
  evidenceItems: number;
  evidenceLinks: number;
}

export interface DemoResetResult {
  seededAt: string;
  summary: DemoSeedSummary;
}

export interface ScorecardMetricSeed {
  metricKey: ScorecardMetricKey;
  weightPercent: number;
}
