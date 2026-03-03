import Link from "next/link";
import { ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
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
import { getManagerTeamReviewDashboard } from "@/server/reviews/team-reviews-service";

const statusTone = {
  NOT_STARTED: "neutral",
  IN_PROGRESS: "info",
  SUBMITTED: "success",
  RETURNED: "warning",
} as const;

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

export const dynamic = "force-dynamic";

type SearchParamsShape = Record<string, string | string[] | undefined>;

export default async function TeamReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.MANAGER) {
    redirect("/");
  }

  const query = await searchParams;
  const selectedCycleId = getSingleValue(query.cycleId);
  const selectedEmployeeId = getSingleValue(query.employeeId);

  const dashboard = await getManagerTeamReviewDashboard(
    context,
    selectedCycleId ? { cycleId: selectedCycleId } : {},
  );
  const selectedRow =
    selectedEmployeeId != null
      ? dashboard.rows.find((row) => row.employeeId === selectedEmployeeId) ?? null
      : null;

  const total = dashboard.kpis.totalDirectReports;
  const completedPct =
    total > 0 ? Math.round((dashboard.kpis.completedManagerReview / total) * 100) : 0;
  const inProgressPct =
    total > 0 ? Math.round((dashboard.kpis.inProgressManagerReview / total) * 100) : 0;
  const awaitingPct = total > 0 ? Math.max(0, 100 - completedPct - inProgressPct) : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="My Team"
        description="Manage direct-report reviews with profile drilldowns and contextual actions."
        metadata={
          dashboard.cycle ? (
            <span>
              Cycle: <strong>{dashboard.cycle.name}</strong>
            </span>
          ) : (
            "No cycle submissions found yet"
          )
        }
      />

      {dashboard.rows.length === 0 ? (
        <EmptyState
          title="No team data yet"
          description="My Team populates after HR generates cycle submissions for your direct reports."
          icon={<span aria-hidden="true">👥</span>}
          action={
            <Link href="/performance/reviews">
              <Button variant="outline" size="sm">
                Open my review tasks
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <form method="get" className="flex flex-wrap items-center gap-2">
                <Select
                  name="cycleId"
                  defaultValue={dashboard.cycle?.id ?? ""}
                  data-testid="my-team-cycle-select"
                  className="w-[260px]"
                >
                  {dashboard.cycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="outline" size="sm">
                  Load cycle
                </Button>
              </form>
              <StatusChip tone="info">Team size {dashboard.kpis.totalDirectReports}</StatusChip>
            </CardContent>
          </Card>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Total direct reports"
              value={dashboard.kpis.totalDirectReports}
              tone="info"
            />
            <KpiCard
              label="Awaiting manager review"
              value={dashboard.kpis.awaitingManagerReview}
              tone="neutral"
            />
            <KpiCard
              label="Self not started"
              value={dashboard.kpis.selfNotStarted}
              tone="warning"
            />
            <KpiCard
              label="Overdue manager reviews"
              value={dashboard.kpis.overdueManagerReview}
              tone="warning"
            />
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Manager review completion</CardTitle>
              <CardDescription>
                {dashboard.kpis.completedManagerReview} of {dashboard.kpis.totalDirectReports} manager
                reviews submitted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="flex h-full w-full">
                  <div className="bg-slate-400" style={{ width: `${awaitingPct}%` }} />
                  <div className="bg-sky-500" style={{ width: `${inProgressPct}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${completedPct}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-slate-700">
                <span>Awaiting {awaitingPct}%</span>
                <span>In progress {inProgressPct}%</span>
                <span>Completed {completedPct}%</span>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="my-team-insights">
            <CardHeader>
              <CardTitle className="text-lg">Insights</CardTitle>
              <CardDescription>
                Snapshot of completion and rating spread for your direct reports in this cycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Completion snapshot
                </p>
                <p>Awaiting manager review: {dashboard.kpis.awaitingManagerReview}</p>
                <p>In progress: {dashboard.kpis.inProgressManagerReview}</p>
                <p>Completed: {dashboard.kpis.completedManagerReview}</p>
              </div>
              <div className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                <RatingDistribution
                  title="Final rating"
                  total={dashboard.insights.finalRatedCount}
                  distribution={dashboard.insights.finalDistribution}
                />
                <RatingDistribution
                  title="Scorecard baseline"
                  total={dashboard.insights.scorecardRatedCount}
                  distribution={dashboard.insights.scorecardDistribution}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardContent className="p-0">
                <TableWrapper>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Direct report</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Self</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Peer</TableHead>
                        <TableHead>Upward</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.rows.map((row) => (
                        <TableRow key={row.employeeId} data-testid="team-reviews-row">
                          <TableCell className="font-semibold text-slate-900">{row.employeeName}</TableCell>
                          <TableCell className="text-slate-700">{row.title ?? "—"}</TableCell>
                          <TableCell className="text-slate-700">{row.department ?? "—"}</TableCell>
                          <TableCell>{renderStatus(row.statuses[ReviewRelationship.SELF])}</TableCell>
                          <TableCell>{renderStatus(row.statuses[ReviewRelationship.MANAGER])}</TableCell>
                          <TableCell>{renderStatus(row.statuses[ReviewRelationship.PEER])}</TableCell>
                          <TableCell>{renderStatus(row.statuses[ReviewRelationship.UPWARD])}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Link href={toMyTeamHref(dashboard.cycle?.id ?? null, row.employeeId)}>
                                <Button size="sm" data-testid={`my-team-open-profile-${row.employeeId}`}>
                                  Open profile
                                </Button>
                              </Link>
                              {row.managerReviewHref ? (
                                <Link href={row.managerReviewHref}>
                                  <Button size="sm" variant="outline">
                                    Open review
                                  </Button>
                                </Link>
                              ) : (
                                <Badge variant="info">No manager task</Badge>
                              )}
                              {row.packetHref ? (
                                <Link href={row.packetHref}>
                                  <Button size="sm" variant="outline">
                                    Open packet
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>

            <Card data-testid="my-team-profile-drawer">
              <CardHeader>
                <CardTitle className="text-lg">Direct report profile</CardTitle>
                <CardDescription>
                  {selectedRow
                    ? "Status snapshot and quick actions for this direct report."
                    : "Select Open profile from the table to view details."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRow ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-900">{selectedRow.employeeName}</p>
                      <p className="text-sm text-slate-600">
                        {selectedRow.title ?? "No title"} · {selectedRow.department ?? "No department"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <StatusLine
                        label="Self"
                        status={selectedRow.statuses[ReviewRelationship.SELF]}
                      />
                      <StatusLine
                        label="Manager"
                        status={selectedRow.statuses[ReviewRelationship.MANAGER]}
                      />
                      <StatusLine
                        label="Peer"
                        status={selectedRow.statuses[ReviewRelationship.PEER]}
                      />
                      <StatusLine
                        label="Upward"
                        status={selectedRow.statuses[ReviewRelationship.UPWARD]}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedRow.managerReviewHref ? (
                        <Link href={selectedRow.managerReviewHref}>
                          <Button size="sm">Open review</Button>
                        </Link>
                      ) : null}
                      {selectedRow.packetHref ? (
                        <Link href={selectedRow.packetHref}>
                          <Button size="sm" variant="outline">
                            Open packet
                          </Button>
                        </Link>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="No profile selected"
                    description="Pick a direct report to view review status and actions."
                    className="p-4"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function renderStatus(status: ReviewSubmissionStatus | undefined) {
  if (!status) {
    return <Badge variant="info">N/A</Badge>;
  }

  return <StatusChip tone={statusTone[status]}>{statusLabel[status]}</StatusChip>;
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "info" | "success" | "warning";
}) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>{label}</CardDescription>
        <div className="flex items-center gap-2">
          <CardTitle className="text-2xl">{value}</CardTitle>
          <StatusChip tone={tone}>{label}</StatusChip>
        </div>
      </CardHeader>
    </Card>
  );
}

function StatusLine({
  label,
  status,
}: {
  label: string;
  status: ReviewSubmissionStatus | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {renderStatus(status)}
    </div>
  );
}

function getSingleValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toMyTeamHref(cycleId: string | null, employeeId: string): string {
  const params = new URLSearchParams();
  if (cycleId) {
    params.set("cycleId", cycleId);
  }
  params.set("employeeId", employeeId);
  return `/performance/team-reviews?${params.toString()}`;
}

function RatingDistribution({
  title,
  total,
  distribution,
}: {
  title: string;
  total: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}) {
  return (
    <div className="space-y-2 text-sm text-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title} ({total})
      </p>
      <div className="flex flex-wrap gap-2">
        {(["1", "2", "3", "4", "5"] as const).map((rating) => (
          <span
            key={`${title}-${rating}`}
            className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-slate-200 bg-white px-2 py-1 text-xs"
          >
            <span className="font-semibold">{rating}</span>
            <span>{distribution[rating]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
