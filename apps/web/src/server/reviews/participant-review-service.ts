import {
  CycleStatus,
  EvidenceType,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

interface TemplateQuestion {
  id: string;
  prompt: string;
  isRequired: boolean;
  sortOrder: number;
}

interface TemplateRecord {
  id: string;
  name: string;
  questions: TemplateQuestion[];
}

interface SubmissionAccessRecord {
  id: string;
  orgId: string;
  cycleId: string;
  status: ReviewSubmissionStatus;
  submittedAt: Date | null;
  relationship: ReviewRelationship;
  subjectEmployeeId: string;
  reviewerEmployee: {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
  };
  subjectEmployee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
    endDate: Date;
    template: TemplateRecord | null;
  };
}

interface ReviewTaskRecord {
  id: string;
  cycleId: string;
  relationship: ReviewRelationship;
  status: ReviewSubmissionStatus;
  updatedAt: Date;
  submittedAt: Date | null;
  cycle: {
    id: string;
    name: string;
    endDate: Date;
    status: CycleStatus;
  };
  subjectEmployee: {
    firstName: string;
    lastName: string;
  };
}

interface ParticipantReviewDb {
  reviewSubmission: {
    findMany: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
      orderBy: { updatedAt: "desc" };
    }) => Promise<ReviewTaskRecord[]>;
    findFirst: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<SubmissionAccessRecord | null>;
    update: (args: {
      where: { id: string };
      data: {
        status?: ReviewSubmissionStatus;
        submittedAt?: Date | null;
      };
      select: {
        id: true;
        status: true;
        submittedAt: true;
      };
    }) => Promise<{ id: string; status: ReviewSubmissionStatus; submittedAt: Date | null }>;
  };
  reviewTemplate: {
    findFirst: (args: {
      where: { orgId: string; isDefault: true };
      select: {
        id: true;
        name: true;
        questions: {
          select: {
            id: true;
            prompt: true;
            isRequired: true;
            sortOrder: true;
          };
          orderBy: {
            sortOrder: "asc";
          };
        };
      };
    }) => Promise<TemplateRecord | null>;
  };
  reviewAnswer: {
    findMany: (args: {
      where: { orgId: string; submissionId: string };
      select: { id: true; questionId: true; responseText: true };
    }) => Promise<{ id: string; questionId: string; responseText: string }[]>;
    upsert: (args: {
      where: {
        submissionId_questionId: {
          submissionId: string;
          questionId: string;
        };
      };
      create: {
        orgId: string;
        submissionId: string;
        questionId: string;
        responseText: string;
      };
      update: {
        responseText: string;
      };
      select: {
        id: true;
        updatedAt: true;
      };
    }) => Promise<{ id: string; updatedAt: Date }>;
  };
  evidenceItem: {
    groupBy: (args: {
      by: ["type"];
      where: { orgId: string; subjectEmployeeId: string };
      _count: { _all: true };
    }) => Promise<{ type: EvidenceType; _count: { _all: number } }[]>;
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

const reviewIdentifierSchema = z.object({
  cycleId: z.string().trim().min(1),
  submissionId: z.string().trim().min(1),
});

const autosaveSchema = z.object({
  cycleId: z.string().trim().min(1),
  submissionId: z.string().trim().min(1),
  questionId: z.string().trim().min(1),
  responseText: z.string().max(8000),
});

export interface ReviewTaskListItem {
  id: string;
  cycleId: string;
  cycleName: string;
  cycleEndDate: string;
  cycleStatus: CycleStatus;
  subjectName: string;
  relationship: ReviewRelationship;
  status: ReviewSubmissionStatus;
  submittedAt: string | null;
}

export interface WriteReviewData {
  submission: {
    id: string;
    cycleId: string;
    cycleName: string;
    cycleStatus: CycleStatus;
    relationship: ReviewRelationship;
    status: ReviewSubmissionStatus;
    submittedAt: string | null;
    reviewerName: string;
    subjectName: string;
    subjectEmployeeId: string;
  };
  template: {
    id: string;
    name: string;
  };
  questions: {
    id: string;
    prompt: string;
    isRequired: boolean;
    responseText: string;
  }[];
  evidenceCounts: Record<EvidenceType, number>;
}

export interface AutosaveResult {
  answerId: string;
  savedAt: string;
  status: ReviewSubmissionStatus;
}

export interface SubmitResult {
  submissionId: string;
  status: ReviewSubmissionStatus;
  submittedAt: string | null;
}

export async function listAssignedReviewTasks(
  context: RequestContext,
  db: ParticipantReviewDb = prisma as unknown as ParticipantReviewDb,
): Promise<ReviewTaskListItem[]> {
  const where: Record<string, unknown> = {
    orgId: context.orgId,
  };

  if (context.role !== UserRole.HR_ADMIN) {
    where.reviewerEmployee = {
      userId: context.userId,
    };
  }

  const submissions = await db.reviewSubmission.findMany({
    where,
    select: {
      id: true,
      cycleId: true,
      relationship: true,
      status: true,
      updatedAt: true,
      submittedAt: true,
      cycle: {
        select: {
          id: true,
          name: true,
          endDate: true,
          status: true,
        },
      },
      subjectEmployee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return submissions.map((submission) => ({
    id: submission.id,
    cycleId: submission.cycleId,
    cycleName: submission.cycle.name,
    cycleEndDate: submission.cycle.endDate.toISOString(),
    cycleStatus: submission.cycle.status,
    subjectName: `${submission.subjectEmployee.firstName} ${submission.subjectEmployee.lastName}`,
    relationship: submission.relationship,
    status: submission.status,
    submittedAt: submission.submittedAt?.toISOString() ?? null,
  }));
}

export async function getWriteReviewData(
  cycleId: string,
  submissionId: string,
  context: RequestContext,
  db: ParticipantReviewDb = prisma as unknown as ParticipantReviewDb,
): Promise<WriteReviewData> {
  reviewIdentifierSchema.parse({ cycleId, submissionId });

  const submission = await getSubmissionForAccess(cycleId, submissionId, context, db);
  const template = await resolveTemplateForSubmission(submission, db);

  const answers = await db.reviewAnswer.findMany({
    where: {
      orgId: context.orgId,
      submissionId: submission.id,
    },
    select: {
      id: true,
      questionId: true,
      responseText: true,
    },
  });

  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer.responseText]));

  const evidenceRows = await db.evidenceItem.groupBy({
    by: ["type"],
    where: {
      orgId: context.orgId,
      subjectEmployeeId: submission.subjectEmployeeId,
    },
    _count: {
      _all: true,
    },
  });

  const evidenceCounts = buildEvidenceCountMap(evidenceRows);

  return {
    submission: {
      id: submission.id,
      cycleId: submission.cycleId,
      cycleName: submission.cycle.name,
      cycleStatus: submission.cycle.status,
      relationship: submission.relationship,
      status: submission.status,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      reviewerName: `${submission.reviewerEmployee.firstName} ${submission.reviewerEmployee.lastName}`,
      subjectName: `${submission.subjectEmployee.firstName} ${submission.subjectEmployee.lastName}`,
      subjectEmployeeId: submission.subjectEmployeeId,
    },
    template: {
      id: template.id,
      name: template.name,
    },
    questions: template.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      isRequired: question.isRequired,
      responseText: answerByQuestionId.get(question.id) ?? "",
    })),
    evidenceCounts,
  };
}

export async function autosaveReviewAnswer(
  input: unknown,
  context: RequestContext,
  db: ParticipantReviewDb = prisma as unknown as ParticipantReviewDb,
): Promise<AutosaveResult> {
  const parsed = autosaveSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid autosave payload",
      400,
      parsed.error.flatten(),
    );
  }

  const submission = await getSubmissionForAccess(parsed.data.cycleId, parsed.data.submissionId, context, db);
  if (submission.status === ReviewSubmissionStatus.SUBMITTED) {
    throw new AppError("READ_ONLY", "Submitted reviews cannot be edited", 409);
  }

  const template = await resolveTemplateForSubmission(submission, db);
  const questionExists = template.questions.some((question) => question.id === parsed.data.questionId);
  if (!questionExists) {
    throw new AppError("INVALID_QUESTION", "Question does not belong to this submission template", 400);
  }

  const answer = await db.reviewAnswer.upsert({
    where: {
      submissionId_questionId: {
        submissionId: submission.id,
        questionId: parsed.data.questionId,
      },
    },
    create: {
      orgId: context.orgId,
      submissionId: submission.id,
      questionId: parsed.data.questionId,
      responseText: parsed.data.responseText,
    },
    update: {
      responseText: parsed.data.responseText,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  let status: ReviewSubmissionStatus = submission.status;
  if (
    submission.status === ReviewSubmissionStatus.NOT_STARTED &&
    parsed.data.responseText.trim().length > 0
  ) {
    const updated = await db.reviewSubmission.update({
      where: { id: submission.id },
      data: {
        status: ReviewSubmissionStatus.IN_PROGRESS,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    status = updated.status;
  }

  return {
    answerId: answer.id,
    savedAt: answer.updatedAt.toISOString(),
    status,
  };
}

export async function submitReviewSubmission(
  cycleId: string,
  submissionId: string,
  context: RequestContext,
  db: ParticipantReviewDb = prisma as unknown as ParticipantReviewDb,
): Promise<SubmitResult> {
  reviewIdentifierSchema.parse({ cycleId, submissionId });

  const submission = await getSubmissionForAccess(cycleId, submissionId, context, db);
  if (submission.status === ReviewSubmissionStatus.SUBMITTED) {
    return {
      submissionId: submission.id,
      status: submission.status,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
    };
  }

  const template = await resolveTemplateForSubmission(submission, db);
  const requiredQuestionIds = template.questions
    .filter((question) => question.isRequired)
    .map((question) => question.id);

  const answers = await db.reviewAnswer.findMany({
    where: {
      orgId: context.orgId,
      submissionId: submission.id,
    },
    select: {
      id: true,
      questionId: true,
      responseText: true,
    },
  });

  const completedQuestionIds = new Set(
    answers.filter((answer) => answer.responseText.trim().length > 0).map((answer) => answer.questionId),
  );

  const missingQuestionIds = requiredQuestionIds.filter(
    (questionId) => !completedQuestionIds.has(questionId),
  );

  if (missingQuestionIds.length > 0) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Required questions are missing",
      400,
      { missingQuestionIds },
    );
  }

  const updatedSubmission = await db.reviewSubmission.update({
    where: {
      id: submission.id,
    },
    data: {
      status: ReviewSubmissionStatus.SUBMITTED,
      submittedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "REVIEW_SUBMISSION_SUBMITTED",
      entityType: "ReviewSubmission",
      entityId: submission.id,
      metadata: {
        cycleId,
        requiredQuestionCount: requiredQuestionIds.length,
      },
    },
  });

  return {
    submissionId: updatedSubmission.id,
    status: updatedSubmission.status,
    submittedAt: updatedSubmission.submittedAt?.toISOString() ?? null,
  };
}

async function getSubmissionForAccess(
  cycleId: string,
  submissionId: string,
  context: RequestContext,
  db: ParticipantReviewDb,
): Promise<SubmissionAccessRecord> {
  const submission = await db.reviewSubmission.findFirst({
    where: {
      id: submissionId,
      cycleId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      orgId: true,
      cycleId: true,
      status: true,
      submittedAt: true,
      relationship: true,
      subjectEmployeeId: true,
      reviewerEmployee: {
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
        },
      },
      subjectEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      cycle: {
        select: {
          id: true,
          name: true,
          status: true,
          endDate: true,
          template: {
            select: {
              id: true,
              name: true,
              questions: {
                select: {
                  id: true,
                  prompt: true,
                  isRequired: true,
                  sortOrder: true,
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new AppError("NOT_FOUND", "Review submission not found", 404);
  }

  if (context.role !== UserRole.HR_ADMIN && submission.reviewerEmployee.userId !== context.userId) {
    throw new AppError(
      "FORBIDDEN",
      "You are not allowed to access this review submission",
      403,
    );
  }

  return submission;
}

async function resolveTemplateForSubmission(
  submission: SubmissionAccessRecord,
  db: ParticipantReviewDb,
): Promise<TemplateRecord> {
  if (submission.cycle.template) {
    return submission.cycle.template;
  }

  const defaultTemplate = await db.reviewTemplate.findFirst({
    where: {
      orgId: submission.orgId,
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
      questions: {
        select: {
          id: true,
          prompt: true,
          isRequired: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!defaultTemplate) {
    throw new AppError(
      "MISSING_TEMPLATE",
      "No review template is configured for this cycle",
      500,
    );
  }

  return defaultTemplate;
}

function buildEvidenceCountMap(
  rows: { type: EvidenceType; _count: { _all: number } }[],
): Record<EvidenceType, number> {
  const counts: Record<EvidenceType, number> = {
    [EvidenceType.FEEDBACK]: 0,
    [EvidenceType.UPDATE]: 0,
    [EvidenceType.ONE_ON_ONE]: 0,
    [EvidenceType.GOAL]: 0,
    [EvidenceType.VALUE_RECOGNITION]: 0,
  };

  for (const row of rows) {
    counts[row.type] = row._count._all;
  }

  return counts;
}
