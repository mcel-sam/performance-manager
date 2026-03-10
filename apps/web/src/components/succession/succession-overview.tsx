import Link from "next/link";
import { PositionStatus } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
import type { SuccessionOverviewResult } from "@/server/succession/succession-service";

interface SuccessionOverviewProps {
  title: string;
  description: string;
  overview: SuccessionOverviewResult;
  baseHref: string;
  detailBaseHref: string;
  createHref?: string;
  exportHref?: string;
  coverageExportHref?: string;
}

export default function SuccessionOverview({
  title,
  description,
  overview,
  baseHref,
  detailBaseHref,
  createHref,
  exportHref,
  coverageExportHref,
}: SuccessionOverviewProps) {
  const criticalGapPositions = overview.positions.filter(
    (position) => position.isCritical && position.coverageState !== "READY_NOW",
  );
  const positionsWithManagerProposals = overview.positions.filter(
    (position) => (position.plan?.managerProposalCount ?? 0) > 0,
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        title={title}
        description={description}
        metadata={`${overview.summary.visiblePositions} visible positions • ${overview.summary.criticalGaps} critical gaps`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {exportHref ? (
              <Link href={exportHref}>
                <Button variant="outline" size="sm" data-testid="succession-export-positions">
                  Export slate CSV
                </Button>
              </Link>
            ) : null}
            {coverageExportHref ? (
              <Link href={coverageExportHref}>
                <Button variant="outline" size="sm" data-testid="succession-export-coverage">
                  Export coverage CSV
                </Button>
              </Link>
            ) : null}
            {createHref ? (
              <Link href={createHref}>
                <Button size="sm" data-testid="succession-create-position">
                  Create Position
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Visible positions" value={overview.summary.visiblePositions} />
        <SummaryCard label="Active positions" value={overview.summary.activePositions} />
        <SummaryCard label="Critical roles" value={overview.summary.criticalPositions} />
        <SummaryCard label="Ready-now covered" value={overview.summary.readyNowCoveredPositions} />
        <SummaryCard label="Manager proposals" value={overview.summary.managerProposals} />
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter positions</CardTitle>
          <CardDescription>Refine the succession slate by department, criticality, or free-text search.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_220px_auto_auto]">
            <Input
              name="search"
              defaultValue={overview.filters.search ?? ""}
              placeholder="Search title, department, or location"
              data-testid="succession-filter-search"
            />
            <select
              name="department"
              defaultValue={overview.filters.department ?? ""}
              data-testid="succession-filter-department"
              className="h-10 rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-[var(--shadow-xs)]"
            >
              <option value="">All departments</option>
              {overview.filters.departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="criticalOnly"
                defaultChecked={overview.filters.criticalOnly}
                data-testid="succession-filter-critical-only"
              />
              Critical only
            </label>
            <div className="flex gap-2">
              <Button type="submit" variant="outline" data-testid="succession-apply-filters">
                Apply
              </Button>
              <Link href={baseHref}>
                <Button type="button" variant="outline" data-testid="succession-clear-filters">
                  Clear
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {overview.positions.length === 0 ? (
        <EmptyState
          title="No succession positions match this view"
          description="Widen the filters or add a position to start building successor coverage."
          action={
            createHref ? (
              <Link href={createHref}>
                <Button>Create position</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Coverage table</CardTitle>
            <CardDescription>
              Open a position to review ownership, candidate signals, and notes in one workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableWrapper>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead>Position</TableHead>
                    <TableHead>Incumbent</TableHead>
                    <TableHead>Plan owner</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {overview.positions.map((position) => (
                    <TableRow key={position.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{position.title}</p>
                          <p className="text-xs text-slate-500">
                            {position.department}
                            {position.location ? ` • ${position.location}` : ""}
                          </p>
                          {position.isCritical ? (
                            <StatusChip tone="warning">Critical role</StatusChip>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{position.incumbent?.name ?? "Unassigned"}</TableCell>
                      <TableCell>{position.plan?.ownerName ?? "No plan"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <StatusChip tone={getCoverageTone(position.coverageState)}>
                            {formatCoverageState(position.coverageState)}
                          </StatusChip>
                          <p className="text-xs text-slate-500">
                            {position.plan
                              ? `${position.plan.readyNowCount} ready now • ${position.plan.candidateCount} total`
                              : "Create a plan to track bench depth"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          tone={position.status === PositionStatus.ACTIVE ? "success" : "warning"}
                        >
                          {position.status}
                        </StatusChip>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`${detailBaseHref}/${position.id}`}>
                          <Button variant="outline" size="sm">
                            Open
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </CardContent>
        </Card>
      )}

      {overview.viewer.mode === "HR_ADMIN" ? (
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Critical-role gaps</CardTitle>
              <CardDescription>
                Roles without a ready-now successor stay visible here for fast HR review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {criticalGapPositions.length === 0 ? (
                <p className="text-sm text-slate-600">All critical roles currently have ready-now coverage.</p>
              ) : (
                criticalGapPositions.map((position) => (
                  <div
                    key={position.id}
                    className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{position.title}</p>
                        <p className="text-xs text-slate-500">
                          {position.department}
                          {position.location ? ` • ${position.location}` : ""}
                        </p>
                      </div>
                      <StatusChip tone="warning">{formatCoverageState(position.coverageState)}</StatusChip>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {position.plan
                        ? `${position.plan.candidateCount} candidates tracked • ${position.plan.readyNowCount} ready now`
                        : "No plan exists yet for this role."}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Manager proposals awaiting review</CardTitle>
              <CardDescription>
                Positions with manager-originated candidates that HR should review in the active slate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {positionsWithManagerProposals.length === 0 ? (
                <p className="text-sm text-slate-600">No manager proposals are waiting for HR review.</p>
              ) : (
                positionsWithManagerProposals.map((position) => (
                  <div
                    key={position.id}
                    className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{position.title}</p>
                        <p className="text-xs text-slate-500">{position.department}</p>
                      </div>
                      <StatusChip tone="info">
                        {position.plan?.managerProposalCount ?? 0} manager proposals
                      </StatusChip>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      Owner: {position.plan?.ownerName ?? "Unassigned"}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Department coverage</CardTitle>
          <CardDescription>
            Small-N suppression hides grouped counts for thin departments to avoid privacy leakage.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.coverageByDepartment.map((row) => (
            <div
              key={row.department}
              className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{row.department}</h3>
                {row.suppressed ? (
                  <StatusChip tone="warning">Suppressed</StatusChip>
                ) : (
                  <StatusChip tone="info">Visible</StatusChip>
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>Positions: {row.positionCount ?? "Suppressed"}</p>
                <p>Ready-now covered: {row.readyNowCoveredCount ?? "Suppressed"}</p>
                <p>Critical gaps: {row.criticalGapCount ?? "Suppressed"}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function getCoverageTone(
  state: "NO_PLAN" | "NO_READY_NOW" | "READY_NOW",
): "neutral" | "warning" | "success" {
  switch (state) {
    case "READY_NOW":
      return "success";
    case "NO_READY_NOW":
      return "warning";
    case "NO_PLAN":
    default:
      return "neutral";
  }
}

function formatCoverageState(state: "NO_PLAN" | "NO_READY_NOW" | "READY_NOW"): string {
  switch (state) {
    case "READY_NOW":
      return "Ready-now covered";
    case "NO_READY_NOW":
      return "No ready-now candidate";
    case "NO_PLAN":
    default:
      return "No plan yet";
  }
}
