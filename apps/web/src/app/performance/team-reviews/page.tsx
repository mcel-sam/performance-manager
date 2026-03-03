import Link from "next/link";
import { ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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

export default async function TeamReviewsPage() {
  const context = await getDevRequestContext();
  if (context.role !== UserRole.MANAGER) {
    redirect("/");
  }

  const dashboard = await getManagerTeamReviewDashboard(context);
  const total = dashboard.kpis.awaitingReview + dashboard.kpis.inProgress + dashboard.kpis.completed;
  const completedPct = total > 0 ? Math.round((dashboard.kpis.completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((dashboard.kpis.inProgress / total) * 100) : 0;
  const awaitingPct = total > 0 ? Math.max(0, 100 - completedPct - inProgressPct) : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Team Reviews"
        description="See direct-report review status by type and open packet/review drilldowns."
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
          title="No team review data yet"
          description="Team review dashboards populate after HR generates cycle submissions for your direct reports."
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
          <section className="grid gap-4 md:grid-cols-3">
            <KpiCard label="Awaiting review" value={dashboard.kpis.awaitingReview} tone="neutral" />
            <KpiCard label="In progress" value={dashboard.kpis.inProgress} tone="info" />
            <KpiCard label="Completed" value={dashboard.kpis.completed} tone="success" />
          </section>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Progress</CardTitle>
              <CardDescription>Segmented status progress for manager review submissions.</CardDescription>
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

          <Card>
            <CardContent className="p-0">
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Direct report</TableHead>
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
                        <TableCell>{renderStatus(row.statuses[ReviewRelationship.SELF])}</TableCell>
                        <TableCell>{renderStatus(row.statuses[ReviewRelationship.MANAGER])}</TableCell>
                        <TableCell>{renderStatus(row.statuses[ReviewRelationship.PEER])}</TableCell>
                        <TableCell>{renderStatus(row.statuses[ReviewRelationship.UPWARD])}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {row.packetHref ? (
                              <Link href={row.packetHref}>
                                <Button size="sm" variant="outline">
                                  Open packet
                                </Button>
                              </Link>
                            ) : null}
                            {row.managerReviewHref ? (
                              <Link href={row.managerReviewHref}>
                                <Button size="sm">Open review</Button>
                              </Link>
                            ) : (
                              <Badge variant="info">No manager task</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
          </Card>
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
  tone: "neutral" | "info" | "success";
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
