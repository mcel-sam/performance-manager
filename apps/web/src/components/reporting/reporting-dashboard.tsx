"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { ReviewSubmissionStatus } from "@prisma/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterChip } from "@/components/ui/filter-chip";
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { withReturnTo } from "@/lib/navigation/return-to";
import { reportingChartTheme } from "@/components/reporting/chart-theme";
import type {
  ReportingCompetenciesResponse,
  ReportingCompetencyResult,
  ReportingGoalsResult,
  ReportingManagerOverviewResult,
  ReportingPeopleResult,
  ReportingProgressResult,
  ReportingRatingsResult,
  ReportingScorecardResponse,
} from "@/server/reporting/reporting-service";

type ProgressStatusFilter = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type RatingSourceFilter = "FINAL" | "SCORECARD";
type ReportingTab =
  | "overview"
  | "managers"
  | "queue"
  | "goals"
  | "results"
  | "competencies"
  | "scorecard";

interface ReportingDashboardProps {
  cycleName: string | null;
  selectedTab: ReportingTab;
  selectedCycleId: string;
  selectedDepartment?: string;
  selectedTitle?: string;
  selectedTrack?: string;
  selectedStatus?: ProgressStatusFilter;
  selectedRatingSource: RatingSourceFilter;
  selectedGroupBy?: "department" | "title";
  selectedDimensionKey?: string;
  cycleOptions: Array<{ value: string; label: string }>;
  departmentOptions: string[];
  titleOptions: string[];
  trackOptions: Array<{ value: string; label: string }>;
  tabHrefs: {
    overview: string;
    managers: string;
    queue: string;
    goals: string;
    results: string;
    competencies: string;
    scorecard: string;
  };
  paginationHrefs: {
    previous: string | null;
    next: string | null;
  };
  managerOverview: ReportingManagerOverviewResult;
  progress: ReportingProgressResult;
  goals: ReportingGoalsResult;
  ratingsFinal: ReportingRatingsResult;
  ratingsScorecard: ReportingRatingsResult;
  competencies: ReportingCompetenciesResponse;
  selectedCompetency: ReportingCompetencyResult | null;
  selectedCompetencyDepartment?: string;
  scorecard: ReportingScorecardResponse;
  people: ReportingPeopleResult;
  competencyOrder: string[];
  scorecardOrder: string[];
  csvHrefs: {
    progress: string;
    goals: string;
    ratings: string;
    competencies: string;
  };
}

const submissionStatusLabel: Record<ReviewSubmissionStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Completed",
  RETURNED: "Returned",
};

const progressStatusLabel: Record<ProgressStatusFilter, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const ratingBucketColor: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#0ea5e9",
};

interface CompetencyHeatmapCell {
  dimensionKey: string;
  averageRating: number | null;
  observedCount: number;
}

interface CompetencyHeatmapRow {
  department: string;
  cells: CompetencyHeatmapCell[];
}

interface CompetencyHeatmapHover {
  department: string;
  dimensionLabel: string;
  averageRating: number | null;
  observedCount: number;
}

interface ScorecardMatrixRow {
  metricKey: string;
  label: string;
  self: number | null;
  manager: number | null;
  average: number | null;
  gap: number | null;
  absoluteGap: number | null;
  comparedCount: number;
  observedCount: number;
  notObservedCount: number;
}

interface ScorecardHeatmapHover {
  metricLabel: string;
  columnLabel: string;
  displayValue: string;
  observedCount: number;
  notObservedCount: number;
  comparedCount: number;
}

export function ReportingDashboard({
  cycleName,
  selectedTab,
  selectedCycleId,
  selectedDepartment,
  selectedTitle,
  selectedTrack,
  selectedStatus,
  selectedRatingSource,
  selectedGroupBy = "department",
  selectedDimensionKey,
  cycleOptions,
  departmentOptions,
  titleOptions,
  trackOptions,
  tabHrefs,
  paginationHrefs,
  managerOverview,
  progress,
  goals,
  ratingsFinal,
  ratingsScorecard,
  competencies,
  selectedCompetency,
  selectedCompetencyDepartment,
  scorecard,
  people,
  competencyOrder,
  scorecardOrder,
  csvHrefs,
}: ReportingDashboardProps) {
  const [hiddenRatingSeries, setHiddenRatingSeries] = useState<
    Record<RatingSourceFilter, boolean>
  >({
    FINAL: false,
    SCORECARD: false,
  });

  const totalPeople =
    progress.totals.notStarted + progress.totals.inProgress + progress.totals.completed;

  const ratingsData = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((rating) => ({
        rating,
        FINAL: ratingsFinal.distribution[String(rating) as keyof typeof ratingsFinal.distribution],
        SCORECARD:
          ratingsScorecard.distribution[
            String(rating) as keyof typeof ratingsScorecard.distribution
          ],
      })),
    [ratingsFinal, ratingsScorecard],
  );

  const employeeCsvHref = useMemo(() => buildEmployeeCsvHref(people.rows), [people.rows]);

  const baseFilterQuery = useMemo(
    () => ({
      cycleId: selectedCycleId,
      tab: selectedTab,
      track: selectedTab === "goals" ? selectedTrack : undefined,
      status: selectedTab === "queue" ? selectedStatus : undefined,
      ratingSource: selectedRatingSource,
      groupBy: selectedGroupBy,
      dimensionKey: selectedDimensionKey,
      page: "1",
    }),
    [
      selectedCycleId,
      selectedTab,
      selectedTrack,
      selectedStatus,
      selectedRatingSource,
      selectedGroupBy,
      selectedDimensionKey,
    ],
  );

  const filterChips = useMemo(
    () =>
      [
        selectedDepartment
          ? {
              key: "department",
              label: `Department: ${selectedDepartment}`,
              clearHref: toQueryString({
                ...baseFilterQuery,
                department: undefined,
                title: selectedTitle,
              }),
            }
          : null,
        selectedTitle
          ? {
              key: "title",
              label: `Title: ${selectedTitle}`,
              clearHref: toQueryString({
                ...baseFilterQuery,
                department: selectedDepartment,
                title: undefined,
              }),
            }
          : null,
      ].filter((chip): chip is { key: string; label: string; clearHref: string } => chip !== null),
    [baseFilterQuery, selectedDepartment, selectedTitle],
  );
  const currentReportingHref = useMemo(
    () =>
      toQueryString({
        ...baseFilterQuery,
        department: selectedDepartment,
        title: selectedTitle,
      }),
    [baseFilterQuery, selectedDepartment, selectedTitle],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" data-testid="reporting-dashboard">
      <PageHeader
        title="Reporting"
        description="Monitor cycle progress, manager follow-up, and employee queue status for the selected cycle."
        metadata={
          cycleName ? (
            <span>
              Active cycle: <strong>{cycleName}</strong>
            </span>
          ) : null
        }
      />

      <FilterBar
        method="get"
        data-testid="reporting-filter-bar"
        description="Refine the cycle scope, then move between completion, manager follow-up, and employee queue views."
        chips={
          filterChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2" data-testid="reporting-filter-chips">
              {filterChips.map((chip) => (
                <FilterChip
                  key={chip.key}
                  data-testid={`reporting-filter-chip-${chip.key}`}
                  clearHref={chip.clearHref}
                  clearTestId={`reporting-filter-chip-clear-${chip.key}`}
                  clearLabel={`Clear ${chip.key} filter`}
                >
                  {chip.label}
                </FilterChip>
              ))}
            </div>
          ) : null
        }
      >
        <input type="hidden" name="tab" value={selectedTab} />
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="groupBy" value={selectedGroupBy} />
        {selectedDimensionKey ? (
          <input type="hidden" name="dimensionKey" value={selectedDimensionKey} />
        ) : null}
        {selectedCompetencyDepartment ? (
          <input type="hidden" name="competencyDepartment" value={selectedCompetencyDepartment} />
        ) : null}

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Cycle
          <Select name="cycleId" defaultValue={selectedCycleId} data-testid="reporting-cycle-select">
            {cycleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Department
          <Select
            name="department"
            defaultValue={selectedDepartment ?? ""}
            data-testid="reporting-filter-department"
          >
            <option value="">All departments</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Title
          <Select name="title" defaultValue={selectedTitle ?? ""} data-testid="reporting-filter-title">
            <option value="">All titles</option>
            {titleOptions.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex items-end">
          <Button type="submit" className="w-full" data-testid="reporting-apply-filters">
            Apply filters
          </Button>
        </div>
      </FilterBar>

      <section className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-1">
          <Link
            href={tabHrefs.overview}
            data-testid="reporting-tab-overview"
            className={tabClassName(selectedTab === "overview")}
          >
            Overview
          </Link>
          <Link
            href={tabHrefs.managers}
            data-testid="reporting-tab-managers"
            className={tabClassName(selectedTab === "managers")}
          >
            Managers
          </Link>
          <Link
            href={tabHrefs.queue}
            data-testid="reporting-tab-queue"
            className={tabClassName(selectedTab === "queue")}
          >
            Employee queue
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="text-slate-500">Scope</span>
          <span data-testid="reporting-current-department">{selectedDepartment ?? "All departments"}</span>
          {" • "}
          <span data-testid="reporting-current-title">{selectedTitle ?? "All titles"}</span>
        </div>
      </section>

      {selectedTab === "overview" ? (
        <OverviewTab
          progress={progress}
          totalPeople={totalPeople}
          csvHref={csvHrefs.progress}
        />
      ) : null}

      {selectedTab === "managers" ? (
        <ManagerAccountabilitySection
          managerOverview={managerOverview}
          currentReportingHref={currentReportingHref}
        />
      ) : null}

      {selectedTab === "queue" ? (
        <EmployeeQueueTab
          selectedCycleId={selectedCycleId}
          selectedDepartment={selectedDepartment}
          selectedTitle={selectedTitle}
          selectedStatus={selectedStatus}
          selectedRatingSource={selectedRatingSource}
          selectedGroupBy={selectedGroupBy}
          people={people}
          paginationHrefs={paginationHrefs}
          employeeCsvHref={employeeCsvHref}
          currentReportingHref={currentReportingHref}
        />
      ) : null}

      {selectedTab === "goals" ? (
        <GoalsTab goals={goals} selectedTrack={selectedTrack} csvHref={csvHrefs.goals} />
      ) : null}

      {selectedTab === "results" ? (
        <ResultsTab
          ratingsFinal={ratingsFinal}
          ratingsScorecard={ratingsScorecard}
          ratingsData={ratingsData}
          selectedRatingSource={selectedRatingSource}
          csvHref={csvHrefs.ratings}
          hiddenSeries={hiddenRatingSeries}
          onToggleSeries={(source) =>
            setHiddenRatingSeries((previous) => ({
              ...previous,
              [source]: !previous[source],
            }))
          }
        />
      ) : null}

      {selectedTab === "competencies" ? (
        <CompetenciesTab
          competencies={competencies}
          selectedCompetency={selectedCompetency}
          selectedCompetencyDepartment={selectedCompetencyDepartment}
          competencyOrder={competencyOrder}
          cycleId={selectedCycleId}
          selectedDepartment={selectedDepartment}
          selectedTitle={selectedTitle}
          selectedRatingSource={selectedRatingSource}
          selectedGroupBy={selectedGroupBy}
          csvHref={csvHrefs.competencies}
        />
      ) : null}

      {selectedTab === "scorecard" ? (
        <ScorecardTab scorecard={scorecard} scorecardOrder={scorecardOrder} />
      ) : null}
    </div>
  );
}

function OverviewTab({
  progress,
  totalPeople,
  csvHref,
}: {
  progress: ReportingProgressResult;
  totalPeople: number;
  csvHref: string;
}) {
  if (progress.suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={
          progress.suppression.message ??
          "Widen the filter scope to view aggregate progress safely."
        }
      />
    );
  }

  const statusMix = (Object.keys(progressStatusLabel) as ProgressStatusFilter[]).map((status) => ({
    status,
    label: progressStatusLabel[status],
    value: progress.totals[toProgressKey(status)],
    color:
      status === "NOT_STARTED"
        ? reportingChartTheme.progress.notStarted
        : status === "IN_PROGRESS"
          ? reportingChartTheme.progress.inProgress
      : reportingChartTheme.progress.completed,
  }));
  const completionRate =
    totalPeople > 0 ? Math.round((progress.totals.completed / totalPeople) * 100) : 0;

  return (
    <section className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Not started"
          value={progress.totals.notStarted}
          caption="No self or manager progress yet"
          accentColor={reportingChartTheme.progress.notStarted}
          trendLabel="Focus"
        />
        <MetricCard
          title="In progress"
          value={progress.totals.inProgress}
          caption="At least one review is underway"
          accentColor={reportingChartTheme.progress.inProgress}
          trendLabel="Active"
        />
        <MetricCard
          title="Completed"
          value={progress.totals.completed}
          caption="Self and manager submitted"
          accentColor={reportingChartTheme.progress.completed}
          trendLabel="Stable"
        />
        <MetricCard
          title="Self in progress"
          value={progress.self.inProgress}
          caption="Employee draft activity"
          accentColor="#38bdf8"
          trendLabel="Monitor"
        />
        <MetricCard
          title="Manager in progress"
          value={progress.manager.inProgress}
          caption="Manager draft activity"
          accentColor="#22c55e"
          trendLabel="Monitor"
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Completion overview</CardTitle>
              <CardDescription>
                One view for the current cycle scope. Use the employee queue tab for person-level
                follow-up by status.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void downloadChartAsPng("reporting-progress-chart", "reporting-progress-chart.png")
                }
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label="Download status mix chart as PNG"
                data-testid="reporting-download-progress-png"
              >
                Download PNG
              </button>
              <a
                href={csvHref}
                download="reporting-progress-summary.csv"
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Export progress CSV
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartExportContainer chartId="reporting-progress-chart" className="space-y-4 p-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_320px]">
              <div className="space-y-4">
                <ProgressMixSvg totalPeople={totalPeople} segments={statusMix} />
                <div className="grid gap-3 sm:grid-cols-3">
                  {statusMix.map((segment) => {
                    const segmentPercent =
                      totalPeople > 0 ? Math.round((segment.value / totalPeople) * 100) : 0;

                    return (
                      <div
                        key={`progress-summary-${segment.status}`}
                        data-testid={`reporting-progress-summary-${segment.status}`}
                        className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: segment.color }}
                            />
                            {segment.label}
                          </span>
                          <span className="text-xs text-slate-500">{segmentPercent}%</span>
                        </div>
                        <p className="mt-3 text-2xl font-semibold text-slate-900">{segment.value}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {segment.value === 1 ? "employee" : "employees"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <MiniInsightCard
                  title="Completion rate"
                  value={`${completionRate}%`}
                  subtitle={`${progress.totals.completed} of ${totalPeople} employees completed both reviews.`}
                />
                <MiniInsightCard
                  title="Employee draft activity"
                  value={String(progress.self.inProgress)}
                  subtitle="Self reviews started but not yet completed."
                />
                <MiniInsightCard
                  title="Manager draft activity"
                  value={String(progress.manager.inProgress)}
                  subtitle="Manager reviews currently in motion."
                />
              </div>
            </div>
          </ChartExportContainer>

          <HelpHint label="What counts as In progress?">
            In progress means either the self review or manager review has started, but both are
            not submitted yet.
          </HelpHint>
        </CardContent>
      </Card>
    </section>
  );
}

function ManagerAccountabilitySection({
  managerOverview,
  currentReportingHref,
}: {
  managerOverview: ReportingManagerOverviewResult;
  currentReportingHref: string;
}) {
  const [selectedManagerKey, setSelectedManagerKey] = useState<string | null>(null);
  const defaultManagerKey =
    managerOverview.rows.find((row) => row.pendingManagerReviewCount > 0)?.managerKey ??
    managerOverview.rows[0]?.managerKey ??
    null;
  const selectedManager =
    managerOverview.rows.find((row) => row.managerKey === selectedManagerKey) ??
    managerOverview.rows.find((row) => row.managerKey === defaultManagerKey) ??
    null;

  if (managerOverview.suppression.suppressed) {
    return null;
  }

  return (
    <section className="space-y-4" data-testid="reporting-manager-overview">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniInsightCard
          title="Managers in scope"
          value={String(managerOverview.summary.totalManagers)}
          subtitle={`${managerOverview.summary.totalDirectReports} direct reports across the current filter set.`}
        />
        <MiniInsightCard
          title="Managers with pending"
          value={String(managerOverview.summary.managersWithPendingReviews)}
          subtitle="At least one direct report still needs a manager review action."
        />
        <MiniInsightCard
          title="Pending manager reviews"
          value={String(managerOverview.summary.pendingManagerReviews)}
          subtitle="Awaiting plus in-progress manager reviews."
        />
        <MiniInsightCard
          title="Overdue manager reviews"
          value={String(managerOverview.summary.overdueManagerReviews)}
          subtitle="Past due and not yet submitted."
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Manager accountability</CardTitle>
              <CardDescription>
                This view is for HR follow-up, not org trend analysis. Select a manager row to
                drill into their direct-report review queue.
              </CardDescription>
            </div>
            {selectedManager ? <Badge variant="info">Focused: {selectedManager.managerName}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {managerOverview.rows.length === 0 ? (
            <EmptyState
              title="No manager data in scope"
              description="Adjust filters to include employees with assigned managers."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Manager</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Scope</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Direct reports</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Pending</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Awaiting</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">In progress</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Overdue</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Completed</th>
                      <th className="border-b border-slate-200 px-4 py-3 font-semibold">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managerOverview.rows.map((row) => {
                      const isActive = selectedManager?.managerKey === row.managerKey;

                      return (
                        <tr
                          key={row.managerKey}
                          data-testid="reporting-manager-row"
                          className={isActive ? "bg-slate-900 text-white" : "bg-white"}
                        >
                          <td className="border-b border-slate-200 px-4 py-3 align-top">
                            <button
                              type="button"
                              onClick={() => setSelectedManagerKey(row.managerKey)}
                              className={[
                                "text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                                isActive ? "text-white" : "text-slate-900 hover:text-slate-700",
                              ].join(" ")}
                            >
                              <span className="block font-semibold">{row.managerName}</span>
                              <span
                                className={[
                                  "mt-1 block text-xs",
                                  isActive ? "text-slate-200" : "text-slate-500",
                                ].join(" ")}
                              >
                                Click to drill into direct reports
                              </span>
                            </button>
                          </td>
                          <td
                            className={[
                              "border-b border-slate-200 px-4 py-3 align-top text-xs",
                              isActive ? "text-slate-200" : "text-slate-600",
                            ].join(" ")}
                          >
                            {row.departments.length > 0 ? row.departments.join(", ") : "Unspecified"}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3 font-semibold">
                            {row.directReportCount}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3 font-semibold">
                            {row.pendingManagerReviewCount}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3">
                            {row.awaitingManagerReviewCount}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3">
                            {row.inProgressManagerReviewCount}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3">
                            {row.overdueManagerReviewCount}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3">
                            {row.completedManagerReviewCount}
                          </td>
                          <td className="border-b border-slate-200 px-4 py-3">
                            {row.completionRate.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedManager ? (
                <div
                  className="grid gap-4 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[280px_minmax(0,1fr)]"
                  data-testid="reporting-manager-drilldown"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Selected manager
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {selectedManager.managerName}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {selectedManager.directReportCount} direct reports across{" "}
                        {selectedManager.departments.length || 1} scope area
                        {selectedManager.departments.length === 1 ? "" : "s"}.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <MiniInsightCard
                        title="Pending"
                        value={String(selectedManager.pendingManagerReviewCount)}
                        subtitle="Awaiting plus in-progress manager reviews."
                      />
                      <MiniInsightCard
                        title="Overdue"
                        value={String(selectedManager.overdueManagerReviewCount)}
                        subtitle="Past due and still not submitted."
                      />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {selectedManager.reports.map((report) => (
                      <article
                        key={report.employeeId}
                        className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-xs)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">{report.employeeName}</h4>
                            <p className="text-sm text-slate-600">
                              {report.department} · {report.title}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <p>Overall</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {progressStatusLabel[report.overallStatus]}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={overallStatusBadgeVariant(report.overallStatus)}>
                            {progressStatusLabel[report.overallStatus]}
                          </Badge>
                          <Badge variant="neutral">Self {submissionStatusLabel[report.selfStatus]}</Badge>
                          <Badge variant="neutral">
                            Manager {submissionStatusLabel[report.managerStatus]}
                          </Badge>
                          {report.managerDueAt ? (
                            <Badge variant="info">Due {formatShortDate(report.managerDueAt)}</Badge>
                          ) : null}
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-500">
                            Review packet detail stays limited to participant and manager workflows.
                          </p>
                          {report.links.packet ? (
                            <Link
                              href={withReturnTo(report.links.packet, currentReportingHref)}
                              className="text-xs font-medium text-slate-700 underline underline-offset-2"
                            >
                              Open packet
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}

          <HelpHint label="How pending is counted">
            Awaiting includes Not Started and Returned manager reviews. Overdue is a subset of
            pending where the manager due date has passed.
          </HelpHint>
        </CardContent>
      </Card>
    </section>
  );
}

function EmployeeQueueTab({
  selectedCycleId,
  selectedDepartment,
  selectedTitle,
  selectedStatus,
  selectedRatingSource,
  selectedGroupBy,
  people,
  paginationHrefs,
  employeeCsvHref,
  currentReportingHref,
}: {
  selectedCycleId: string;
  selectedDepartment?: string;
  selectedTitle?: string;
  selectedStatus?: ProgressStatusFilter;
  selectedRatingSource: RatingSourceFilter;
  selectedGroupBy: "department" | "title";
  people: ReportingPeopleResult;
  paginationHrefs: {
    previous: string | null;
    next: string | null;
  };
  employeeCsvHref: string;
  currentReportingHref: string;
}) {
  const queueFilterOptions: Array<{
    label: string;
    status?: ProgressStatusFilter;
    testId: string;
  }> = [
    {
      label: "All statuses",
      status: undefined,
      testId: "reporting-queue-filter-all",
    },
    {
      label: "Not started",
      status: "NOT_STARTED",
      testId: "reporting-queue-filter-NOT_STARTED",
    },
    {
      label: "In progress",
      status: "IN_PROGRESS",
      testId: "reporting-queue-filter-IN_PROGRESS",
    },
    {
      label: "Completed",
      status: "COMPLETED",
      testId: "reporting-queue-filter-COMPLETED",
    },
  ];

  const queueStatusDescription = selectedStatus
    ? `Showing ${progressStatusLabel[selectedStatus].toLowerCase()} employees in the current reporting scope.`
    : "Choose a queue status to narrow follow-up work without affecting the overview or manager views.";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Employee queue</CardTitle>
            <CardDescription>{queueStatusDescription}</CardDescription>
          </div>
          {people.rows.length > 0 ? (
            <a
              href={employeeCsvHref}
              download="reporting-employee-queue.csv"
              className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Export queue CSV
            </a>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2" data-testid="reporting-queue-filter-bar">
            {queueFilterOptions.map((option) => (
              <Link
                key={option.testId}
                href={toQueryString({
                  cycleId: selectedCycleId,
                  department: selectedDepartment,
                  title: selectedTitle,
                  status: option.status,
                  ratingSource: selectedRatingSource,
                  groupBy: selectedGroupBy,
                  tab: "queue",
                  page: "1",
                })}
                data-testid={option.testId}
                className={tabClassName(selectedStatus === option.status)}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-500">Queue filters stay local to this operational view.</p>
        </div>

        {people.rows.length === 0 ? (
          <EmptyState
            title="No employees match this queue"
            description="Try a different queue status or widen the reporting scope."
          />
        ) : (
          <div className="grid gap-3">
            {people.rows.map((row) => (
              <article
                key={row.employeeId}
                data-testid="reporting-employee-row"
                className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-xs)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{row.employeeName}</h3>
                    <p className="text-sm text-slate-600">
                      {row.department} · {row.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Rating
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {row.finalRating ? `Final ${row.finalRating}` : "No final rating"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.finalRatingSource
                        ? humanizeEnumValue(row.finalRatingSource)
                        : "Pending source"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={overallStatusBadgeVariant(row.overallStatus)}>
                    {progressStatusLabel[row.overallStatus]}
                  </Badge>
                  <Badge variant="neutral">Self {submissionStatusLabel[row.selfStatus]}</Badge>
                  <Badge variant="neutral">Manager {submissionStatusLabel[row.managerStatus]}</Badge>
                  <Badge variant="info">
                    {typeof row.scorecardPercent === "number"
                      ? `${row.scorecardPercent.toFixed(1)}% scorecard`
                      : "No scorecard"}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500">
                    Operational follow-up links for the selected employee record.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700">
                    {row.links.packet ? (
                      <Link
                        href={withReturnTo(row.links.packet, currentReportingHref)}
                        className="underline underline-offset-2"
                      >
                        Packet
                      </Link>
                    ) : null}
                    {row.links.calibrationSession ? (
                      <Link
                        href={withReturnTo(row.links.calibrationSession, currentReportingHref)}
                        className="underline underline-offset-2"
                      >
                        Calibration
                      </Link>
                    ) : null}
                    {row.links.improvementPlan ? (
                      <Link
                        href={withReturnTo(row.links.improvementPlan, currentReportingHref)}
                        className="underline underline-offset-2"
                      >
                        Plan
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <span data-testid="reporting-table-row-count">
            Showing {people.rows.length} rows on this page (Page {people.pagination.page} of{" "}
            {Math.max(people.pagination.totalPages, 1)}; {people.pagination.totalRows} employees
            total)
          </span>
          <div className="flex items-center gap-2">
            {paginationHrefs.previous ? (
              <Link
                href={paginationHrefs.previous}
                className="text-xs font-medium text-slate-700 underline underline-offset-2"
              >
                Previous
              </Link>
            ) : (
              <span className="text-xs text-slate-400">Previous</span>
            )}
            {paginationHrefs.next ? (
              <Link
                href={paginationHrefs.next}
                className="text-xs font-medium text-slate-700 underline underline-offset-2"
              >
                Next
              </Link>
            ) : (
              <span className="text-xs text-slate-400">Next</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalsTab({
  goals,
  selectedTrack,
  csvHref,
}: {
  goals: ReportingGoalsResult;
  selectedTrack?: string;
  csvHref: string;
}) {
  if (goals.suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={
          goals.suppression.message ??
          "Widen the goal reporting scope to view adoption and progress safely."
        }
      />
    );
  }

  const visibleGoals = goals.rows.slice(0, 8);
  const atRiskGoals = goals.rows.filter(
    (goal) => goal.status === "AT_RISK" || goal.status === "OFF_TRACK",
  );
  const mappedCycleLabel = goals.summary.goalCycleName ?? "No mapped goal cycle";
  const strongestLinkage = goals.linkage[0] ?? null;
  const broadestTrackCoverage = goals.trackCoverage[0] ?? null;

  return (
    <section className="space-y-4" data-testid="reporting-goals-overview">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MiniInsightCard
          title="Active goals"
          value={String(goals.summary.activeGoals)}
          subtitle={`Across ${goals.rows.length} scoped objectives in ${mappedCycleLabel}.`}
        />
        <MiniInsightCard
          title="Off track"
          value={String(goals.summary.offTrackGoals)}
          subtitle="Goals already marked off track and needing leadership attention."
        />
        <MiniInsightCard
          title="No updates"
          value={String(goals.summary.noUpdateGoals)}
          subtitle="Goals without any check-in yet in the mapped goal cycle."
        />
        <MiniInsightCard
          title="Completion rate"
          value={`${goals.summary.completionRate}%`}
          subtitle="Share of scoped goals already marked complete."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Goals adoption</CardTitle>
                <CardDescription>
                  Track objective health, updates, and competency tagging for the goal cycle mapped
                  to the selected review cycle.
                </CardDescription>
              </div>
              <a
                href={csvHref}
                download="reporting-goals-progress.csv"
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Export goals CSV
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Goal cycle
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{mappedCycleLabel}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Derived from the review cycle selection to keep the reporting flow flat.
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Track focus
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {selectedTrack
                    ? goals.filters.tracks.find((track) => track.value === selectedTrack)?.label ??
                      selectedTrack
                    : "All tracks"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Use the track filter when HR wants adoption by job architecture slice.
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Highest risk pocket
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {atRiskGoals[0]?.title ?? "No at-risk goals"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {atRiskGoals[0]
                    ? `${atRiskGoals[0].ownerName} · ${atRiskGoals[0].department}`
                    : "No goals are currently marked at risk or off track."}
                </p>
              </div>
            </div>

            {visibleGoals.length === 0 ? (
              <EmptyState
                title="No goals in scope"
                description="Adjust department, title, or track filters to include active goals."
              />
            ) : (
              <div className="grid gap-3">
                {visibleGoals.map((goal) => (
                  <article
                    key={goal.goalId}
                    data-testid="reporting-goal-row"
                    className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-4 shadow-[var(--shadow-xs)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{goal.title}</h3>
                          <Badge variant={goalStatusBadgeVariant(goal.status)}>
                            {humanizeEnumValue(goal.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {goal.ownerName} · {goal.department} · {goal.titleName}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="neutral">
                            {goal.trackName} · {goal.levelName}
                          </Badge>
                          <Badge variant="info">
                            {goal.updateCount} {goal.updateCount === 1 ? "update" : "updates"}
                          </Badge>
                          <Badge variant="neutral">
                            {goal.keyResults.length}{" "}
                            {goal.keyResults.length === 1 ? "key result" : "key results"}
                          </Badge>
                        </div>
                      </div>

                      <div className="min-w-[180px] flex-1 max-w-[240px]">
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                          <span>Progress</span>
                          <span>{goal.progressPercent}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full transition-[width]"
                            style={{
                              width: `${Math.max(0, Math.min(goal.progressPercent, 100))}%`,
                              backgroundColor: goalProgressColor(goal.status, goal.progressPercent),
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {goal.lastUpdateAt
                            ? `Last update ${formatShortDate(goal.lastUpdateAt)}`
                            : "No check-ins recorded yet"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Competency tags
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {goal.competencyNames.length > 0
                            ? goal.competencyNames.join(", ")
                            : "No competency linkage yet."}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Key result scope
                        </p>
                        <div className="mt-2 space-y-1.5 text-sm text-slate-700">
                          {goal.keyResults.slice(0, 2).map((keyResult) => (
                            <p key={keyResult.id}>
                              {keyResult.title} · {humanizeEnumValue(keyResult.type)}
                            </p>
                          ))}
                          {goal.keyResults.length > 2 ? (
                            <p className="text-xs text-slate-500">
                              +{goal.keyResults.length - 2} more key results in export.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {goals.rows.length > visibleGoals.length ? (
              <p className="text-xs text-slate-500">
                Showing the first {visibleGoals.length} goals in the UI. Export CSV for the full
                scoped dataset.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Competency linkage</CardTitle>
              <CardDescription>
                Goals tagged to competencies, with average progress and risk signal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.linkage.length === 0 ? (
                <EmptyState
                  title="No competency tags yet"
                  description="Tagged goals will show how objective work aligns to capability expectations."
                />
              ) : (
                <>
                  {strongestLinkage ? (
                    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Most linked competency
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {strongestLinkage.competencyName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {strongestLinkage.goalCount} linked goals · {formatNumber(strongestLinkage.averageProgress)} average progress
                      </p>
                    </div>
                  ) : null}

                  {goals.linkage.slice(0, 5).map((link) => (
                    <div
                      key={link.competencyId}
                      className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{link.competencyName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {link.goalCount} linked goals
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>Avg progress</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatNumber(link.averageProgress)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="success">{link.onTrackCount} on track</Badge>
                        <Badge variant="warning">{link.offTrackCount} off track</Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Track coverage</CardTitle>
              <CardDescription>
                Track and level slices using assigned grow tracks first, with role baseline fallback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.trackCoverage.length === 0 ? (
                <EmptyState
                  title="No track coverage in scope"
                  description="Track and level coverage appears once goals map to assigned or inferred tracks."
                />
              ) : (
                <>
                  {broadestTrackCoverage ? (
                    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Broadest footprint
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {broadestTrackCoverage.trackName} · {broadestTrackCoverage.levelName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {broadestTrackCoverage.employeeCount} employees · {broadestTrackCoverage.goalCount} goals
                      </p>
                    </div>
                  ) : null}

                  {goals.trackCoverage.slice(0, 5).map((coverage) => (
                    <div
                      key={`${coverage.trackId}-${coverage.levelName}`}
                      className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {coverage.trackName} · {coverage.levelName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {coverage.departments.join(", ")}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>{coverage.employeeCount} employees</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {coverage.goalCount} goals
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500">{coverage.titles.join(", ")}</p>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <HelpHint label="How adoption is calculated">
        Active goals exclude completed and canceled objectives. No updates counts goals with zero
        check-ins. Completion rate is goal-level completion, not key-result completion.
      </HelpHint>
    </section>
  );
}

function ResultsTab({
  ratingsFinal,
  ratingsScorecard,
  ratingsData,
  selectedRatingSource,
  csvHref,
  hiddenSeries,
  onToggleSeries,
}: {
  ratingsFinal: ReportingRatingsResult;
  ratingsScorecard: ReportingRatingsResult;
  ratingsData: Array<{ rating: number; FINAL: number; SCORECARD: number }>;
  selectedRatingSource: RatingSourceFilter;
  csvHref: string;
  hiddenSeries: Record<RatingSourceFilter, boolean>;
  onToggleSeries: (source: RatingSourceFilter) => void;
}) {
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setShowChart(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const suppression =
    selectedRatingSource === "FINAL" ? ratingsFinal.suppression : ratingsScorecard.suppression;

  if (suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={
          suppression.message ?? "Widen the filter scope to view rating distributions safely."
        }
      />
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Rating distribution</CardTitle>
              <CardDescription>
                Compare final ratings against scorecard baseline by rating bucket.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void downloadChartAsPng("reporting-ratings-chart", "reporting-ratings-chart.png")
                }
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label="Download rating distribution chart as PNG"
                data-testid="reporting-download-results-png"
              >
                Download PNG
              </button>
              <a
                href={csvHref}
                download="reporting-ratings-distribution.csv"
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Export ratings CSV
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChartExportContainer chartId="reporting-ratings-chart" className="p-3">
            <div className="h-60">
              {showChart ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={240}>
                  <BarChart data={ratingsData} margin={{ top: 12, right: 12, left: 6, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="rating" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                    <Tooltip
                      formatter={(value: number | undefined, name: string | undefined) => [
                        value ?? 0,
                        name === "FINAL" ? "Final" : "Scorecard baseline",
                      ]}
                      labelFormatter={(value) => `Rating ${value}`}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "FINAL" ? "Final" : "Scorecard baseline"
                      }
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Bar
                      dataKey="FINAL"
                      fill={reportingChartTheme.ratingSource.FINAL}
                      hide={hiddenSeries.FINAL}
                      animationDuration={450}
                    />
                    <Bar
                      dataKey="SCORECARD"
                      fill={reportingChartTheme.ratingSource.SCORECARD}
                      hide={hiddenSeries.SCORECARD}
                      animationDuration={450}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Skeleton className="h-full rounded-[var(--radius-sm)]" />
              )}
            </div>
          </ChartExportContainer>

          <div className="flex flex-wrap gap-2">
            {(["FINAL", "SCORECARD"] as RatingSourceFilter[]).map((source) => (
              <button
                key={`results-legend-${source}`}
                type="button"
                aria-label={`Toggle ${source === "FINAL" ? "final" : "scorecard baseline"} series`}
                data-testid={`reporting-results-legend-${source}`}
                onClick={() => onToggleSeries(source)}
                className={legendButtonClassName(!hiddenSeries[source])}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      source === "FINAL"
                        ? reportingChartTheme.ratingSource.FINAL
                        : reportingChartTheme.ratingSource.SCORECARD,
                  }}
                />
                {source === "FINAL" ? "Final" : "Scorecard baseline"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {ratingsData.map((item) => (
              <div
                key={`rating-summary-${item.rating}`}
                className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ratingBucketColor[item.rating] }}
                  />
                  Rating {item.rating}
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <p className="flex items-center justify-between gap-2">
                    <span>Final</span>
                    <strong className="text-slate-900">{item.FINAL}</strong>
                  </p>
                  <p className="flex items-center justify-between gap-2">
                    <span>Scorecard</span>
                    <strong className="text-slate-900">{item.SCORECARD}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <HelpHint label="Final vs scorecard baseline">
            Final reflects the currently active final rating source. Scorecard baseline shows the
            scorecard-derived rating before calibration overrides.
          </HelpHint>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source breakdown</CardTitle>
          <CardDescription>
            Final vs scorecard baseline source counts across included reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <SourceSummaryRow
            label="Final (rated)"
            value={ratingsFinal.ratedCount}
            color={reportingChartTheme.ratingSource.FINAL}
          />
          <SourceSummaryRow
            label="Scorecard baseline (rated)"
            value={ratingsScorecard.ratedCount}
            color={reportingChartTheme.ratingSource.SCORECARD}
          />
          <SourceSummaryRow
            label="Calibration source"
            value={ratingsFinal.sourceSummary.calibration}
            color="#f59e0b"
          />
          <SourceSummaryRow
            label="Scorecard source"
            value={ratingsFinal.sourceSummary.scorecard}
            color="#22c55e"
          />
          <SourceSummaryRow
            label="Unset source"
            value={ratingsFinal.sourceSummary.unset}
            color="#94a3b8"
          />
        </CardContent>
      </Card>
    </section>
  );
}

function CompetenciesTab({
  competencies,
  selectedCompetency,
  selectedCompetencyDepartment,
  competencyOrder,
  cycleId,
  selectedDepartment,
  selectedTitle,
  selectedRatingSource,
  selectedGroupBy,
  csvHref,
}: {
  competencies: ReportingCompetenciesResponse;
  selectedCompetency: ReportingCompetencyResult | null;
  selectedCompetencyDepartment?: string;
  competencyOrder: string[];
  cycleId: string;
  selectedDepartment?: string;
  selectedTitle?: string;
  selectedRatingSource: RatingSourceFilter;
  selectedGroupBy: "department" | "title";
  csvHref: string;
}) {
  const [hoveredCell, setHoveredCell] = useState<CompetencyHeatmapHover | null>(null);
  const [showDistributionChart, setShowDistributionChart] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setShowDistributionChart(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  if (competencies.suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={
          competencies.suppression.message ?? "Widen filters to unlock competency insights safely."
        }
      />
    );
  }

  const rows = buildCompetencyHeatmapRows(competencies.competencies, competencyOrder);
  const ratedCompetencies = competencies.competencies.filter((item) => item.observedCount > 0);
  const strongestCompetency =
    [...ratedCompetencies].sort((left, right) => (right.averageRating ?? 0) - (left.averageRating ?? 0))[0] ??
    null;
  const weakestCompetency =
    [...ratedCompetencies].sort((left, right) => (left.averageRating ?? 0) - (right.averageRating ?? 0))[0] ??
    null;
  const widestGapCompetency =
    [...ratedCompetencies].sort(
      (left, right) =>
        (right.selfManagerGap.averageAbsoluteGap ?? 0) - (left.selfManagerGap.averageAbsoluteGap ?? 0),
    )[0] ?? null;
  const clearFocusHref = toQueryString({
    cycleId,
    department: selectedDepartment,
    title: selectedTitle,
    ratingSource: selectedRatingSource,
    groupBy: selectedGroupBy,
    tab: "competencies",
    page: "1",
  });
  const departmentComparison =
    selectedCompetency != null
      ? buildDepartmentComparisonRows(
          selectedCompetency.departmentBreakdown,
          selectedCompetencyDepartment,
        )
      : [];
  const strongestDepartment = departmentComparison[0] ?? null;
  const weakestDepartment =
    departmentComparison.length > 0
      ? departmentComparison[departmentComparison.length - 1]
      : null;
  const focusedDepartment =
    selectedCompetencyDepartment != null
      ? departmentComparison.find((item) => item.department === selectedCompetencyDepartment) ?? null
      : null;

  return (
    <section className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <MiniInsightCard
          title="Strongest signal"
          value={strongestCompetency ? humanizeEnumValue(strongestCompetency.dimensionKey) : "No data"}
          subtitle={
            strongestCompetency
              ? `Average ${formatNumber(strongestCompetency.averageRating)} across ${strongestCompetency.observedCount} observed responses.`
              : "Add more completed reviews to unlock competency signal."
          }
        />
        <MiniInsightCard
          title="Lowest confidence area"
          value={weakestCompetency ? humanizeEnumValue(weakestCompetency.dimensionKey) : "No data"}
          subtitle={
            weakestCompetency
              ? `Average ${formatNumber(weakestCompetency.averageRating)} with ${weakestCompetency.notObservedCount} not observed responses.`
              : "No competency responses in the current scope."
          }
        />
        <MiniInsightCard
          title="Largest self-manager gap"
          value={widestGapCompetency ? humanizeEnumValue(widestGapCompetency.dimensionKey) : "No data"}
          subtitle={
            widestGapCompetency
              ? `Absolute gap ${formatNumber(widestGapCompetency.selfManagerGap.averageAbsoluteGap)} across ${widestGapCompetency.selfManagerGap.comparedCount} paired reviews.`
              : "No paired self and manager competency scores."
          }
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Competency heatmap</CardTitle>
              <CardDescription>
                A proper department-by-competency matrix. Hover for exact values, then click a cell
                to focus the competency detail panel below.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void downloadChartAsPng(
                    "reporting-competency-heatmap",
                    "reporting-competency-heatmap.png",
                  )
                }
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                aria-label="Download competency heatmap as PNG"
                data-testid="reporting-download-competency-png"
              >
                Download PNG
              </button>
              <a
                href={csvHref}
                download="reporting-competency-breakdown.csv"
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Export competencies CSV
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <EmptyState
              title="No competency data"
              description="Adjust filters to include departments with observed competency responses."
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              <ChartExportContainer chartId="reporting-competency-heatmap" className="overflow-x-auto p-4">
                <CompetencyHeatmapSvg
                  rows={rows}
                  competencyOrder={competencyOrder}
                  cycleId={cycleId}
                  selectedDepartment={selectedDepartment}
                  selectedTitle={selectedTitle}
                  selectedRatingSource={selectedRatingSource}
                  selectedGroupBy={selectedGroupBy}
                  activeDimensionKey={selectedCompetency?.dimensionKey ?? null}
                  activeDepartment={selectedCompetencyDepartment ?? null}
                  onHoverChange={setHoveredCell}
                />
              </ChartExportContainer>
              <HeatmapHoverCard
                eyebrow="Hovered cell"
                title={
                  hoveredCell
                    ? `${hoveredCell.department} · ${hoveredCell.dimensionLabel}`
                    : "Move across the matrix"
                }
                description={
                  hoveredCell
                    ? `Average ${formatNumber(hoveredCell.averageRating)} from ${hoveredCell.observedCount} observed responses.`
                    : "Each cell is a department/competency intersection. Click a cell to pin the competency detail below."
                }
                secondaryText={
                  selectedCompetency && !hoveredCell
                    ? `Focused competency: ${humanizeEnumValue(selectedCompetency.dimensionKey)}`
                    : undefined
                }
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <HeatmapLegend label="Needs support 1.0-2.4" swatch={getCompetencyHeatColor(2)} />
            <HeatmapLegend label="Watch closely 2.5-3.4" swatch={getCompetencyHeatColor(3)} />
            <HeatmapLegend label="Strong signal 3.5-5.0" swatch={getCompetencyHeatColor(4.4)} />
          </div>
        </CardContent>
      </Card>

      {selectedCompetency ? (
        <Card data-testid="reporting-competency-drilldown">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{humanizeEnumValue(selectedCompetency.dimensionKey)}</CardTitle>
                <CardDescription>
                  Department comparison stays in the drilldown because you clicked a
                  department-by-competency cell. The department view uses ranked bars instead of a
                  line because departments are categorical, not sequential.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void downloadChartAsPng(
                      "reporting-competency-drilldown-chart",
                      `reporting-competency-${selectedCompetency.dimensionKey.toLowerCase()}.png`,
                    )
                  }
                  className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Download PNG
                </button>
                <Link
                  href={clearFocusHref}
                  className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  Clear focus
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MiniInsightCard
                title="Overall average"
                value={formatNumber(selectedCompetency.averageRating)}
                subtitle={`${selectedCompetency.observedCount} observed responses`}
              />
              <MiniInsightCard
                title="Self average"
                value={formatNumber(selectedCompetency.self.averageRating)}
                subtitle={`${selectedCompetency.self.observedCount} self responses`}
              />
              <MiniInsightCard
                title="Manager average"
                value={formatNumber(selectedCompetency.manager.averageRating)}
                subtitle={`${selectedCompetency.manager.observedCount} manager responses`}
              />
              <MiniInsightCard
                title="Average gap"
                value={formatNumber(selectedCompetency.selfManagerGap.averageGap)}
                subtitle={`${selectedCompetency.selfManagerGap.comparedCount} paired reviews`}
              />
            </div>

            <ChartExportContainer chartId="reporting-competency-drilldown-chart" className="space-y-4 p-4">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div
                  className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
                  data-testid="reporting-competency-department-chart"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Ratings by department</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        Ranked average ratings for this competency across departments in scope.
                      </p>
                    </div>
                    {focusedDepartment ? (
                      <Badge variant="info">Focused from heatmap: {focusedDepartment.department}</Badge>
                    ) : null}
                  </div>

                  <div className="h-[320px]">
                    {showDistributionChart ? (
                      departmentComparison.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={240}>
                          <BarChart
                            data={departmentComparison}
                            layout="vertical"
                            margin={{ top: 12, right: 52, left: 4, bottom: 12 }}
                          >
                            <CartesianGrid
                              horizontal={false}
                              strokeDasharray="3 3"
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              type="number"
                              domain={[0, 5]}
                              ticks={[1, 2, 3, 4, 5]}
                              tickLine={false}
                              axisLine={{ stroke: "#cbd5e1" }}
                            />
                            <YAxis
                              type="category"
                              dataKey="department"
                              width={132}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              formatter={(value: number | undefined) => [
                                formatNumber(typeof value === "number" ? value : null),
                                "Average rating",
                              ]}
                              labelFormatter={(department, payload) => {
                                const item = payload?.[0]?.payload as
                                  | (typeof departmentComparison)[number]
                                  | undefined;
                                return item
                                  ? `${department} · ${item.observedCount} observed responses`
                                  : String(department);
                              }}
                            />
                            <Bar dataKey="averageRating" radius={[0, 10, 10, 0]} animationDuration={450}>
                              {departmentComparison.map((item) => (
                                <Cell
                                  key={`competency-department-bar-${item.department}`}
                                  fill={item.fill}
                                  stroke={item.isFocused ? "#0f172a" : "transparent"}
                                  strokeWidth={item.isFocused ? 1.5 : 0}
                                />
                              ))}
                              <LabelList
                                dataKey="summary"
                                position="right"
                                fill="#0f172a"
                                fontSize={11}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <EmptyState
                          title="No department comparison yet"
                          description="Completed competency responses will populate department averages."
                        />
                      )
                    ) : (
                      <Skeleton className="h-full rounded-[var(--radius-sm)]" />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Self vs manager distribution
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        The department chart shows where averages differ; this chart explains how
                        raters are distributing scores.
                      </p>
                    </div>

                    <div className="mt-4 h-64">
                      {showDistributionChart ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={240}>
                          <BarChart
                            data={[1, 2, 3, 4, 5].map((rating) => ({
                              rating,
                              Self: selectedCompetency.selfDistribution[
                                String(rating) as keyof typeof selectedCompetency.selfDistribution
                              ],
                              Manager:
                                selectedCompetency.managerDistribution[
                                  String(rating) as keyof typeof selectedCompetency.managerDistribution
                                ],
                            }))}
                            margin={{ top: 12, right: 12, left: 6, bottom: 12 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="rating" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                            <YAxis
                              allowDecimals={false}
                              tickLine={false}
                              axisLine={{ stroke: "#cbd5e1" }}
                            />
                            <Tooltip labelFormatter={(value) => `Rating ${value}`} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="Self" fill="#38bdf8" animationDuration={450} />
                            <Bar dataKey="Manager" fill="#22c55e" animationDuration={450} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Skeleton className="h-full rounded-[var(--radius-sm)]" />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <MiniInsightCard
                      title="Not observed"
                      value={String(selectedCompetency.notObservedCount)}
                      subtitle="Excluded from averages and self-manager gap math."
                    />
                    <MiniInsightCard
                      title="Departments in scope"
                      value={String(selectedCompetency.departmentBreakdown.length)}
                      subtitle="Departments with at least one observed competency response."
                    />
                    <MiniInsightCard
                      title="Strongest department"
                      value={strongestDepartment?.department ?? "No data"}
                      subtitle={
                        strongestDepartment
                          ? `${formatNumber(strongestDepartment.averageRating)} average across ${strongestDepartment.observedCount} observations.`
                          : "No department signal in scope."
                      }
                    />
                    <MiniInsightCard
                      title={focusedDepartment ? "Focused department" : "Lowest department"}
                      value={
                        focusedDepartment?.department ?? weakestDepartment?.department ?? "No data"
                      }
                      subtitle={
                        focusedDepartment
                          ? `${formatNumber(focusedDepartment.averageRating)} average across ${focusedDepartment.observedCount} observations.`
                          : weakestDepartment
                            ? `${formatNumber(weakestDepartment.averageRating)} average across ${weakestDepartment.observedCount} observations.`
                            : "No department signal in scope."
                      }
                    />
                  </div>

                  <HelpHint label="How Not Observed is handled">
                    Not Observed responses are stored and reported separately. They are excluded from
                    average calculations and self-vs-manager gap math.
                  </HelpHint>
                </div>
              </div>
            </ChartExportContainer>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function ScorecardTab({
  scorecard,
  scorecardOrder,
}: {
  scorecard: ReportingScorecardResponse;
  scorecardOrder: string[];
}) {
  const [hoveredMetric, setHoveredMetric] = useState<ScorecardHeatmapHover | null>(null);

  if (scorecard.suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={
          scorecard.suppression.message ?? "Widen filters to unlock scorecard insights safely."
        }
      />
    );
  }

  const scorecardData = scorecardOrder
    .map((metricKey) => {
      const metric = scorecard.metrics.find((entry) => entry.metricKey === metricKey);
      if (!metric) {
        return null;
      }

      return {
        metricKey,
        label: humanizeEnumValue(metricKey),
        self: metric.self.averageRating,
        manager: metric.manager.averageRating,
        average: metric.averageRating,
        gap: metric.selfManagerGap.averageGap,
        absoluteGap: metric.selfManagerGap.averageAbsoluteGap,
        comparedCount: metric.selfManagerGap.comparedCount,
        observedCount: metric.observedCount,
        notObservedCount: metric.notObservedCount,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
  const biggestGapMetric =
    [...scorecardData].sort((left, right) => (right.absoluteGap ?? 0) - (left.absoluteGap ?? 0))[0] ??
    null;
  const strongestManagerMetric =
    [...scorecardData].sort((left, right) => (right.manager ?? 0) - (left.manager ?? 0))[0] ??
    null;
  const mostIncompleteMetric =
    [...scorecardData].sort((left, right) => right.notObservedCount - left.notObservedCount)[0] ??
    null;

  return (
    <section className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <MiniInsightCard
          title="Biggest alignment gap"
          value={biggestGapMetric ? biggestGapMetric.label : "No data"}
          subtitle={
            biggestGapMetric
              ? `Absolute gap ${formatNumber(biggestGapMetric.absoluteGap)} across ${biggestGapMetric.comparedCount} paired ratings.`
              : "No scorecard pairings in scope."
          }
        />
        <MiniInsightCard
          title="Highest manager average"
          value={strongestManagerMetric ? strongestManagerMetric.label : "No data"}
          subtitle={
            strongestManagerMetric
              ? `Manager average ${formatNumber(strongestManagerMetric.manager)}.`
              : "No manager scorecard signal in scope."
          }
        />
        <MiniInsightCard
          title="Most incomplete metric"
          value={mostIncompleteMetric ? mostIncompleteMetric.label : "No data"}
          subtitle={
            mostIncompleteMetric
              ? `${mostIncompleteMetric.notObservedCount} not observed responses.`
              : "No scorecard gaps in scope."
          }
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Scorecard metric matrix</CardTitle>
              <CardDescription>
                Metrics stay readable on the left, with self, manager, gap, and data quality in a
                single hoverable matrix.
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() =>
                void downloadChartAsPng("reporting-scorecard-chart", "reporting-scorecard-chart.png")
              }
              className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              aria-label="Download scorecard metric comparison chart as PNG"
              data-testid="reporting-download-scorecard-png"
            >
              Download PNG
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <ChartExportContainer chartId="reporting-scorecard-chart" className="overflow-x-auto p-4">
              <ScorecardMatrixSvg rows={scorecardData} onHoverChange={setHoveredMetric} />
            </ChartExportContainer>
            <HeatmapHoverCard
              eyebrow="Hovered metric"
              title={hoveredMetric ? hoveredMetric.metricLabel : "Move across the matrix"}
              description={
                hoveredMetric
                  ? `${hoveredMetric.columnLabel}: ${hoveredMetric.displayValue}. Observed ${hoveredMetric.observedCount}, not observed ${hoveredMetric.notObservedCount}.`
                  : "Hover any self, manager, gap, or not observed cell to inspect a metric without scanning tiny bars."
              }
              secondaryText={
                hoveredMetric ? `Compared pairs: ${hoveredMetric.comparedCount}` : undefined
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <HeatmapLegend label="Self avg" swatch={reportingChartTheme.metricSeries.self} />
            <HeatmapLegend label="Manager avg" swatch={reportingChartTheme.metricSeries.manager} />
            <HeatmapLegend label="Gap intensity" swatch={reportingChartTheme.metricSeries.gap} />
            <HeatmapLegend label="Data quality" swatch="#cbd5e1" />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function MetricCard({
  title,
  value,
  caption,
  accentColor,
  trendLabel,
}: {
  title: string;
  value: number;
  caption: string;
  accentColor: string;
  trendLabel: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{title}</p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-700"
            style={{ backgroundColor: "rgba(148, 163, 184, 0.16)" }}
            aria-label={`${trendLabel} indicator`}
          >
            {trendLabel}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: accentColor }} />
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-600">{caption}</p>
      </CardContent>
    </Card>
  );
}

function SourceSummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-slate-200 px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function MiniInsightCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

function HeatmapHoverCard({
  eyebrow,
  title,
  description,
  secondaryText,
}: {
  eyebrow: string;
  title: string;
  description: string;
  secondaryText?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{eyebrow}</p>
      <h3 className="mt-2 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {secondaryText ? <p className="mt-3 text-xs text-slate-500">{secondaryText}</p> : null}
    </div>
  );
}

function HeatmapLegend({
  label,
  swatch,
}: {
  label: string;
  swatch: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: swatch }}
      />
      {label}
    </div>
  );
}

function ProgressMixSvg({
  totalPeople,
  segments,
}: {
  totalPeople: number;
  segments: Array<{
    status: ProgressStatusFilter;
    label: string;
    value: number;
    color: string;
  }>;
}) {
  const width = 900;
  const height = 140;
  const barX = 24;
  const barY = 52;
  const barWidth = width - 48;
  const barHeight = 44;
  const segmentGeometry = segments.map((segment, index) => {
    const usedWidth = segments
      .slice(0, index)
      .reduce(
        (sum, current) => sum + (totalPeople > 0 ? (current.value / totalPeople) * barWidth : 0),
        0,
      );
    const rawWidth = totalPeople > 0 ? (segment.value / totalPeople) * barWidth : 0;

    return {
      ...segment,
      x: barX + usedWidth,
      width: index === segments.length - 1 ? barWidth - usedWidth : rawWidth,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto min-w-[720px] w-full"
      role="img"
      aria-label={`Completion overview for ${totalPeople} employees`}
    >
      <text x={barX} y={24} fill="#0f172a" fontSize="15" fontWeight="600">
        {totalPeople} employees in scope
      </text>
      <text x={width - barX} y={24} fill="#475569" fontSize="13" textAnchor="end">
        Employee queue owns the follow-up filters
      </text>
      <rect x={barX} y={barY} width={barWidth} height={barHeight} rx={20} fill="#e2e8f0" />
      {segmentGeometry.map((segment, index) => {
        if (segment.width <= 0) {
          return null;
        }

        const radiusLeft = index === 0 ? 20 : 0;
        const radiusRight = index === segments.length - 1 ? 20 : 0;

        return (
          <g key={`progress-mix-${segment.status}`}>
            <path
              d={roundedRectPath(segment.x, barY, segment.width, barHeight, radiusLeft, radiusRight)}
              fill={segment.color}
            />
            {segment.width > 120 ? (
              <text
                x={segment.x + segment.width / 2}
                y={barY + barHeight / 2 + 4}
                fill="#0f172a"
                fontSize="13"
                fontWeight="600"
                textAnchor="middle"
              >
                {segment.label} · {segment.value}
              </text>
            ) : null}
          </g>
        );
      })}
      <text x={barX} y={height - 12} fill="#64748b" fontSize="12">
        Completed includes only employees with both self and manager reviews submitted.
      </text>
    </svg>
  );
}

function CompetencyHeatmapSvg({
  rows,
  competencyOrder,
  cycleId,
  selectedDepartment,
  selectedTitle,
  selectedRatingSource,
  selectedGroupBy,
  activeDimensionKey,
  activeDepartment,
  onHoverChange,
}: {
  rows: CompetencyHeatmapRow[];
  competencyOrder: string[];
  cycleId: string;
  selectedDepartment?: string;
  selectedTitle?: string;
  selectedRatingSource: RatingSourceFilter;
  selectedGroupBy: "department" | "title";
  activeDimensionKey: string | null;
  activeDepartment: string | null;
  onHoverChange: (value: CompetencyHeatmapHover | null) => void;
}) {
  const labelWidth = 188;
  const cellWidth = 104;
  const cellHeight = 70;
  const headerHeight = 86;
  const width = labelWidth + cellWidth * competencyOrder.length + 24;
  const height = headerHeight + cellHeight * rows.length + 20;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto min-w-[980px] w-full"
      role="img"
      aria-label="Competency heatmap"
      onMouseLeave={() => onHoverChange(null)}
    >
      <defs>
        {rows.flatMap((row, rowIndex) =>
          row.cells.map((cell, columnIndex) => {
            const gradientId = getCompetencyHeatGradientId(rowIndex, columnIndex);
            const gradient = getCompetencyHeatGradient(cell.averageRating);

            return (
              <linearGradient
                key={gradientId}
                id={gradientId}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={gradient.start} />
                <stop offset="100%" stopColor={gradient.end} />
              </linearGradient>
            );
          }),
        )}
      </defs>
      <text x={16} y={32} fill="#0f172a" fontSize="13" fontWeight="700">
        Department
      </text>
      {competencyOrder.map((dimensionKey, columnIndex) => {
        const x = labelWidth + columnIndex * cellWidth + cellWidth / 2;
        const lines = splitLabelLines(humanizeEnumValue(dimensionKey), 14);

        return (
          <text
            key={`competency-column-${dimensionKey}`}
            x={x}
            y={28}
            fill="#475569"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
          >
            {lines.map((line, index) => (
              <tspan key={`${dimensionKey}-line-${index}`} x={x} dy={index === 0 ? 0 : 14}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}

      {rows.map((row, rowIndex) => {
        const y = headerHeight + rowIndex * cellHeight;

        return (
          <g key={`competency-row-${row.department}`}>
            <text
              x={16}
              y={y + cellHeight / 2 + 4}
              fill="#0f172a"
              fontSize="13"
              fontWeight="600"
            >
              {row.department}
            </text>
            {row.cells.map((cell, columnIndex) => {
              const x = labelWidth + columnIndex * cellWidth;
              const href = toQueryString({
                cycleId,
                department: selectedDepartment,
                title: selectedTitle,
                ratingSource: selectedRatingSource,
                groupBy: selectedGroupBy,
                tab: "competencies",
                dimensionKey: cell.dimensionKey,
                competencyDepartment: row.department,
                page: "1",
              });
              const isFocusedDepartment = activeDepartment === row.department;
              const isFocusedCell = isFocusedDepartment && activeDimensionKey === cell.dimensionKey;
              const fill = `url(#${getCompetencyHeatGradientId(rowIndex, columnIndex)})`;
              const stroke = isFocusedCell
                ? "#0f172a"
                : activeDimensionKey === cell.dimensionKey
                  ? "#cbd5e1"
                  : "#ffffff";
              const label = humanizeEnumValue(cell.dimensionKey);

              return (
                <a
                  key={`competency-cell-${row.department}-${cell.dimensionKey}`}
                  href={href}
                  data-testid={`reporting-competency-cell-${cell.dimensionKey}`}
                  aria-label={`${row.department} ${label} average ${formatNumber(cell.averageRating)} from ${cell.observedCount} observed responses`}
                  onFocus={() =>
                    onHoverChange({
                      department: row.department,
                      dimensionLabel: label,
                      averageRating: cell.averageRating,
                      observedCount: cell.observedCount,
                    })
                  }
                  onMouseEnter={() =>
                    onHoverChange({
                      department: row.department,
                      dimensionLabel: label,
                      averageRating: cell.averageRating,
                      observedCount: cell.observedCount,
                    })
                  }
                >
                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={cellWidth - 2}
                    height={cellHeight - 2}
                    rx={0}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isFocusedCell ? 3 : activeDimensionKey === cell.dimensionKey ? 1.5 : 1}
                  />
                  <text
                    x={x + cellWidth / 2}
                    y={y + 30}
                    fill="#0f172a"
                    fontSize="16"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {formatCompactValue(cell.averageRating)}
                  </text>
                  <text
                    x={x + cellWidth / 2}
                    y={y + 50}
                    fill="#475569"
                    fontSize="11"
                    textAnchor="middle"
                  >
                    {cell.observedCount} obs
                  </text>
                </a>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function ScorecardMatrixSvg({
  rows,
  onHoverChange,
}: {
  rows: ScorecardMatrixRow[];
  onHoverChange: (value: ScorecardHeatmapHover | null) => void;
}) {
  const columns = [
    { key: "self", label: "Self avg" },
    { key: "manager", label: "Manager avg" },
    { key: "gap", label: "Gap" },
    { key: "notObservedCount", label: "Not observed" },
  ] as const;
  const labelWidth = 232;
  const cellWidth = 120;
  const cellHeight = 68;
  const headerHeight = 72;
  const width = labelWidth + cellWidth * columns.length + 24;
  const height = headerHeight + cellHeight * rows.length + 20;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto min-w-[760px] w-full"
      role="img"
      aria-label="Scorecard metric matrix"
      onMouseLeave={() => onHoverChange(null)}
    >
      <text x={16} y={30} fill="#0f172a" fontSize="13" fontWeight="700">
        Metric
      </text>
      {columns.map((column, columnIndex) => {
        const x = labelWidth + columnIndex * cellWidth + cellWidth / 2;

        return (
          <text
            key={`scorecard-column-${column.key}`}
            x={x}
            y={30}
            fill="#475569"
            fontSize="11"
            fontWeight="700"
            textAnchor="middle"
          >
            {column.label}
          </text>
        );
      })}

      {rows.map((row, rowIndex) => {
        const y = headerHeight + rowIndex * cellHeight;
        const metricLines = splitLabelLines(row.label, 22);

        return (
          <g key={`scorecard-row-${row.metricKey}`}>
            <text x={16} y={y + 26} fill="#0f172a" fontSize="13" fontWeight="600">
              {metricLines.map((line, index) => (
                <tspan key={`${row.metricKey}-line-${index}`} x={16} dy={index === 0 ? 0 : 14}>
                  {line}
                </tspan>
              ))}
            </text>
            <text x={16} y={y + 54} fill="#64748b" fontSize="11">
              Avg {formatNumber(row.average)}
            </text>

            {columns.map((column, columnIndex) => {
              const x = labelWidth + columnIndex * cellWidth;
              const cell = getScorecardCellContent(row, column.key);

              return (
                <g
                  key={`scorecard-cell-${row.metricKey}-${column.key}`}
                  aria-label={`${row.label} ${column.label} ${cell.displayValue}. Observed ${row.observedCount}, not observed ${row.notObservedCount}.`}
                  onMouseEnter={() =>
                    onHoverChange({
                      metricLabel: row.label,
                      columnLabel: column.label,
                      displayValue: cell.displayValue,
                      observedCount: row.observedCount,
                      notObservedCount: row.notObservedCount,
                      comparedCount: row.comparedCount,
                    })
                  }
                >
                  <rect
                    x={x + 8}
                    y={y + 8}
                    width={cellWidth - 16}
                    height={cellHeight - 16}
                    rx={16}
                    fill={cell.fill}
                    stroke="#e2e8f0"
                    strokeWidth={1.2}
                  />
                  <text
                    x={x + cellWidth / 2}
                    y={y + 34}
                    fill="#0f172a"
                    fontSize="15"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {cell.text}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function ChartExportContainer({
  chartId,
  className,
  children,
}: {
  chartId: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border border-slate-200 bg-white ${className ?? ""}`.trim()}
      data-chart-export-id={chartId}
    >
      {children}
    </div>
  );
}

function toProgressKey(status: ProgressStatusFilter): "notStarted" | "inProgress" | "completed" {
  if (status === "NOT_STARTED") {
    return "notStarted";
  }

  if (status === "IN_PROGRESS") {
    return "inProgress";
  }

  return "completed";
}

function buildEmployeeCsvHref(rows: ReportingPeopleResult["rows"]): string {
  const headers = [
    "Employee",
    "Department",
    "Title",
    "Self Status",
    "Manager Status",
    "Overall Status",
    "Final Rating",
    "Final Rating Source",
    "Scorecard Percent",
  ];

  const body = rows.map((row) => [
    row.employeeName,
    row.department,
    row.title,
    row.selfStatus,
    row.managerStatus,
    row.overallStatus,
    row.finalRating ?? "",
    row.finalRatingSource ?? "",
    row.scorecardPercent ?? "",
  ]);

  const csv = [headers, ...body]
    .map((cells) => cells.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");

  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function escapeCsvCell(value: string | number): string {
  const normalized = String(value);
  if (normalized.includes(",") || normalized.includes('"') || normalized.includes("\n")) {
    return `"${normalized.replaceAll('"', '""')}"`;
  }

  return normalized;
}

function legendButtonClassName(isVisible: boolean): string {
  return [
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    isVisible
      ? "border-slate-300 bg-white text-slate-800"
      : "border-slate-200 bg-slate-100 text-slate-500",
  ].join(" ");
}

function toggleClassName(isActive: boolean): string {
  return [
    "rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    isActive ? "bg-white text-slate-900 shadow-[var(--shadow-xs)]" : "text-slate-600",
  ].join(" ");
}

function tabClassName(isActive: boolean): string {
  return [
    "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    isActive ? "bg-white text-slate-900 shadow-[var(--shadow-xs)]" : "text-slate-600",
  ].join(" ");
}

function humanizeEnumValue(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatNumber(value: number | null): string {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toFixed(2);
}

function formatShortDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function toQueryString(values: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const serialized = searchParams.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

function buildCompetencyHeatmapRows(
  competencies: ReportingCompetencyResult[],
  competencyOrder: string[],
): CompetencyHeatmapRow[] {
  const departments = new Set<string>();
  const byDimension = new Map(
    competencies.map((competency) => [competency.dimensionKey, competency]),
  );

  for (const competency of competencies) {
    for (const breakdown of competency.departmentBreakdown) {
      departments.add(breakdown.department);
    }
  }

  return Array.from(departments)
    .sort((left, right) => left.localeCompare(right))
    .map((department) => ({
      department,
      cells: competencyOrder.map((dimensionKey) => {
        const competency = byDimension.get(
          dimensionKey as ReportingCompetencyResult["dimensionKey"],
        );
        const departmentCell = competency?.departmentBreakdown.find(
          (breakdown) => breakdown.department === department,
        );

        return {
          dimensionKey,
          averageRating: departmentCell?.averageRating ?? null,
          observedCount: departmentCell?.observedCount ?? 0,
        };
      }),
    }));
}

function buildDepartmentComparisonRows(
  breakdown: ReportingCompetencyResult["departmentBreakdown"],
  focusedDepartment?: string,
) {
  return [...breakdown]
    .filter(
      (
        item,
      ): item is typeof item & {
        averageRating: number;
      } => typeof item.averageRating === "number",
    )
    .sort((left, right) => {
      if (right.averageRating !== left.averageRating) {
        return right.averageRating - left.averageRating;
      }

      if (right.observedCount !== left.observedCount) {
        return right.observedCount - left.observedCount;
      }

      return left.department.localeCompare(right.department);
    })
    .map((item) => ({
      ...item,
      isFocused: item.department === focusedDepartment,
      fill:
        item.department === focusedDepartment
          ? "#0f172a"
          : getCompetencyHeatColor(item.averageRating),
      summary: `${item.averageRating.toFixed(2)} · ${item.observedCount} obs`,
    }));
}

function goalStatusBadgeVariant(
  status: ReportingGoalsResult["rows"][number]["status"],
): "neutral" | "warning" | "success" | "info" {
  if (status === "COMPLETE" || status === "ON_TRACK") {
    return "success";
  }

  if (status === "AT_RISK" || status === "OFF_TRACK") {
    return "warning";
  }

  if (status === "NOT_STARTED") {
    return "info";
  }

  return "neutral";
}

function goalProgressColor(
  status: ReportingGoalsResult["rows"][number]["status"],
  progressPercent: number,
): string {
  if (status === "OFF_TRACK") {
    return "#ef4444";
  }

  if (status === "AT_RISK") {
    return "#f59e0b";
  }

  if (status === "COMPLETE") {
    return "#10b981";
  }

  if (progressPercent >= 75) {
    return "#22c55e";
  }

  if (progressPercent >= 35) {
    return "#eab308";
  }

  return "#94a3b8";
}

function overallStatusBadgeVariant(
  status: ProgressStatusFilter,
): "neutral" | "warning" | "success" | "info" {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "IN_PROGRESS") {
    return "warning";
  }

  return "neutral";
}

function formatCompactValue(value: number | null): string {
  if (typeof value !== "number") {
    return "—";
  }

  return value.toFixed(1);
}

function formatSignedNumber(value: number | null): string {
  if (typeof value !== "number") {
    return "—";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
}

function getCompetencyHeatColor(value: number | null): string {
  if (typeof value !== "number") {
    return "#f8fafc";
  }

  const clamped = Math.min(5, Math.max(1, value));
  return competencyHeatToneToCss(getCompetencyHeatTone(clamped));
}

function getCompetencyHeatGradient(value: number | null): {
  start: string;
  end: string;
} {
  if (typeof value !== "number") {
    return {
      start: "#f8fafc",
      end: "#eef2f7",
    };
  }

  const tone = getCompetencyHeatTone(Math.min(5, Math.max(1, value)));

  return {
    start: competencyHeatToneToCss({
      hue: tone.hue,
      saturation: Math.min(96, tone.saturation + 2),
      lightness: Math.min(95, tone.lightness + 6),
    }),
    end: competencyHeatToneToCss({
      hue: tone.hue,
      saturation: Math.min(98, tone.saturation + 4),
      lightness: Math.max(54, tone.lightness - 6),
    }),
  };
}

function getCompetencyHeatGradientId(rowIndex: number, columnIndex: number): string {
  return `competency-heat-${rowIndex}-${columnIndex}`;
}

function getCompetencyHeatTone(value: number): {
  hue: number;
  saturation: number;
  lightness: number;
} {
  if (value < 2.5) {
    return interpolateCompetencyHeatTone(
      value,
      1,
      2.5,
      { hue: 5, saturation: 82, lightness: 92 },
      { hue: 4, saturation: 86, lightness: 76 },
    );
  }

  if (value < 3.5) {
    return interpolateCompetencyHeatTone(
      value,
      2.5,
      3.5,
      { hue: 48, saturation: 88, lightness: 88 },
      { hue: 52, saturation: 93, lightness: 72 },
    );
  }

  return interpolateCompetencyHeatTone(
    value,
    3.5,
    5,
    { hue: 101, saturation: 59, lightness: 85 },
    { hue: 128, saturation: 66, lightness: 66 },
  );
}

function interpolateCompetencyHeatTone(
  value: number,
  min: number,
  max: number,
  start: { hue: number; saturation: number; lightness: number },
  end: { hue: number; saturation: number; lightness: number },
) {
  const progress = max === min ? 0 : (value - min) / (max - min);

  return {
    hue: interpolateNumber(start.hue, end.hue, progress),
    saturation: interpolateNumber(start.saturation, end.saturation, progress),
    lightness: interpolateNumber(start.lightness, end.lightness, progress),
  };
}

function competencyHeatToneToCss(tone: {
  hue: number;
  saturation: number;
  lightness: number;
}): string {
  return `hsl(${tone.hue} ${tone.saturation}% ${tone.lightness}%)`;
}

function interpolateNumber(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function getAverageHeatColor(value: number | null): string {
  if (typeof value !== "number") {
    return "#f8fafc";
  }

  if (value < 2.5) {
    return "#fecaca";
  }

  if (value < 3.25) {
    return "#fde68a";
  }

  if (value < 4) {
    return "#bbf7d0";
  }

  return "#4ade80";
}

function getGapHeatColor(value: number | null): string {
  if (typeof value !== "number") {
    return "#f8fafc";
  }

  const magnitude = Math.abs(value);
  if (magnitude < 0.2) {
    return "#e2e8f0";
  }

  if (value > 0) {
    return magnitude < 0.45 ? "#fdba74" : "#fb923c";
  }

  return magnitude < 0.45 ? "#bae6fd" : "#7dd3fc";
}

function getCountHeatColor(value: number): string {
  if (value <= 0) {
    return "#f8fafc";
  }

  if (value < 3) {
    return "#e2e8f0";
  }

  if (value < 6) {
    return "#cbd5e1";
  }

  return "#94a3b8";
}

function splitLabelLines(label: string, maxCharsPerLine: number): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 2);
}

function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radiusLeft: number,
  radiusRight: number,
): string {
  return [
    `M ${x + radiusLeft} ${y}`,
    `H ${x + width - radiusRight}`,
    radiusRight > 0 ? `A ${radiusRight} ${radiusRight} 0 0 1 ${x + width} ${y + radiusRight}` : "",
    `V ${y + height - radiusRight}`,
    radiusRight > 0
      ? `A ${radiusRight} ${radiusRight} 0 0 1 ${x + width - radiusRight} ${y + height}`
      : "",
    `H ${x + radiusLeft}`,
    radiusLeft > 0 ? `A ${radiusLeft} ${radiusLeft} 0 0 1 ${x} ${y + height - radiusLeft}` : "",
    `V ${y + radiusLeft}`,
    radiusLeft > 0 ? `A ${radiusLeft} ${radiusLeft} 0 0 1 ${x + radiusLeft} ${y}` : "",
    "Z",
  ]
    .filter(Boolean)
    .join(" ");
}

function getScorecardCellContent(
  row: ScorecardMatrixRow,
  columnKey: "self" | "manager" | "gap" | "notObservedCount",
): {
  text: string;
  displayValue: string;
  fill: string;
} {
  if (columnKey === "self") {
    return {
      text: formatCompactValue(row.self),
      displayValue: formatNumber(row.self),
      fill: getAverageHeatColor(row.self),
    };
  }

  if (columnKey === "manager") {
    return {
      text: formatCompactValue(row.manager),
      displayValue: formatNumber(row.manager),
      fill: getAverageHeatColor(row.manager),
    };
  }

  if (columnKey === "gap") {
    return {
      text: formatSignedNumber(row.gap),
      displayValue: formatSignedNumber(row.gap),
      fill: getGapHeatColor(row.gap),
    };
  }

  return {
    text: String(row.notObservedCount),
    displayValue: String(row.notObservedCount),
    fill: getCountHeatColor(row.notObservedCount),
  };
}

async function downloadChartAsPng(
  chartId: string,
  fileName: string,
): Promise<void> {
  const chartContainer = document.querySelector<HTMLElement>(
    `[data-chart-export-id=\"${chartId}\"]`,
  );
  if (!chartContainer) {
    return;
  }

  const rect = chartContainer.getBoundingClientRect();
  const width = Math.max(640, Math.ceil(rect.width));
  const height = Math.max(240, Math.ceil(rect.height));
  const scale = window.devicePixelRatio > 1 ? 2 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  try {
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    const svgNodes = await waitForChartSvgNodes(chartContainer, 3_000);
    if (svgNodes.length === 0) {
      drawExportFallback(context, width, height, chartId);
    }

    for (const svgNode of svgNodes) {
      const svgRect = svgNode.getBoundingClientRect();
      if (svgRect.width === 0 || svgRect.height === 0) {
        continue;
      }

      const svgClone = svgNode.cloneNode(true) as SVGSVGElement;
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgClone.setAttribute("width", String(Math.ceil(svgRect.width)));
      svgClone.setAttribute("height", String(Math.ceil(svgRect.height)));
      if (!svgClone.getAttribute("viewBox")) {
        svgClone.setAttribute(
          "viewBox",
          `0 0 ${Math.ceil(svgRect.width)} ${Math.ceil(svgRect.height)}`,
        );
      }

      const serialized = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([serialized], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      try {
        const image = await loadImage(svgUrl);
        context.drawImage(
          image,
          Math.max(0, svgRect.left - rect.left),
          Math.max(0, svgRect.top - rect.top),
          svgRect.width,
          svgRect.height,
        );
      } finally {
        URL.revokeObjectURL(svgUrl);
      }
    }

    const pngBlob = await canvasToPngBlob(canvas);

    if (!pngBlob) {
      return;
    }

    triggerPngDownload(pngBlob, fileName);
  } catch {
    const fallbackContext = canvas.getContext("2d");
    if (!fallbackContext) {
      return;
    }

    fallbackContext.setTransform(scale, 0, 0, scale, 0, 0);
    fallbackContext.fillStyle = "#ffffff";
    fallbackContext.fillRect(0, 0, width, height);
    drawExportFallback(fallbackContext, width, height, chartId);

    const fallbackBlob = await canvasToPngBlob(canvas);
    if (fallbackBlob) {
      triggerPngDownload(fallbackBlob, fileName);
    }

    // Keep export failures non-blocking for reporting workflows.
    return;
  }
}

async function waitForChartSvgNodes(
  chartContainer: HTMLElement,
  timeoutMs: number,
): Promise<SVGSVGElement[]> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const nodes = Array.from(chartContainer.querySelectorAll<SVGSVGElement>("svg")).filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (nodes.length > 0) {
      return nodes;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 120));
  }

  return [];
}

async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
}

function triggerPngDownload(pngBlob: Blob, fileName: string): void {
  const downloadUrl = URL.createObjectURL(pngBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadUrl);
}

function drawExportFallback(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  chartId: string,
): void {
  context.fillStyle = "#0f172a";
  context.font = "600 14px ui-sans-serif, system-ui";
  context.fillText("Chart export fallback", 20, 36);
  context.fillStyle = "#475569";
  context.font = "12px ui-sans-serif, system-ui";
  context.fillText(`Source: ${chartId}`, 20, 58);
  context.fillText("The chart rendered without SVG nodes at export time.", 20, 80);
  context.fillText("Retry export if this fallback appears unexpectedly.", 20, 98);
  context.strokeStyle = "#cbd5e1";
  context.strokeRect(12, 12, width - 24, height - 24);
}

function loadImage(sourceUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to render chart image export."));
    image.src = sourceUrl;
  });
}
