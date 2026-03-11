import Link from "next/link";

import { CompetencyDimensionKey, ScorecardMetricKey, UserRole } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { ReportingDashboard } from "@/components/reporting/reporting-dashboard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDevRequestContext } from "@/server/auth/request-context";
import {
  buildCompetencyBreakdownCsv,
  buildProgressSummaryCsv,
  buildRatingsDistributionCsv,
} from "@/server/reporting/reporting-export";
import {
  getReportingCompetencies,
  getReportingManagerOverview,
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
} from "@/server/reporting/reporting-service";

type QueryValue = string | string[] | undefined;
type SearchParamsShape = Record<string, QueryValue>;

type ProgressStatusFilter = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
type RatingSourceFilter = "FINAL" | "SCORECARD";
type ReportingTab =
  | "overview"
  | "managers"
  | "queue"
  | "results"
  | "competencies"
  | "scorecard";
type GroupByFilter = "department" | "title";

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
  const selectedGroupBy = parseGroupBy(getSingleValue(query.groupBy));
  const requestedStatus = parseProgressStatus(getSingleValue(query.status));
  const selectedStatus = selectedTab === "queue" ? requestedStatus : undefined;
  const selectedPage = parsePositiveInt(getSingleValue(query.page), 1);
  const requestedDimensionKey = parseDimensionKey(getSingleValue(query.dimensionKey));
  const requestedCompetencyDepartment = getSingleValue(query.competencyDepartment);

  const progressFilters = parseProgressFilters(
    toUrlSearchParams({
      cycleId: selectedCycleId,
      department: selectedDepartment,
      title: selectedTitle,
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

  const [
    filterCatalog,
    progress,
    managerOverview,
    ratingsFinal,
    ratingsScorecard,
    competencies,
    scorecard,
    people,
  ] =
    await Promise.all([
      getReportingProgress(
        {
          cycleId: selectedCycleId,
          smallNThreshold: 5,
        },
        context,
      ),
      getReportingProgress(progressFilters, context),
      getReportingManagerOverview(progressFilters, context),
      getReportingRatings(
        parseRatingsFilters(
          toUrlSearchParams({
            cycleId: selectedCycleId,
            department: selectedDepartment,
            title: selectedTitle,
            ratingSource: "FINAL",
          }),
        ),
        context,
      ),
      getReportingRatings(
        parseRatingsFilters(
          toUrlSearchParams({
            cycleId: selectedCycleId,
            department: selectedDepartment,
            title: selectedTitle,
            ratingSource: "SCORECARD",
          }),
        ),
        context,
      ),
      getReportingCompetencies(competenciesFilters, context),
      getReportingScorecard(scorecardFilters, context),
      getReportingPeople(peopleFilters, context),
    ]);

  const cycle = cyclesResult.cycles.find((item) => item.id === selectedCycleId);

  const cycleOptions = cyclesResult.cycles.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  const departmentOptions = filterCatalog.filters.departments;
  const titleOptions = filterCatalog.filters.titles;

  const selectedCompetency = requestedDimensionKey
    ? competencies.competencies.find((item) => item.dimensionKey === requestedDimensionKey) ??
      competencies.competencies.find((item) => item.observedCount > 0) ??
      competencies.competencies[0] ??
      null
    : null;

  const baseQuery = {
    cycleId: selectedCycleId,
    department: selectedDepartment,
    title: selectedTitle,
    groupBy: selectedGroupBy,
  };

  const tabHrefs = {
    overview: toQueryString({
      ...baseQuery,
      tab: "overview",
      ratingSource: selectedRatingSource,
      page: "1",
    }),
    managers: toQueryString({
      ...baseQuery,
      tab: "managers",
      ratingSource: selectedRatingSource,
      page: "1",
    }),
    queue: toQueryString({
      ...baseQuery,
      tab: "queue",
      status: selectedStatus,
      ratingSource: selectedRatingSource,
      page: "1",
    }),
    results: toQueryString({
      ...baseQuery,
      tab: "results",
      ratingSource: selectedRatingSource,
      page: "1",
    }),
    competencies: toQueryString({
      ...baseQuery,
      tab: "competencies",
      ratingSource: selectedRatingSource,
      dimensionKey: selectedCompetency?.dimensionKey,
      competencyDepartment: requestedCompetencyDepartment,
      page: "1",
    }),
    scorecard: toQueryString({
      ...baseQuery,
      tab: "scorecard",
      ratingSource: selectedRatingSource,
      page: "1",
    }),
  };

  const paginationHrefs = {
    previous:
      people.pagination.page > 1
        ? toQueryString({
            ...baseQuery,
            tab: selectedTab,
            status: selectedStatus,
            ratingSource: selectedRatingSource,
            dimensionKey: selectedCompetency?.dimensionKey,
            page: String(people.pagination.page - 1),
          })
        : null,
    next:
      people.pagination.page < people.pagination.totalPages
        ? toQueryString({
            ...baseQuery,
            tab: selectedTab,
            status: selectedStatus,
            ratingSource: selectedRatingSource,
            dimensionKey: selectedCompetency?.dimensionKey,
            page: String(people.pagination.page + 1),
          })
        : null,
  };

  return (
    <ReportingDashboard
      cycleName={cycle?.name ?? null}
      selectedTab={selectedTab}
      selectedCycleId={selectedCycleId}
      selectedDepartment={selectedDepartment}
      selectedTitle={selectedTitle}
      selectedStatus={selectedStatus}
      selectedRatingSource={selectedRatingSource}
      selectedGroupBy={selectedGroupBy}
      selectedDimensionKey={selectedCompetency?.dimensionKey}
      cycleOptions={cycleOptions}
      departmentOptions={departmentOptions}
      titleOptions={titleOptions}
      tabHrefs={tabHrefs}
      paginationHrefs={paginationHrefs}
      managerOverview={managerOverview}
      progress={progress}
      ratingsFinal={ratingsFinal}
      ratingsScorecard={ratingsScorecard}
      competencies={competencies}
      selectedCompetency={selectedCompetency}
      selectedCompetencyDepartment={requestedCompetencyDepartment}
      scorecard={scorecard}
      people={people}
      competencyOrder={competencyOrder}
      scorecardOrder={scorecardOrder}
      csvHrefs={{
        progress: toDataCsvHref(buildProgressSummaryCsv(progress)),
        ratings: toDataCsvHref(
          buildRatingsDistributionCsv(
            selectedRatingSource === "FINAL" ? ratingsFinal : ratingsScorecard,
          ),
        ),
        competencies: toDataCsvHref(buildCompetencyBreakdownCsv(competencies)),
      }}
    />
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

function toDataCsvHref(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

function parseProgressStatus(value: string | undefined): ProgressStatusFilter | undefined {
  if (value === "NOT_STARTED" || value === "IN_PROGRESS" || value === "COMPLETED") {
    return value;
  }

  return undefined;
}

function parseTab(value: string | undefined): ReportingTab {
  if (
    value === "overview" ||
    value === "managers" ||
    value === "queue" ||
    value === "results" ||
    value === "competencies" ||
    value === "scorecard"
  ) {
    return value;
  }

  if (value === "progress") {
    return "overview";
  }

  return "overview";
}

function parseGroupBy(value: string | undefined): GroupByFilter {
  if (value === "title") {
    return "title";
  }

  return "department";
}

function parseDimensionKey(value: string | undefined): CompetencyDimensionKey | undefined {
  if (!value) {
    return undefined;
  }

  return competencyOrder.find((item) => item === value);
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
