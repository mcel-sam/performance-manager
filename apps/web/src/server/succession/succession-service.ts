import {
  CalibrationBucket,
  FinalRatingSource,
  PositionStatus,
  Prisma,
  SuccessionAssessmentLevel,
  SuccessionNoteVisibility,
  SuccessionReadiness,
  SuccessionVisibilityScope,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import { appEnv } from "@/config/env";
import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

const DEFAULT_SMALL_N_THRESHOLD = 5;

const listFiltersSchema = z.object({
  search: z.string().trim().min(1).max(160).optional(),
  department: z.string().trim().min(1).max(120).optional(),
  includeArchived: z.coerce.boolean().default(false),
  criticalOnly: z.coerce.boolean().default(false),
  smallNThreshold: z.coerce.number().int().min(1).max(50).default(DEFAULT_SMALL_N_THRESHOLD),
});

const createPositionSchema = z.object({
  title: z.string().trim().min(2).max(160),
  department: z.string().trim().min(1).max(120),
  location: z.string().trim().max(160).nullable().optional(),
  incumbentEmployeeId: z.string().trim().min(1).nullable().optional(),
  isCritical: z.coerce.boolean().default(false),
  status: z.nativeEnum(PositionStatus).default(PositionStatus.ACTIVE),
  ownerEmployeeId: z.string().trim().min(1),
  visibilityScope: z
    .nativeEnum(SuccessionVisibilityScope)
    .default(SuccessionVisibilityScope.MANAGERS_IN_SCOPE),
  reviewCadence: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(6000).nullable().optional(),
  collaboratorEmployeeIds: z.array(z.string().trim().min(1)).max(20).optional().default([]),
  allowedManagerEmployeeIds: z.array(z.string().trim().min(1)).max(20).optional().default([]),
});

const updatePositionSchema = createPositionSchema.extend({
  status: z.nativeEnum(PositionStatus),
});

const createCandidateSchema = z.object({
  candidateEmployeeId: z.string().trim().min(1),
  readiness: z.nativeEnum(SuccessionReadiness),
  riskOfLoss: z.nativeEnum(SuccessionAssessmentLevel).nullable().optional(),
  confidence: z.nativeEnum(SuccessionAssessmentLevel).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

const updateCandidateSchema = z.object({
  readiness: z.nativeEnum(SuccessionReadiness).optional(),
  riskOfLoss: z.nativeEnum(SuccessionAssessmentLevel).nullable().optional(),
  confidence: z.nativeEnum(SuccessionAssessmentLevel).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

const createNoteSchema = z.object({
  visibility: z.nativeEnum(SuccessionNoteVisibility).optional(),
  body: z.string().trim().min(1).max(4000),
});

const viewerEmployeeSelect = Prisma.validator<Prisma.EmployeeSelect>()({
  id: true,
  firstName: true,
  lastName: true,
  department: true,
  title: true,
  directReports: {
    select: {
      id: true,
    },
  },
});

const employeeOptionSelect = Prisma.validator<Prisma.EmployeeSelect>()({
  id: true,
  firstName: true,
  lastName: true,
  department: true,
  title: true,
  avatarUrl: true,
  managerId: true,
  user: {
    select: {
      role: true,
    },
  },
});

const positionOverviewSelect = Prisma.validator<Prisma.PositionSelect>()({
  id: true,
  title: true,
  department: true,
  location: true,
  isCritical: true,
  status: true,
  incumbentEmployee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      avatarUrl: true,
      managerId: true,
    },
  },
  plan: {
    select: {
      id: true,
      visibilityScope: true,
      reviewCadence: true,
      ownerEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true,
          avatarUrl: true,
        },
      },
      candidates: {
        select: {
          id: true,
          readiness: true,
          proposedByRole: true,
          candidateEmployee: {
            select: {
              id: true,
              managerId: true,
            },
          },
        },
      },
    },
  },
});

const positionDetailSelect = Prisma.validator<Prisma.PositionSelect>()({
  id: true,
  title: true,
  department: true,
  location: true,
  isCritical: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  incumbentEmployee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      title: true,
      department: true,
      avatarUrl: true,
      managerId: true,
    },
  },
  plan: {
    select: {
      id: true,
      visibilityScope: true,
      reviewCadence: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      ownerEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true,
          department: true,
          avatarUrl: true,
        },
      },
      collaborators: {
        select: {
          id: true,
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              department: true,
              avatarUrl: true,
            },
          },
        },
      },
      allowedManagers: {
        select: {
          id: true,
          managerEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              department: true,
              avatarUrl: true,
            },
          },
        },
      },
      candidates: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          readiness: true,
          riskOfLoss: true,
          confidence: true,
          proposedByRole: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          candidateEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              department: true,
              avatarUrl: true,
              managerId: true,
            },
          },
          proposedByEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              department: true,
              avatarUrl: true,
            },
          },
          notes: {
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              visibility: true,
              body: true,
              authorRole: true,
              createdAt: true,
              authorEmployee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  title: true,
                  avatarUrl: true,
                },
              },
            },
          },
          snapshots: {
            orderBy: [{ createdAt: "desc" }],
            take: 1,
            select: {
              id: true,
              cycleId: true,
              scorecardOverallRating: true,
              scorecardPercent: true,
              finalRatingSource: true,
              calibrationPerformanceBucket: true,
              calibrationPotentialBucket: true,
              snapshotDepartment: true,
              snapshotTitle: true,
              snapshotManagerName: true,
              createdAt: true,
            },
          },
        },
      },
    },
  },
});

type ViewerEmployeeRecord = Prisma.EmployeeGetPayload<{ select: typeof viewerEmployeeSelect }>;
type EmployeeOptionRecord = Prisma.EmployeeGetPayload<{ select: typeof employeeOptionSelect }>;
type PositionOverviewRecord = Prisma.PositionGetPayload<{
  select: typeof positionOverviewSelect;
}>;
type PositionDetailRecord = Prisma.PositionGetPayload<{ select: typeof positionDetailSelect }>;
type PositionPlanRecord = NonNullable<PositionDetailRecord["plan"]>;
type PositionCandidateRecord = PositionPlanRecord["candidates"][number];
type PositionCandidateSnapshotRecord = PositionCandidateRecord["snapshots"][number];

interface SuccessionViewerScope {
  mode: "HR_ADMIN" | "MANAGER";
  canViewSensitiveFields: boolean;
  viewerEmployee: ViewerEmployeeRecord | null;
  directReportIds: Set<string>;
  department: string | null;
}

export interface SuccessionFilters {
  search?: string;
  department?: string;
  includeArchived: boolean;
  criticalOnly: boolean;
  smallNThreshold: number;
}

export interface SuccessionEmployeeOption {
  id: string;
  name: string;
  title: string | null;
  department: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

export interface SuccessionFormOptions {
  employees: SuccessionEmployeeOption[];
  owners: SuccessionEmployeeOption[];
  managers: SuccessionEmployeeOption[];
  departments: string[];
}

export interface SuccessionPositionListItem {
  id: string;
  title: string;
  department: string;
  location: string | null;
  isCritical: boolean;
  status: PositionStatus;
  incumbent: {
    id: string;
    name: string;
    title: string | null;
    avatarUrl: string | null;
  } | null;
  plan: {
    id: string;
    ownerName: string;
    visibilityScope: SuccessionVisibilityScope;
    reviewCadence: string | null;
    candidateCount: number;
    readyNowCount: number;
    managerProposalCount: number;
  } | null;
  coverageState: "NO_PLAN" | "NO_READY_NOW" | "READY_NOW";
}

export interface SuccessionCoverageReportRow {
  department: string;
  positionCount: number | null;
  readyNowCoveredCount: number | null;
  criticalGapCount: number | null;
  suppressed: boolean;
}

export interface SuccessionOverviewResult {
  viewer: {
    mode: "HR_ADMIN" | "MANAGER";
    canViewSensitiveFields: boolean;
  };
  summary: {
    visiblePositions: number;
    activePositions: number;
    criticalPositions: number;
    readyNowCoveredPositions: number;
    criticalGaps: number;
    managerProposals: number;
  };
  filters: {
    search?: string;
    department?: string;
    includeArchived: boolean;
    criticalOnly: boolean;
    departments: string[];
  };
  positions: SuccessionPositionListItem[];
  coverageByDepartment: SuccessionCoverageReportRow[];
}

export interface SuccessionCandidateSignal {
  scorecardOverallRating: number | null;
  scorecardPercent: number | null;
  finalRatingSource: FinalRatingSource | null;
  calibrationPerformanceBucket: CalibrationBucket | null;
  calibrationPotentialBucket: CalibrationBucket | null;
  snapshotDepartment: string | null;
  snapshotTitle: string | null;
  snapshotManagerName: string | null;
  updatedAt: string | null;
}

export interface SuccessionNoteItem {
  id: string;
  visibility: SuccessionNoteVisibility;
  body: string;
  authorRole: UserRole;
  createdAt: string;
  author: {
    id: string;
    name: string;
    title: string | null;
    avatarUrl: string | null;
  };
}

export interface SuccessionCandidateItem {
  id: string;
  candidateEmployeeId: string;
  candidateName: string;
  candidateTitle: string | null;
  candidateDepartment: string | null;
  candidateAvatarUrl: string | null;
  candidateManagerId: string | null;
  readiness: SuccessionReadiness;
  riskOfLoss: SuccessionAssessmentLevel | null;
  confidence: SuccessionAssessmentLevel | null;
  proposedByRole: UserRole;
  proposedByName: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  signal: SuccessionCandidateSignal;
  notes: SuccessionNoteItem[];
}

export interface SuccessionPositionDetailResult {
  viewer: {
    mode: "HR_ADMIN" | "MANAGER";
    canViewSensitiveFields: boolean;
    canEditPosition: boolean;
    canManageCandidates: boolean;
    canProposeCandidates: boolean;
  };
  position: {
    id: string;
    title: string;
    department: string;
    location: string | null;
    isCritical: boolean;
    status: PositionStatus;
    createdAt: string;
    updatedAt: string;
    incumbent: {
      id: string;
      name: string;
      title: string | null;
      department: string | null;
      avatarUrl: string | null;
    } | null;
  };
  plan: {
    id: string;
    visibilityScope: SuccessionVisibilityScope;
    reviewCadence: string | null;
    notes: string | null;
    owner: {
      id: string;
      name: string;
      title: string | null;
      department: string | null;
      avatarUrl: string | null;
    };
    collaborators: Array<{
      id: string;
      name: string;
      title: string | null;
      department: string | null;
      avatarUrl: string | null;
    }>;
    allowedManagers: Array<{
      id: string;
      name: string;
      title: string | null;
      department: string | null;
      avatarUrl: string | null;
    }>;
  } | null;
  candidates: SuccessionCandidateItem[];
}

export interface SuccessionExportRow {
  positionTitle: string;
  department: string;
  location: string | null;
  isCritical: boolean;
  positionStatus: PositionStatus;
  incumbentName: string | null;
  planOwnerName: string | null;
  visibilityScope: SuccessionVisibilityScope | null;
  candidateName: string | null;
  candidateTitle: string | null;
  readiness: SuccessionReadiness | null;
  riskOfLoss: SuccessionAssessmentLevel | null;
  confidence: SuccessionAssessmentLevel | null;
  proposedByRole: UserRole | null;
  proposedByName: string | null;
  scorecardOverallRating: number | null;
  scorecardPercent: number | null;
  finalRatingSource: FinalRatingSource | null;
  calibrationPerformanceBucket: CalibrationBucket | null;
  calibrationPotentialBucket: CalibrationBucket | null;
}

export function parseSuccessionFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): SuccessionFilters {
  const values =
    input instanceof URLSearchParams
      ? {
          search: input.get("search") ?? undefined,
          department: input.get("department") ?? undefined,
          includeArchived: input.get("includeArchived") ?? undefined,
          criticalOnly: input.get("criticalOnly") ?? undefined,
          smallNThreshold: input.get("smallNThreshold") ?? undefined,
        }
      : {
          search: firstValue(input.search),
          department: firstValue(input.department),
          includeArchived: firstValue(input.includeArchived),
          criticalOnly: firstValue(input.criticalOnly),
          smallNThreshold: firstValue(input.smallNThreshold),
        };

  return listFiltersSchema.parse(values);
}

export async function getSuccessionFormOptions(
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<SuccessionFormOptions> {
  const scope = await resolveViewerScope(context, db);

  const employees = await db.employee.findMany({
    where: {
      orgId: context.orgId,
      ...(scope.mode === "MANAGER"
        ? {
            managerId: scope.viewerEmployee?.id ?? "__never__",
          }
        : {}),
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: employeeOptionSelect,
  });

  const allEmployees =
    scope.mode === "HR_ADMIN"
      ? employees
      : await db.employee.findMany({
          where: { orgId: context.orgId },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          select: employeeOptionSelect,
        });

  return {
    employees: employees.map(mapEmployeeOption),
    owners: allEmployees.map(mapEmployeeOption),
    managers: allEmployees.filter((employee) => employee.user.role === UserRole.MANAGER).map(mapEmployeeOption),
    departments: uniqueNonNull(allEmployees.map((employee) => employee.department)),
  };
}

export async function listSuccessionOverview(
  filters: SuccessionFilters,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<SuccessionOverviewResult> {
  const scope = await resolveViewerScope(context, db);
  const rows = await db.position.findMany({
    where: buildPositionWhere(filters, scope, context.orgId),
    orderBy: [{ isCritical: "desc" }, { department: "asc" }, { title: "asc" }],
    select: positionOverviewSelect,
  });

  const positions = rows.map((row) => mapPositionOverview(row));
  const departments = uniqueNonNull(rows.map((row) => row.department));
  const coverageByDepartment = buildCoverageByDepartment(positions, filters.smallNThreshold);

  return {
    viewer: {
      mode: scope.mode,
      canViewSensitiveFields: scope.canViewSensitiveFields,
    },
    summary: {
      visiblePositions: positions.length,
      activePositions: positions.filter((position) => position.status === PositionStatus.ACTIVE).length,
      criticalPositions: positions.filter((position) => position.isCritical).length,
      readyNowCoveredPositions: positions.filter((position) => position.coverageState === "READY_NOW").length,
      criticalGaps: positions.filter(
        (position) => position.isCritical && position.coverageState !== "READY_NOW",
      ).length,
      managerProposals: positions.reduce(
        (total, position) => total + (position.plan?.managerProposalCount ?? 0),
        0,
      ),
    },
    filters: {
      search: filters.search,
      department: filters.department,
      includeArchived: filters.includeArchived,
      criticalOnly: filters.criticalOnly,
      departments,
    },
    positions,
    coverageByDepartment,
  };
}

export async function getSuccessionPositionDetail(
  positionId: string,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<SuccessionPositionDetailResult> {
  const scope = await resolveViewerScope(context, db);
  const row = await db.position.findFirst({
    where: {
      id: positionId,
      ...buildPositionWhere(
        {
          includeArchived: true,
          criticalOnly: false,
          smallNThreshold: DEFAULT_SMALL_N_THRESHOLD,
        },
        scope,
        context.orgId,
      ),
    },
    select: positionDetailSelect,
  });

  if (!row || !row.plan) {
    throw new AppError("NOT_FOUND", "Succession position was not found", 404);
  }

  const candidateIdsNeedingSnapshot = row.plan.candidates
    .filter((candidate) => candidate.snapshots.length === 0)
    .map((candidate) => candidate.id);

  for (const candidateId of candidateIdsNeedingSnapshot) {
    await refreshCandidateSnapshot(candidateId, context.orgId, db);
  }

  const refreshedRow =
    candidateIdsNeedingSnapshot.length > 0
      ? await db.position.findFirst({
          where: {
            id: positionId,
            ...buildPositionWhere(
              {
                includeArchived: true,
                criticalOnly: false,
                smallNThreshold: DEFAULT_SMALL_N_THRESHOLD,
              },
              scope,
              context.orgId,
            ),
          },
          select: positionDetailSelect,
        })
      : row;

  if (!refreshedRow?.plan) {
    throw new AppError("NOT_FOUND", "Succession position was not found", 404);
  }

  return {
    viewer: {
      mode: scope.mode,
      canViewSensitiveFields: scope.canViewSensitiveFields,
      canEditPosition: scope.mode === "HR_ADMIN",
      canManageCandidates: scope.mode === "HR_ADMIN",
      canProposeCandidates: scope.mode === "HR_ADMIN" || scope.mode === "MANAGER",
    },
    position: {
      id: refreshedRow.id,
      title: refreshedRow.title,
      department: refreshedRow.department,
      location: refreshedRow.location,
      isCritical: refreshedRow.isCritical,
      status: refreshedRow.status,
      createdAt: refreshedRow.createdAt.toISOString(),
      updatedAt: refreshedRow.updatedAt.toISOString(),
      incumbent: refreshedRow.incumbentEmployee
        ? {
            id: refreshedRow.incumbentEmployee.id,
            name: formatPersonName(
              refreshedRow.incumbentEmployee.firstName,
              refreshedRow.incumbentEmployee.lastName,
            ),
            title: refreshedRow.incumbentEmployee.title,
            department: refreshedRow.incumbentEmployee.department,
            avatarUrl: refreshedRow.incumbentEmployee.avatarUrl,
          }
        : null,
    },
    plan: {
      id: refreshedRow.plan.id,
      visibilityScope: refreshedRow.plan.visibilityScope,
      reviewCadence: refreshedRow.plan.reviewCadence,
      notes: refreshedRow.plan.notes,
      owner: mapDetailPerson(refreshedRow.plan.ownerEmployee),
      collaborators: refreshedRow.plan.collaborators.map((item) => mapDetailPerson(item.employee)),
      allowedManagers: refreshedRow.plan.allowedManagers.map((item) =>
        mapDetailPerson(item.managerEmployee),
      ),
    },
    candidates: refreshedRow.plan.candidates.map((candidate) =>
      mapCandidateItem(candidate, scope.canViewSensitiveFields, scope.mode),
    ),
  };
}

export async function createSuccessionPosition(
  input: unknown,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<{ id: string }> {
  const scope = await resolveViewerScope(context, db);
  assertHrAdmin(scope);

  const payload = createPositionSchema.parse(input);
  await ensureEmployeeIdsExist(
    [
      payload.ownerEmployeeId,
      payload.incumbentEmployeeId ?? undefined,
      ...payload.collaboratorEmployeeIds,
      ...payload.allowedManagerEmployeeIds,
    ],
    context.orgId,
    db,
  );

  const collaboratorIds = uniqueIds(payload.collaboratorEmployeeIds);
  const allowedManagerIds = uniqueIds(payload.allowedManagerEmployeeIds);

  const position = await db.position.create({
    data: {
      orgId: context.orgId,
      title: payload.title,
      department: payload.department,
      location: normalizeNullableString(payload.location),
      incumbentEmployeeId: normalizeNullableString(payload.incumbentEmployeeId),
      isCritical: payload.isCritical,
      status: payload.status,
      plan: {
        create: {
          orgId: context.orgId,
          ownerEmployeeId: payload.ownerEmployeeId,
          visibilityScope: payload.visibilityScope,
          reviewCadence: normalizeNullableString(payload.reviewCadence),
          notes: normalizeNullableString(payload.notes),
          collaborators: {
            create: collaboratorIds.map((employeeId) => ({
              orgId: context.orgId,
              employeeId,
            })),
          },
          allowedManagers: {
            create: allowedManagerIds.map((managerEmployeeId) => ({
              orgId: context.orgId,
              managerEmployeeId,
            })),
          },
        },
      },
    },
    select: {
      id: true,
      plan: {
        select: {
          id: true,
        },
      },
    },
  });

  await writeAuditEvent(
    db,
    context,
    "SUCCESSION_POSITION_CREATED",
    "POSITION",
    position.id,
    {
      planId: position.plan?.id ?? null,
      title: payload.title,
      department: payload.department,
      isCritical: payload.isCritical,
      visibilityScope: payload.visibilityScope,
    },
  );

  return { id: position.id };
}

export async function updateSuccessionPosition(
  positionId: string,
  input: unknown,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<{ id: string }> {
  const scope = await resolveViewerScope(context, db);
  assertHrAdmin(scope);

  const payload = updatePositionSchema.parse(input);
  await ensureEmployeeIdsExist(
    [
      payload.ownerEmployeeId,
      payload.incumbentEmployeeId ?? undefined,
      ...payload.collaboratorEmployeeIds,
      ...payload.allowedManagerEmployeeIds,
    ],
    context.orgId,
    db,
  );

  const existing = await db.position.findFirst({
    where: {
      id: positionId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      status: true,
      plan: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError("NOT_FOUND", "Succession position was not found", 404);
  }

  const collaboratorIds = uniqueIds(payload.collaboratorEmployeeIds);
  const allowedManagerIds = uniqueIds(payload.allowedManagerEmployeeIds);

  await db.position.update({
    where: { id: positionId },
    data: {
      title: payload.title,
      department: payload.department,
      location: normalizeNullableString(payload.location),
      incumbentEmployeeId: normalizeNullableString(payload.incumbentEmployeeId),
      isCritical: payload.isCritical,
      status: payload.status,
      plan: {
        upsert: {
          create: {
            orgId: context.orgId,
            ownerEmployeeId: payload.ownerEmployeeId,
            visibilityScope: payload.visibilityScope,
            reviewCadence: normalizeNullableString(payload.reviewCadence),
            notes: normalizeNullableString(payload.notes),
            collaborators: {
              create: collaboratorIds.map((employeeId) => ({
                orgId: context.orgId,
                employeeId,
              })),
            },
            allowedManagers: {
              create: allowedManagerIds.map((managerEmployeeId) => ({
                orgId: context.orgId,
                managerEmployeeId,
              })),
            },
          },
          update: {
            ownerEmployeeId: payload.ownerEmployeeId,
            visibilityScope: payload.visibilityScope,
            reviewCadence: normalizeNullableString(payload.reviewCadence),
            notes: normalizeNullableString(payload.notes),
            collaborators: {
              deleteMany: {},
              create: collaboratorIds.map((employeeId) => ({
                orgId: context.orgId,
                employeeId,
              })),
            },
            allowedManagers: {
              deleteMany: {},
              create: allowedManagerIds.map((managerEmployeeId) => ({
                orgId: context.orgId,
                managerEmployeeId,
              })),
            },
          },
        },
      },
    },
  });

  await writeAuditEvent(
    db,
    context,
    payload.status === PositionStatus.ARCHIVED && existing.status !== PositionStatus.ARCHIVED
      ? "SUCCESSION_POSITION_ARCHIVED"
      : "SUCCESSION_POSITION_UPDATED",
    "POSITION",
    positionId,
    {
      hadPlan: Boolean(existing.plan?.id),
      ownerEmployeeId: payload.ownerEmployeeId,
      visibilityScope: payload.visibilityScope,
      collaboratorCount: collaboratorIds.length,
      allowedManagerCount: allowedManagerIds.length,
    },
  );

  return { id: positionId };
}

export async function createSuccessionCandidate(
  positionId: string,
  input: unknown,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<{ id: string }> {
  const scope = await resolveViewerScope(context, db);
  const payload = createCandidateSchema.parse(input);
  const position = await requireVisiblePosition(positionId, scope, context.orgId, db);

  if (!position.plan) {
    throw new AppError("FAILED_PRECONDITION", "Position does not have a succession plan", 400);
  }

  if (scope.mode === "MANAGER") {
    const viewerEmployeeId = scope.viewerEmployee?.id;
    if (!viewerEmployeeId) {
      throw new AppError("FORBIDDEN", "Manager profile is not configured", 403);
    }

    if (!scope.directReportIds.has(payload.candidateEmployeeId)) {
      throw new AppError(
        "FORBIDDEN",
        "Managers can only propose direct reports in the MVP succession workflow",
        403,
      );
    }

    if (payload.riskOfLoss != null || payload.confidence != null) {
      throw new AppError("FORBIDDEN", "Managers cannot set risk or confidence", 403);
    }
  }

  await ensureEmployeeIdsExist([payload.candidateEmployeeId], context.orgId, db);

  const nextSortOrder =
    payload.sortOrder ??
    position.plan.candidates.reduce((max, candidate) => Math.max(max, candidate.sortOrder), 0) + 1;

  const candidate = await db.successionCandidate.create({
    data: {
      orgId: context.orgId,
      planId: position.plan.id,
      candidateEmployeeId: payload.candidateEmployeeId,
      readiness: payload.readiness,
      riskOfLoss: scope.mode === "HR_ADMIN" ? payload.riskOfLoss ?? null : null,
      confidence: scope.mode === "HR_ADMIN" ? payload.confidence ?? null : null,
      proposedByRole: context.role,
      proposedByEmployeeId: scope.viewerEmployee?.id ?? position.plan.ownerEmployee.id,
      sortOrder: nextSortOrder,
    },
    select: {
      id: true,
      candidateEmployeeId: true,
    },
  });

  await refreshCandidateSnapshot(candidate.id, context.orgId, db);

  await writeAuditEvent(
    db,
    context,
    "SUCCESSION_CANDIDATE_ADDED",
    "SUCCESSION_CANDIDATE",
    candidate.id,
    {
      positionId,
      candidateEmployeeId: candidate.candidateEmployeeId,
      readiness: payload.readiness,
      proposedByRole: context.role,
    },
  );

  return { id: candidate.id };
}

export async function updateSuccessionCandidate(
  candidateId: string,
  input: unknown,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<{ id: string }> {
  const scope = await resolveViewerScope(context, db);
  assertHrAdmin(scope);
  const payload = updateCandidateSchema.parse(input);

  const candidate = await db.successionCandidate.findFirst({
    where: {
      id: candidateId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      plan: {
        select: {
          positionId: true,
        },
      },
      readiness: true,
      riskOfLoss: true,
      confidence: true,
      sortOrder: true,
    },
  });

  if (!candidate) {
    throw new AppError("NOT_FOUND", "Succession candidate was not found", 404);
  }

  await db.successionCandidate.update({
    where: { id: candidateId },
    data: {
      ...(payload.readiness != null ? { readiness: payload.readiness } : {}),
      ...(payload.riskOfLoss !== undefined ? { riskOfLoss: payload.riskOfLoss } : {}),
      ...(payload.confidence !== undefined ? { confidence: payload.confidence } : {}),
      ...(payload.sortOrder != null ? { sortOrder: payload.sortOrder } : {}),
    },
  });

  await refreshCandidateSnapshot(candidateId, context.orgId, db);

  const changedSensitiveFields =
    payload.riskOfLoss !== undefined || payload.confidence !== undefined;

  await writeAuditEvent(
    db,
    context,
    changedSensitiveFields
      ? "SUCCESSION_CANDIDATE_SENSITIVE_FIELDS_UPDATED"
      : "SUCCESSION_CANDIDATE_UPDATED",
    "SUCCESSION_CANDIDATE",
    candidateId,
    {
      positionId: candidate.plan.positionId,
      readiness: payload.readiness ?? candidate.readiness,
      riskOfLoss: payload.riskOfLoss ?? candidate.riskOfLoss,
      confidence: payload.confidence ?? candidate.confidence,
      sortOrder: payload.sortOrder ?? candidate.sortOrder,
    },
  );

  return { id: candidateId };
}

export async function removeSuccessionCandidate(
  candidateId: string,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<void> {
  const scope = await resolveViewerScope(context, db);
  assertHrAdmin(scope);

  const candidate = await db.successionCandidate.findFirst({
    where: {
      id: candidateId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      candidateEmployeeId: true,
      plan: {
        select: {
          positionId: true,
        },
      },
    },
  });

  if (!candidate) {
    throw new AppError("NOT_FOUND", "Succession candidate was not found", 404);
  }

  await db.successionCandidate.delete({
    where: {
      id: candidateId,
    },
  });

  await writeAuditEvent(
    db,
    context,
    "SUCCESSION_CANDIDATE_REMOVED",
    "SUCCESSION_CANDIDATE",
    candidateId,
    {
      positionId: candidate.plan.positionId,
      candidateEmployeeId: candidate.candidateEmployeeId,
    },
  );
}

export async function createSuccessionNote(
  candidateId: string,
  input: unknown,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<{ id: string }> {
  const scope = await resolveViewerScope(context, db);
  const payload = createNoteSchema.parse(input);

  const candidate = await db.successionCandidate.findFirst({
    where: {
      id: candidateId,
      orgId: context.orgId,
      plan: {
        position: buildPositionWhere(
          {
            includeArchived: true,
            criticalOnly: false,
            smallNThreshold: DEFAULT_SMALL_N_THRESHOLD,
          },
          scope,
          context.orgId,
        ),
      },
    },
    select: {
      id: true,
      plan: {
        select: {
          positionId: true,
        },
      },
    },
  });

  if (!candidate) {
    throw new AppError("NOT_FOUND", "Succession candidate was not found", 404);
  }

  const authorEmployeeId = scope.viewerEmployee?.id;
  if (!authorEmployeeId) {
    throw new AppError("FORBIDDEN", "Viewer is missing an employee profile", 403);
  }

  const visibility =
    scope.mode === "HR_ADMIN"
      ? payload.visibility ?? SuccessionNoteVisibility.PLAN_VIEWERS
      : SuccessionNoteVisibility.PLAN_VIEWERS;

  const note = await db.successionNote.create({
    data: {
      orgId: context.orgId,
      candidateId,
      authorEmployeeId,
      authorRole: context.role,
      visibility,
      body: payload.body,
    },
    select: {
      id: true,
    },
  });

  await writeAuditEvent(
    db,
    context,
    "SUCCESSION_NOTE_CREATED",
    "SUCCESSION_NOTE",
    note.id,
    {
      candidateId,
      positionId: candidate.plan.positionId,
      visibility,
    },
  );

  return note;
}

export async function listSuccessionExportRows(
  filters: SuccessionFilters,
  context: RequestContext,
  db: typeof prisma = prisma,
): Promise<SuccessionExportRow[]> {
  const scope = await resolveViewerScope(context, db);
  assertHrAdmin(scope);

  const rows = await db.position.findMany({
    where: buildPositionWhere(filters, scope, context.orgId),
    orderBy: [{ department: "asc" }, { title: "asc" }],
    select: positionDetailSelect,
  });

  const exportRows: SuccessionExportRow[] = [];

  for (const row of rows) {
    if (!row.plan || row.plan.candidates.length === 0) {
      exportRows.push({
        positionTitle: row.title,
        department: row.department,
        location: row.location,
        isCritical: row.isCritical,
        positionStatus: row.status,
        incumbentName: row.incumbentEmployee
          ? formatPersonName(row.incumbentEmployee.firstName, row.incumbentEmployee.lastName)
          : null,
        planOwnerName: row.plan
          ? formatPersonName(row.plan.ownerEmployee.firstName, row.plan.ownerEmployee.lastName)
          : null,
        visibilityScope: row.plan?.visibilityScope ?? null,
        candidateName: null,
        candidateTitle: null,
        readiness: null,
        riskOfLoss: null,
        confidence: null,
        proposedByRole: null,
        proposedByName: null,
        scorecardOverallRating: null,
        scorecardPercent: null,
        finalRatingSource: null,
        calibrationPerformanceBucket: null,
        calibrationPotentialBucket: null,
      });
      continue;
    }

    for (const candidate of row.plan.candidates) {
      const signal = resolveCandidateSignal(candidate.snapshots[0] ?? null);
      exportRows.push({
        positionTitle: row.title,
        department: row.department,
        location: row.location,
        isCritical: row.isCritical,
        positionStatus: row.status,
        incumbentName: row.incumbentEmployee
          ? formatPersonName(row.incumbentEmployee.firstName, row.incumbentEmployee.lastName)
          : null,
        planOwnerName: formatPersonName(
          row.plan.ownerEmployee.firstName,
          row.plan.ownerEmployee.lastName,
        ),
        visibilityScope: row.plan.visibilityScope,
        candidateName: formatPersonName(
          candidate.candidateEmployee.firstName,
          candidate.candidateEmployee.lastName,
        ),
        candidateTitle: candidate.candidateEmployee.title,
        readiness: candidate.readiness,
        riskOfLoss: candidate.riskOfLoss,
        confidence: candidate.confidence,
        proposedByRole: candidate.proposedByRole,
        proposedByName: formatPersonName(
          candidate.proposedByEmployee.firstName,
          candidate.proposedByEmployee.lastName,
        ),
        scorecardOverallRating: signal.scorecardOverallRating,
        scorecardPercent: signal.scorecardPercent,
        finalRatingSource: signal.finalRatingSource,
        calibrationPerformanceBucket: signal.calibrationPerformanceBucket,
        calibrationPotentialBucket: signal.calibrationPotentialBucket,
      });
    }
  }

  return exportRows;
}

async function resolveViewerScope(
  context: RequestContext,
  db: typeof prisma,
): Promise<SuccessionViewerScope> {
  if (context.role === UserRole.HR_ADMIN) {
    const viewerEmployee = await db.employee.findFirst({
      where: {
        orgId: context.orgId,
        userId: context.userId,
      },
      select: viewerEmployeeSelect,
    });

    return {
      mode: "HR_ADMIN",
      canViewSensitiveFields: true,
      viewerEmployee,
      directReportIds: new Set(viewerEmployee?.directReports.map((employee) => employee.id) ?? []),
      department: viewerEmployee?.department ?? null,
    };
  }

  if (context.role !== UserRole.MANAGER) {
    throw new AppError(
      "FORBIDDEN",
      "Succession planning is restricted to HR admins and managers in this MVP",
      403,
    );
  }

  const viewerEmployee = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: viewerEmployeeSelect,
  });

  if (!viewerEmployee) {
    throw new AppError("FORBIDDEN", "Manager profile is not configured for succession access", 403);
  }

  return {
    mode: "MANAGER",
    canViewSensitiveFields: appEnv.allowManagerRiskView,
    viewerEmployee,
    directReportIds: new Set(viewerEmployee.directReports.map((employee) => employee.id)),
    department: viewerEmployee.department ?? null,
  };
}

function assertHrAdmin(scope: SuccessionViewerScope): void {
  if (scope.mode !== "HR_ADMIN") {
    throw new AppError("FORBIDDEN", "Only HR admins can perform this action", 403);
  }
}

function buildPositionWhere(
  filters: SuccessionFilters,
  scope: SuccessionViewerScope,
  orgId: string,
): Prisma.PositionWhereInput {
  const search = normalizeNullableString(filters.search);
  const department = normalizeNullableString(filters.department);

  const where: Prisma.PositionWhereInput = {
    orgId,
    ...(filters.includeArchived ? {} : { status: PositionStatus.ACTIVE }),
    ...(filters.criticalOnly ? { isCritical: true } : {}),
    ...(department ? { department } : {}),
  };

  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        department: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        location: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ];
  }

  if (scope.mode === "HR_ADMIN") {
    return where;
  }

  const managerEmployeeId = scope.viewerEmployee?.id;
  if (!managerEmployeeId) {
    return {
      ...where,
      id: "__never__",
    };
  }

  const managerScopeOr: Prisma.PositionWhereInput[] = [
    {
      plan: {
        is: {
          visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
          ownerEmployeeId: managerEmployeeId,
        },
      },
    },
    {
      plan: {
        is: {
          visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
          collaborators: {
            some: {
              employeeId: managerEmployeeId,
            },
          },
        },
      },
    },
    {
      plan: {
        is: {
          visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
          allowedManagers: {
            some: {
              managerEmployeeId,
            },
          },
        },
      },
    },
    {
      plan: {
        is: {
          visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
        },
      },
      incumbentEmployee: {
        managerId: managerEmployeeId,
      },
    },
  ];

  if (scope.department) {
    managerScopeOr.push({
      plan: {
        is: {
          visibilityScope: SuccessionVisibilityScope.MANAGERS_IN_SCOPE,
        },
      },
      department: scope.department,
    });
  }

  return {
    ...where,
    plan: {
      isNot: null,
    },
    AND: [
      ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
      { OR: managerScopeOr },
    ],
  };
}

async function requireVisiblePosition(
  positionId: string,
  scope: SuccessionViewerScope,
  orgId: string,
  db: typeof prisma,
): Promise<PositionDetailRecord> {
  const row = await db.position.findFirst({
    where: {
      id: positionId,
      ...buildPositionWhere(
        {
          includeArchived: true,
          criticalOnly: false,
          smallNThreshold: DEFAULT_SMALL_N_THRESHOLD,
        },
        scope,
        orgId,
      ),
    },
    select: positionDetailSelect,
  });

  if (!row) {
    throw new AppError("NOT_FOUND", "Succession position was not found", 404);
  }

  return row;
}

async function ensureEmployeeIdsExist(
  employeeIds: Array<string | undefined>,
  orgId: string,
  db: typeof prisma,
): Promise<void> {
  const ids = uniqueIds(employeeIds);
  if (ids.length === 0) {
    return;
  }

  const foundEmployees = await db.employee.findMany({
    where: {
      orgId,
      id: {
        in: ids,
      },
    },
    select: {
      id: true,
    },
  });

  if (foundEmployees.length !== ids.length) {
    throw new AppError("VALIDATION_ERROR", "One or more employee ids are invalid", 400);
  }
}

async function refreshCandidateSnapshot(
  candidateId: string,
  orgId: string,
  db: typeof prisma,
): Promise<void> {
  const candidate = await db.successionCandidate.findFirst({
    where: {
      id: candidateId,
      orgId,
    },
    select: {
      id: true,
      candidateEmployeeId: true,
    },
  });

  if (!candidate) {
    return;
  }

  const latestPacket = await db.reviewPacket.findFirst({
    where: {
      orgId,
      subjectEmployeeId: candidate.candidateEmployeeId,
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
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

  const latestCalibration = await db.calibrationPlacement.findFirst({
    where: {
      orgId,
      employeeId: candidate.candidateEmployeeId,
    },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      performanceBucket: true,
      potentialBucket: true,
    },
  });

  if (!latestPacket) {
    return;
  }

  await db.successionCandidateSnapshot.upsert({
    where: {
      candidateId_cycleId: {
        candidateId,
        cycleId: latestPacket.cycleId,
      },
    },
    update: {
      scorecardOverallRating: latestPacket.scorecardOverallRating,
      scorecardPercent: latestPacket.totalScorecardPercent,
      finalRatingSource: latestPacket.finalRatingSource,
      calibrationPerformanceBucket: latestCalibration?.performanceBucket ?? null,
      calibrationPotentialBucket: latestCalibration?.potentialBucket ?? null,
      snapshotDepartment: latestPacket.snapshotDepartment,
      snapshotTitle: latestPacket.snapshotTitle,
      snapshotManagerEmployeeId: latestPacket.snapshotManagerEmployeeId,
      snapshotManagerName: latestPacket.snapshotManagerName,
    },
    create: {
      orgId,
      candidateId,
      cycleId: latestPacket.cycleId,
      scorecardOverallRating: latestPacket.scorecardOverallRating,
      scorecardPercent: latestPacket.totalScorecardPercent,
      finalRatingSource: latestPacket.finalRatingSource,
      calibrationPerformanceBucket: latestCalibration?.performanceBucket ?? null,
      calibrationPotentialBucket: latestCalibration?.potentialBucket ?? null,
      snapshotDepartment: latestPacket.snapshotDepartment,
      snapshotTitle: latestPacket.snapshotTitle,
      snapshotManagerEmployeeId: latestPacket.snapshotManagerEmployeeId,
      snapshotManagerName: latestPacket.snapshotManagerName,
    },
  });
}

async function writeAuditEvent(
  db: typeof prisma,
  context: RequestContext,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action,
      entityType,
      entityId,
      metadata: metadata as Prisma.InputJsonObject | undefined,
    },
  });
}

function mapEmployeeOption(employee: EmployeeOptionRecord): SuccessionEmployeeOption {
  return {
    id: employee.id,
    name: formatPersonName(employee.firstName, employee.lastName),
    title: employee.title,
    department: employee.department,
    avatarUrl: employee.avatarUrl,
    role: employee.user.role,
  };
}

function mapPositionOverview(row: PositionOverviewRecord): SuccessionPositionListItem {
  const readyNowCount =
    row.plan?.candidates.filter((candidate) => candidate.readiness === SuccessionReadiness.READY_NOW)
      .length ?? 0;
  const managerProposalCount =
    row.plan?.candidates.filter((candidate) => candidate.proposedByRole === UserRole.MANAGER)
      .length ?? 0;

  return {
    id: row.id,
    title: row.title,
    department: row.department,
    location: row.location,
    isCritical: row.isCritical,
    status: row.status,
    incumbent: row.incumbentEmployee
      ? {
          id: row.incumbentEmployee.id,
          name: formatPersonName(row.incumbentEmployee.firstName, row.incumbentEmployee.lastName),
          title: row.incumbentEmployee.title,
          avatarUrl: row.incumbentEmployee.avatarUrl,
        }
      : null,
    plan: row.plan
      ? {
          id: row.plan.id,
          ownerName: formatPersonName(
            row.plan.ownerEmployee.firstName,
            row.plan.ownerEmployee.lastName,
          ),
          visibilityScope: row.plan.visibilityScope,
          reviewCadence: row.plan.reviewCadence,
          candidateCount: row.plan.candidates.length,
          readyNowCount,
          managerProposalCount,
        }
      : null,
    coverageState: !row.plan
      ? "NO_PLAN"
      : readyNowCount > 0
        ? "READY_NOW"
        : "NO_READY_NOW",
  };
}

function mapCandidateItem(
  candidate: PositionCandidateRecord,
  canViewSensitiveFields: boolean,
  viewerMode: "HR_ADMIN" | "MANAGER",
): SuccessionCandidateItem {
  return {
    id: candidate.id,
    candidateEmployeeId: candidate.candidateEmployee.id,
    candidateName: formatPersonName(
      candidate.candidateEmployee.firstName,
      candidate.candidateEmployee.lastName,
    ),
    candidateTitle: candidate.candidateEmployee.title,
    candidateDepartment: candidate.candidateEmployee.department,
    candidateAvatarUrl: candidate.candidateEmployee.avatarUrl,
    candidateManagerId: candidate.candidateEmployee.managerId,
    readiness: candidate.readiness,
    riskOfLoss: canViewSensitiveFields ? candidate.riskOfLoss : null,
    confidence: canViewSensitiveFields ? candidate.confidence : null,
    proposedByRole: candidate.proposedByRole,
    proposedByName: formatPersonName(
      candidate.proposedByEmployee.firstName,
      candidate.proposedByEmployee.lastName,
    ),
    sortOrder: candidate.sortOrder,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
    signal: resolveCandidateSignal(candidate.snapshots[0] ?? null),
    notes: candidate.notes
      .filter((note) => viewerMode === "HR_ADMIN" || note.visibility === SuccessionNoteVisibility.PLAN_VIEWERS)
      .map((note) => ({
        id: note.id,
        visibility: note.visibility,
        body: note.body,
        authorRole: note.authorRole,
        createdAt: note.createdAt.toISOString(),
        author: {
          id: note.authorEmployee.id,
          name: formatPersonName(note.authorEmployee.firstName, note.authorEmployee.lastName),
          title: note.authorEmployee.title,
          avatarUrl: note.authorEmployee.avatarUrl,
        },
      })),
  };
}

function resolveCandidateSignal(
  snapshot: PositionCandidateSnapshotRecord | null,
): SuccessionCandidateSignal {
  return {
    scorecardOverallRating: snapshot?.scorecardOverallRating ?? null,
    scorecardPercent: snapshot?.scorecardPercent ?? null,
    finalRatingSource: snapshot?.finalRatingSource ?? null,
    calibrationPerformanceBucket: snapshot?.calibrationPerformanceBucket ?? null,
    calibrationPotentialBucket: snapshot?.calibrationPotentialBucket ?? null,
    snapshotDepartment: snapshot?.snapshotDepartment ?? null,
    snapshotTitle: snapshot?.snapshotTitle ?? null,
    snapshotManagerName: snapshot?.snapshotManagerName ?? null,
    updatedAt: snapshot?.createdAt.toISOString() ?? null,
  };
}

function buildCoverageByDepartment(
  positions: SuccessionPositionListItem[],
  smallNThreshold: number,
): SuccessionCoverageReportRow[] {
  const rowsByDepartment = new Map<
    string,
    { positionCount: number; readyNowCoveredCount: number; criticalGapCount: number }
  >();

  for (const position of positions.filter((item) => item.status === PositionStatus.ACTIVE)) {
    const bucket = rowsByDepartment.get(position.department) ?? {
      positionCount: 0,
      readyNowCoveredCount: 0,
      criticalGapCount: 0,
    };

    bucket.positionCount += 1;
    if (position.coverageState === "READY_NOW") {
      bucket.readyNowCoveredCount += 1;
    }
    if (position.isCritical && position.coverageState !== "READY_NOW") {
      bucket.criticalGapCount += 1;
    }

    rowsByDepartment.set(position.department, bucket);
  }

  return [...rowsByDepartment.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([department, bucket]) => {
      const suppressed = bucket.positionCount < smallNThreshold;
      return {
        department,
        positionCount: suppressed ? null : bucket.positionCount,
        readyNowCoveredCount: suppressed ? null : bucket.readyNowCoveredCount,
        criticalGapCount: suppressed ? null : bucket.criticalGapCount,
        suppressed,
      };
    });
}

function mapDetailPerson(person: {
  id: string;
  firstName: string;
  lastName: string;
  title: string | null;
  department: string | null;
  avatarUrl: string | null;
}) {
  return {
    id: person.id,
    name: formatPersonName(person.firstName, person.lastName),
    title: person.title,
    department: person.department,
    avatarUrl: person.avatarUrl,
  };
}

function formatPersonName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

function uniqueIds(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.map((value) => normalizeNullableString(value)).filter(Boolean) as string[])];
}

function uniqueNonNull(values: Array<string | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function normalizeNullableString(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
