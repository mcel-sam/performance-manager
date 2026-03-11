import {
  CycleStatus,
  CycleVisibilityPolicy,
  EvidenceType,
  EvidenceVisibility,
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

interface ReviewAnswerRecord {
  id: string;
  questionId: string;
  responseText: string;
  scaleRating: number | null;
  notObserved: boolean;
  question: {
    id: string;
    prompt: string;
    questionType: ReviewQuestionType;
    isRequired: boolean;
    sortOrder: number;
  };
}

interface ReviewSubmissionRecord {
  id: string;
  relationship: ReviewRelationship;
  status: ReviewSubmissionStatus;
  submittedAt: Date | null;
  reviewerEmployee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  answers: ReviewAnswerRecord[];
}

interface ReviewPacketRecord {
  id: string;
  cycleId: string;
  subjectEmployeeId: string;
  cycle: {
    id: string;
    name: string;
    status: CycleStatus;
    visibilityPolicy: CycleVisibilityPolicy;
  };
  subjectEmployee: {
    id: string;
    userId: string;
    managerId: string | null;
    firstName: string;
    lastName: string;
  };
  submissions: ReviewSubmissionRecord[];
}

interface PacketViewerRecord {
  id: string;
}

interface ReviewPacketDb {
  reviewPacket: {
    findFirst: (args: {
      where: {
        orgId: string;
        cycleId: string;
        subjectEmployeeId: string;
      };
      select: Record<string, unknown>;
    }) => Promise<ReviewPacketRecord | null>;
  };
  employee: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<PacketViewerRecord | null>;
  };
  reviewTemplate: {
    findFirst: (args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }) => Promise<unknown>;
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
  evidenceItem: {
    groupBy: (args: {
      by: ["type"];
      where: Record<string, unknown>;
      _count: {
        _all: true;
      };
    }) => Promise<{ type: EvidenceType; _count: { _all: number } }[]>;
  };
}

const packetIdentifierSchema = z.object({
  cycleId: z.string().trim().min(1),
  subjectEmployeeId: z.string().trim().min(1),
});

const submissionOrder: Record<ReviewRelationship, number> = {
  [ReviewRelationship.SELF]: 0,
  [ReviewRelationship.MANAGER]: 1,
  [ReviewRelationship.PEER]: 2,
  [ReviewRelationship.UPWARD]: 3,
};

export interface ReviewPacketData {
  packet: {
    id: string;
    cycleId: string;
    cycleName: string;
    cycleStatus: CycleStatus;
    visibilityPolicy: CycleVisibilityPolicy;
    subjectEmployeeId: string;
    subjectName: string;
    totalSubmissions: number;
    submittedCount: number;
    evidenceCounts: Record<EvidenceType, number>;
  };
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
  submissions: {
    submissionId: string;
    relationship: ReviewRelationship;
    isReferenceInput: boolean;
    status: ReviewSubmissionStatus;
    submittedAt: string | null;
    reviewerName: string;
    answers: {
      answerId: string;
      questionId: string;
      prompt: string;
      questionType: ReviewQuestionType;
      isRequired: boolean;
      responseText: string;
      scaleRating: number | null;
      notObserved: boolean;
    }[];
  }[];
}

export async function getReviewPacket(
  cycleId: string,
  subjectEmployeeId: string,
  context: RequestContext,
  db: ReviewPacketDb = prisma as unknown as ReviewPacketDb,
): Promise<ReviewPacketData> {
  const parsed = packetIdentifierSchema.safeParse({ cycleId, subjectEmployeeId });
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid review packet identifiers", 400, parsed.error.flatten());
  }

  const packet = await db.reviewPacket.findFirst({
    where: {
      orgId: context.orgId,
      cycleId: parsed.data.cycleId,
      subjectEmployeeId: parsed.data.subjectEmployeeId,
    },
    select: {
      id: true,
      cycleId: true,
      subjectEmployeeId: true,
      cycle: {
        select: {
          id: true,
          name: true,
          status: true,
          visibilityPolicy: true,
        },
      },
      subjectEmployee: {
        select: {
          id: true,
          userId: true,
          managerId: true,
          firstName: true,
          lastName: true,
        },
      },
      submissions: {
        select: {
          id: true,
          relationship: true,
          status: true,
          submittedAt: true,
          reviewerEmployee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          answers: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              questionId: true,
              responseText: true,
              scaleRating: true,
              notObserved: true,
              question: {
                select: {
                  id: true,
                  prompt: true,
                  questionType: true,
                  isRequired: true,
                  sortOrder: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!packet) {
    throw new AppError("NOT_FOUND", "Review packet not found", 404);
  }

  const access = await assertPacketAccess(packet, context, db);
  const [evidenceCounts, goalContext, growthTrack] = await Promise.all([
    loadEvidenceCounts(packet.subjectEmployeeId, context.orgId, access, db),
    getGoalReviewContext(packet.subjectEmployeeId, context, db as never),
    getGrowthTrackDataForEmployee(packet.subjectEmployeeId, context, db as never),
  ]);

  const submissions = [...packet.submissions]
    .sort((left, right) => submissionOrder[left.relationship] - submissionOrder[right.relationship])
    .map((submission) => ({
      submissionId: submission.id,
      relationship: submission.relationship,
      isReferenceInput:
        submission.relationship === ReviewRelationship.PEER ||
        submission.relationship === ReviewRelationship.UPWARD,
      status: submission.status,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      reviewerName: `${submission.reviewerEmployee.firstName} ${submission.reviewerEmployee.lastName}`,
      answers: [...submission.answers]
        .sort((left, right) => left.question.sortOrder - right.question.sortOrder)
        .map((answer) => ({
          answerId: answer.id,
          questionId: answer.questionId,
          prompt: answer.question.prompt,
          questionType: answer.question.questionType,
          isRequired: answer.question.isRequired,
          responseText: answer.responseText,
          scaleRating: answer.scaleRating,
          notObserved: answer.notObserved,
        })),
    }));

  const submittedCount = submissions.filter(
    (submission) => submission.status === ReviewSubmissionStatus.SUBMITTED,
  ).length;

  return {
    packet: {
      id: packet.id,
      cycleId: packet.cycleId,
      cycleName: packet.cycle.name,
      cycleStatus: packet.cycle.status,
      visibilityPolicy: packet.cycle.visibilityPolicy,
      subjectEmployeeId: packet.subjectEmployeeId,
      subjectName: `${packet.subjectEmployee.firstName} ${packet.subjectEmployee.lastName}`,
      totalSubmissions: submissions.length,
      submittedCount,
      evidenceCounts,
    },
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
    submissions,
  };
}

interface PacketAccessState {
  allowAllEvidence: boolean;
  viewerEmployeeId: string | null;
  allowedEvidenceVisibilities: EvidenceVisibility[];
}

async function assertPacketAccess(
  packet: ReviewPacketRecord,
  context: RequestContext,
  db: ReviewPacketDb,
): Promise<PacketAccessState> {
  if (context.role === UserRole.HR_ADMIN) {
    return {
      allowAllEvidence: true,
      viewerEmployeeId: null,
      allowedEvidenceVisibilities: [],
    };
  }

  const viewer = await db.employee.findFirst({
    where: {
      orgId: context.orgId,
      userId: context.userId,
    },
    select: {
      id: true,
    },
  });

  if (!viewer) {
    throw new AppError("FORBIDDEN", "User is not mapped to an employee profile", 403);
  }

  if (packet.subjectEmployee.managerId === viewer.id) {
    return {
      allowAllEvidence: false,
      viewerEmployeeId: viewer.id,
      allowedEvidenceVisibilities: [
        EvidenceVisibility.ORG_VISIBLE,
        EvidenceVisibility.SHARED_WITH_SUBJECT,
        EvidenceVisibility.MANAGER_ONLY,
      ],
    };
  }

  const isSubject = packet.subjectEmployee.userId === context.userId;
  if (isSubject) {
    const canViewAfterRelease =
      packet.cycle.visibilityPolicy === CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE &&
      packet.cycle.status === CycleStatus.RELEASED;

    if (canViewAfterRelease) {
      return {
        allowAllEvidence: false,
        viewerEmployeeId: viewer.id,
        allowedEvidenceVisibilities: [
          EvidenceVisibility.ORG_VISIBLE,
          EvidenceVisibility.SHARED_WITH_SUBJECT,
        ],
      };
    }

    throw new AppError(
      "FORBIDDEN",
      "Review packet is not visible to the subject employee yet",
      403,
      {
        cycleStatus: packet.cycle.status,
        visibilityPolicy: packet.cycle.visibilityPolicy,
      },
    );
  }

  throw new AppError("FORBIDDEN", "You are not allowed to access this review packet", 403);
}

async function loadEvidenceCounts(
  subjectEmployeeId: string,
  orgId: string,
  access: PacketAccessState,
  db: ReviewPacketDb,
): Promise<Record<EvidenceType, number>> {
  const where: Record<string, unknown> = {
    orgId,
    subjectEmployeeId,
  };

  if (!access.allowAllEvidence) {
    where.OR = [
      {
        authorEmployeeId: access.viewerEmployeeId,
      },
      {
        visibility: {
          in: access.allowedEvidenceVisibilities,
        },
      },
    ];
  }

  const rows = await db.evidenceItem.groupBy({
    by: ["type"],
    where,
    _count: {
      _all: true,
    },
  });

  const counts = buildEmptyEvidenceCountMap();
  for (const row of rows) {
    counts[row.type] = row._count._all;
  }

  return counts;
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
