import Link from "next/link";

import { ReviewSubmissionStatus, UserRole } from "@prisma/client";

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
  getReportingPeople,
  getReportingProgress,
  getReportingRatings,
  listReportingCycles,
  parsePeopleFilters,
  parseProgressFilters,
  parseRatingsFilters,
  type ReportingPeopleRow,
} from "@/server/reporting/reporting-service";

type QueryValue = string | string[] | undefined;

type SearchParamsShape = Record<string, QueryValue>;

type ProgressStatusFilter = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type RatingSourceFilter = "FINAL" | "SCORECARD";
type ReportingTab = "progress" | "results";

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
  const selectedTab: ReportingTab = getSingleValue(query.tab) === "results" ? "results" : "progress";
  const selectedDepartment = getSingleValue(query.department);
  const selectedTitle = getSingleValue(query.title);
  const selectedRatingSource: RatingSourceFilter =
    getSingleValue(query.ratingSource) === "SCORECARD" ? "SCORECARD" : "FINAL";
  const selectedStatus = parseProgressStatus(getSingleValue(query.status));
  const selectedPage = parsePositiveInt(getSingleValue(query.page), 1);

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

  const [filterCatalog, progress, ratings, people] = await Promise.all([
    getReportingProgress(
      {
        cycleId: selectedCycleId,
        smallNThreshold: 5,
      },
      context,
    ),
    getReportingProgress(progressFilters, context),
    getReportingRatings(ratingsFilters, context),
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

  const previousPageHref =
    people.pagination.page > 1
      ? toQueryString({
          ...baseQuery,
          tab: selectedTab,
          status: selectedStatus,
          ratingSource: selectedRatingSource,
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
          page: String(people.pagination.page + 1),
        })
      : null;

  const csvHref = buildCsvHref(people.rows);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        title="Reporting"
        description="Review completion trends and rating outcomes for the selected cycle."
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
        </div>

        <div className="text-sm text-slate-600">
          Showing <span data-testid="reporting-current-department">{selectedDepartment ?? "All departments"}</span>
          {" • "}
          <span data-testid="reporting-current-title">{selectedTitle ?? "All titles"}</span>
        </div>
      </section>

      {selectedTab === "progress" ? (
        <>
          {progress.suppression.suppressed ? (
            <EmptyState
              title="Insufficient data for selected filters"
              description={
                progress.suppression.message ??
                "Widen the filter scope to view aggregate progress safely."
              }
            />
          ) : (
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
                  <CardTitle>Status mix</CardTitle>
                  <CardDescription>
                    Distribution across {totalPeople} employees in the current filter scope.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : (
        <>
          {ratings.suppression.suppressed ? (
            <EmptyState
              title="Insufficient data for selected filters"
              description={
                ratings.suppression.message ??
                "Widen the filter scope to view rating distributions safely."
              }
            />
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rating distribution</CardTitle>
                  <CardDescription>
                    {ratings.ratingSource === "FINAL"
                      ? "Final rating source"
                      : "Scorecard baseline rating source"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                            width: percent(
                              ratings.distribution[ratingKey],
                              ratings.ratedCount,
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))}
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
          )}
        </>
      )}

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
              Page {people.pagination.page} of {Math.max(people.pagination.totalPages, 1)} ({people.pagination.totalRows} employees)
            </span>
            <div className="flex items-center gap-2">
              {previousPageHref ? (
                <Link href={previousPageHref} className="text-xs font-medium text-slate-700 underline underline-offset-2">
                  Previous
                </Link>
              ) : (
                <span className="text-xs text-slate-400">Previous</span>
              )}
              {nextPageHref ? (
                <Link href={nextPageHref} className="text-xs font-medium text-slate-700 underline underline-offset-2">
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

function escapeCsvCell(value: string | number): string {
  const normalized = String(value);
  if (normalized.includes(",") || normalized.includes("\"") || normalized.includes("\n")) {
    return `"${normalized.replaceAll("\"", "\"\"")}"`;
  }

  return normalized;
}
