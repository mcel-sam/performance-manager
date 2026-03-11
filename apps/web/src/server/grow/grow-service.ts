import {
  CompetencyAlignmentLabel,
  Prisma,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

type GrowDb = typeof prisma;

const trackGroupInputSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

const trackLevelExpectationInputSchema = z.object({
  competencyId: z.string().trim().min(1),
  expectation: z.string().trim().min(1).max(4000),
});

const trackLevelInputSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  levelOrder: z.coerce.number().int().min(0).max(999),
  expectations: z.array(trackLevelExpectationInputSchema).max(40).default([]),
});

const createTrackSchema = z
  .object({
    trackGroupId: z.string().trim().min(1).optional(),
    trackGroup: trackGroupInputSchema.optional(),
    slug: z.string().trim().min(1).max(120),
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(2000).nullable().optional(),
    isPublished: z.coerce.boolean().default(false),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    levels: z.array(trackLevelInputSchema).max(10).default([]),
  })
  .superRefine((payload, ctx) => {
    if (!payload.trackGroupId && !payload.trackGroup) {
      ctx.addIssue({
        code: "custom",
        message: "trackGroupId or trackGroup is required",
        path: ["trackGroupId"],
      });
    }
  });

const updateTrackSchema = z
  .object({
    trackGroupId: z.string().trim().min(1).optional(),
    trackGroup: trackGroupInputSchema.optional(),
    slug: z.string().trim().min(1).max(120).optional(),
    name: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    isPublished: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).max(999).optional(),
    levels: z.array(trackLevelInputSchema).max(10).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

const trackAssignmentCreateSchema = z.object({
  employeeId: z.string().trim().min(1),
  trackId: z.string().trim().min(1),
  trackLevelId: z.string().trim().min(1),
});

const trackAssignmentUpdateSchema = z.object({
  employeeId: z.string().trim().min(1),
  trackId: z.string().trim().min(1).optional(),
  trackLevelId: z.string().trim().min(1).optional(),
});

const competencyCommentCreateSchema = z.object({
  employeeTrackAssignmentId: z.string().trim().min(1),
  label: z.nativeEnum(CompetencyAlignmentLabel).default(CompetencyAlignmentLabel.NONE),
  note: z.string().trim().min(1).max(4000),
});

export async function listPublishedTracks(
  context: RequestContext,
  db: GrowDb = prisma,
) {
  const tracks = await db.track.findMany({
    where: {
      orgId: context.orgId,
      isPublished: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      isPublished: true,
      sortOrder: true,
      trackGroup: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      levels: {
        orderBy: [{ levelOrder: "asc" }],
        select: {
          id: true,
          slug: true,
          name: true,
          levelOrder: true,
        },
      },
    },
  });

  return tracks.map((track) => ({
    id: track.id,
    slug: track.slug,
    name: track.name,
    description: track.description,
    isPublished: track.isPublished,
    sortOrder: track.sortOrder,
    trackGroup: track.trackGroup,
    levels: track.levels,
  }));
}

export async function getTrack(
  trackId: string,
  context: RequestContext,
  db: GrowDb = prisma,
) {
  const viewer = await getViewerEmployee(context, db);
  const track = await db.track.findFirst({
    where: {
      id: trackId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      isPublished: true,
      sortOrder: true,
      trackGroup: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
        },
      },
      levels: {
        orderBy: [{ levelOrder: "asc" }],
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          levelOrder: true,
          expectations: {
            select: {
              id: true,
              expectation: true,
              competency: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  dimensionKey: true,
                  theme: {
                    select: {
                      id: true,
                      slug: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      assignments: {
        where: viewer
          ? {
              employeeId: viewer.id,
            }
          : undefined,
        select: {
          id: true,
          employeeId: true,
          trackLevelId: true,
        },
      },
    },
  });

  if (!track) {
    throw new AppError("NOT_FOUND", "Track not found", 404);
  }

  if (!track.isPublished && context.role !== UserRole.HR_ADMIN && track.assignments.length === 0) {
    throw new AppError("FORBIDDEN", "Track is not visible to this user", 403);
  }

  return {
    id: track.id,
    slug: track.slug,
    name: track.name,
    description: track.description,
    isPublished: track.isPublished,
    sortOrder: track.sortOrder,
    trackGroup: track.trackGroup,
    levels: track.levels.map((level) => ({
      id: level.id,
      slug: level.slug,
      name: level.name,
      description: level.description,
      levelOrder: level.levelOrder,
      expectations: level.expectations.map((expectation) => ({
        id: expectation.id,
        expectation: expectation.expectation,
        competency: {
          id: expectation.competency.id,
          slug: expectation.competency.slug,
          name: expectation.competency.name,
          dimensionKey: expectation.competency.dimensionKey,
          theme: expectation.competency.theme,
        },
      })),
    })),
    viewerAssignment: track.assignments[0] ?? null,
  };
}

export async function createTrack(
  payload: unknown,
  context: RequestContext,
  db: GrowDb = prisma,
) {
  requireHrAdmin(context);
  const parsed = createTrackSchema.parse(payload);
  await assertCompetenciesExist(parsed.levels.flatMap((level) => level.expectations), context, db);

  let trackGroupId = parsed.trackGroupId ?? null;
  if (!trackGroupId && parsed.trackGroup) {
    const trackGroup = await db.trackGroup.create({
      data: {
        orgId: context.orgId,
        slug: parsed.trackGroup.slug,
        name: parsed.trackGroup.name,
        description: normalizeNullableString(parsed.trackGroup.description),
        sortOrder: parsed.trackGroup.sortOrder,
      },
      select: {
        id: true,
      },
    });
    trackGroupId = trackGroup.id;
  }

  if (!trackGroupId) {
    throw new AppError("VALIDATION_ERROR", "Track group is required", 400);
  }

  const created = await db.track.create({
    data: {
      orgId: context.orgId,
      trackGroupId,
      slug: parsed.slug,
      name: parsed.name,
      description: normalizeNullableString(parsed.description),
      isPublished: parsed.isPublished,
      sortOrder: parsed.sortOrder,
      levels: parsed.levels.length
        ? {
            create: parsed.levels.map((level) => ({
              orgId: context.orgId,
              slug: level.slug,
              name: level.name,
              description: normalizeNullableString(level.description),
              levelOrder: level.levelOrder,
              expectations: level.expectations.length
                ? {
                    create: level.expectations.map((expectation) => ({
                      orgId: context.orgId,
                      competencyId: expectation.competencyId,
                      expectation: expectation.expectation,
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    },
    select: {
      id: true,
      name: true,
    },
  });

  await writeAuditEvent(db, context, "TRACK_CREATED", "Track", created.id, {
    trackGroupId,
    levelCount: parsed.levels.length,
  });

  return getTrack(created.id, context, db);
}

export async function updateTrack(
  trackId: string,
  payload: unknown,
  context: RequestContext,
  db: GrowDb = prisma,
) {
  requireHrAdmin(context);
  const parsed = updateTrackSchema.parse(payload);
  const existingTrack = await db.track.findFirst({
    where: {
      id: trackId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      trackGroupId: true,
      _count: {
        select: {
          assignments: true,
        },
      },
    },
  });

  if (!existingTrack) {
    throw new AppError("NOT_FOUND", "Track not found", 404);
  }

  await assertCompetenciesExist(parsed.levels?.flatMap((level) => level.expectations) ?? [], context, db);

  let trackGroupId = parsed.trackGroupId ?? existingTrack.trackGroupId;
  if (!parsed.trackGroupId && parsed.trackGroup) {
    const trackGroup = await db.trackGroup.create({
      data: {
        orgId: context.orgId,
        slug: parsed.trackGroup.slug,
        name: parsed.trackGroup.name,
        description: normalizeNullableString(parsed.trackGroup.description),
        sortOrder: parsed.trackGroup.sortOrder,
      },
      select: {
        id: true,
      },
    });
    trackGroupId = trackGroup.id;
  }

  await db.track.update({
    where: { id: trackId },
    data: {
      trackGroupId,
      ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.description !== undefined
        ? { description: normalizeNullableString(parsed.description) }
        : {}),
      ...(parsed.isPublished !== undefined ? { isPublished: parsed.isPublished } : {}),
      ...(parsed.sortOrder !== undefined ? { sortOrder: parsed.sortOrder } : {}),
    },
  });

  if (parsed.levels) {
    if (existingTrack._count.assignments > 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Tracks with assignments cannot replace levels in this phase",
        400,
      );
    }

    await db.trackLevel.deleteMany({
      where: {
        trackId,
      },
    });

    if (parsed.levels.length > 0) {
      for (const level of parsed.levels) {
        await db.trackLevel.create({
          data: {
            orgId: context.orgId,
            trackId,
            slug: level.slug,
            name: level.name,
            description: normalizeNullableString(level.description),
            levelOrder: level.levelOrder,
            expectations: level.expectations.length
              ? {
                  create: level.expectations.map((expectation) => ({
                    orgId: context.orgId,
                    competencyId: expectation.competencyId,
                    expectation: expectation.expectation,
                  })),
                }
              : undefined,
          },
        });
      }
    }
  }

  await writeAuditEvent(db, context, "TRACK_UPDATED", "Track", trackId, {
    fields: Object.keys(parsed),
  });

  return getTrack(trackId, context, db);
}

export async function createEmployeeTrackAssignment(
  payload: unknown,
  context: RequestContext,
  db: GrowDb = prisma,
) {
  requireHrAdmin(context);
  const parsed = trackAssignmentCreateSchema.parse(payload);
  await assertTrackLevelMatchesTrack(parsed.trackId, parsed.trackLevelId, context, db);

  const existing = await db.employeeTrackAssignment.findFirst({
    where: {
      employeeId: parsed.employeeId,
      orgId: context.orgId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    throw new AppError("CONFLICT", "Employee already has a track assignment", 409);
  }

  const assignment = await db.employeeTrackAssignment.create({
    data: {
      orgId: context.orgId,
      employeeId: parsed.employeeId,
      trackId: parsed.trackId,
      trackLevelId: parsed.trackLevelId,
    },
    select: {
      id: true,
      employeeId: true,
      trackId: true,
      trackLevelId: true,
      assignedAt: true,
    },
  });

  await writeAuditEvent(db, context, "EMPLOYEE_TRACK_ASSIGNED", "EmployeeTrackAssignment", assignment.id, {
    employeeId: assignment.employeeId,
    trackId: assignment.trackId,
    trackLevelId: assignment.trackLevelId,
  });

  return {
    id: assignment.id,
    employeeId: assignment.employeeId,
    trackId: assignment.trackId,
    trackLevelId: assignment.trackLevelId,
    assignedAt: assignment.assignedAt.toISOString(),
  };
}

export async function updateEmployeeTrackAssignment(
  payload: unknown,
  context: RequestContext,
  db: GrowDb = prisma,
) {
  requireHrAdmin(context);
  const parsed = trackAssignmentUpdateSchema.parse(payload);
  const assignment = await db.employeeTrackAssignment.findFirst({
    where: {
      employeeId: parsed.employeeId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      trackId: true,
      trackLevelId: true,
    },
  });

  if (!assignment) {
    throw new AppError("NOT_FOUND", "Track assignment not found", 404);
  }

  const nextTrackId = parsed.trackId ?? assignment.trackId;
  const nextTrackLevelId = parsed.trackLevelId ?? assignment.trackLevelId;
  await assertTrackLevelMatchesTrack(nextTrackId, nextTrackLevelId, context, db);

  const updated = await db.employeeTrackAssignment.update({
    where: { id: assignment.id },
    data: {
      trackId: nextTrackId,
      trackLevelId: nextTrackLevelId,
      assignedAt: new Date(),
    },
    select: {
      id: true,
      employeeId: true,
      trackId: true,
      trackLevelId: true,
      assignedAt: true,
    },
  });

  await writeAuditEvent(db, context, "EMPLOYEE_TRACK_REASSIGNED", "EmployeeTrackAssignment", updated.id, {
    employeeId: updated.employeeId,
    trackId: updated.trackId,
    trackLevelId: updated.trackLevelId,
  });

  return {
    id: updated.id,
    employeeId: updated.employeeId,
    trackId: updated.trackId,
    trackLevelId: updated.trackLevelId,
    assignedAt: updated.assignedAt.toISOString(),
  };
}

export async function createCompetencyAlignmentComment(
  competencyId: string,
  payload: unknown,
  context: RequestContext,
  db: GrowDb = prisma,
) {
  const parsed = competencyCommentCreateSchema.parse(payload);
  const viewer = await getViewerEmployee(context, db);
  const assignment = await db.employeeTrackAssignment.findFirst({
    where: {
      id: parsed.employeeTrackAssignmentId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      employee: {
        select: {
          id: true,
          managerId: true,
        },
      },
    },
  });

  if (!assignment) {
    throw new AppError("NOT_FOUND", "Track assignment not found", 404);
  }

  if (
    context.role !== UserRole.HR_ADMIN &&
    assignment.employee.id !== viewer?.id &&
    assignment.employee.managerId !== viewer?.id
  ) {
    throw new AppError("FORBIDDEN", "Insufficient permissions for competency alignment comments", 403);
  }

  const comment = await db.competencyAlignmentComment.create({
    data: {
      orgId: context.orgId,
      employeeTrackAssignmentId: assignment.id,
      competencyId,
      authorEmployeeId: viewer!.id,
      label: parsed.label,
      note: parsed.note,
    },
    select: {
      id: true,
      employeeTrackAssignmentId: true,
      competencyId: true,
      label: true,
      note: true,
      createdAt: true,
    },
  });

  await writeAuditEvent(
    db,
    context,
    "COMPETENCY_ALIGNMENT_COMMENT_CREATED",
    "CompetencyAlignmentComment",
    comment.id,
    {
      employeeTrackAssignmentId: comment.employeeTrackAssignmentId,
      competencyId: comment.competencyId,
      label: comment.label,
    },
  );

  return {
    id: comment.id,
    employeeTrackAssignmentId: comment.employeeTrackAssignmentId,
    competencyId: comment.competencyId,
    label: comment.label,
    note: comment.note,
    createdAt: comment.createdAt.toISOString(),
  };
}

async function getViewerEmployee(context: RequestContext, db: GrowDb) {
  return db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
      managerId: true,
    },
  });
}

function requireHrAdmin(context: RequestContext): void {
  if (context.role !== UserRole.HR_ADMIN) {
    throw new AppError("FORBIDDEN", "Insufficient permissions", 403);
  }
}

async function assertCompetenciesExist(
  expectations: Array<{ competencyId: string }>,
  context: RequestContext,
  db: GrowDb,
) {
  if (expectations.length === 0) {
    return;
  }

  const competencyIds = [...new Set(expectations.map((item) => item.competencyId))];
  const count = await db.competency.count({
    where: {
      orgId: context.orgId,
      id: {
        in: competencyIds,
      },
    },
  });

  if (count !== competencyIds.length) {
    throw new AppError("VALIDATION_ERROR", "One or more competencies are invalid", 400);
  }
}

async function assertTrackLevelMatchesTrack(
  trackId: string,
  trackLevelId: string,
  context: RequestContext,
  db: GrowDb,
) {
  const trackLevel = await db.trackLevel.findFirst({
    where: {
      id: trackLevelId,
      trackId,
      orgId: context.orgId,
    },
    select: {
      id: true,
    },
  });

  if (!trackLevel) {
    throw new AppError("VALIDATION_ERROR", "Track level does not belong to the selected track", 400);
  }
}

async function writeAuditEvent(
  db: GrowDb,
  context: RequestContext,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
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

function normalizeNullableString(value: string | null | undefined): string | null {
  return value == null || value === "" ? null : value;
}
