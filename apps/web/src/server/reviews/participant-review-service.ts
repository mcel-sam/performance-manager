import {
  CycleStatus,
  CompetencyDimensionKey,
  EvidenceType,
  GoalStatus,
  ReviewRelationship,
  ReviewQuestionType,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { getGoalReviewContext } from "@/server/goals/goal-service";
import { getGrowthTrackDataForEmployee } from "@/server/growth/growth-track-service";
import { AppError } from "@/server/http/errors";
import {
  recomputePacketScorecard,
  shouldRecomputeScorecardOnSubmissionSubmit,
} from "@/server/scorecard/scorecard-service";

interface TemplateQuestion {
  id: string;
  prompt: string;
  questionType: ReviewQuestionType;
  dimensionKey: CompetencyDimensionKey | null;
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
  packetId: string;
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
    department: string | null;
    title: string | null;
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
    avatarUrl: string | null;
  };
}

interface ReviewAnswerRecord {
  id: string;
  questionId: string;
  responseText: string;
  scaleRating: number | null;
  notObserved: boolean;
  evidenceLinks: {
    evidenceItemId: string;
    evidenceItem: {
      id: string;
      type: EvidenceType;
      content: string;
      occurredAt: Date;
    };
  }[];
}

interface ParticipantReviewDb {
  employee: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<unknown>;
  };
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
            questionType: true;
            dimensionKey: true;
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
  goalCycle: {
    findFirst: (args: {
      where: Record<string, unknown>;
      orderBy: Array<Record<string, "desc">>;
      select: Record<string, unknown>;
    }) => Promise<unknown>;
  };
  goal: {
    findMany: (args: {
      where: Record<string, unknown>;
      orderBy: Array<Record<string, "desc">>;
      select: Record<string, unknown>;
    }) => Promise<unknown[]>;
  };
  reviewAnswer: {
    findMany: (args: {
      where: { orgId: string; submissionId: string };
      select: Record<string, unknown>;
    }) => Promise<ReviewAnswerRecord[]>;
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
        scaleRating: number | null;
        notObserved: boolean;
      };
      update: {
        responseText: string;
        scaleRating: number | null;
        notObserved: boolean;
      };
      select: {
        id: true;
        updatedAt: true;
      };
    }) => Promise<{ id: string; updatedAt: Date }>;
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
  scaleRating: z.number().int().min(1).max(5).nullable().optional(),
  notObserved: z.boolean().optional(),
});

export interface ReviewTaskListItem {
  id: string;
  cycleId: string;
  cycleName: string;
  cycleEndDate: string;
  cycleStatus: CycleStatus;
  subjectName: string;
  subjectAvatarUrl: string | null;
  relationship: ReviewRelationship;
  status: ReviewSubmissionStatus;
  submittedAt: string | null;
}

export interface AttachedEvidenceSummary {
  evidenceItemId: string;
  type: EvidenceType;
  title: string;
  summary: string;
  occurredAt: string;
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
    subjectDepartment: string | null;
    subjectTitle: string | null;
  };
  template: {
    id: string;
    name: string;
  };
  questions: {
    id: string;
    prompt: string;
    questionType: ReviewQuestionType;
    dimensionKey: CompetencyDimensionKey | null;
    isRequired: boolean;
    answerId: string | null;
    responseText: string;
    scaleRating: number | null;
    notObserved: boolean;
    attachedEvidence: AttachedEvidenceSummary[];
  }[];
  goalContext: {
    cycleId: string;
    cycleName: string;
    goals: Array<{
      id: string;
      title: string;
      status: GoalStatus;
      progressPercent: number;
      lastUpdate: {
        id: string;
        note: string;
        createdAt: string;
      } | null;
    }>;
  } | null;
  trackContext: {
    trackLabel: string;
    levelLabel: string;
    summary: string;
    competenciesHref: string;
    competencies: Array<{
      label: string;
      summary: string;
    }>;
  } | null;
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
          avatarUrl: true,
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
    subjectAvatarUrl: submission.subjectEmployee.avatarUrl,
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
      scaleRating: true,
      notObserved: true,
      evidenceLinks: {
        select: {
          evidenceItemId: true,
          evidenceItem: {
            select: {
              id: true,
              type: true,
              content: true,
              occurredAt: true,
            },
          },
        },
      },
    },
  });

  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const [goalContext, growthTrack] = await Promise.all([
    getGoalReviewContext(submission.subjectEmployeeId, context, db as never),
    getGrowthTrackDataForEmployee(submission.subjectEmployeeId, context, db as never),
  ]);

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
      subjectDepartment: submission.subjectEmployee.department,
      subjectTitle: submission.subjectEmployee.title,
    },
    template: {
      id: template.id,
      name: template.name,
    },
    questions: template.questions.map((question) => {
      const answer = answerByQuestionId.get(question.id);

      return {
        id: question.id,
        prompt: question.prompt,
        questionType: question.questionType,
        dimensionKey: question.dimensionKey,
        isRequired: question.isRequired,
        answerId: answer?.id ?? null,
        responseText: answer?.responseText ?? "",
        scaleRating: answer?.scaleRating ?? null,
        notObserved: answer?.notObserved ?? false,
        attachedEvidence:
          answer?.evidenceLinks.map((link) => ({
            evidenceItemId: link.evidenceItemId,
            type: link.evidenceItem.type,
            title: buildEvidenceTitle(link.evidenceItem.content, link.evidenceItem.type),
            summary: buildEvidenceSummary(link.evidenceItem.content),
            occurredAt: link.evidenceItem.occurredAt.toISOString(),
          })) ?? [],
      };
    }),
    goalContext,
    trackContext: {
      trackLabel: growthTrack.track.label,
      levelLabel: growthTrack.currentLevel.label,
      summary: growthTrack.track.summary,
      competenciesHref: "/performance/tracks#growth-competencies",
      competencies: growthTrack.competencies.slice(0, 4).map((competency) => ({
        label: competency.label,
        summary: competency.summary,
      })),
    },
    evidenceCounts: buildEmptyEvidenceCountMap(),
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
  const question = template.questions.find(
    (templateQuestion) => templateQuestion.id === parsed.data.questionId,
  );
  if (!question) {
    throw new AppError("INVALID_QUESTION", "Question does not belong to this submission template", 400);
  }

  if (question.questionType === ReviewQuestionType.TEXT && parsed.data.notObserved) {
    throw new AppError("VALIDATION_ERROR", "notObserved is only valid for scale questions", 400);
  }

  if (question.questionType === ReviewQuestionType.TEXT && parsed.data.scaleRating != null) {
    throw new AppError("VALIDATION_ERROR", "scaleRating is only valid for scale questions", 400);
  }

  const notObserved = parsed.data.notObserved ?? false;
  const scaleRating =
    question.questionType === ReviewQuestionType.SCALE_1_TO_5 && !notObserved
      ? (parsed.data.scaleRating ?? null)
      : null;

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
      scaleRating,
      notObserved,
    },
    update: {
      responseText: parsed.data.responseText,
      scaleRating,
      notObserved,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  let status: ReviewSubmissionStatus = submission.status;
  if (
    submission.status === ReviewSubmissionStatus.NOT_STARTED &&
    (parsed.data.responseText.trim().length > 0 || scaleRating != null || notObserved)
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
  const questionById = new Map(template.questions.map((question) => [question.id, question]));

  const answers = await db.reviewAnswer.findMany({
    where: {
      orgId: context.orgId,
      submissionId: submission.id,
    },
    select: {
      id: true,
      questionId: true,
      responseText: true,
      scaleRating: true,
      notObserved: true,
      evidenceLinks: {
        select: {
          evidenceItemId: true,
          evidenceItem: {
            select: {
              id: true,
              type: true,
              content: true,
              occurredAt: true,
            },
          },
        },
      },
    },
  });

  const completedQuestionIds = new Set<string>();
  for (const answer of answers) {
    const templateQuestion = questionById.get(answer.questionId);
    if (!templateQuestion) {
      continue;
    }

    const hasComment = answer.responseText.trim().length > 0;
    const hasScaleValue = answer.notObserved || answer.scaleRating != null;
    const isCompleted =
      templateQuestion.questionType === ReviewQuestionType.SCALE_1_TO_5
        ? hasComment && hasScaleValue
        : hasComment;

    if (isCompleted) {
      completedQuestionIds.add(answer.questionId);
    }
  }

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

  if (shouldRecomputeScorecardOnSubmissionSubmit(submission.relationship)) {
    await recomputePacketScorecard(submission.packetId, context);
  }

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
      packetId: true,
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
          department: true,
          title: true,
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
                  questionType: true,
                  dimensionKey: true,
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
          questionType: true,
          dimensionKey: true,
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

function buildEmptyEvidenceCountMap(): Record<EvidenceType, number> {
  return {
    [EvidenceType.FEEDBACK]: 0,
    [EvidenceType.UPDATE]: 0,
    [EvidenceType.ONE_ON_ONE]: 0,
    [EvidenceType.GOAL]: 0,
    [EvidenceType.GOAL_UPDATE]: 0,
    [EvidenceType.VALUE_RECOGNITION]: 0,
  };
}
