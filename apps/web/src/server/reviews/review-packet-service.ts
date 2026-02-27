import {
  CycleStatus,
  CycleVisibilityPolicy,
  ReviewRelationship,
  ReviewSubmissionStatus,
  UserRole,
} from "@prisma/client";
import { z } from "zod";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

interface ReviewAnswerRecord {
  id: string;
  questionId: string;
  responseText: string;
  question: {
    id: string;
    prompt: string;
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
      where: {
        orgId: string;
        userId: string;
      };
      select: {
        id: true;
      };
    }) => Promise<PacketViewerRecord | null>;
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
  };
  submissions: {
    submissionId: string;
    relationship: ReviewRelationship;
    status: ReviewSubmissionStatus;
    submittedAt: string | null;
    reviewerName: string;
    answers: {
      answerId: string;
      questionId: string;
      prompt: string;
      isRequired: boolean;
      responseText: string;
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
              question: {
                select: {
                  id: true,
                  prompt: true,
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

  await assertPacketAccess(packet, context, db);

  const submissions = [...packet.submissions]
    .sort((left, right) => submissionOrder[left.relationship] - submissionOrder[right.relationship])
    .map((submission) => ({
      submissionId: submission.id,
      relationship: submission.relationship,
      status: submission.status,
      submittedAt: submission.submittedAt?.toISOString() ?? null,
      reviewerName: `${submission.reviewerEmployee.firstName} ${submission.reviewerEmployee.lastName}`,
      answers: [...submission.answers]
        .sort((left, right) => left.question.sortOrder - right.question.sortOrder)
        .map((answer) => ({
          answerId: answer.id,
          questionId: answer.questionId,
          prompt: answer.question.prompt,
          isRequired: answer.question.isRequired,
          responseText: answer.responseText,
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
    },
    submissions,
  };
}

async function assertPacketAccess(
  packet: ReviewPacketRecord,
  context: RequestContext,
  db: ReviewPacketDb,
): Promise<void> {
  if (context.role === UserRole.HR_ADMIN) {
    return;
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
    return;
  }

  const isSubject = packet.subjectEmployee.userId === context.userId;
  if (isSubject) {
    const canViewAfterRelease =
      packet.cycle.visibilityPolicy === CycleVisibilityPolicy.EMPLOYEE_AFTER_RELEASE &&
      packet.cycle.status === CycleStatus.RELEASED;

    if (canViewAfterRelease) {
      return;
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
