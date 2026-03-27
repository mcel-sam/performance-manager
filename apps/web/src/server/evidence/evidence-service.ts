import {
  EvidenceType,
  EvidenceVisibility,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

const EVIDENCE_TYPE_ORDER: EvidenceType[] = [
  EvidenceType.FEEDBACK,
  EvidenceType.UPDATE,
  EvidenceType.ONE_ON_ONE,
  EvidenceType.GOAL,
  EvidenceType.GOAL_UPDATE,
  EvidenceType.VALUE_RECOGNITION,
];

const DEFAULT_EVIDENCE_LIMIT = 20;

const listEvidenceSchema = z.object({
  subjectEmployeeId: z.string().trim().min(1),
  types: z.array(z.nativeEnum(EvidenceType)).optional(),
});

const evidenceLinkSchema = z.object({
  answerId: z.string().trim().min(1),
  evidenceItemId: z.string().trim().min(1),
});

interface EvidenceAccessSubject {
  id: string;
  managerId: string | null;
}

interface EvidenceAccessViewer {
  id: string;
}

interface EvidenceRecord {
  id: string;
  subjectEmployeeId: string;
  authorEmployeeId: string | null;
  type: EvidenceType;
  visibility: EvidenceVisibility;
  content: string;
  occurredAt: Date;
}

interface AnswerAccessRecord {
  id: string;
  submissionId: string;
  submission: {
    id: string;
    cycleId: string;
    subjectEmployeeId: string;
    status: ReviewSubmissionStatus;
    reviewerEmployee: {
      id: string;
      userId: string;
    };
  };
}

interface EvidenceServiceDb {
  employee: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<EvidenceAccessSubject | EvidenceAccessViewer | null>;
  };
  evidenceItem: {
    groupBy: (args: {
      by: ["type"];
      where: Record<string, unknown>;
      _count: { _all: true };
    }) => Promise<{ type: EvidenceType; _count: { _all: number } }[]>;
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: { occurredAt: "desc" };
      take: number;
      select: {
        id: true;
        subjectEmployeeId: true;
        authorEmployeeId: true;
        type: true;
        visibility: true;
        content: true;
        occurredAt: true;
      };
    }) => Promise<EvidenceRecord[]>;
    findFirst: (args: {
      where: Record<string, unknown>;
      select: {
        id: true;
        subjectEmployeeId: true;
        authorEmployeeId: true;
        type: true;
        visibility: true;
        content: true;
        occurredAt: true;
      };
    }) => Promise<EvidenceRecord | null>;
  };
  reviewAnswer: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<AnswerAccessRecord | null>;
  };
  answerEvidenceLink: {
    upsert: (args: {
      where: {
        answerId_evidenceItemId: {
          answerId: string;
          evidenceItemId: string;
        };
      };
      create: {
        orgId: string;
        answerId: string;
        evidenceItemId: string;
      };
      update: Record<string, never>;
      select: {
        id: true;
        answerId: true;
        evidenceItemId: true;
      };
    }) => Promise<{ id: string; answerId: string; evidenceItemId: string }>;
    deleteMany: (args: {
      where: {
        orgId: string;
        answerId: string;
        evidenceItemId: string;
      };
    }) => Promise<{ count: number }>;
  };
  auditEvent: {
    create: (args: {
      data: {
        orgId: string;
        actorUserId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata?: Record<string, unknown>;
      };
    }) => Promise<unknown>;
  };
}

interface EvidenceAccessState {
  allowAll: boolean;
  viewerEmployeeId: string | null;
  allowedVisibilities: EvidenceVisibility[];
  subject: EvidenceAccessSubject;
}

export interface EvidenceListItem {
  evidenceItemId: string;
  type: EvidenceType;
  title: string;
  summary: string;
  occurredAt: string;
}

export interface EvidenceListResult {
  subjectEmployeeId: string;
  counts: Record<EvidenceType, number>;
  itemsByType: Record<EvidenceType, EvidenceListItem[]>;
  limitPerType: number;
}

export interface EvidenceAttachResult {
  answerId: string;
  evidence: EvidenceListItem;
}

export interface EvidenceDetachResult {
  answerId: string;
  evidenceItemId: string;
}

export async function listEvidenceForSubject(
  input: unknown,
  context: RequestContext,
  db: EvidenceServiceDb = prisma as unknown as EvidenceServiceDb,
): Promise<EvidenceListResult> {
  const parsed = listEvidenceSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid evidence query", 400, parsed.error.flatten());
  }

  const requestedTypes =
    parsed.data.types && parsed.data.types.length > 0
      ? Array.from(new Set(parsed.data.types))
      : [...EVIDENCE_TYPE_ORDER];

  const access = await resolveEvidenceAccess(parsed.data.subjectEmployeeId, context, db);
  const where = buildEvidenceWhere(context.orgId, parsed.data.subjectEmployeeId, requestedTypes, access);

  const rows = await db.evidenceItem.groupBy({
    by: ["type"],
    where,
    _count: {
      _all: true,
    },
  });

  const counts = buildEvidenceCountMap(rows);
  const itemsByType: Record<EvidenceType, EvidenceListItem[]> = {
    [EvidenceType.FEEDBACK]: [],
    [EvidenceType.UPDATE]: [],
    [EvidenceType.ONE_ON_ONE]: [],
    [EvidenceType.GOAL]: [],
    [EvidenceType.GOAL_UPDATE]: [],
    [EvidenceType.VALUE_RECOGNITION]: [],
  };

  for (const type of requestedTypes) {
    const items = await db.evidenceItem.findMany({
      where: {
        ...where,
        type,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: DEFAULT_EVIDENCE_LIMIT,
      select: {
        id: true,
        subjectEmployeeId: true,
        authorEmployeeId: true,
        type: true,
        visibility: true,
        content: true,
        occurredAt: true,
      },
    });

    itemsByType[type] = items.map((item) => toEvidenceListItem(item));
  }

  return {
    subjectEmployeeId: parsed.data.subjectEmployeeId,
    counts,
    itemsByType,
    limitPerType: DEFAULT_EVIDENCE_LIMIT,
  };
}

export async function attachEvidenceToAnswer(
  input: unknown,
  context: RequestContext,
  db: EvidenceServiceDb = prisma as unknown as EvidenceServiceDb,
): Promise<EvidenceAttachResult> {
  const parsed = evidenceLinkSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid attach evidence payload",
      400,
      parsed.error.flatten(),
    );
  }

  const answer = await getAnswerForAccess(parsed.data.answerId, context, db);
  if (answer.submission.status === ReviewSubmissionStatus.SUBMITTED) {
    throw new AppError("READ_ONLY", "Submitted reviews cannot be edited", 409);
  }

  const access = await resolveEvidenceAccess(answer.submission.subjectEmployeeId, context, db);

  const evidenceItem = await db.evidenceItem.findFirst({
    where: {
      id: parsed.data.evidenceItemId,
      orgId: context.orgId,
      subjectEmployeeId: answer.submission.subjectEmployeeId,
    },
    select: {
      id: true,
      subjectEmployeeId: true,
      authorEmployeeId: true,
      type: true,
      visibility: true,
      content: true,
      occurredAt: true,
    },
  });

  if (!evidenceItem) {
    throw new AppError("NOT_FOUND", "Evidence item not found", 404);
  }

  if (!canViewEvidenceItem(evidenceItem, access)) {
    throw new AppError("FORBIDDEN", "You are not allowed to use this evidence item", 403);
  }

  const link = await db.answerEvidenceLink.upsert({
    where: {
      answerId_evidenceItemId: {
        answerId: parsed.data.answerId,
        evidenceItemId: parsed.data.evidenceItemId,
      },
    },
    create: {
      orgId: context.orgId,
      answerId: parsed.data.answerId,
      evidenceItemId: parsed.data.evidenceItemId,
    },
    update: {},
    select: {
      id: true,
      answerId: true,
      evidenceItemId: true,
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "REVIEW_ANSWER_EVIDENCE_ATTACHED",
      entityType: "AnswerEvidenceLink",
      entityId: link.id,
      metadata: {
        answerId: link.answerId,
        evidenceItemId: link.evidenceItemId,
        submissionId: answer.submission.id,
        cycleId: answer.submission.cycleId,
        evidenceType: evidenceItem.type,
      },
    },
  });

  return {
    answerId: link.answerId,
    evidence: toEvidenceListItem(evidenceItem),
  };
}

export async function detachEvidenceFromAnswer(
  input: unknown,
  context: RequestContext,
  db: EvidenceServiceDb = prisma as unknown as EvidenceServiceDb,
): Promise<EvidenceDetachResult> {
  const parsed = evidenceLinkSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid detach evidence payload",
      400,
      parsed.error.flatten(),
    );
  }

  const answer = await getAnswerForAccess(parsed.data.answerId, context, db);
  if (answer.submission.status === ReviewSubmissionStatus.SUBMITTED) {
    throw new AppError("READ_ONLY", "Submitted reviews cannot be edited", 409);
  }

  const deleted = await db.answerEvidenceLink.deleteMany({
    where: {
      orgId: context.orgId,
      answerId: parsed.data.answerId,
      evidenceItemId: parsed.data.evidenceItemId,
    },
  });

  if (deleted.count === 0) {
    throw new AppError("NOT_FOUND", "Evidence link not found", 404);
  }

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "REVIEW_ANSWER_EVIDENCE_DETACHED",
      entityType: "AnswerEvidenceLink",
      entityId: `${parsed.data.answerId}:${parsed.data.evidenceItemId}`,
      metadata: {
        answerId: parsed.data.answerId,
        evidenceItemId: parsed.data.evidenceItemId,
        submissionId: answer.submission.id,
        cycleId: answer.submission.cycleId,
      },
    },
  });

  return {
    answerId: parsed.data.answerId,
    evidenceItemId: parsed.data.evidenceItemId,
  };
}

async function resolveEvidenceAccess(
  subjectEmployeeId: string,
  context: RequestContext,
  db: EvidenceServiceDb,
): Promise<EvidenceAccessState> {
  const subjectRecord = await db.employee.findFirst({
    where: {
      id: subjectEmployeeId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      managerId: true,
    },
  });

  if (!subjectRecord || !("managerId" in subjectRecord)) {
    throw new AppError("NOT_FOUND", "Subject employee not found", 404);
  }

  const subject: EvidenceAccessSubject = {
    id: subjectRecord.id,
    managerId: subjectRecord.managerId,
  };

  if (hasHrAdminAccess(context.role)) {
    return {
      allowAll: true,
      viewerEmployeeId: null,
      allowedVisibilities: [
        EvidenceVisibility.PRIVATE,
        EvidenceVisibility.MANAGER_ONLY,
        EvidenceVisibility.SHARED_WITH_SUBJECT,
        EvidenceVisibility.ORG_VISIBLE,
      ],
      subject,
    };
  }

  const viewerRecord = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
    },
  });

  if (!viewerRecord) {
    throw new AppError(
      "FORBIDDEN",
      "User is not mapped to an employee profile for evidence access",
      403,
    );
  }

  const viewerEmployeeId = viewerRecord.id;
  const isSubject = viewerEmployeeId === subject.id;
  const isSubjectManager = subject.managerId === viewerEmployeeId;

  const allowedVisibilities: EvidenceVisibility[] = [EvidenceVisibility.ORG_VISIBLE];
  if (isSubject || isSubjectManager) {
    allowedVisibilities.push(EvidenceVisibility.SHARED_WITH_SUBJECT);
  }
  if (isSubjectManager) {
    allowedVisibilities.push(EvidenceVisibility.MANAGER_ONLY);
  }

  return {
    allowAll: false,
    viewerEmployeeId,
    allowedVisibilities,
    subject,
  };
}

function buildEvidenceWhere(
  orgId: string,
  subjectEmployeeId: string,
  types: EvidenceType[],
  access: EvidenceAccessState,
): Record<string, unknown> {
  const where: Record<string, unknown> = {
    orgId,
    subjectEmployeeId,
    type: {
      in: types,
    },
  };

  if (access.allowAll) {
    return where;
  }

  return {
    ...where,
    OR: [
      {
        authorEmployeeId: access.viewerEmployeeId,
      },
      {
        visibility: {
          in: access.allowedVisibilities,
        },
      },
    ],
  };
}

function canViewEvidenceItem(item: EvidenceRecord, access: EvidenceAccessState): boolean {
  if (access.allowAll) {
    return true;
  }

  if (access.viewerEmployeeId && item.authorEmployeeId === access.viewerEmployeeId) {
    return true;
  }

  return access.allowedVisibilities.includes(item.visibility);
}

async function getAnswerForAccess(
  answerId: string,
  context: RequestContext,
  db: EvidenceServiceDb,
): Promise<AnswerAccessRecord> {
  const answer = await db.reviewAnswer.findFirst({
    where: {
      id: answerId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      submissionId: true,
      submission: {
        select: {
          id: true,
          cycleId: true,
          subjectEmployeeId: true,
          status: true,
          reviewerEmployee: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!answer) {
    throw new AppError("NOT_FOUND", "Review answer not found", 404);
  }

  if (!hasHrAdminAccess(context.role) && answer.submission.reviewerEmployee.userId !== context.userId) {
    throw new AppError("FORBIDDEN", "You are not allowed to modify this answer", 403);
  }

  return answer;
}

function buildEvidenceCountMap(
  rows: { type: EvidenceType; _count: { _all: number } }[],
): Record<EvidenceType, number> {
  const counts: Record<EvidenceType, number> = {
    [EvidenceType.FEEDBACK]: 0,
    [EvidenceType.UPDATE]: 0,
    [EvidenceType.ONE_ON_ONE]: 0,
    [EvidenceType.GOAL]: 0,
    [EvidenceType.GOAL_UPDATE]: 0,
    [EvidenceType.VALUE_RECOGNITION]: 0,
  };

  for (const row of rows) {
    counts[row.type] = row._count._all;
  }

  return counts;
}

function toEvidenceListItem(item: EvidenceRecord): EvidenceListItem {
  return {
    evidenceItemId: item.id,
    type: item.type,
    title: buildEvidenceTitle(item.content, item.type),
    summary: buildEvidenceSummary(item.content),
    occurredAt: item.occurredAt.toISOString(),
  };
}

function buildEvidenceTitle(content: string, type: EvidenceType): string {
  const firstLine = content.trim().split(/[.!?]/)[0]?.trim() ?? "";
  if (firstLine.length > 0) {
    return truncate(firstLine, 72);
  }

  return `${type.replaceAll("_", " ")} evidence`;
}

function buildEvidenceSummary(content: string): string {
  return truncate(content.trim(), 160);
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}
