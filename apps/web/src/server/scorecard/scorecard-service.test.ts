import {
  FinalRatingSource,
  ReviewRelationship,
  ScorecardMetricKey,
  UserRole,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  mapScorecardPercentToRating,
  recomputePacketScorecard,
  shouldRecomputeScorecardOnSubmissionSubmit,
} from "@/server/scorecard/scorecard-service";

const context = {
  userId: "user_manager_1",
  orgId: "org_demo_1",
  role: UserRole.MANAGER,
};

function buildDbMock() {
  return {
    reviewPacket: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    scorecardMetricResult: {
      upsert: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };
}

function buildPacketRecord(overrides?: {
  finalRatingSource?: FinalRatingSource | null;
  metrics?: { metricKey: ScorecardMetricKey; weightPercent: number }[];
  selfAnswers?: {
    metricKey: ScorecardMetricKey;
    scaleRating: number | null;
    notObserved?: boolean;
  }[];
  managerAnswers?: {
    metricKey: ScorecardMetricKey;
    scaleRating: number | null;
    notObserved?: boolean;
  }[];
  peerAnswers?: {
    metricKey: ScorecardMetricKey;
    scaleRating: number | null;
    notObserved?: boolean;
  }[];
}) {
  const selfAnswers =
    overrides?.selfAnswers ??
    [
      {
        metricKey: ScorecardMetricKey.QUALITY_OF_WORK,
        scaleRating: 4,
      },
      {
        metricKey: ScorecardMetricKey.COMMUNICATION,
        scaleRating: 3,
      },
    ];

  const managerAnswers =
    overrides?.managerAnswers ??
    [
      {
        metricKey: ScorecardMetricKey.QUALITY_OF_WORK,
        scaleRating: 5,
      },
      {
        metricKey: ScorecardMetricKey.COMMUNICATION,
        scaleRating: 3,
      },
    ];

  const peerAnswers = overrides?.peerAnswers ?? [];

  return {
    id: "packet_seed_employee_1",
    orgId: context.orgId,
    finalRatingSource: overrides?.finalRatingSource ?? null,
    cycle: {
      scorecardMetrics:
        overrides?.metrics ??
        [
          {
            metricKey: ScorecardMetricKey.QUALITY_OF_WORK,
            weightPercent: 15,
          },
          {
            metricKey: ScorecardMetricKey.COMMUNICATION,
            weightPercent: 10,
          },
        ],
    },
    submissions: [
      {
        relationship: ReviewRelationship.SELF,
        answers: selfAnswers.map((answer) => ({
          scaleRating: answer.scaleRating,
          notObserved: answer.notObserved ?? false,
          question: {
            dimensionKey: answer.metricKey,
          },
        })),
      },
      {
        relationship: ReviewRelationship.PEER,
        answers: peerAnswers.map((answer) => ({
          scaleRating: answer.scaleRating,
          notObserved: answer.notObserved ?? false,
          question: {
            dimensionKey: answer.metricKey,
          },
        })),
      },
      {
        relationship: ReviewRelationship.MANAGER,
        answers: managerAnswers.map((answer) => ({
          scaleRating: answer.scaleRating,
          notObserved: answer.notObserved ?? false,
          question: {
            dimensionKey: answer.metricKey,
          },
        })),
      },
    ],
  };
}

describe("mapScorecardPercentToRating", () => {
  it("maps boundary percent values to expected ratings", () => {
    expect(mapScorecardPercentToRating(90)).toBe(5);
    expect(mapScorecardPercentToRating(89)).toBe(4);
    expect(mapScorecardPercentToRating(80)).toBe(4);
    expect(mapScorecardPercentToRating(79)).toBe(3);
    expect(mapScorecardPercentToRating(70)).toBe(3);
    expect(mapScorecardPercentToRating(60)).toBe(2);
    expect(mapScorecardPercentToRating(59.999)).toBe(1);
  });
});

describe("shouldRecomputeScorecardOnSubmissionSubmit", () => {
  it("recomputes only on manager submission submit", () => {
    expect(shouldRecomputeScorecardOnSubmissionSubmit(ReviewRelationship.MANAGER)).toBe(true);
    expect(shouldRecomputeScorecardOnSubmissionSubmit(ReviewRelationship.SELF)).toBe(false);
    expect(shouldRecomputeScorecardOnSubmissionSubmit(ReviewRelationship.PEER)).toBe(false);
    expect(shouldRecomputeScorecardOnSubmissionSubmit(ReviewRelationship.UPWARD)).toBe(false);
  });
});

describe("recomputePacketScorecard", () => {
  it("computes blended and weighted scorecard values and persists packet summary", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(buildPacketRecord());
    db.scorecardMetricResult.upsert.mockResolvedValue({ id: "metric_result_1" });
    db.reviewPacket.update.mockResolvedValue({
      id: "packet_seed_employee_1",
      totalScorecardPercent: 19.5,
      scorecardOverallRating: 1,
      finalRatingSource: FinalRatingSource.SCORECARD,
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_scorecard_1" });

    const result = await recomputePacketScorecard("packet_seed_employee_1", context, db as never);

    expect(result.totalScorecardPercent).toBe(19.5);
    expect(result.scorecardOverallRating).toBe(1);
    expect(result.finalRatingSource).toBe(FinalRatingSource.SCORECARD);
    expect(db.scorecardMetricResult.upsert).toHaveBeenCalledTimes(2);
    expect(db.reviewPacket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalScorecardPercent: 19.5,
          scorecardOverallRating: 1,
          finalRatingSource: FinalRatingSource.SCORECARD,
        }),
      }),
    );
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("excludes not-observed values from weighted scoring", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        selfAnswers: [
          {
            metricKey: ScorecardMetricKey.QUALITY_OF_WORK,
            scaleRating: null,
            notObserved: true,
          },
          {
            metricKey: ScorecardMetricKey.COMMUNICATION,
            scaleRating: 4,
          },
        ],
        managerAnswers: [
          {
            metricKey: ScorecardMetricKey.QUALITY_OF_WORK,
            scaleRating: 5,
          },
          {
            metricKey: ScorecardMetricKey.COMMUNICATION,
            scaleRating: 4,
          },
        ],
      }),
    );
    db.scorecardMetricResult.upsert.mockResolvedValue({ id: "metric_result_2" });
    db.reviewPacket.update.mockResolvedValue({
      id: "packet_seed_employee_1",
      totalScorecardPercent: 8,
      scorecardOverallRating: 1,
      finalRatingSource: FinalRatingSource.SCORECARD,
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_scorecard_2" });

    const result = await recomputePacketScorecard("packet_seed_employee_1", context, db as never);

    expect(result.totalScorecardPercent).toBe(8);
    expect(result.metrics.find((metric) => metric.metricKey === ScorecardMetricKey.QUALITY_OF_WORK))
      .toMatchObject({
        selfNotObserved: true,
        weightedPercent: null,
      });
    expect(result.metrics.find((metric) => metric.metricKey === ScorecardMetricKey.COMMUNICATION))
      .toMatchObject({
        weightedPercent: 8,
      });
  });

  it("preserves CALIBRATION as final rating source when recomputing scorecard", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        finalRatingSource: FinalRatingSource.CALIBRATION,
      }),
    );
    db.scorecardMetricResult.upsert.mockResolvedValue({ id: "metric_result_3" });
    db.reviewPacket.update.mockResolvedValue({
      id: "packet_seed_employee_1",
      totalScorecardPercent: 19.5,
      scorecardOverallRating: 1,
      finalRatingSource: FinalRatingSource.CALIBRATION,
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_scorecard_3" });

    const result = await recomputePacketScorecard("packet_seed_employee_1", context, db as never);

    expect(result.finalRatingSource).toBe(FinalRatingSource.CALIBRATION);
    expect(db.reviewPacket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          finalRatingSource: FinalRatingSource.CALIBRATION,
        }),
      }),
    );
  });

  it("ignores peer and upward inputs for scorecard totals by default", async () => {
    const db = buildDbMock();
    db.reviewPacket.findFirst.mockResolvedValue(
      buildPacketRecord({
        peerAnswers: [
          {
            metricKey: ScorecardMetricKey.QUALITY_OF_WORK,
            scaleRating: 1,
          },
        ],
      }),
    );
    db.scorecardMetricResult.upsert.mockResolvedValue({ id: "metric_result_4" });
    db.reviewPacket.update.mockResolvedValue({
      id: "packet_seed_employee_1",
      totalScorecardPercent: 19.5,
      scorecardOverallRating: 1,
      finalRatingSource: FinalRatingSource.SCORECARD,
    });
    db.auditEvent.create.mockResolvedValue({ id: "audit_scorecard_4" });

    const result = await recomputePacketScorecard("packet_seed_employee_1", context, db as never);

    expect(result.totalScorecardPercent).toBe(19.5);
    expect(result.metrics.find((metric) => metric.metricKey === ScorecardMetricKey.QUALITY_OF_WORK))
      .toMatchObject({
        selfRating: 4,
        managerRating: 5,
      });
  });
});
