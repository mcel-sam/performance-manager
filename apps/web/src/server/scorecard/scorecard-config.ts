import { ScorecardMetricKey } from "@prisma/client";
import { z } from "zod";

import { AppError } from "@/server/http/errors";

export const DEFAULT_SCORECARD_METRICS: ReadonlyArray<{
  metricKey: ScorecardMetricKey;
  weightPercent: number;
}> = [
  { metricKey: ScorecardMetricKey.QUALITY_OF_WORK, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.COMMUNICATION, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ACCOUNTABILITY, weightPercent: 15 },
  { metricKey: ScorecardMetricKey.RELATIONSHIP_BUILDING, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.RESULTS_DRIVEN, weightPercent: 20 },
  { metricKey: ScorecardMetricKey.ATTITUDE, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.SERVICE_ORIENTED, weightPercent: 10 },
  { metricKey: ScorecardMetricKey.ADAPTABILITY, weightPercent: 10 },
] as const;

const scorecardMetricSchema = z.object({
  metricKey: z.nativeEnum(ScorecardMetricKey),
  weightPercent: z.number().positive().max(100),
});

export const scorecardMetricListSchema = z.array(scorecardMetricSchema);

export type ScorecardMetricInput = z.infer<typeof scorecardMetricSchema>;

export function resolveScorecardMetricConfig(
  input: ScorecardMetricInput[] | undefined,
): ScorecardMetricInput[] {
  const candidate = input ?? [...DEFAULT_SCORECARD_METRICS];
  const parsed = scorecardMetricListSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid scorecard metric configuration payload",
      400,
      parsed.error.flatten(),
    );
  }

  validateScorecardMetricConfig(parsed.data);

  return parsed.data;
}

export function validateScorecardMetricConfig(metrics: ScorecardMetricInput[]): void {
  const allowedMetricKeys = new Set(DEFAULT_SCORECARD_METRICS.map((metric) => metric.metricKey));
  const seen = new Set<ScorecardMetricKey>();

  for (const metric of metrics) {
    if (!allowedMetricKeys.has(metric.metricKey)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Unknown scorecard metric key: ${metric.metricKey}`,
        400,
      );
    }

    if (seen.has(metric.metricKey)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Duplicate scorecard metric key: ${metric.metricKey}`,
        400,
      );
    }

    seen.add(metric.metricKey);
  }

  if (seen.size !== allowedMetricKeys.size) {
    const missing = [...allowedMetricKeys].filter((metricKey) => !seen.has(metricKey));
    throw new AppError(
      "VALIDATION_ERROR",
      "Scorecard metric configuration must include all required metric keys",
      400,
      { missingMetricKeys: missing },
    );
  }

  const totalWeight = metrics.reduce((total, metric) => total + metric.weightPercent, 0);
  if (Math.abs(totalWeight - 100) > 0.0001) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Scorecard metric weights must sum to 100",
      400,
      { totalWeight },
    );
  }
}
