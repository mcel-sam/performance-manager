import { describe, expect, it } from "vitest";

import {
  buildCompetencyBreakdownCsv,
  buildGoalsProgressCsv,
  buildProgressSummaryCsv,
  buildRatingsDistributionCsv,
} from "@/server/reporting/reporting-export";

describe("reporting-export", () => {
  it("builds progress summary csv", () => {
    const csv = buildProgressSummaryCsv({
      totals: { notStarted: 2, inProgress: 3, completed: 5 },
      self: { notStarted: 1, inProgress: 2, completed: 7 },
      manager: { notStarted: 4, inProgress: 2, completed: 4 },
      filters: { cycleId: "cycle_1", departments: [], titles: [] },
      suppression: { suppressed: false, message: null },
    });

    expect(csv).toContain("status,total,self,manager");
    expect(csv).toContain("IN_PROGRESS,3,2,2");
  });

  it("builds ratings distribution csv", () => {
    const csv = buildRatingsDistributionCsv({
      ratingSource: "FINAL",
      distribution: { "1": 1, "2": 0, "3": 2, "4": 3, "5": 4 },
      ratedCount: 10,
      sourceSummary: { scorecard: 8, calibration: 1, unset: 1 },
      filters: { cycleId: "cycle_1", departments: [], titles: [] },
      suppression: { suppressed: false, message: null },
    });

    expect(csv).toContain("rating,count,ratingSource");
    expect(csv).toContain("5,4,FINAL");
  });

  it("builds competency breakdown csv", () => {
    const csv = buildCompetencyBreakdownCsv({
      competencies: [
        {
          dimensionKey: "COMMUNICATION",
          distribution: { "1": 0, "2": 1, "3": 2, "4": 1, "5": 0 },
          selfDistribution: { "1": 0, "2": 1, "3": 1, "4": 0, "5": 0 },
          managerDistribution: { "1": 0, "2": 0, "3": 1, "4": 1, "5": 0 },
          notObservedCount: 1,
          observedCount: 4,
          averageRating: 3,
          self: { observedCount: 2, averageRating: 2.5 },
          manager: { observedCount: 2, averageRating: 3.5 },
          departmentBreakdown: [
            {
              department: "Operations",
              observedCount: 4,
              averageRating: 3,
            },
          ],
          selfManagerGap: { comparedCount: 1, averageGap: 1, averageAbsoluteGap: 1 },
        },
      ],
      filters: { cycleId: "cycle_1", departments: [], titles: [] },
      suppression: { suppressed: false, message: null },
    });

    expect(csv).toContain(
      "dimensionKey,averageRating,selfAverage,managerAverage,observedCount,notObservedCount,averageGap,averageAbsoluteGap",
    );
    expect(csv).toContain("COMMUNICATION,3,2.5,3.5,4,1,1,1");
  });

  it("builds goals progress csv", () => {
    const csv = buildGoalsProgressCsv({
      summary: {
        goalCycleName: "FY26 Goals",
        activeGoals: 2,
        offTrackGoals: 1,
        noUpdateGoals: 1,
        completionRate: 50,
      },
      linkage: [],
      trackCoverage: [],
      rows: [
        {
          goalId: "goal_1",
          title: "Improve platform reliability",
          ownerName: "Elliot Employee",
          department: "Operations",
          titleName: "Software Engineer",
          trackId: "track_software",
          trackName: "Software",
          levelName: "Senior",
          status: "ON_TRACK",
          progressPercent: 82,
          updateCount: 2,
          lastUpdateAt: "2026-02-14T00:00:00.000Z",
          competencyNames: ["Communication", "Accountability"],
          keyResults: [
            {
              id: "kr_1",
              title: "Ship roadmap milestone",
              type: "PERCENT",
              currentValue: 75,
              targetValue: 100,
            },
          ],
        },
      ],
      filters: {
        cycleId: "cycle_1",
        track: "track_software",
        departments: ["Operations"],
        titles: ["Software Engineer"],
        tracks: [{ value: "track_software", label: "Software" }],
      },
      suppression: { suppressed: false, message: null },
    });

    expect(csv).toContain(
      "goalTitle,ownerName,department,title,track,level,status,progressPercent,updateCount,lastUpdateAt,competencies,keyResultTitle,keyResultType,keyResultCurrentValue,keyResultTargetValue",
    );
    expect(csv).toContain(
      "Improve platform reliability,Elliot Employee,Operations,Software Engineer,Software,Senior,ON_TRACK,82,2,2026-02-14T00:00:00.000Z,Communication | Accountability,Ship roadmap milestone,PERCENT,75,100",
    );
  });
});
