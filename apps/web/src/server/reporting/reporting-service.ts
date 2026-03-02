import {
  CompetencyDimensionKey,
  FinalRatingSource,
  ImprovementPlanStatus,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

const DEFAULT_SMALL_N_THRESHOLD = 5;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const reportSubmissionRelationships = [ReviewRelationship.SELF, ReviewRelationship.MANAGER] as const;

type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type RatingSourceMode = "FINAL" | "SCORECARD";

const baseFilterSchema = z.object({
  cycleId: z.string().trim().min(1),
  department: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .optional(),
  title: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .optional(),
  smallNThreshold: z.coerce.number().int().min(1).max(50).default(DEFAULT_SMALL_N_THRESHOLD),
});

const ratingsFilterSchema = baseFilterSchema.extend({
  ratingSource: z.enum(["FINAL", "SCORECARD"]).default("FINAL"),
});

const peopleFilterSchema = baseFilterSchema.extend({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]).optional(),
  ratingSource: z.enum(["FINAL", "SCORECARD"]).default("FINAL"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

interface ReportingCycleRecord {
  id: string;
  name: string;
  status: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  packets: { id: string }[];
}

interface ReportingSubmissionRecord {
  relationship: ReviewRelationship;
  status: ReviewSubmissionStatus;
}

interface ReportingPacketRecord {
  id: string;
  subjectEmployeeId: string;
  snapshotDepartment: string | null;
  snapshotTitle: string | null;
  scorecardOverallRating: number | null;
  finalRatingSource: FinalRatingSource | null;
  totalScorecardPercent: number | null;
  subjectEmployee: {
    firstName: string;
    lastName: string;
  };
  submissions: ReportingSubmissionRecord[];
}

interface CompetencyAnswerRecord {
  scaleRating: number | null;
  notObserved: boolean;
  submission: {
    packetId: string;
    relationship: ReviewRelationship;
  };
  question: {
    dimensionKey: CompetencyDimensionKey | null;
  };
}

interface CalibrationPlacementLinkRecord {
  employeeId: string;
  session: {
    id: string;
  };
}

interface ImprovementPlanLinkRecord {
  id: string;
  subjectEmployeeId: string;
  status: ImprovementPlanStatus;
  createdAt: Date;
}

interface ReportingDb {
  reviewCycle: {
    findMany: (args: Record<string, unknown>) => Promise<ReportingCycleRecord[]>;
  };
  reviewPacket: {
    findMany: (args: Record<string, unknown>) => Promise<ReportingPacketRecord[]>;
  };
  reviewAnswer: {
    findMany: (args: Record<string, unknown>) => Promise<CompetencyAnswerRecord[]>;
  };
  calibrationPlacement: {
    findMany: (args: Record<string, unknown>) => Promise<CalibrationPlacementLinkRecord[]>;
  };
  improvementPlan: {
    findMany: (args: Record<string, unknown>) => Promise<ImprovementPlanLinkRecord[]>;
  };
}

interface NormalizedReportFilters {
  cycleId: string;
  department?: string;
  title?: string;
  smallNThreshold: number;
}

interface PacketScope {
  packets: ReportingPacketRecord[];
  suppressed: boolean;
  filterOptions: {
    departments: string[];
    titles: string[];
  };
}

interface SubmissionStatusBreakdown {
  notStarted: number;
  inProgress: number;
  completed: number;
}

interface ReportingSuppressionState {
  suppressed: boolean;
  message: string | null;
}

interface CompetencyGapAccumulator {
  selfRating: number | null;
  managerRating: number | null;
}

interface CompetencyAccumulator {
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  notObservedCount: number;
  observedCount: number;
  observedRatingSum: number;
  gapByPacket: Map<string, CompetencyGapAccumulator>;
}

export interface ReportingCycleListItem {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  packetCount: number;
  createdAt: string;
}

export interface ReportingCycleListResult {
  cycles: ReportingCycleListItem[];
}

export interface ReportingProgressResult {
  totals: SubmissionStatusBreakdown;
  self: SubmissionStatusBreakdown;
  manager: SubmissionStatusBreakdown;
  filters: {
    cycleId: string;
    department?: string;
    title?: string;
    departments: string[];
    titles: string[];
  };
  suppression: ReportingSuppressionState;
}

export interface ReportingRatingsResult {
  ratingSource: RatingSourceMode;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  ratedCount: number;
  sourceSummary: {
    scorecard: number;
    calibration: number;
    unset: number;
  };
  filters: {
    cycleId: string;
    department?: string;
    title?: string;
    departments: string[];
    titles: string[];
  };
  suppression: ReportingSuppressionState;
}

export interface ReportingCompetencyResult {
  dimensionKey: CompetencyDimensionKey;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  notObservedCount: number;
  observedCount: number;
  averageRating: number | null;
  selfManagerGap: {
    comparedCount: number;
    averageGap: number | null;
    averageAbsoluteGap: number | null;
  };
}

export interface ReportingCompetenciesResponse {
  competencies: ReportingCompetencyResult[];
  filters: {
    cycleId: string;
    department?: string;
    title?: string;
    departments: string[];
    titles: string[];
  };
  suppression: ReportingSuppressionState;
}

export interface ReportingPeopleRow {
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  selfStatus: ReviewSubmissionStatus;
  managerStatus: ReviewSubmissionStatus;
  overallStatus: ProgressStatus;
  finalRating: number | null;
  finalRatingSource: FinalRatingSource | null;
  scorecardPercent: number | null;
  links: {
    packet: string;
    calibrationSession: string | null;
    improvementPlan: string | null;
  };
}

export interface ReportingPeopleResult {
  rows: ReportingPeopleRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
  };
  filters: {
    cycleId: string;
    department?: string;
    title?: string;
    status?: ProgressStatus;
    ratingSource: RatingSourceMode;
    departments: string[];
    titles: string[];
  };
  suppression: ReportingSuppressionState;
}

export function parseProgressFilters(searchParams: URLSearchParams): NormalizedReportFilters {
  const parsed = baseFilterSchema.safeParse({
    cycleId: searchParams.get("cycleId") ?? "",
    department: normalizeOptionalFilter(searchParams.get("department")),
    title: normalizeOptionalFilter(searchParams.get("title")),
    smallNThreshold: normalizeOptionalFilter(searchParams.get("smallNThreshold")) ?? DEFAULT_SMALL_N_THRESHOLD,
  });

  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid reporting filters", 400, parsed.error.flatten());
  }

  return parsed.data;
}

export function parseRatingsFilters(
  searchParams: URLSearchParams,
): NormalizedReportFilters & { ratingSource: RatingSourceMode } {
  const parsed = ratingsFilterSchema.safeParse({
    cycleId: searchParams.get("cycleId") ?? "",
    department: normalizeOptionalFilter(searchParams.get("department")),
    title: normalizeOptionalFilter(searchParams.get("title")),
    ratingSource: normalizeOptionalFilter(searchParams.get("ratingSource")) ?? "FINAL",
    smallNThreshold: normalizeOptionalFilter(searchParams.get("smallNThreshold")) ?? DEFAULT_SMALL_N_THRESHOLD,
  });

  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid rating filters", 400, parsed.error.flatten());
  }

  return parsed.data;
}

export function parseCompetenciesFilters(searchParams: URLSearchParams): NormalizedReportFilters {
  return parseProgressFilters(searchParams);
}

export function parsePeopleFilters(
  searchParams: URLSearchParams,
): NormalizedReportFilters & {
  status?: ProgressStatus;
  ratingSource: RatingSourceMode;
  page: number;
  pageSize: number;
} {
  const parsed = peopleFilterSchema.safeParse({
    cycleId: searchParams.get("cycleId") ?? "",
    department: normalizeOptionalFilter(searchParams.get("department")),
    title: normalizeOptionalFilter(searchParams.get("title")),
    status: normalizeOptionalFilter(searchParams.get("status")),
    ratingSource: normalizeOptionalFilter(searchParams.get("ratingSource")) ?? "FINAL",
    page: normalizeOptionalFilter(searchParams.get("page")) ?? 1,
    pageSize: normalizeOptionalFilter(searchParams.get("pageSize")) ?? DEFAULT_PAGE_SIZE,
    smallNThreshold: normalizeOptionalFilter(searchParams.get("smallNThreshold")) ?? DEFAULT_SMALL_N_THRESHOLD,
  });

  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid people filters", 400, parsed.error.flatten());
  }

  return parsed.data;
}

export async function listReportingCycles(
  context: RequestContext,
  db: ReportingDb = prisma as unknown as ReportingDb,
): Promise<ReportingCycleListResult> {
  requireReportingAccess(context);

  const cycles = await db.reviewCycle.findMany({
    where: {
      orgId: context.orgId,
    },
    orderBy: {
      startDate: "desc",
    },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      packets: {
        select: {
          id: true,
        },
      },
    },
  });

  return {
    cycles: cycles.map((cycle) => ({
      id: cycle.id,
      name: cycle.name,
      status: cycle.status,
      startDate: cycle.startDate.toISOString(),
      endDate: cycle.endDate.toISOString(),
      packetCount: cycle.packets.length,
      createdAt: cycle.createdAt.toISOString(),
    })),
  };
}

export async function getReportingProgress(
  filters: NormalizedReportFilters,
  context: RequestContext,
  db: ReportingDb = prisma as unknown as ReportingDb,
): Promise<ReportingProgressResult> {
  requireReportingAccess(context);
  const scope = await loadPacketScope(filters, context, db);

  if (scope.suppressed) {
    return {
      totals: emptyBreakdown(),
      self: emptyBreakdown(),
      manager: emptyBreakdown(),
      filters: {
        cycleId: filters.cycleId,
        department: filters.department,
        title: filters.title,
        departments: scope.filterOptions.departments,
        titles: scope.filterOptions.titles,
      },
      suppression: suppressedMessage(),
    };
  }

  const totals = emptyBreakdown();
  const self = emptyBreakdown();
  const manager = emptyBreakdown();

  for (const packet of scope.packets) {
    const selfStatus = getSubmissionStatus(packet.submissions, ReviewRelationship.SELF);
    const managerStatus = getSubmissionStatus(packet.submissions, ReviewRelationship.MANAGER);
    const selfBucket = mapSubmissionToProgressStatus(selfStatus);
    const managerBucket = mapSubmissionToProgressStatus(managerStatus);
    const overallBucket = mapOverallProgressStatus(selfStatus, managerStatus);

    incrementBreakdown(self, selfBucket);
    incrementBreakdown(manager, managerBucket);
    incrementBreakdown(totals, overallBucket);
  }

  return {
    totals,
    self,
    manager,
    filters: {
      cycleId: filters.cycleId,
      department: filters.department,
      title: filters.title,
      departments: scope.filterOptions.departments,
      titles: scope.filterOptions.titles,
    },
    suppression: unsuppressedState(),
  };
}

export async function getReportingRatings(
  filters: NormalizedReportFilters & { ratingSource: RatingSourceMode },
  context: RequestContext,
  db: ReportingDb = prisma as unknown as ReportingDb,
): Promise<ReportingRatingsResult> {
  requireReportingAccess(context);
  const scope = await loadPacketScope(filters, context, db);

  if (scope.suppressed) {
    return {
      ratingSource: filters.ratingSource,
      distribution: emptyRatingDistribution(),
      ratedCount: 0,
      sourceSummary: {
        scorecard: 0,
        calibration: 0,
        unset: 0,
      },
      filters: {
        cycleId: filters.cycleId,
        department: filters.department,
        title: filters.title,
        departments: scope.filterOptions.departments,
        titles: scope.filterOptions.titles,
      },
      suppression: suppressedMessage(),
    };
  }

  const distribution = emptyRatingDistribution();
  let ratedCount = 0;
  let scorecardCount = 0;
  let calibrationCount = 0;
  let unsetCount = 0;

  for (const packet of scope.packets) {
    if (packet.finalRatingSource === FinalRatingSource.CALIBRATION) {
      calibrationCount += 1;
    } else if (packet.finalRatingSource === FinalRatingSource.SCORECARD) {
      scorecardCount += 1;
    } else {
      unsetCount += 1;
    }

    const rating = packet.scorecardOverallRating;
    if (typeof rating !== "number") {
      continue;
    }

    if (rating >= 1 && rating <= 5) {
      distribution[String(rating) as keyof typeof distribution] += 1;
      ratedCount += 1;
    }
  }

  return {
    ratingSource: filters.ratingSource,
    distribution,
    ratedCount,
    sourceSummary: {
      scorecard: scorecardCount,
      calibration: calibrationCount,
      unset: unsetCount,
    },
    filters: {
      cycleId: filters.cycleId,
      department: filters.department,
      title: filters.title,
      departments: scope.filterOptions.departments,
      titles: scope.filterOptions.titles,
    },
    suppression: unsuppressedState(),
  };
}

export async function getReportingCompetencies(
  filters: NormalizedReportFilters,
  context: RequestContext,
  db: ReportingDb = prisma as unknown as ReportingDb,
): Promise<ReportingCompetenciesResponse> {
  requireReportingAccess(context);
  const scope = await loadPacketScope(filters, context, db);

  if (scope.suppressed) {
    return {
      competencies: [],
      filters: {
        cycleId: filters.cycleId,
        department: filters.department,
        title: filters.title,
        departments: scope.filterOptions.departments,
        titles: scope.filterOptions.titles,
      },
      suppression: suppressedMessage(),
    };
  }

  if (scope.packets.length === 0) {
    return {
      competencies: [],
      filters: {
        cycleId: filters.cycleId,
        department: filters.department,
        title: filters.title,
        departments: scope.filterOptions.departments,
        titles: scope.filterOptions.titles,
      },
      suppression: unsuppressedState(),
    };
  }

  const packetIds = scope.packets.map((packet) => packet.id);

  const answers = await db.reviewAnswer.findMany({
    where: {
      submission: {
        orgId: context.orgId,
        packetId: {
          in: packetIds,
        },
        relationship: {
          in: reportSubmissionRelationships,
        },
      },
      question: {
        dimensionKey: {
          not: null,
        },
      },
    },
    select: {
      scaleRating: true,
      notObserved: true,
      submission: {
        select: {
          packetId: true,
          relationship: true,
        },
      },
      question: {
        select: {
          dimensionKey: true,
        },
      },
    },
  });

  const byDimension = new Map<CompetencyDimensionKey, CompetencyAccumulator>();

  for (const answer of answers) {
    const dimensionKey = answer.question.dimensionKey;
    if (!dimensionKey) {
      continue;
    }

    const accumulator = byDimension.get(dimensionKey) ?? {
      distribution: emptyRatingDistribution(),
      notObservedCount: 0,
      observedCount: 0,
      observedRatingSum: 0,
      gapByPacket: new Map<string, CompetencyGapAccumulator>(),
    };

    if (answer.notObserved || typeof answer.scaleRating !== "number") {
      accumulator.notObservedCount += 1;
    } else {
      const scoreKey = String(answer.scaleRating) as keyof typeof accumulator.distribution;
      if (scoreKey in accumulator.distribution) {
        accumulator.distribution[scoreKey] += 1;
        accumulator.observedCount += 1;
        accumulator.observedRatingSum += answer.scaleRating;
      }
    }

    const gapEntry = accumulator.gapByPacket.get(answer.submission.packetId) ?? {
      selfRating: null,
      managerRating: null,
    };

    if (!answer.notObserved && typeof answer.scaleRating === "number") {
      if (answer.submission.relationship === ReviewRelationship.SELF) {
        gapEntry.selfRating = answer.scaleRating;
      }

      if (answer.submission.relationship === ReviewRelationship.MANAGER) {
        gapEntry.managerRating = answer.scaleRating;
      }
    }

    accumulator.gapByPacket.set(answer.submission.packetId, gapEntry);
    byDimension.set(dimensionKey, accumulator);
  }

  const competencies = Object.values(CompetencyDimensionKey).map((dimensionKey) => {
    const accumulator = byDimension.get(dimensionKey) ?? {
      distribution: emptyRatingDistribution(),
      notObservedCount: 0,
      observedCount: 0,
      observedRatingSum: 0,
      gapByPacket: new Map<string, CompetencyGapAccumulator>(),
    };

    let comparedCount = 0;
    let gapSum = 0;
    let absoluteGapSum = 0;

    for (const gap of accumulator.gapByPacket.values()) {
      if (gap.selfRating == null || gap.managerRating == null) {
        continue;
      }

      const diff = gap.managerRating - gap.selfRating;
      comparedCount += 1;
      gapSum += diff;
      absoluteGapSum += Math.abs(diff);
    }

    return {
      dimensionKey,
      distribution: accumulator.distribution,
      notObservedCount: accumulator.notObservedCount,
      observedCount: accumulator.observedCount,
      averageRating:
        accumulator.observedCount > 0
          ? roundTo(accumulator.observedRatingSum / accumulator.observedCount)
          : null,
      selfManagerGap: {
        comparedCount,
        averageGap: comparedCount > 0 ? roundTo(gapSum / comparedCount) : null,
        averageAbsoluteGap: comparedCount > 0 ? roundTo(absoluteGapSum / comparedCount) : null,
      },
    };
  });

  return {
    competencies,
    filters: {
      cycleId: filters.cycleId,
      department: filters.department,
      title: filters.title,
      departments: scope.filterOptions.departments,
      titles: scope.filterOptions.titles,
    },
    suppression: unsuppressedState(),
  };
}

export async function getReportingPeople(
  filters: NormalizedReportFilters & {
    status?: ProgressStatus;
    ratingSource: RatingSourceMode;
    page: number;
    pageSize: number;
  },
  context: RequestContext,
  db: ReportingDb = prisma as unknown as ReportingDb,
): Promise<ReportingPeopleResult> {
  requireReportingAccess(context);
  const scope = await loadPacketScope(filters, context, db);

  if (scope.suppressed) {
    return {
      rows: [],
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalRows: 0,
        totalPages: 0,
      },
      filters: {
        cycleId: filters.cycleId,
        department: filters.department,
        title: filters.title,
        status: filters.status,
        ratingSource: filters.ratingSource,
        departments: scope.filterOptions.departments,
        titles: scope.filterOptions.titles,
      },
      suppression: suppressedMessage(),
    };
  }

  const withStatus = scope.packets
    .map((packet) => {
      const selfStatus = getSubmissionStatus(packet.submissions, ReviewRelationship.SELF);
      const managerStatus = getSubmissionStatus(packet.submissions, ReviewRelationship.MANAGER);
      const overallStatus = mapOverallProgressStatus(selfStatus, managerStatus);

      return {
        packet,
        selfStatus,
        managerStatus,
        overallStatus,
      };
    })
    .filter((item) => {
      if (!filters.status) {
        return true;
      }

      return item.overallStatus === filters.status;
    });

  const subjectIds = withStatus.map((item) => item.packet.subjectEmployeeId);

  const [calibrationLinks, planLinks] = await Promise.all([
    subjectIds.length === 0
      ? Promise.resolve([])
      : db.calibrationPlacement.findMany({
          where: {
            orgId: context.orgId,
            employeeId: {
              in: subjectIds,
            },
            session: {
              cycleId: filters.cycleId,
            },
          },
          select: {
            employeeId: true,
            session: {
              select: {
                id: true,
              },
            },
          },
        }),
    subjectIds.length === 0
      ? Promise.resolve([])
      : db.improvementPlan.findMany({
          where: {
            orgId: context.orgId,
            subjectEmployeeId: {
              in: subjectIds,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            subjectEmployeeId: true,
            status: true,
            createdAt: true,
          },
        }),
  ]);

  const calibrationByEmployeeId = new Map<string, string>();
  for (const link of calibrationLinks) {
    if (!calibrationByEmployeeId.has(link.employeeId)) {
      calibrationByEmployeeId.set(link.employeeId, link.session.id);
    }
  }

  const improvementPlanByEmployeeId = new Map<string, string>();
  for (const link of planLinks) {
    if (!improvementPlanByEmployeeId.has(link.subjectEmployeeId)) {
      improvementPlanByEmployeeId.set(link.subjectEmployeeId, link.id);
    }
  }

  const rows = withStatus.map((item) => ({
    employeeId: item.packet.subjectEmployeeId,
    employeeName: `${item.packet.subjectEmployee.firstName} ${item.packet.subjectEmployee.lastName}`,
    department: item.packet.snapshotDepartment ?? "Unspecified",
    title: item.packet.snapshotTitle ?? "Unspecified",
    selfStatus: item.selfStatus,
    managerStatus: item.managerStatus,
    overallStatus: item.overallStatus,
    finalRating: item.packet.scorecardOverallRating,
    finalRatingSource: item.packet.finalRatingSource,
    scorecardPercent: item.packet.totalScorecardPercent,
    links: {
      packet: `/performance/reviews/${filters.cycleId}/packet/${item.packet.subjectEmployeeId}`,
      calibrationSession: calibrationByEmployeeId.get(item.packet.subjectEmployeeId)
        ? `/performance/calibration/${calibrationByEmployeeId.get(item.packet.subjectEmployeeId)}`
        : null,
      improvementPlan: improvementPlanByEmployeeId.get(item.packet.subjectEmployeeId)
        ? `/performance/improvement-plans/${improvementPlanByEmployeeId.get(item.packet.subjectEmployeeId)}`
        : null,
    },
  }));

  const totalRows = rows.length;
  const totalPages = totalRows === 0 ? 0 : Math.ceil(totalRows / filters.pageSize);
  const page = totalPages === 0 ? 1 : Math.min(filters.page, totalPages);
  const start = totalRows === 0 ? 0 : (page - 1) * filters.pageSize;
  const pagedRows = rows.slice(start, start + filters.pageSize);

  return {
    rows: pagedRows,
    pagination: {
      page,
      pageSize: filters.pageSize,
      totalRows,
      totalPages,
    },
    filters: {
      cycleId: filters.cycleId,
      department: filters.department,
      title: filters.title,
      status: filters.status,
      ratingSource: filters.ratingSource,
      departments: scope.filterOptions.departments,
      titles: scope.filterOptions.titles,
    },
    suppression: unsuppressedState(),
  };
}

async function loadPacketScope(
  filters: NormalizedReportFilters,
  context: RequestContext,
  db: ReportingDb,
): Promise<PacketScope> {
  const packets = await db.reviewPacket.findMany({
    where: {
      orgId: context.orgId,
      cycleId: filters.cycleId,
      ...(filters.department ? { snapshotDepartment: filters.department } : {}),
      ...(filters.title ? { snapshotTitle: filters.title } : {}),
    },
    orderBy: {
      snapshotDepartment: "asc",
    },
    select: {
      id: true,
      subjectEmployeeId: true,
      snapshotDepartment: true,
      snapshotTitle: true,
      scorecardOverallRating: true,
      finalRatingSource: true,
      totalScorecardPercent: true,
      subjectEmployee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      submissions: {
        where: {
          relationship: {
            in: reportSubmissionRelationships,
          },
        },
        select: {
          relationship: true,
          status: true,
        },
      },
    },
  });

  const filterOptions = {
    departments: uniqueSortedValues(packets.map((packet) => packet.snapshotDepartment)),
    titles: uniqueSortedValues(packets.map((packet) => packet.snapshotTitle)),
  };

  return {
    packets,
    suppressed: shouldSuppressSmallGroup(packets.length, filters.smallNThreshold),
    filterOptions,
  };
}

function requireReportingAccess(context: RequestContext): void {
  if (context.role !== UserRole.HR_ADMIN) {
    throw new AppError("FORBIDDEN", "Only HR admins can access reporting", 403);
  }
}

function getSubmissionStatus(
  submissions: ReportingSubmissionRecord[],
  relationship: ReviewRelationship,
): ReviewSubmissionStatus {
  const submission = submissions.find((candidate) => candidate.relationship === relationship);
  return submission?.status ?? ReviewSubmissionStatus.NOT_STARTED;
}

function mapSubmissionToProgressStatus(status: ReviewSubmissionStatus): ProgressStatus {
  if (status === ReviewSubmissionStatus.SUBMITTED) {
    return "COMPLETED";
  }

  if (status === ReviewSubmissionStatus.NOT_STARTED) {
    return "NOT_STARTED";
  }

  return "IN_PROGRESS";
}

function mapOverallProgressStatus(
  selfStatus: ReviewSubmissionStatus,
  managerStatus: ReviewSubmissionStatus,
): ProgressStatus {
  const selfBucket = mapSubmissionToProgressStatus(selfStatus);
  const managerBucket = mapSubmissionToProgressStatus(managerStatus);

  if (selfBucket === "COMPLETED" && managerBucket === "COMPLETED") {
    return "COMPLETED";
  }

  if (selfBucket === "NOT_STARTED" && managerBucket === "NOT_STARTED") {
    return "NOT_STARTED";
  }

  return "IN_PROGRESS";
}

function normalizeOptionalFilter(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length === 0 ? undefined : normalized;
}

function shouldSuppressSmallGroup(count: number, threshold: number): boolean {
  return count > 0 && count < threshold;
}

function uniqueSortedValues(values: Array<string | null>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)).map((value) => value.trim())))
    .filter((value) => value.length > 0)
    .sort((left, right) => left.localeCompare(right));
}

function emptyBreakdown(): SubmissionStatusBreakdown {
  return {
    notStarted: 0,
    inProgress: 0,
    completed: 0,
  };
}

function incrementBreakdown(breakdown: SubmissionStatusBreakdown, status: ProgressStatus): void {
  if (status === "NOT_STARTED") {
    breakdown.notStarted += 1;
    return;
  }

  if (status === "IN_PROGRESS") {
    breakdown.inProgress += 1;
    return;
  }

  breakdown.completed += 1;
}

function emptyRatingDistribution(): Record<"1" | "2" | "3" | "4" | "5", number> {
  return {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };
}

function suppressedMessage(): ReportingSuppressionState {
  return {
    suppressed: true,
    message: "Insufficient data for this filter group.",
  };
}

function unsuppressedState(): ReportingSuppressionState {
  return {
    suppressed: false,
    message: null,
  };
}

function roundTo(value: number): number {
  return Math.round(value * 100) / 100;
}
