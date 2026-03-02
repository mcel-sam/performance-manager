import { ScorecardMetricKey } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_SCORECARD_METRICS,
  resolveScorecardMetricConfig,
  validateScorecardMetricConfig,
} from "@/server/scorecard/scorecard-config";

describe("scorecard config validation", () => {
  it("returns default scorecard weights when no config is provided", () => {
    const resolved = resolveScorecardMetricConfig(undefined);

    expect(resolved).toEqual(DEFAULT_SCORECARD_METRICS);
    expect(resolved.reduce((total, metric) => total + metric.weightPercent, 0)).toBe(100);
  });

  it("rejects metric weights that do not sum to 100", () => {
    expect(() =>
      validateScorecardMetricConfig(
        DEFAULT_SCORECARD_METRICS.map((metric) => ({
          ...metric,
          weightPercent: metric.weightPercent + 1,
        })),
      ),
    ).toThrowError("Scorecard metric weights must sum to 100");
  });

  it("rejects missing metric keys", () => {
    expect(() =>
      validateScorecardMetricConfig(
        DEFAULT_SCORECARD_METRICS.filter(
          (metric) => metric.metricKey !== ScorecardMetricKey.ADAPTABILITY,
        ),
      ),
    ).toThrowError("must include all required metric keys");
  });

  it("rejects duplicate metric keys", () => {
    const metrics = [
      ...DEFAULT_SCORECARD_METRICS.slice(0, 7),
      {
        metricKey: ScorecardMetricKey.QUALITY_OF_WORK,
        weightPercent: 10,
      },
    ];

    expect(() => validateScorecardMetricConfig(metrics)).toThrowError(
      "Duplicate scorecard metric key",
    );
  });
});
