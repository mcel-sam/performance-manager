import {
  FinalRatingSource,
  ReviewRelationship,
  ScorecardMetricKey,
} from "@prisma/client";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";
import {
  DEFAULT_SCORECARD_METRICS,
  type ScorecardMetricInput,
} from "@/server/scorecard/scorecard-config";

interface AnswerWithDimension {
  scaleRating: number | null;
  notObserved: boolean;
  question: {
    dimensionKey: string | null;
  };
}

interface SubmissionWithRatings {
  relationship: ReviewRelationship;
  answers: AnswerWithDimension[];
}

interface PacketScorecardRecord {
  id: string;
  orgId: string;
  finalRatingSource: FinalRatingSource | null;
  cycle: {
    scorecardMetrics: {
      metricKey: ScorecardMetricKey;
      weightPercent: number;
    }[];
  };
  submissions: SubmissionWithRatings[];
}

interface ScorecardDb {
  reviewPacket: {
    findFirst: (args: {
      where: { id: string; orgId: string };
      select: Record<string, unknown>;
    }) => Promise<PacketScorecardRecord | null>;
    update: (args: {
      where: { id: string };
      data: {
        totalScorecardPercent: number | null;
        scorecardOverallRating: number | null;
        finalRatingSource: FinalRatingSource | null;
      };
      select: {
        id: true;
        totalScorecardPercent: true;
        scorecardOverallRating: true;
        finalRatingSource: true;
      };
    }) => Promise<{
      id: string;
      totalScorecardPercent: number | null;
      scorecardOverallRating: number | null;
      finalRatingSource: FinalRatingSource | null;
    }>;
  };
  scorecardMetricResult: {
    upsert: (args: {
      where: { packetId_metricKey: { packetId: string; metricKey: ScorecardMetricKey } };
      create: {
        orgId: string;
        packetId: string;
        metricKey: ScorecardMetricKey;
        selfRating: number | null;
        managerRating: number | null;
        selfNotObserved: boolean;
        managerNotObserved: boolean;
        blendedRating: number | null;
        weightPercent: number;
        weightedPercent: number | null;
      };
      update: {
        selfRating: number | null;
        managerRating: number | null;
        selfNotObserved: boolean;
        managerNotObserved: boolean;
        blendedRating: number | null;
        weightPercent: number;
        weightedPercent: number | null;
      };
      select: {
        id: true;
      };
    }) => Promise<{ id: string }>;
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

interface MetricComputation {
  metricKey: ScorecardMetricKey;
  weightPercent: number;
  selfRating: number | null;
  managerRating: number | null;
  selfNotObserved: boolean;
  managerNotObserved: boolean;
  blendedRating: number | null;
  weightedPercent: number | null;
}

export interface ScorecardComputationResult {
  packetId: string;
  totalScorecardPercent: number | null;
  scorecardOverallRating: number | null;
  finalRatingSource: FinalRatingSource | null;
  metrics: MetricComputation[];
}

const scorecardMetricKeySet = new Set<string>(Object.values(ScorecardMetricKey));

export function shouldRecomputeScorecardOnSubmissionSubmit(
  relationship: ReviewRelationship,
): boolean {
  return relationship === ReviewRelationship.MANAGER;
}

export function mapScorecardPercentToRating(percent: number): number {
  if (percent >= 90) {
    return 5;
  }

  if (percent >= 80) {
    return 4;
  }

  if (percent >= 70) {
    return 3;
  }

  if (percent >= 60) {
    return 2;
  }

  return 1;
}

export async function recomputePacketScorecard(
  packetId: string,
  context: RequestContext,
  db: ScorecardDb = prisma as unknown as ScorecardDb,
): Promise<ScorecardComputationResult> {
  const packet = await db.reviewPacket.findFirst({
    where: {
      id: packetId,
      orgId: context.orgId,
    },
    select: {
      id: true,
      orgId: true,
      finalRatingSource: true,
      cycle: {
        select: {
          scorecardMetrics: {
            select: {
              metricKey: true,
              weightPercent: true,
            },
          },
        },
      },
      submissions: {
        where: {
          relationship: {
            in: [ReviewRelationship.SELF, ReviewRelationship.MANAGER],
          },
        },
        select: {
          relationship: true,
          answers: {
            select: {
              scaleRating: true,
              notObserved: true,
              question: {
                select: {
                  dimensionKey: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!packet) {
    throw new AppError("NOT_FOUND", "Review packet not found for scorecard recompute", 404);
  }

  const configuredMetrics = normalizeConfiguredMetrics(packet.cycle.scorecardMetrics);
  const metricComputations = computeMetrics(configuredMetrics, packet.submissions);

  for (const metric of metricComputations) {
    await db.scorecardMetricResult.upsert({
      where: {
        packetId_metricKey: {
          packetId: packet.id,
          metricKey: metric.metricKey,
        },
      },
      create: {
        orgId: context.orgId,
        packetId: packet.id,
        metricKey: metric.metricKey,
        selfRating: metric.selfRating,
        managerRating: metric.managerRating,
        selfNotObserved: metric.selfNotObserved,
        managerNotObserved: metric.managerNotObserved,
        blendedRating: metric.blendedRating,
        weightPercent: metric.weightPercent,
        weightedPercent: metric.weightedPercent,
      },
      update: {
        selfRating: metric.selfRating,
        managerRating: metric.managerRating,
        selfNotObserved: metric.selfNotObserved,
        managerNotObserved: metric.managerNotObserved,
        blendedRating: metric.blendedRating,
        weightPercent: metric.weightPercent,
        weightedPercent: metric.weightedPercent,
      },
      select: {
        id: true,
      },
    });
  }

  const weightedValues = metricComputations
    .map((metric) => metric.weightedPercent)
    .filter((value): value is number => typeof value === "number");

  const totalScorecardPercent =
    weightedValues.length > 0
      ? roundToPrecision(weightedValues.reduce((total, value) => total + value, 0))
      : null;
  const scorecardOverallRating =
    totalScorecardPercent === null ? null : mapScorecardPercentToRating(totalScorecardPercent);

  const finalRatingSource =
    packet.finalRatingSource === FinalRatingSource.CALIBRATION
      ? FinalRatingSource.CALIBRATION
      : scorecardOverallRating === null
        ? null
        : FinalRatingSource.SCORECARD;

  const updatedPacket = await db.reviewPacket.update({
    where: { id: packet.id },
    data: {
      totalScorecardPercent,
      scorecardOverallRating,
      finalRatingSource,
    },
    select: {
      id: true,
      totalScorecardPercent: true,
      scorecardOverallRating: true,
      finalRatingSource: true,
    },
  });

  await db.auditEvent.create({
    data: {
      orgId: context.orgId,
      actorUserId: context.userId,
      action: "SCORECARD_RECOMPUTED",
      entityType: "ReviewPacket",
      entityId: packet.id,
      metadata: {
        packetId: packet.id,
        computedMetricCount: metricComputations.length,
        scoredMetricCount: weightedValues.length,
        totalScorecardPercent,
        scorecardOverallRating,
        finalRatingSource,
      },
    },
  });

  return {
    packetId: updatedPacket.id,
    totalScorecardPercent: updatedPacket.totalScorecardPercent,
    scorecardOverallRating: updatedPacket.scorecardOverallRating,
    finalRatingSource: updatedPacket.finalRatingSource,
    metrics: metricComputations,
  };
}

function normalizeConfiguredMetrics(
  configured: { metricKey: ScorecardMetricKey; weightPercent: number }[],
): ScorecardMetricInput[] {
  if (configured.length === 0) {
    return [...DEFAULT_SCORECARD_METRICS];
  }

  return configured.map((metric) => ({
    metricKey: metric.metricKey,
    weightPercent: metric.weightPercent,
  }));
}

function computeMetrics(
  configuredMetrics: ScorecardMetricInput[],
  submissions: SubmissionWithRatings[],
): MetricComputation[] {
  const selfAnswerByMetric = buildAnswerMap(submissions, ReviewRelationship.SELF);
  const managerAnswerByMetric = buildAnswerMap(submissions, ReviewRelationship.MANAGER);

  return configuredMetrics.map((configuredMetric) => {
    const selfAnswer = selfAnswerByMetric.get(configuredMetric.metricKey);
    const managerAnswer = managerAnswerByMetric.get(configuredMetric.metricKey);
    const selfNotObserved = selfAnswer?.notObserved ?? false;
    const managerNotObserved = managerAnswer?.notObserved ?? false;
    const selfRating = selfAnswer?.scaleRating ?? null;
    const managerRating = managerAnswer?.scaleRating ?? null;

    const isScorable =
      !selfNotObserved &&
      !managerNotObserved &&
      typeof selfRating === "number" &&
      typeof managerRating === "number";

    const blendedRating = isScorable
      ? roundToPrecision((selfRating + managerRating) / 2)
      : null;
    const weightedPercent =
      blendedRating === null
        ? null
        : roundToPrecision((blendedRating / 5) * configuredMetric.weightPercent);

    return {
      metricKey: configuredMetric.metricKey,
      weightPercent: configuredMetric.weightPercent,
      selfRating,
      managerRating,
      selfNotObserved,
      managerNotObserved,
      blendedRating,
      weightedPercent,
    };
  });
}

function buildAnswerMap(
  submissions: SubmissionWithRatings[],
  relationship: ReviewRelationship,
): Map<ScorecardMetricKey, AnswerWithDimension> {
  const submission = submissions.find((candidate) => candidate.relationship === relationship);
  if (!submission) {
    return new Map();
  }

  const answerMap = new Map<ScorecardMetricKey, AnswerWithDimension>();
  for (const answer of submission.answers) {
    const metricKey = answer.question.dimensionKey;
    if (!metricKey || !isScorecardMetricKey(metricKey)) {
      continue;
    }

    answerMap.set(metricKey, answer);
  }

  return answerMap;
}

function isScorecardMetricKey(value: string): value is ScorecardMetricKey {
  return scorecardMetricKeySet.has(value);
}

function roundToPrecision(value: number): number {
  return Number(value.toFixed(4));
}
