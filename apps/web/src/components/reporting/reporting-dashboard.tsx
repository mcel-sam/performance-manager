"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import type { ReviewSubmissionStatus } from "@prisma/client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
import { RightDrawer } from "@/components/ui/right-drawer";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { reportingChartTheme } from "@/components/reporting/chart-theme";
import type {
  ReportingCompetenciesResponse,
  ReportingCompetencyResult,
  ReportingPeopleResult,
  ReportingProgressResult,
  ReportingRatingsResult,
  ReportingScorecardResponse,
} from "@/server/reporting/reporting-service";

type ProgressStatusFilter = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type RatingSourceFilter = "FINAL" | "SCORECARD";
type ReportingTab = "progress" | "results" | "competencies" | "scorecard";

interface ReportingDashboardProps {
  cycleName: string | null;
  selectedTab: ReportingTab;
  selectedCycleId: string;
  selectedDepartment?: string;
  selectedTitle?: string;
  selectedStatus?: ProgressStatusFilter;
  selectedRatingSource: RatingSourceFilter;
  selectedGroupBy?: "department" | "title";
  selectedDimensionKey?: string;
  cycleOptions: Array<{ value: string; label: string }>;
  departmentOptions: string[];
  titleOptions: string[];
  tabHrefs: {
    progress: string;
    results: string;
    competencies: string;
    scorecard: string;
  };
  paginationHrefs: {
    previous: string | null;
    next: string | null;
  };
  progress: ReportingProgressResult;
  ratingsFinal: ReportingRatingsResult;
  ratingsScorecard: ReportingRatingsResult;
  competencies: ReportingCompetenciesResponse;
  selectedCompetency: ReportingCompetencyResult | null;
  scorecard: ReportingScorecardResponse;
  people: ReportingPeopleResult;
  competencyOrder: string[];
  scorecardOrder: string[];
  csvHrefs: {
    progress: string;
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

export function ReportingDashboard({
  cycleName,
  selectedTab,
  selectedCycleId,
  selectedDepartment,
  selectedTitle,
  selectedStatus,
  selectedRatingSource,
  selectedGroupBy = "department",
  selectedDimensionKey,
  cycleOptions,
  departmentOptions,
  titleOptions,
  tabHrefs,
  paginationHrefs,
  progress,
  ratingsFinal,
  ratingsScorecard,
  competencies,
  selectedCompetency,
  scorecard,
  people,
  competencyOrder,
  scorecardOrder,
  csvHrefs,
}: ReportingDashboardProps) {
  const [hiddenProgressSeries, setHiddenProgressSeries] = useState<
    Record<ProgressStatusFilter, boolean>
  >({
    NOT_STARTED: false,
    IN_PROGRESS: false,
    COMPLETED: false,
  });
  const [hiddenRatingSeries, setHiddenRatingSeries] = useState<
    Record<RatingSourceFilter, boolean>
  >({
    FINAL: false,
    SCORECARD: false,
  });
  const [statusDrilldown, setStatusDrilldown] = useState<ProgressStatusFilter | null>(null);
  const [ratingDrilldown, setRatingDrilldown] = useState<number | null>(null);

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

  const activeRows = useMemo(() => {
    return people.rows.filter((row) => {
      if (statusDrilldown && row.overallStatus !== statusDrilldown) {
        return false;
      }

      if (ratingDrilldown && row.finalRating !== ratingDrilldown) {
        return false;
      }

      return true;
    });
  }, [people.rows, ratingDrilldown, statusDrilldown]);

  const employeeCsvHref = useMemo(() => buildEmployeeCsvHref(activeRows), [activeRows]);

  const hasActiveDrilldown = statusDrilldown !== null || ratingDrilldown !== null;
  const baseFilterQuery = useMemo(
    () => ({
      cycleId: selectedCycleId,
      tab: selectedTab,
      status: selectedStatus,
      ratingSource: selectedRatingSource,
      groupBy: selectedGroupBy,
      dimensionKey: selectedDimensionKey,
      page: "1",
    }),
    [selectedCycleId, selectedTab, selectedStatus, selectedRatingSource, selectedGroupBy, selectedDimensionKey],
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
        selectedStatus
          ? {
              key: "status",
              label: `Status: ${progressStatusLabel[selectedStatus]}`,
              clearHref: toQueryString({
                ...baseFilterQuery,
                department: selectedDepartment,
                title: selectedTitle,
                status: undefined,
              }),
            }
          : null,
      ].filter((chip): chip is { key: string; label: string; clearHref: string } => chip !== null),
    [baseFilterQuery, selectedDepartment, selectedStatus, selectedTitle],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6" data-testid="reporting-dashboard">
      <PageHeader
        title="Reporting"
        description="Review completion trends, ratings, and competency outcomes for the selected cycle."
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
        description="Select a cycle, then refine by department, title, and status. Group by controls table and chart slices."
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
        {selectedDimensionKey ? (
          <input type="hidden" name="dimensionKey" value={selectedDimensionKey} />
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

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Status
          <Select name="status" defaultValue={selectedStatus ?? ""} data-testid="reporting-status-filter">
            <option value="">All statuses</option>
            <option value="NOT_STARTED">Not started</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </Select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Group by
          <Select name="groupBy" defaultValue={selectedGroupBy} data-testid="reporting-group-by">
            <option value="department">Department</option>
            <option value="title">Title</option>
          </Select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-slate-700">Rating source</span>
          <div
            className="inline-flex h-10 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-1"
            role="group"
            aria-label="Rating source toggle"
            data-testid="reporting-rating-source-toggle"
          >
            <button
              type="submit"
              name="ratingSource"
              value="FINAL"
              aria-label="Use final ratings"
              data-testid="reporting-rating-toggle-final"
              className={toggleClassName(selectedRatingSource === "FINAL")}
            >
              Final
            </button>
            <button
              type="submit"
              name="ratingSource"
              value="SCORECARD"
              aria-label="Use scorecard baseline ratings"
              data-testid="reporting-rating-toggle-scorecard"
              className={toggleClassName(selectedRatingSource === "SCORECARD")}
            >
              Scorecard baseline
            </button>
          </div>
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" data-testid="reporting-apply-filters">
            Apply filters
          </Button>
        </div>
      </FilterBar>

      <section className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-1">
          <Link
            href={tabHrefs.progress}
            data-testid="reporting-tab-progress"
            className={tabClassName(selectedTab === "progress")}
          >
            Progress
          </Link>
          <Link
            href={tabHrefs.results}
            data-testid="reporting-tab-results"
            className={tabClassName(selectedTab === "results")}
          >
            Results
          </Link>
          <Link
            href={tabHrefs.competencies}
            data-testid="reporting-tab-competencies"
            className={tabClassName(selectedTab === "competencies")}
          >
            Competencies
          </Link>
          <Link
            href={tabHrefs.scorecard}
            data-testid="reporting-tab-scorecard"
            className={tabClassName(selectedTab === "scorecard")}
          >
            Scorecard
          </Link>
        </div>

        <div className="text-sm text-slate-600">
          Showing <span data-testid="reporting-current-department">{selectedDepartment ?? "All departments"}</span>
          {" • "}
          <span data-testid="reporting-current-title">{selectedTitle ?? "All titles"}</span>
          {" • "}
          <span data-testid="reporting-current-group-by">
            Group by {selectedGroupBy === "title" ? "Title" : "Department"}
          </span>
        </div>
      </section>

      {selectedTab === "progress" ? (
        <ProgressTab
          progress={progress}
          totalPeople={totalPeople}
          csvHref={csvHrefs.progress}
          hiddenSeries={hiddenProgressSeries}
          onToggleSeries={(status) =>
            setHiddenProgressSeries((previous) => ({
              ...previous,
              [status]: !previous[status],
            }))
          }
          statusDrilldown={statusDrilldown}
          onDrilldown={setStatusDrilldown}
        />
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
          ratingDrilldown={ratingDrilldown}
          onDrilldown={setRatingDrilldown}
        />
      ) : null}

      {selectedTab === "competencies" ? (
        <CompetenciesTab
          competencies={competencies}
          selectedCompetency={selectedCompetency}
          competencyOrder={competencyOrder}
          cycleId={selectedCycleId}
          selectedDepartment={selectedDepartment}
          selectedTitle={selectedTitle}
          selectedStatus={selectedStatus}
          selectedRatingSource={selectedRatingSource}
          selectedGroupBy={selectedGroupBy}
          csvHref={csvHrefs.competencies}
        />
      ) : null}

      {selectedTab === "scorecard" ? (
        <ScorecardTab scorecard={scorecard} scorecardOrder={scorecardOrder} />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Employee drilldown</CardTitle>
              <CardDescription>
                {selectedStatus
                  ? `Filtered to ${progressStatusLabel[selectedStatus].toLowerCase()} employees.`
                  : "Use chart interactions or filters to narrow this table."}
              </CardDescription>
            </div>
            {activeRows.length > 0 ? (
              <a
                href={employeeCsvHref}
                download={`reporting-employees-${selectedCycleId}.csv`}
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Export CSV
              </a>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {hasActiveDrilldown ? (
            <div
              className="mx-5 mt-4 rounded-[var(--radius-md)] border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900"
              data-testid="reporting-active-drilldowns"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  Active drilldowns:
                  {statusDrilldown ? ` status = ${progressStatusLabel[statusDrilldown]}` : ""}
                  {ratingDrilldown ? ` • rating = ${ratingDrilldown}` : ""}
                </span>
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2"
                  data-testid="reporting-clear-drilldown"
                  onClick={() => {
                    setStatusDrilldown(null);
                    setRatingDrilldown(null);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}

          {activeRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No employees match this filter"
                description="Try clearing one or more filters to broaden the drilldown table."
              />
            </div>
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Self</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Final rating</TableHead>
                    <TableHead>Scorecard %</TableHead>
                    <TableHead>Links</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRows.map((row) => (
                    <TableRow key={row.employeeId} data-testid="reporting-employee-row">
                      <TableCell className="font-semibold text-slate-900">{row.employeeName}</TableCell>
                      <TableCell className="text-slate-700">{row.department}</TableCell>
                      <TableCell className="text-slate-700">{row.title}</TableCell>
                      <TableCell>
                        <Badge variant="neutral">{submissionStatusLabel[row.selfStatus]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{submissionStatusLabel[row.managerStatus]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{progressStatusLabel[row.overallStatus]}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {row.finalRating ? `${row.finalRating}` : "-"}
                        {row.finalRatingSource ? ` (${row.finalRatingSource})` : ""}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {typeof row.scorecardPercent === "number"
                          ? `${row.scorecardPercent.toFixed(1)}%`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {row.links.calibrationSession ? (
                            <Link
                              href={row.links.calibrationSession}
                              className="text-xs font-medium text-slate-700 underline underline-offset-2"
                            >
                              Calibration
                            </Link>
                          ) : null}
                          {row.links.improvementPlan ? (
                            <Link
                              href={row.links.improvementPlan}
                              className="text-xs font-medium text-slate-700 underline underline-offset-2"
                            >
                              Plan
                            </Link>
                          ) : null}
                          {!row.links.calibrationSession && !row.links.improvementPlan ? (
                            <span className="text-xs text-slate-400">-</span>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}

          <div className="flex items-center justify-between px-5 pb-5 text-sm text-slate-600">
            <span data-testid="reporting-table-row-count">
              Showing {activeRows.length} of {people.rows.length} rows on this page (Page {people.pagination.page} of{" "}
              {Math.max(people.pagination.totalPages, 1)}; {people.pagination.totalRows} employees total)
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
    </div>
  );
}

function ProgressTab({
  progress,
  totalPeople,
  csvHref,
  hiddenSeries,
  onToggleSeries,
  statusDrilldown,
  onDrilldown,
}: {
  progress: ReportingProgressResult;
  totalPeople: number;
  csvHref: string;
  hiddenSeries: Record<ProgressStatusFilter, boolean>;
  onToggleSeries: (status: ProgressStatusFilter) => void;
  statusDrilldown: ProgressStatusFilter | null;
  onDrilldown: (status: ProgressStatusFilter | null) => void;
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

  const chartData = [
    {
      name: "Employees",
      NOT_STARTED: hiddenSeries.NOT_STARTED ? 0 : progress.totals.notStarted,
      IN_PROGRESS: hiddenSeries.IN_PROGRESS ? 0 : progress.totals.inProgress,
      COMPLETED: hiddenSeries.COMPLETED ? 0 : progress.totals.completed,
    },
  ];
  const completionDonutData = [
    { name: "Not started", value: progress.totals.notStarted, color: reportingChartTheme.progress.notStarted },
    { name: "In progress", value: progress.totals.inProgress, color: reportingChartTheme.progress.inProgress },
    { name: "Completed", value: progress.totals.completed, color: reportingChartTheme.progress.completed },
  ].filter((entry) => entry.value > 0);

  return (
    <>
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
              <CardTitle>Status mix</CardTitle>
              <CardDescription>
                Distribution across {totalPeople} employees in the current filter scope.
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
          <ChartExportContainer chartId="reporting-progress-chart" className="space-y-3 p-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="h-56 rounded-[var(--radius-sm)] border border-slate-200 bg-white p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 12, right: 12, left: 12, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.16)" }}
                      formatter={(value: number | undefined, name: string | undefined) => [
                        value ?? 0,
                        progressStatusLabel[(name ?? "NOT_STARTED") as ProgressStatusFilter],
                      ]}
                      labelFormatter={() => "Current filter scope"}
                    />
                    <Legend
                      formatter={(value) => progressStatusLabel[value as ProgressStatusFilter]}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                    <Bar
                      dataKey="NOT_STARTED"
                      stackId="status"
                      fill={reportingChartTheme.progress.notStarted}
                      radius={[0, 0, 0, 0]}
                      onClick={() => onDrilldown("NOT_STARTED")}
                      animationDuration={450}
                    />
                    <Bar
                      dataKey="IN_PROGRESS"
                      stackId="status"
                      fill={reportingChartTheme.progress.inProgress}
                      radius={[0, 0, 0, 0]}
                      onClick={() => onDrilldown("IN_PROGRESS")}
                      animationDuration={450}
                    />
                    <Bar
                      dataKey="COMPLETED"
                      stackId="status"
                      fill={reportingChartTheme.progress.completed}
                      radius={[8, 8, 0, 0]}
                      onClick={() => onDrilldown("COMPLETED")}
                      animationDuration={450}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-56 rounded-[var(--radius-sm)] border border-slate-200 bg-white p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionDonutData}
                      innerRadius={52}
                      outerRadius={86}
                      dataKey="value"
                      nameKey="name"
                      paddingAngle={2}
                      animationDuration={450}
                    >
                      {completionDonutData.map((entry) => (
                        <Cell key={`progress-donut-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => value ?? 0} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartExportContainer>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(progressStatusLabel) as ProgressStatusFilter[]).map((status) => (
              <button
                key={`progress-legend-${status}`}
                type="button"
                aria-label={`Toggle ${progressStatusLabel[status]} segment visibility`}
                data-testid={`reporting-progress-legend-${status}`}
                onClick={() => onToggleSeries(status)}
                className={legendButtonClassName(!hiddenSeries[status])}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      status === "NOT_STARTED"
                        ? reportingChartTheme.progress.notStarted
                        : status === "IN_PROGRESS"
                          ? reportingChartTheme.progress.inProgress
                          : reportingChartTheme.progress.completed,
                  }}
                />
                {progressStatusLabel[status]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(progressStatusLabel) as ProgressStatusFilter[]).map((status) => (
              <button
                key={`progress-drill-${status}`}
                type="button"
                aria-label={`Filter employee table by ${progressStatusLabel[status]}`}
                data-testid={`reporting-progress-drilldown-${status}`}
                onClick={() => onDrilldown(statusDrilldown === status ? null : status)}
                className={drilldownButtonClassName(statusDrilldown === status)}
              >
                {progressStatusLabel[status]} ({progress.totals[toProgressKey(status)]})
              </button>
            ))}
          </div>

          <HelpHint label="What counts as In progress?">
            In progress means either the self review or manager review has started, but both are not
            submitted yet.
          </HelpHint>
        </CardContent>
      </Card>
    </>
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
  ratingDrilldown,
  onDrilldown,
}: {
  ratingsFinal: ReportingRatingsResult;
  ratingsScorecard: ReportingRatingsResult;
  ratingsData: Array<{ rating: number; FINAL: number; SCORECARD: number }>;
  selectedRatingSource: RatingSourceFilter;
  csvHref: string;
  hiddenSeries: Record<RatingSourceFilter, boolean>;
  onToggleSeries: (source: RatingSourceFilter) => void;
  ratingDrilldown: number | null;
  onDrilldown: (value: number | null) => void;
}) {
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
              <ResponsiveContainer width="100%" height="100%">
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
                    onClick={(entry) => {
                      const payload = entry?.payload as { rating?: number } | undefined;
                      if (typeof payload?.rating === "number") {
                        onDrilldown(payload.rating);
                      }
                    }}
                  />
                  <Bar
                    dataKey="SCORECARD"
                    fill={reportingChartTheme.ratingSource.SCORECARD}
                    hide={hiddenSeries.SCORECARD}
                    animationDuration={450}
                    onClick={(entry) => {
                      const payload = entry?.payload as { rating?: number } | undefined;
                      if (typeof payload?.rating === "number") {
                        onDrilldown(payload.rating);
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
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

          <div className="flex flex-wrap gap-2" data-testid="reporting-rating-drilldown-controls">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={`rating-drill-${rating}`}
                type="button"
                aria-label={`Filter employee table by rating ${rating}`}
                data-testid={`reporting-rating-drilldown-${rating}`}
                onClick={() => onDrilldown(ratingDrilldown === rating ? null : rating)}
                className={drilldownButtonClassName(ratingDrilldown === rating)}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ratingBucketColor[rating] }}
                />
                Rating {rating}
              </button>
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
  competencyOrder,
  cycleId,
  selectedDepartment,
  selectedTitle,
  selectedStatus,
  selectedRatingSource,
  selectedGroupBy,
  csvHref,
}: {
  competencies: ReportingCompetenciesResponse;
  selectedCompetency: ReportingCompetencyResult | null;
  competencyOrder: string[];
  cycleId: string;
  selectedDepartment?: string;
  selectedTitle?: string;
  selectedStatus?: ProgressStatusFilter;
  selectedRatingSource: RatingSourceFilter;
  selectedGroupBy: "department" | "title";
  csvHref: string;
}) {
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

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Competency summary</CardTitle>
              <CardDescription>
                Heatmap intensity represents average observed ratings by department. Hover a cell
                for exact values.
              </CardDescription>
            </div>
            <a
              href={csvHref}
              download="reporting-competency-breakdown.csv"
              className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Export competencies CSV
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No competency data"
                description="Adjust filters to include departments with observed competency responses."
              />
            </div>
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    {competencyOrder.map((dimensionKey) => (
                      <TableHead key={`competency-heatmap-header-${dimensionKey}`}>
                        {shortLabel(humanizeEnumValue(dimensionKey), 12)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`competency-heatmap-${row.department}`}>
                      <TableCell className="font-medium text-slate-900">{row.department}</TableCell>
                      {row.cells.map((cell) => (
                        <TableCell key={`competency-cell-${row.department}-${cell.dimensionKey}`}>
                          <Link
                            href={toQueryString({
                              cycleId,
                              department: selectedDepartment,
                              title: selectedTitle,
                              tab: "competencies",
                              dimensionKey: cell.dimensionKey,
                              page: "1",
                            })}
                            className="group relative block rounded-[var(--radius-sm)] border border-slate-200 p-1.5 transition hover:border-slate-400"
                            style={heatmapCellStyle(cell.averageRating)}
                            data-testid={`reporting-competency-cell-${cell.dimensionKey}`}
                            aria-label={`${row.department} ${humanizeEnumValue(cell.dimensionKey)} average ${formatNumber(cell.averageRating)} from ${cell.observedCount} observations`}
                          >
                            <span className="block h-7 rounded-[var(--radius-sm)] border border-white/65 bg-white/20" />
                            <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max -translate-x-1/2 rounded-[var(--radius-sm)] border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-150 group-hover:opacity-100">
                              {humanizeEnumValue(cell.dimensionKey)} · {row.department}:{" "}
                              {formatNumber(cell.averageRating)} ({cell.observedCount} obs)
                            </span>
                          </Link>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      {selectedCompetency ? (
        <RightDrawer
          testId="reporting-competency-drilldown"
          title={`${humanizeEnumValue(selectedCompetency.dimensionKey)} drilldown`}
          subtitle="Distribution and self vs manager comparison for the selected competency."
          closeHref={toQueryString({
            cycleId,
            department: selectedDepartment,
            title: selectedTitle,
            status: selectedStatus,
            ratingSource: selectedRatingSource,
            groupBy: selectedGroupBy,
            tab: "competencies",
            page: "1",
          })}
          actions={
            <button
              type="button"
              onClick={() =>
                void downloadChartAsPng(
                  "reporting-competency-drilldown-chart",
                  `reporting-competency-${selectedCompetency.dimensionKey.toLowerCase()}.png`,
                )
              }
              className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              aria-label="Download competency drilldown chart as PNG"
              data-testid="reporting-download-competency-png"
            >
              Download PNG
            </button>
          }
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>Overall average: {formatNumber(selectedCompetency.averageRating)}</p>
                    <p>Self average: {formatNumber(selectedCompetency.self.averageRating)}</p>
                    <p>Manager average: {formatNumber(selectedCompetency.manager.averageRating)}</p>
                    <p>
                      Average gap (manager - self):{" "}
                      {formatNumber(selectedCompetency.selfManagerGap.averageGap)}
                    </p>
                  </div>
                  <ChartExportContainer chartId="reporting-competency-drilldown-chart" className="p-3">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
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
                          <YAxis allowDecimals={false} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                          <Tooltip labelFormatter={(value) => `Rating ${value}`} />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="Self" fill="#38bdf8" animationDuration={450} />
                          <Bar dataKey="Manager" fill="#22c55e" animationDuration={450} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartExportContainer>
                </div>
              ),
            },
            {
              id: "timeline",
              label: "Timeline",
              content: (
                <ol className="space-y-2 text-sm text-slate-700">
                  <li className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-medium text-slate-900">Observed responses</p>
                    <p className="text-xs text-slate-600">
                      {selectedCompetency.observedCount} rated responses included.
                    </p>
                  </li>
                  <li className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-medium text-slate-900">Not observed responses</p>
                    <p className="text-xs text-slate-600">
                      {selectedCompetency.notObservedCount} responses excluded from averages.
                    </p>
                  </li>
                </ol>
              ),
            },
            {
              id: "audit",
              label: "Audit Log",
              content: (
                <HelpHint label="How Not Observed is handled">
                  Not Observed responses are stored and reported separately. They are excluded from
                  average calculations and self-vs-manager gap math.
                </HelpHint>
              ),
            },
          ]}
        />
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
        label: shortLabel(humanizeEnumValue(metricKey), 14),
        self: metric.self.averageRating ?? 0,
        manager: metric.manager.averageRating ?? 0,
        gap: metric.selfManagerGap.averageGap ?? 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Scorecard metric comparison</CardTitle>
              <CardDescription>
                Self vs manager average ratings across weighted scorecard metrics.
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
        <CardContent>
          <ChartExportContainer chartId="reporting-scorecard-chart" className="p-3">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scorecardData} margin={{ top: 12, right: 16, left: 6, bottom: 36 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis domain={[0, 5]} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => [
                      typeof value === "number" ? value.toFixed(2) : "0.00",
                      name ?? "Value",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="self" name="Self avg" fill={reportingChartTheme.metricSeries.self} animationDuration={450} />
                  <Bar
                    dataKey="manager"
                    name="Manager avg"
                    fill={reportingChartTheme.metricSeries.manager}
                    animationDuration={450}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartExportContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gap and data quality</CardTitle>
          <CardDescription>
            Largest self-vs-manager differences and Not Observed counts for each metric.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Average</TableHead>
                  <TableHead>Gap (mgr-self)</TableHead>
                  <TableHead>Not observed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecardOrder.map((metricKey) => {
                  const metric = scorecard.metrics.find((entry) => entry.metricKey === metricKey);
                  if (!metric) {
                    return null;
                  }

                  return (
                    <TableRow key={`scorecard-row-${metricKey}`}>
                      <TableCell className="font-medium text-slate-900">
                        {humanizeEnumValue(metricKey)}
                      </TableCell>
                      <TableCell>{formatNumber(metric.averageRating)}</TableCell>
                      <TableCell>{formatNumber(metric.selfManagerGap.averageGap)}</TableCell>
                      <TableCell>{metric.notObservedCount}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
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

function drilldownButtonClassName(isActive: boolean): string {
  return [
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    isActive
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
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

function shortLabel(label: string, maxLength: number): string {
  return label.length > maxLength ? `${label.slice(0, maxLength)}…` : label;
}

function formatNumber(value: number | null): string {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toFixed(2);
}

function heatmapCellStyle(value: number | null): { background: string } {
  if (typeof value !== "number") {
    return { background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" };
  }

  if (value < 2.5) {
    return {
      background: `linear-gradient(135deg, ${reportingChartTheme.competency.low}, #fca5a5)`,
    };
  }

  if (value < 3.75) {
    return {
      background: `linear-gradient(135deg, ${reportingChartTheme.competency.medium}, #fcd34d)`,
    };
  }

  return {
    background: `linear-gradient(135deg, ${reportingChartTheme.competency.high}, #4ade80)`,
  };
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
): Array<{
  department: string;
  cells: Array<{ dimensionKey: string; averageRating: number | null; observedCount: number }>;
}> {
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
