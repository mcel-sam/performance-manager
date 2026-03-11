import Link from "next/link";
import { ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarsStack } from "@/components/ui/avatars-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { RightDrawer } from "@/components/ui/right-drawer";
import { SegmentedProgress } from "@/components/ui/segmented-progress";
import { Select } from "@/components/ui/select";
import { getReviewStatusTone, StatusChip } from "@/components/ui/status-chip";
import { withReturnTo } from "@/lib/navigation/return-to";
import { getReviewRelationshipLabel } from "@/lib/reviews/review-copy";
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

  const completionSegments = [
    {
      key: "awaiting",
      label: "Awaiting",
      value: dashboard.kpis.awaitingManagerReview,
      color: "#94a3b8",
    },
    {
      key: "in-progress",
      label: "In progress",
      value: dashboard.kpis.inProgressManagerReview,
      color: "#0ea5e9",
    },
    {
      key: "completed",
      label: "Completed",
      value: dashboard.kpis.completedManagerReview,
      color: "#10b981",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="My Team"
        description="Track direct-report review readiness, open the next manager review, and inspect packet context for the active cycle."
        className="gap-4 p-5 sm:p-6"
        metadata={
          dashboard.cycle ? (
            <span>
              Cycle: <strong>{dashboard.cycle.name}</strong>
            </span>
          ) : (
            "No cycle submissions found yet"
          )
        }
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusChip tone="info" data-testid="my-team-team-size-pill">
              Team size {dashboard.kpis.totalDirectReports}
            </StatusChip>
            <Link href="/performance/reviews">
              <Button variant="outline" size="sm" data-testid="my-team-secondary-reviews-link">
                Open review tasks
              </Button>
            </Link>
          </div>
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
            <CardContent className="flex flex-wrap items-end justify-between gap-4 p-4">
              <form method="get" className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-2 text-sm text-slate-700">
                  Review cycle
                  <Select
                    name="cycleId"
                    defaultValue={dashboard.cycle?.id ?? ""}
                    data-testid="my-team-cycle-select"
                    className="min-w-[250px]"
                  >
                    {dashboard.cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button type="submit" variant="outline" size="sm">
                  Load cycle
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                <StatusChip tone="info">
                  {dashboard.kpis.awaitingManagerReview + dashboard.kpis.inProgressManagerReview} manager tasks open
                </StatusChip>
                {dashboard.kpis.overdueManagerReview > 0 ? (
                  <StatusChip tone="warning">
                    {dashboard.kpis.overdueManagerReview} overdue for manager action
                  </StatusChip>
                ) : null}
                <StatusChip tone="info">
                  {dashboard.kpis.selfNotStarted} self reviews pending
                </StatusChip>
              </div>
            </CardContent>
          </Card>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Awaiting review"
              value={dashboard.kpis.awaitingManagerReview}
              tone="slate"
              detail={
                dashboard.kpis.overdueManagerReview > 0
                  ? `${dashboard.kpis.overdueManagerReview} already past due.`
                  : "Reports waiting for a first manager pass."
              }
            />
            <KpiCard
              label="Self not started"
              value={dashboard.kpis.selfNotStarted}
              tone="amber"
              detail="Employees who have not opened their self review yet."
            />
            <KpiCard
              label="In progress"
              value={dashboard.kpis.inProgressManagerReview}
              tone="sky"
              detail="Manager reviews already underway."
            />
            <KpiCard
              label="Completed"
              value={dashboard.kpis.completedManagerReview}
              tone="emerald"
              detail="Manager reviews submitted for this cycle."
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Review pipeline</CardTitle>
                <CardDescription>
                  {dashboard.kpis.completedManagerReview} of {dashboard.kpis.totalDirectReports} manager reviews submitted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SegmentedProgress
                  segments={completionSegments}
                  data-testid="my-team-segmented-progress"
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <PipelineStat
                    label="Awaiting"
                    value={dashboard.kpis.awaitingManagerReview}
                    tone="slate"
                  />
                  <PipelineStat
                    label="In progress"
                    value={dashboard.kpis.inProgressManagerReview}
                    tone="sky"
                  />
                  <PipelineStat
                    label="Completed"
                    value={dashboard.kpis.completedManagerReview}
                    tone="emerald"
                  />
                </div>
              </CardContent>
            </Card>

            <Card data-testid="my-team-insights">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Rating mix</CardTitle>
                <CardDescription>
                  Final ratings and scorecard baselines shown as star bands instead of raw number buckets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <RatingDistribution
                  title="Final rating mix"
                  total={dashboard.insights.finalRatedCount}
                  distribution={dashboard.insights.finalDistribution}
                  tone="emerald"
                />
                <RatingDistribution
                  title="Scorecard baseline"
                  total={dashboard.insights.scorecardRatedCount}
                  distribution={dashboard.insights.scorecardDistribution}
                  tone="sky"
                />
              </CardContent>
            </Card>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Direct reports</CardTitle>
                <CardDescription>
                  Pick a report to open the drawer, then review status, packet context, and next action without leaving the list.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <TableWrapper>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Direct report</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Reviews</TableHead>
                        <TableHead>Feedback</TableHead>
                        <TableHead>Next step</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.rows.map((row) => {
                        const isSelected = row.employeeId === selectedRow?.employeeId;

                        return (
                          <TableRow
                            key={row.employeeId}
                            data-testid="team-reviews-row"
                            className={isSelected ? "bg-teal-50/40 ring-1 ring-inset ring-teal-200" : undefined}
                          >
                            <TableCell>
                              <Link
                                href={toMyTeamHref(dashboard.cycle?.id ?? null, row.employeeId)}
                                scroll={false}
                                data-testid={`my-team-open-profile-${row.employeeId}`}
                                className="inline-flex flex-col rounded-[var(--radius-sm)] px-2 py-1 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                              >
                                <span className="font-semibold text-slate-900">{row.employeeName}</span>
                                <span className="text-xs text-slate-500">
                                  {isSelected ? "Selected profile" : "Open profile"}
                                </span>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm text-slate-700">
                                <p className="font-medium text-slate-900">{row.title ?? "No title"}</p>
                                <p className="text-xs text-slate-500">{row.department ?? "No department"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusStack
                                items={[
                                  {
                                    label: getReviewRelationshipLabel(ReviewRelationship.SELF),
                                    status: row.statuses[ReviewRelationship.SELF],
                                  },
                                  {
                                    label: getReviewRelationshipLabel(ReviewRelationship.MANAGER),
                                    status: row.statuses[ReviewRelationship.MANAGER],
                                  },
                                ]}
                              />
                            </TableCell>
                            <TableCell>
                              <StatusStack
                                items={[
                                  {
                                    label: getReviewRelationshipLabel(ReviewRelationship.PEER),
                                    status: row.statuses[ReviewRelationship.PEER],
                                  },
                                  {
                                    label: getReviewRelationshipLabel(ReviewRelationship.UPWARD),
                                    status: row.statuses[ReviewRelationship.UPWARD],
                                  },
                                ]}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2 text-sm text-slate-600">
                                {row.managerReviewHref ? (
                                  <Link
                                    href={withReturnTo(
                                      row.managerReviewHref,
                                      toMyTeamHref(dashboard.cycle?.id ?? null, row.employeeId),
                                    )}
                                  >
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      data-testid={`my-team-open-review-${row.employeeId}`}
                                    >
                                      Open manager review
                                    </Button>
                                  </Link>
                                ) : (
                                  <Badge variant="info">No manager task</Badge>
                                )}
                                <p className="text-xs text-slate-500">
                                  {row.managerDueAt
                                    ? `Due ${formatCompactDate(row.managerDueAt)}`
                                    : "No due date assigned"}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableWrapper>
              </CardContent>
            </Card>

            {selectedRow ? (
              <RightDrawer
                testId="my-team-profile-drawer"
                title={selectedRow.employeeName}
                subtitle="Direct report details"
                closeHref={toMyTeamBaseHref(dashboard.cycle?.id ?? null)}
                tabs={[
                  {
                    id: "overview",
                    label: "Overview",
                    content: (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-sm text-slate-600">
                            {selectedRow.title ?? "No title"} · {selectedRow.department ?? "No department"}
                          </p>
                          <AvatarsStack
                            items={createReviewerAvatarItems(selectedRow.employeeName)}
                            data-testid="my-team-reviewers-stack"
                          />
                        </div>

                        <div className="space-y-2">
                          <StatusLine
                            label={getReviewRelationshipLabel(ReviewRelationship.SELF)}
                            status={selectedRow.statuses[ReviewRelationship.SELF]}
                          />
                          <StatusLine
                            label={getReviewRelationshipLabel(ReviewRelationship.MANAGER)}
                            status={selectedRow.statuses[ReviewRelationship.MANAGER]}
                          />
                          <StatusLine
                            label={getReviewRelationshipLabel(ReviewRelationship.PEER)}
                            status={selectedRow.statuses[ReviewRelationship.PEER]}
                          />
                          <StatusLine
                            label={getReviewRelationshipLabel(ReviewRelationship.UPWARD)}
                            status={selectedRow.statuses[ReviewRelationship.UPWARD]}
                          />
                        </div>

                        <div
                          className="space-y-2 rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 p-3"
                          data-testid="my-team-drawer-mini-insights"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Mini insights
                          </p>
                          {createMiniInsights(selectedRow).map((insight) => (
                            <p key={insight} className="text-sm text-slate-700">
                              {insight}
                            </p>
                          ))}
                          <RatingDistribution
                            title="Team final rating context"
                            total={dashboard.insights.finalRatedCount}
                            distribution={dashboard.insights.finalDistribution}
                            tone="emerald"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {selectedRow.managerReviewHref ? (
                            <Link
                              href={withReturnTo(
                                selectedRow.managerReviewHref,
                                toMyTeamHref(dashboard.cycle?.id ?? null, selectedRow.employeeId),
                              )}
                            >
                              <Button size="sm" data-testid="my-team-drawer-open-review">
                                Open manager review
                              </Button>
                            </Link>
                          ) : null}
                          {selectedRow.packetHref ? (
                            <Link
                              href={withReturnTo(
                                selectedRow.packetHref,
                                toMyTeamHref(dashboard.cycle?.id ?? null, selectedRow.employeeId),
                              )}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid="my-team-drawer-open-packet"
                              >
                                Open packet
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: "timeline",
                    label: "Timeline",
                    content: (
                      <ol className="space-y-2 text-sm text-slate-700">
                        {createStatusTimelineEntries(selectedRow).map((entry) => (
                          <li
                            key={entry.key}
                            className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <p className="font-medium text-slate-900">{entry.title}</p>
                            <p className="text-xs text-slate-600">{entry.description}</p>
                          </li>
                        ))}
                      </ol>
                    ),
                  },
                  {
                    id: "audit",
                    label: "Audit Log",
                    content: (
                      <div className="space-y-3 text-sm text-slate-700">
                        <p>
                          Audit timeline for manager-facing actions will appear here as workflow
                          events are expanded.
                        </p>
                        <p className="text-xs text-slate-500">
                          Current surface includes profile status snapshots and review actions.
                        </p>
                      </div>
                    ),
                  },
                ]}
              />
            ) : (
              <Card data-testid="my-team-profile-drawer-empty">
                <CardHeader>
                  <CardTitle className="text-lg">Direct report details</CardTitle>
                  <CardDescription>
                    Select a direct report to inspect status, packet context, and next actions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    title="No profile selected"
                    description="Choose a row from the direct reports table to open the right drawer."
                    className="p-4"
                  />
                </CardContent>
              </Card>
            )}
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

  return <StatusChip tone={getReviewStatusTone(status)}>{statusLabel[status]}</StatusChip>;
}

type DashboardTone = "slate" | "amber" | "sky" | "emerald";

const dashboardToneStyles: Record<
  DashboardTone,
  {
    card: string;
    accent: string;
    badge: string;
    value: string;
    panel: string;
    track: string;
    bar: string;
  }
> = {
  slate: {
    card: "border-slate-200 bg-gradient-to-br from-white to-slate-50",
    accent: "bg-slate-400",
    badge: "bg-slate-900/5 text-slate-700",
    value: "text-slate-950",
    panel: "border-slate-200 bg-slate-50/80",
    track: "bg-slate-100",
    bar: "bg-slate-500",
  },
  amber: {
    card: "border-amber-200 bg-gradient-to-br from-white to-amber-50/80",
    accent: "bg-amber-400",
    badge: "bg-amber-100 text-amber-800",
    value: "text-amber-950",
    panel: "border-amber-200 bg-amber-50/80",
    track: "bg-amber-100",
    bar: "bg-amber-500",
  },
  sky: {
    card: "border-sky-200 bg-gradient-to-br from-white to-sky-50/80",
    accent: "bg-sky-400",
    badge: "bg-sky-100 text-sky-800",
    value: "text-sky-950",
    panel: "border-sky-200 bg-sky-50/80",
    track: "bg-sky-100",
    bar: "bg-sky-500",
  },
  emerald: {
    card: "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/80",
    accent: "bg-emerald-400",
    badge: "bg-emerald-100 text-emerald-800",
    value: "text-emerald-950",
    panel: "border-emerald-200 bg-emerald-50/80",
    track: "bg-emerald-100",
    bar: "bg-emerald-500",
  },
};

function KpiCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: DashboardTone;
}) {
  const styles = dashboardToneStyles[tone];

  return (
    <Card className={cn("relative overflow-hidden shadow-[var(--shadow-xs)]", styles.card)}>
      <div className={cn("absolute inset-x-0 top-0 h-1", styles.accent)} />
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardDescription className="text-sm font-medium text-slate-600">
              {label}
            </CardDescription>
            <CardTitle className={cn("text-3xl tracking-tight", styles.value)}>
              {value}
            </CardTitle>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
              styles.badge,
            )}
          >
            {value === 1 ? "1 report" : `${value} reports`}
          </span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{detail}</p>
      </CardHeader>
    </Card>
  );
}

function PipelineStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: DashboardTone;
}) {
  const styles = dashboardToneStyles[tone];

  return (
    <div className={cn("rounded-[var(--radius-md)] border px-3 py-3", styles.panel)}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", styles.value)}>{value}</p>
    </div>
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

function StatusStack({
  items,
}: {
  items: Array<{
    label: string;
    status: ReviewSubmissionStatus | undefined;
  }>;
}) {
  return (
    <div className="min-w-[210px] space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {item.label}
          </span>
          {renderStatus(item.status)}
        </div>
      ))}
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

function toMyTeamBaseHref(cycleId: string | null): string {
  if (!cycleId) {
    return "/performance/team-reviews";
  }

  const params = new URLSearchParams();
  params.set("cycleId", cycleId);
  return `/performance/team-reviews?${params.toString()}`;
}

function createReviewerAvatarItems(employeeName: string): Array<{ id: string; label: string }> {
  return [
    { id: `${employeeName}-self`, label: `${employeeName} Self review` },
    { id: `${employeeName}-manager`, label: `${employeeName} Manager Review` },
    { id: `${employeeName}-peer`, label: `${employeeName} Peer review` },
    { id: `${employeeName}-upward`, label: `${employeeName} Manager feedback` },
  ];
}

function createStatusTimelineEntries(row: {
  statuses: Partial<Record<ReviewRelationship, ReviewSubmissionStatus>>;
}): Array<{ key: string; title: string; description: string }> {
  const relationships: Array<{ key: ReviewRelationship; label: string }> = [
    { key: ReviewRelationship.SELF, label: getReviewRelationshipLabel(ReviewRelationship.SELF, "full") },
    { key: ReviewRelationship.MANAGER, label: getReviewRelationshipLabel(ReviewRelationship.MANAGER, "full") },
    { key: ReviewRelationship.PEER, label: getReviewRelationshipLabel(ReviewRelationship.PEER, "full") },
    { key: ReviewRelationship.UPWARD, label: getReviewRelationshipLabel(ReviewRelationship.UPWARD, "full") },
  ];

  return relationships.map((entry) => ({
    key: entry.key,
    title: `${entry.label} review status`,
    description: row.statuses[entry.key] ? statusLabel[row.statuses[entry.key] as ReviewSubmissionStatus] : "No submission assigned",
  }));
}

function createMiniInsights(row: {
  statuses: Partial<Record<ReviewRelationship, ReviewSubmissionStatus>>;
  managerDueAt: Date | null;
}): string[] {
  const statuses = Object.values(ReviewRelationship).map(
    (relationship) => row.statuses[relationship] ?? null,
  );

  const submittedCount = statuses.filter((status) => status === ReviewSubmissionStatus.SUBMITTED).length;
  const inProgressCount = statuses.filter((status) => status === ReviewSubmissionStatus.IN_PROGRESS).length;
  const pendingCount = statuses.filter(
    (status) =>
      status === null ||
      status === ReviewSubmissionStatus.NOT_STARTED ||
      status === ReviewSubmissionStatus.RETURNED,
  ).length;

  const insights = [
    `Review coverage: ${submittedCount}/4 review channels submitted.`,
    `Active work: ${inProgressCount} in progress, ${pendingCount} still pending.`,
  ];

  const managerStatus = row.statuses[ReviewRelationship.MANAGER] ?? null;
  if (
    row.managerDueAt &&
    row.managerDueAt.getTime() < Date.now() &&
    managerStatus !== ReviewSubmissionStatus.SUBMITTED
  ) {
    insights.push(`Next attention: manager review overdue since ${formatCompactDate(row.managerDueAt)}.`);
  } else if (managerStatus !== ReviewSubmissionStatus.SUBMITTED) {
    insights.push("Next attention: manager review still needs completion.");
  } else if ((row.statuses[ReviewRelationship.SELF] ?? null) !== ReviewSubmissionStatus.SUBMITTED) {
    insights.push("Next attention: self review follow-through remains open.");
  } else {
    insights.push("Next attention: peer review and manager feedback drive final context.");
  }

  return insights;
}

function formatCompactDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function RatingDistribution({
  title,
  total,
  distribution,
  tone,
}: {
  title: string;
  total: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  tone: DashboardTone;
}) {
  const styles = dashboardToneStyles[tone];

  return (
    <div className="space-y-3 text-sm text-slate-700">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="text-xs text-slate-500">
          {total === 0 ? "No rated packets" : `${total} rated packets`}
        </p>
      </div>
      {total === 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
          Ratings will appear once packets receive scorecards or final calibration outcomes.
        </div>
      ) : (
        <div className="space-y-2">
          {(["5", "4", "3", "2", "1"] as const).map((rating) => {
            const count = distribution[rating];
            const width = total > 0 ? (count / total) * 100 : 0;

            return (
              <div
                key={`${title}-${rating}`}
                className="grid grid-cols-[96px_minmax(0,1fr)_32px] items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <StarScale rating={Number(rating)} />
                  <span className="text-xs font-medium text-slate-600">{rating} star</span>
                </div>
                <div className={cn("h-2.5 overflow-hidden rounded-full", styles.track)}>
                  <div
                    className={cn("h-full rounded-full transition-[width] duration-300", styles.bar)}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-right text-xs font-semibold text-slate-700">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarScale({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon key={`${rating}-${index}`} active={index < rating} />
      ))}
    </span>
  );
}

function StarIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-3.5 w-3.5", active ? "text-amber-400" : "text-slate-200")}
    >
      <path d="M10 1.75l2.55 5.17 5.7.83-4.12 4.01.97 5.67L10 14.75 4.9 17.43l.98-5.67-4.13-4.01 5.71-.83L10 1.75z" />
    </svg>
  );
}
