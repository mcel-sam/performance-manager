import { createCsvResponse } from "@/server/reporting/reporting-export";
import type { SuccessionCoverageReportRow, SuccessionExportRow } from "@/server/succession/succession-service";

export function buildSuccessionExportCsv(rows: SuccessionExportRow[]): string {
  return csvLines([
    [
      "positionTitle",
      "department",
      "location",
      "isCritical",
      "positionStatus",
      "incumbentName",
      "planOwnerName",
      "visibilityScope",
      "candidateName",
      "candidateTitle",
      "readiness",
      "riskOfLoss",
      "confidence",
      "proposedByRole",
      "proposedByName",
      "scorecardOverallRating",
      "scorecardPercent",
      "finalRatingSource",
      "calibrationPerformanceBucket",
      "calibrationPotentialBucket",
    ],
    ...rows.map((row) => [
      row.positionTitle,
      row.department,
      row.location ?? "",
      row.isCritical ? "true" : "false",
      row.positionStatus,
      row.incumbentName ?? "",
      row.planOwnerName ?? "",
      row.visibilityScope ?? "",
      row.candidateName ?? "",
      row.candidateTitle ?? "",
      row.readiness ?? "",
      row.riskOfLoss ?? "",
      row.confidence ?? "",
      row.proposedByRole ?? "",
      row.proposedByName ?? "",
      row.scorecardOverallRating ?? "",
      row.scorecardPercent ?? "",
      row.finalRatingSource ?? "",
      row.calibrationPerformanceBucket ?? "",
      row.calibrationPotentialBucket ?? "",
    ]),
  ]);
}

export function buildSuccessionCoverageCsv(rows: SuccessionCoverageReportRow[]): string {
  return csvLines([
    [
      "department",
      "suppressed",
      "positionCount",
      "readyNowCoveredCount",
      "criticalGapCount",
    ],
    ...rows.map((row) => [
      row.department,
      row.suppressed ? "true" : "false",
      row.positionCount ?? "",
      row.readyNowCoveredCount ?? "",
      row.criticalGapCount ?? "",
    ]),
  ]);
}

export function createSuccessionCsvResponse(filename: string, csv: string): Response {
  return createCsvResponse(filename, csv);
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
