import Link from "next/link";

import {
  CompetencyDimensionKey,
  ReviewSubmissionStatus,
  ScorecardMetricKey,
  UserRole,
} from "@prisma/client";

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
import { HelpHint } from "@/components/ui/help-hint";
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
import { getDevRequestContext } from "@/server/auth/request-context";
import {
  buildCompetencyBreakdownCsv,
  buildProgressSummaryCsv,
  buildRatingsDistributionCsv,
} from "@/server/reporting/reporting-export";
import {
  getReportingCompetencies,
  getReportingPeople,
  getReportingProgress,
  getReportingRatings,
  getReportingScorecard,
  listReportingCycles,
  parseCompetenciesFilters,
  parsePeopleFilters,
  parseProgressFilters,
  parseRatingsFilters,
  parseScorecardFilters,
  type ReportingCompetencyResult,
  type ReportingPeopleRow,
  type ReportingScorecardMetricResult,
} from "@/server/reporting/reporting-service";

type QueryValue = string | string[] | undefined;
type SearchParamsShape = Record<string, QueryValue>;

type ProgressStatusFilter = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type RatingSourceFilter = "FINAL" | "SCORECARD";
type ReportingTab = "progress" | "results" | "competencies" | "scorecard";

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

const competencyOrder = Object.values(CompetencyDimensionKey);
const scorecardOrder = Object.values(ScorecardMetricKey);

export const dynamic = "force-dynamic";

export default async function AdminReportingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const context = await getDevRequestContext();

  if (context.role !== UserRole.HR_ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>Reporting dashboards are restricted to HR admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700">
            Set <code>DEV_USER_ID=user_hr_admin_1</code> in <code>apps/web/.env.local</code> and
            restart the dev server.
          </p>
        </CardContent>
      </Card>
    );
  }

  const query = await searchParams;
  const cyclesResult = await listReportingCycles(context);

  if (cyclesResult.cycles.length === 0) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <PageHeader
          title="Reporting"
          description="Track cycle progress and rating outcomes across departments and titles."
        />
        <EmptyState
          title="No reporting data yet"
          description="Create a review cycle and generate submissions to populate reporting dashboards."
          action={
            <Link href="/admin/performance/review-cycles/new">
              <Button>Create Cycle</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selectedCycleId = resolveCycleId(getSingleValue(query.cycleId), cyclesResult.cycles);
  const selectedTab = parseTab(getSingleValue(query.tab));
  const selectedDepartment = getSingleValue(query.department);
  const selectedTitle = getSingleValue(query.title);
  const selectedRatingSource: RatingSourceFilter =
    getSingleValue(query.ratingSource) === "SCORECARD" ? "SCORECARD" : "FINAL";
  const selectedStatus = parseProgressStatus(getSingleValue(query.status));
  const selectedPage = parsePositiveInt(getSingleValue(query.page), 1);
  const requestedDimensionKey = parseDimensionKey(getSingleValue(query.dimensionKey));

  const progressFilters = parseProgressFilters(
    toUrlSearchParams({
      cycleId: selectedCycleId,
      department: selectedDepartment,
      title: selectedTitle,
    }),
  );

  const ratingsFilters = parseRatingsFilters(
    toUrlSearchParams({
      cycleId: selectedCycleId,
      department: selectedDepartment,
      title: selectedTitle,
      ratingSource: selectedRatingSource,
    }),
  );

  const competenciesFilters = parseCompetenciesFilters(
    toUrlSearchParams({
      cycleId: selectedCycleId,
      department: selectedDepartment,
      title: selectedTitle,
    }),
  );

  const scorecardFilters = parseScorecardFilters(
    toUrlSearchParams({
      cycleId: selectedCycleId,
      department: selectedDepartment,
      title: selectedTitle,
    }),
  );

  const peopleFilters = parsePeopleFilters(
    toUrlSearchParams({
      cycleId: selectedCycleId,
      department: selectedDepartment,
      title: selectedTitle,
      status: selectedStatus,
      ratingSource: selectedRatingSource,
      page: String(selectedPage),
      pageSize: "20",
    }),
  );

  const [filterCatalog, progress, ratings, competencies, scorecard, people] = await Promise.all([
    getReportingProgress(
      {
        cycleId: selectedCycleId,
        smallNThreshold: 5,
      },
      context,
    ),
    getReportingProgress(progressFilters, context),
    getReportingRatings(ratingsFilters, context),
    getReportingCompetencies(competenciesFilters, context),
    getReportingScorecard(scorecardFilters, context),
    getReportingPeople(peopleFilters, context),
  ]);

  const totalPeople =
    progress.totals.notStarted + progress.totals.inProgress + progress.totals.completed;
  const cycle = cyclesResult.cycles.find((item) => item.id === selectedCycleId);

  const cycleOptions = cyclesResult.cycles.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const departmentOptions = filterCatalog.filters.departments;
  const titleOptions = filterCatalog.filters.titles;

  const selectedCompetency =
    competencies.competencies.find((item) => item.dimensionKey === requestedDimensionKey) ??
    competencies.competencies.find((item) => item.observedCount > 0) ??
    competencies.competencies[0] ??
    null;

  const baseQuery = {
    cycleId: selectedCycleId,
    department: selectedDepartment,
    title: selectedTitle,
  };

  const progressTabHref = toQueryString({
    ...baseQuery,
    tab: "progress",
    status: selectedStatus,
    page: "1",
  });

  const resultsTabHref = toQueryString({
    ...baseQuery,
    tab: "results",
    ratingSource: selectedRatingSource,
    page: "1",
  });

  const competenciesTabHref = toQueryString({
    ...baseQuery,
    tab: "competencies",
    dimensionKey: selectedCompetency?.dimensionKey,
    page: "1",
  });

  const scorecardTabHref = toQueryString({
    ...baseQuery,
    tab: "scorecard",
    page: "1",
  });

  const previousPageHref =
    people.pagination.page > 1
      ? toQueryString({
          ...baseQuery,
          tab: selectedTab,
          status: selectedStatus,
          ratingSource: selectedRatingSource,
          dimensionKey: selectedCompetency?.dimensionKey,
          page: String(people.pagination.page - 1),
        })
      : null;

  const nextPageHref =
    people.pagination.page < people.pagination.totalPages
      ? toQueryString({
          ...baseQuery,
          tab: selectedTab,
          status: selectedStatus,
          ratingSource: selectedRatingSource,
          dimensionKey: selectedCompetency?.dimensionKey,
          page: String(people.pagination.page + 1),
        })
      : null;

  const csvHref = buildCsvHref(people.rows);
  const progressCsvHref = toDataCsvHref(buildProgressSummaryCsv(progress));
  const ratingsCsvHref = toDataCsvHref(buildRatingsDistributionCsv(ratings));
  const competenciesCsvHref = toDataCsvHref(buildCompetencyBreakdownCsv(competencies));
  const competencyHeatmapRows = buildCompetencyHeatmapRows(competencies.competencies);
  const scorecardHeatmapRows = buildScorecardHeatmapRows(scorecard.metrics);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Reporting"
        description="Review completion trends, ratings, and competency outcomes for the selected cycle."
        metadata={
          cycle ? (
            <span>
              Active cycle: <strong>{cycle.name}</strong>
            </span>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select a cycle, then refine by department and title.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-6" method="get">
            <input type="hidden" name="tab" value={selectedTab} />
            <input type="hidden" name="page" value="1" />
            {selectedCompetency ? (
              <input type="hidden" name="dimensionKey" value={selectedCompetency.dimensionKey} />
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
              Rating source
              <Select
                name="ratingSource"
                defaultValue={selectedRatingSource}
                data-testid="reporting-rating-source"
              >
                <option value="FINAL">Final</option>
                <option value="SCORECARD">Scorecard baseline</option>
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

            <div className="flex items-end">
              <Button type="submit" className="w-full" data-testid="reporting-apply-filters">
                Apply filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-1">
          <Link
            href={progressTabHref}
            data-testid="reporting-tab-progress"
            className={tabClassName(selectedTab === "progress")}
          >
            Progress
          </Link>
          <Link
            href={resultsTabHref}
            data-testid="reporting-tab-results"
            className={tabClassName(selectedTab === "results")}
          >
            Results
          </Link>
          <Link
            href={competenciesTabHref}
            data-testid="reporting-tab-competencies"
            className={tabClassName(selectedTab === "competencies")}
          >
            Competencies
          </Link>
          <Link
            href={scorecardTabHref}
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
        </div>
      </section>

      {selectedTab === "progress" ? (
        <ProgressTabContent
          progress={progress}
          totalPeople={totalPeople}
          progressCsvHref={progressCsvHref}
        />
      ) : null}

      {selectedTab === "results" ? (
        <ResultsTabContent ratings={ratings} ratingsCsvHref={ratingsCsvHref} />
      ) : null}

      {selectedTab === "competencies" ? (
        <CompetenciesTabContent
          competencies={competencies.competencies}
          suppression={competencies.suppression}
          selectedCompetency={selectedCompetency}
          baseQuery={baseQuery}
          heatmapRows={competencyHeatmapRows}
          competenciesCsvHref={competenciesCsvHref}
        />
      ) : null}

      {selectedTab === "scorecard" ? (
        <ScorecardTabContent
          metrics={scorecard.metrics}
          suppression={scorecard.suppression}
          heatmapRows={scorecardHeatmapRows}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Employee drilldown</CardTitle>
              <CardDescription>
                {selectedStatus
                  ? `Filtered to ${progressStatusLabel[selectedStatus].toLowerCase()} employees.`
                  : "Use status, department, and title filters to narrow this table."}
              </CardDescription>
            </div>
            {people.rows.length > 0 ? (
              <a
                href={csvHref}
                download={`reporting-employees-${selectedCycleId}.csv`}
                className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Export CSV
              </a>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {people.rows.length === 0 ? (
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
                  {people.rows.map((row) => (
                    <TableRow key={row.employeeId}>
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
                          <Link
                            href={row.links.packet}
                            className="text-xs font-medium text-slate-700 underline underline-offset-2"
                          >
                            Packet
                          </Link>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}

          <div className="flex items-center justify-between px-5 pb-5 text-sm text-slate-600">
            <span>
              Page {people.pagination.page} of {Math.max(people.pagination.totalPages, 1)} (
              {people.pagination.totalRows} employees)
            </span>
            <div className="flex items-center gap-2">
              {previousPageHref ? (
                <Link
                  href={previousPageHref}
                  className="text-xs font-medium text-slate-700 underline underline-offset-2"
                >
                  Previous
                </Link>
              ) : (
                <span className="text-xs text-slate-400">Previous</span>
              )}
              {nextPageHref ? (
                <Link
                  href={nextPageHref}
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

function ProgressTabContent({
  progress,
  totalPeople,
  progressCsvHref,
}: {
  progress: Awaited<ReturnType<typeof getReportingProgress>>;
  totalPeople: number;
  progressCsvHref: string;
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

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Not started"
          value={progress.totals.notStarted}
          caption="No self or manager progress yet"
        />
        <MetricCard
          title="In progress"
          value={progress.totals.inProgress}
          caption="At least one review is underway"
        />
        <MetricCard
          title="Completed"
          value={progress.totals.completed}
          caption="Self and manager submitted"
        />
        <MetricCard
          title="Self in progress"
          value={progress.self.inProgress}
          caption="Employee draft activity"
        />
        <MetricCard
          title="Manager in progress"
          value={progress.manager.inProgress}
          caption="Manager draft activity"
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
            <a
              href={progressCsvHref}
              download="reporting-progress-summary.csv"
              className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Export progress CSV
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-4 overflow-hidden rounded-full border border-slate-200">
            <div
              className="bg-rose-200"
              style={{ width: percent(progress.totals.notStarted, totalPeople) }}
            />
            <div
              className="bg-amber-200"
              style={{ width: percent(progress.totals.inProgress, totalPeople) }}
            />
            <div
              className="bg-emerald-200"
              style={{ width: percent(progress.totals.completed, totalPeople) }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span>Not started: {progress.totals.notStarted}</span>
            <span>In progress: {progress.totals.inProgress}</span>
            <span>Completed: {progress.totals.completed}</span>
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

function ResultsTabContent({
  ratings,
  ratingsCsvHref,
}: {
  ratings: Awaited<ReturnType<typeof getReportingRatings>>;
  ratingsCsvHref: string;
}) {
  if (ratings.suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={
          ratings.suppression.message ??
          "Widen the filter scope to view rating distributions safely."
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
                {ratings.ratingSource === "FINAL"
                  ? "Final rating source"
                  : "Scorecard baseline rating source"}
              </CardDescription>
            </div>
            <a
              href={ratingsCsvHref}
              download="reporting-ratings-distribution.csv"
              className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Export ratings CSV
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["5", "4", "3", "2", "1"] as const).map((ratingKey) => (
            <div key={ratingKey} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span>Rating {ratingKey}</span>
                <span>{ratings.distribution[ratingKey]}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-700"
                  style={{
                    width: percent(ratings.distribution[ratingKey], ratings.ratedCount),
                  }}
                />
              </div>
            </div>
          ))}
          <HelpHint label="Final vs scorecard baseline">
            Final reflects the current final rating source. Scorecard baseline shows the
            scorecard-derived rating before calibration overrides.
          </HelpHint>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source breakdown</CardTitle>
          <CardDescription>
            Final vs scorecard baseline source counts across included packets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>Scorecard source: {ratings.sourceSummary.scorecard}</p>
          <p>Calibration source: {ratings.sourceSummary.calibration}</p>
          <p>Unset source: {ratings.sourceSummary.unset}</p>
        </CardContent>
      </Card>
    </section>
  );
}

function CompetenciesTabContent({
  competencies,
  suppression,
  selectedCompetency,
  baseQuery,
  heatmapRows,
  competenciesCsvHref,
}: {
  competencies: ReportingCompetencyResult[];
  suppression: { suppressed: boolean; message: string | null };
  selectedCompetency: ReportingCompetencyResult | null;
  baseQuery: {
    cycleId: string;
    department?: string;
    title?: string;
  };
  heatmapRows: Array<{
    department: string;
    cells: Array<{
      dimensionKey: CompetencyDimensionKey;
      averageRating: number | null;
    }>;
  }>;
  competenciesCsvHref: string;
}) {
  if (suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={
          suppression.message ?? "Widen filters to unlock competency insights safely."
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Competency summary</CardTitle>
              <CardDescription>
                Average, distribution, and self vs manager gap by competency.
              </CardDescription>
            </div>
            <a
              href={competenciesCsvHref}
              download="reporting-competency-breakdown.csv"
              className="rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[var(--shadow-xs)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Export competencies CSV
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competency</TableHead>
                  <TableHead>Avg</TableHead>
                  <TableHead>Self avg</TableHead>
                  <TableHead>Manager avg</TableHead>
                  <TableHead>Gap (mgr-self)</TableHead>
                  <TableHead>Not observed</TableHead>
                  <TableHead>Drill in</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competencyOrder.map((dimensionKey) => {
                  const competency = competencies.find((item) => item.dimensionKey === dimensionKey);
                  if (!competency) {
                    return null;
                  }

                  const detailHref = toQueryString({
                    ...baseQuery,
                    tab: "competencies",
                    dimensionKey,
                    page: "1",
                  });

                  return (
                    <TableRow key={dimensionKey}>
                      <TableCell className="font-medium text-slate-900">
                        {humanizeEnumValue(dimensionKey)}
                      </TableCell>
                      <TableCell>{formatNumber(competency.averageRating)}</TableCell>
                      <TableCell>{formatNumber(competency.self.averageRating)}</TableCell>
                      <TableCell>{formatNumber(competency.manager.averageRating)}</TableCell>
                      <TableCell>{formatNumber(competency.selfManagerGap.averageGap)}</TableCell>
                      <TableCell>{competency.notObservedCount}</TableCell>
                      <TableCell>
                        <Link
                          href={detailHref}
                          className="text-xs font-medium text-slate-700 underline underline-offset-2"
                        >
                          View details
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
          <div className="px-5 pb-5">
            <HelpHint label="How Not Observed is handled">
              Not Observed entries are counted in data-quality totals and excluded from metric
              averages and self-vs-manager gap calculations.
            </HelpHint>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department × competency heatmap</CardTitle>
          <CardDescription>
            Average competency ratings by department (Not Observed excluded).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {heatmapRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No department heatmap data"
                description="Adjust filters to include departments with observed competency ratings."
              />
            </div>
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    {competencyOrder.map((dimensionKey) => (
                      <TableHead key={`heatmap-header-${dimensionKey}`}>
                        {shortCompetencyLabel(dimensionKey)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmapRows.map((row) => (
                    <TableRow key={`heatmap-row-${row.department}`}>
                      <TableCell className="font-medium text-slate-900">{row.department}</TableCell>
                      {row.cells.map((cell) => (
                        <TableCell key={`heatmap-cell-${row.department}-${cell.dimensionKey}`}>
                          {formatNumber(cell.averageRating)}
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
        <Card data-testid="reporting-competency-drilldown">
          <CardHeader>
            <CardTitle>{humanizeEnumValue(selectedCompetency.dimensionKey)} drilldown</CardTitle>
            <CardDescription>
              Distribution and self vs manager comparison for the selected competency.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm text-slate-700">
              <p>Overall average: {formatNumber(selectedCompetency.averageRating)}</p>
              <p>Self average: {formatNumber(selectedCompetency.self.averageRating)}</p>
              <p>Manager average: {formatNumber(selectedCompetency.manager.averageRating)}</p>
              <p>
                Average gap (manager - self): {formatNumber(selectedCompetency.selfManagerGap.averageGap)}
              </p>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              {(["1", "2", "3", "4", "5"] as const).map((ratingKey) => (
                <div key={`competency-drill-${ratingKey}`} className="flex items-center gap-3">
                  <span className="w-12">{ratingKey}</span>
                  <span>Self: {selectedCompetency.selfDistribution[ratingKey]}</span>
                  <span>Manager: {selectedCompetency.managerDistribution[ratingKey]}</span>
                </div>
              ))}
            </div>
            <HelpHint label="How Not Observed is handled" className="md:col-span-2">
              Not Observed responses are stored and reported separately. They are excluded from
              average calculations and self-vs-manager gap math.
            </HelpHint>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function ScorecardTabContent({
  metrics,
  suppression,
  heatmapRows,
}: {
  metrics: ReportingScorecardMetricResult[];
  suppression: { suppressed: boolean; message: string | null };
  heatmapRows: Array<{
    department: string;
    cells: Array<{
      metricKey: ScorecardMetricKey;
      averageRating: number | null;
    }>;
  }>;
}) {
  if (suppression.suppressed) {
    return (
      <EmptyState
        title="Insufficient data for selected filters"
        description={suppression.message ?? "Widen filters to unlock scorecard insights safely."}
      />
    );
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scorecard metric insights</CardTitle>
          <CardDescription>
            Distribution, averages, and self vs manager gaps for weighted scorecard metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Avg</TableHead>
                  <TableHead>Self avg</TableHead>
                  <TableHead>Manager avg</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Not observed</TableHead>
                  <TableHead>Distribution (1-5)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecardOrder.map((metricKey) => {
                  const metric = metrics.find((item) => item.metricKey === metricKey);
                  if (!metric) {
                    return null;
                  }

                  const distributionSummary = ["1", "2", "3", "4", "5"]
                    .map((bucket) => `${bucket}:${metric.distribution[bucket as keyof typeof metric.distribution]}`)
                    .join(" ");

                  return (
                    <TableRow key={metricKey}>
                      <TableCell className="font-medium text-slate-900">
                        {humanizeEnumValue(metricKey)}
                      </TableCell>
                      <TableCell>{formatNumber(metric.averageRating)}</TableCell>
                      <TableCell>{formatNumber(metric.self.averageRating)}</TableCell>
                      <TableCell>{formatNumber(metric.manager.averageRating)}</TableCell>
                      <TableCell>{formatNumber(metric.selfManagerGap.averageGap)}</TableCell>
                      <TableCell>{metric.notObservedCount}</TableCell>
                      <TableCell className="text-xs text-slate-700">{distributionSummary}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableWrapper>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department × scorecard heatmap</CardTitle>
          <CardDescription>
            Average scorecard metric ratings by department (Not Observed excluded).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {heatmapRows.length === 0 ? (
            <div className="p-5">
              <EmptyState
                title="No scorecard heatmap data"
                description="Adjust filters to include departments with observed scorecard metrics."
              />
            </div>
          ) : (
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    {scorecardOrder.map((metricKey) => (
                      <TableHead key={`scorecard-heatmap-header-${metricKey}`}>
                        {shortMetricLabel(metricKey)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmapRows.map((row) => (
                    <TableRow key={`scorecard-heatmap-row-${row.department}`}>
                      <TableCell className="font-medium text-slate-900">{row.department}</TableCell>
                      {row.cells.map((cell) => (
                        <TableCell key={`scorecard-heatmap-cell-${row.department}-${cell.metricKey}`}>
                          {formatNumber(cell.averageRating)}
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
    </section>
  );
}

function MetricCard({
  title,
  value,
  caption,
}: {
  title: string;
  value: number;
  caption: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{title}</p>
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        <p className="text-xs text-slate-600">{caption}</p>
      </CardContent>
    </Card>
  );
}

function getSingleValue(value: QueryValue): string | undefined {
  if (Array.isArray(value)) {
    return normalizeString(value[0]);
  }

  return normalizeString(value);
}

function normalizeString(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveCycleId(cycleId: string | undefined, cycles: Array<{ id: string }>): string {
  if (cycleId && cycles.some((cycle) => cycle.id === cycleId)) {
    return cycleId;
  }

  return cycles[0]?.id ?? "";
}

function toUrlSearchParams(values: Record<string, string | undefined>): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

function toQueryString(values: Record<string, string | undefined>): string {
  const searchParams = toUrlSearchParams(values);
  const serialized = searchParams.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

function parseProgressStatus(value: string | undefined): ProgressStatusFilter | undefined {
  if (value === "NOT_STARTED" || value === "IN_PROGRESS" || value === "COMPLETED") {
    return value;
  }

  return undefined;
}

function parseTab(value: string | undefined): ReportingTab {
  if (
    value === "progress" ||
    value === "results" ||
    value === "competencies" ||
    value === "scorecard"
  ) {
    return value;
  }

  return "progress";
}

function parseDimensionKey(value: string | undefined): CompetencyDimensionKey | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = competencyOrder.find((item) => item === value);
  return parsed;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function percent(value: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, (value / total) * 100)).toFixed(1)}%`;
}

function tabClassName(isActive: boolean): string {
  return [
    "rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
    isActive ? "bg-white text-slate-900 shadow-[var(--shadow-xs)]" : "text-slate-600",
  ].join(" ");
}

function buildCsvHref(rows: ReportingPeopleRow[]): string {
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

function toDataCsvHref(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function escapeCsvCell(value: string | number): string {
  const normalized = String(value);
  if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
    return `"${normalized.replaceAll("\"", "\"\"")}"`;
  }

  return normalized;
}

function humanizeEnumValue(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function shortCompetencyLabel(key: CompetencyDimensionKey): string {
  const label = humanizeEnumValue(key);
  return label.length > 14 ? `${label.slice(0, 14)}…` : label;
}

function shortMetricLabel(key: ScorecardMetricKey): string {
  const label = humanizeEnumValue(key);
  return label.length > 12 ? `${label.slice(0, 12)}…` : label;
}

function formatNumber(value: number | null): string {
  if (typeof value !== "number") {
    return "-";
  }

  return value.toFixed(2);
}

function buildCompetencyHeatmapRows(competencies: ReportingCompetencyResult[]): Array<{
  department: string;
  cells: Array<{
    dimensionKey: CompetencyDimensionKey;
    averageRating: number | null;
  }>;
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
        const competency = byDimension.get(dimensionKey);
        const departmentCell = competency?.departmentBreakdown.find(
          (breakdown) => breakdown.department === department,
        );

        return {
          dimensionKey,
          averageRating: departmentCell?.averageRating ?? null,
        };
      }),
    }));
}

function buildScorecardHeatmapRows(metrics: ReportingScorecardMetricResult[]): Array<{
  department: string;
  cells: Array<{
    metricKey: ScorecardMetricKey;
    averageRating: number | null;
  }>;
}> {
  const departments = new Set<string>();
  const byMetric = new Map(metrics.map((metric) => [metric.metricKey, metric]));

  for (const metric of metrics) {
    for (const breakdown of metric.departmentBreakdown) {
      departments.add(breakdown.department);
    }
  }

  return Array.from(departments)
    .sort((left, right) => left.localeCompare(right))
    .map((department) => ({
      department,
      cells: scorecardOrder.map((metricKey) => {
        const metric = byMetric.get(metricKey);
        const departmentCell = metric?.departmentBreakdown.find(
          (breakdown) => breakdown.department === department,
        );

        return {
          metricKey,
          averageRating: departmentCell?.averageRating ?? null,
        };
      }),
    }));
}
