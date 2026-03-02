import type {
  ReportingCompetenciesResponse,
  ReportingProgressResult,
  ReportingRatingsResult,
} from "@/server/reporting/reporting-service";

export function createCsvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

export function buildProgressSummaryCsv(result: ReportingProgressResult): string {
  if (result.suppression.suppressed) {
    return csvLines([
      ["status", "message"],
      ["suppressed", result.suppression.message ?? "Insufficient data for this filter group."],
    ]);
  }

  return csvLines([
    ["status", "total", "self", "manager"],
    ["NOT_STARTED", result.totals.notStarted, result.self.notStarted, result.manager.notStarted],
    ["IN_PROGRESS", result.totals.inProgress, result.self.inProgress, result.manager.inProgress],
    ["COMPLETED", result.totals.completed, result.self.completed, result.manager.completed],
  ]);
}

export function buildRatingsDistributionCsv(result: ReportingRatingsResult): string {
  if (result.suppression.suppressed) {
    return csvLines([
      ["status", "message"],
      ["suppressed", result.suppression.message ?? "Insufficient data for this filter group."],
    ]);
  }

  return csvLines([
    ["rating", "count", "ratingSource"],
    ["1", result.distribution["1"], result.ratingSource],
    ["2", result.distribution["2"], result.ratingSource],
    ["3", result.distribution["3"], result.ratingSource],
    ["4", result.distribution["4"], result.ratingSource],
    ["5", result.distribution["5"], result.ratingSource],
    ["rated_count", result.ratedCount, result.ratingSource],
    ["source_scorecard", result.sourceSummary.scorecard, result.ratingSource],
    ["source_calibration", result.sourceSummary.calibration, result.ratingSource],
    ["source_unset", result.sourceSummary.unset, result.ratingSource],
  ]);
}

export function buildCompetencyBreakdownCsv(result: ReportingCompetenciesResponse): string {
  if (result.suppression.suppressed) {
    return csvLines([
      ["status", "message"],
      ["suppressed", result.suppression.message ?? "Insufficient data for this filter group."],
    ]);
  }

  const rows: Array<Array<string | number>> = [
    [
      "dimensionKey",
      "averageRating",
      "selfAverage",
      "managerAverage",
      "observedCount",
      "notObservedCount",
      "averageGap",
      "averageAbsoluteGap",
    ],
  ];

  for (const competency of result.competencies) {
    rows.push([
      competency.dimensionKey,
      competency.averageRating ?? "",
      competency.self.averageRating ?? "",
      competency.manager.averageRating ?? "",
      competency.observedCount,
      competency.notObservedCount,
      competency.selfManagerGap.averageGap ?? "",
      competency.selfManagerGap.averageAbsoluteGap ?? "",
    ]);
  }

  return csvLines(rows);
}

function csvLines(rows: Array<Array<string | number>>): string {
  return rows
    .map((cells) => cells.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

function escapeCsvCell(value: string | number): string {
  const normalized = String(value);
  if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
    return `"${normalized.replaceAll("\"", "\"\"")}"`;
  }

  return normalized;
}
