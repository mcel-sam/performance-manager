import Link from "next/link";
import { ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarsStack } from "@/components/ui/avatars-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RightDrawer } from "@/components/ui/right-drawer";
import { SegmentedProgress } from "@/components/ui/segmented-progress";
import { Select } from "@/components/ui/select";
import { getReviewStatusTone, StatusChip } from "@/components/ui/status-chip";
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
            <KpiCard label="Total direct reports" value={dashboard.kpis.totalDirectReports} />
            <KpiCard
              label="Awaiting manager review"
              value={dashboard.kpis.awaitingManagerReview}
            />
            <KpiCard label="Self not started" value={dashboard.kpis.selfNotStarted} />
            <KpiCard
              label="Overdue manager reviews"
              value={dashboard.kpis.overdueManagerReview}
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
            <CardContent>
              <SegmentedProgress
                segments={completionSegments}
                data-testid="my-team-segmented-progress"
              />
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

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_332px]">
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
                            <TableCell className="text-slate-700">{row.title ?? "—"}</TableCell>
                            <TableCell className="text-slate-700">{row.department ?? "—"}</TableCell>
                            <TableCell>{renderStatus(row.statuses[ReviewRelationship.SELF])}</TableCell>
                            <TableCell>{renderStatus(row.statuses[ReviewRelationship.MANAGER])}</TableCell>
                            <TableCell>{renderStatus(row.statuses[ReviewRelationship.PEER])}</TableCell>
                            <TableCell>{renderStatus(row.statuses[ReviewRelationship.UPWARD])}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
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
                subtitle="Direct report profile"
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
                          Current surface includes profile status snapshots and review/packet actions.
                        </p>
                      </div>
                    ),
                  },
                ]}
              />
            ) : (
              <Card data-testid="my-team-profile-drawer-empty">
                <CardHeader>
                  <CardTitle className="text-lg">Direct report profile</CardTitle>
                  <CardDescription>
                    Select a direct report to open overview, timeline, and audit context.
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

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
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
    { id: `${employeeName}-self`, label: `${employeeName} Self` },
    { id: `${employeeName}-manager`, label: `${employeeName} Manager Review` },
    { id: `${employeeName}-peer`, label: `${employeeName} Peer Input` },
    { id: `${employeeName}-upward`, label: `${employeeName} Upward Input` },
  ];
}

function createStatusTimelineEntries(row: {
  statuses: Partial<Record<ReviewRelationship, ReviewSubmissionStatus>>;
}): Array<{ key: string; title: string; description: string }> {
  const relationships: Array<{ key: ReviewRelationship; label: string }> = [
    { key: ReviewRelationship.SELF, label: "Self" },
    { key: ReviewRelationship.MANAGER, label: "Manager" },
    { key: ReviewRelationship.PEER, label: "Peer" },
    { key: ReviewRelationship.UPWARD, label: "Upward" },
  ];

  return relationships.map((entry) => ({
    key: entry.key,
    title: `${entry.label} review status`,
    description: row.statuses[entry.key] ? statusLabel[row.statuses[entry.key] as ReviewSubmissionStatus] : "No submission assigned",
  }));
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
