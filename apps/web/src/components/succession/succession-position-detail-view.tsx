import Link from "next/link";
import { PositionStatus, SuccessionReadiness } from "@prisma/client";

import SuccessionCandidateAdminControls from "@/components/succession/succession-candidate-admin-controls";
import SuccessionCandidateForm from "@/components/succession/succession-candidate-form";
import SuccessionNoteForm from "@/components/succession/succession-note-form";
import SuccessionPositionForm from "@/components/succession/succession-position-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RightDrawer } from "@/components/ui/right-drawer";
import { StatusChip } from "@/components/ui/status-chip";
import type {
  SuccessionFormOptions,
  SuccessionPositionDetailResult,
} from "@/server/succession/succession-service";

interface SuccessionPositionDetailViewProps {
  auth: {
    userId: string;
    orgId: string;
  };
  detail: SuccessionPositionDetailResult;
  formOptions: SuccessionFormOptions;
  detailPath: string;
  overviewHref: string;
  selectedCandidateId?: string;
}

export default function SuccessionPositionDetailView({
  auth,
  detail,
  formOptions,
  detailPath,
  overviewHref,
  selectedCandidateId,
}: SuccessionPositionDetailViewProps) {
  const selectedCandidate =
    selectedCandidateId != null
      ? detail.candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null
      : null;

  const selectedCandidateHref = (candidateId: string) => `${detailPath}?candidateId=${candidateId}`;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow={detail.viewer.mode === "HR_ADMIN" ? "HR Workspace" : "Manager View"}
        title={detail.position.title}
        description="Review plan ownership, candidate depth, performance signals, and succession notes without leaving the workspace."
        metadata={`${detail.position.department} • ${detail.position.location ?? "Location not set"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={overviewHref}>
              <Button variant="outline" size="sm">
                Back to succession
              </Button>
            </Link>
            <StatusChip tone={detail.position.status === PositionStatus.ACTIVE ? "success" : "warning"}>
              {detail.position.status === PositionStatus.ACTIVE ? "Active role" : "Archived role"}
            </StatusChip>
            {detail.position.isCritical ? (
              <StatusChip tone="warning">Critical role</StatusChip>
            ) : (
              <StatusChip tone="info">Non-critical</StatusChip>
            )}
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Candidates" value={String(detail.candidates.length)} />
        <SummaryCard
          label="Ready now"
          value={String(
            detail.candidates.filter(
              (candidate) => candidate.readiness === SuccessionReadiness.READY_NOW,
            ).length,
          )}
        />
        <SummaryCard
          label="Manager proposals"
          value={String(
            detail.candidates.filter((candidate) => candidate.proposedByRole === "MANAGER").length,
          )}
        />
        <SummaryCard
          label="Risk visible"
          value={detail.viewer.canViewSensitiveFields ? "Enabled" : "Hidden"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan ownership</CardTitle>
            <CardDescription>
              Scope, collaborators, and ownership for the active succession plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanField label="Owner" value={detail.plan?.owner.name ?? "Unassigned"} />
            <PlanField
              label="Visibility"
              value={detail.plan?.visibilityScope === "HR_ONLY" ? "HR only" : "Managers in scope"}
            />
            <PlanField label="Review cadence" value={detail.plan?.reviewCadence ?? "Not set"} />
            <PlanField
              label="Collaborators"
              value={
                detail.plan?.collaborators.length
                  ? detail.plan.collaborators.map((person) => person.name).join(", ")
                  : "None"
              }
            />
            <PlanField
              label="Allowed managers"
              value={
                detail.plan?.allowedManagers.length
                  ? detail.plan.allowedManagers.map((person) => person.name).join(", ")
                  : "None"
              }
            />
            <PlanField label="Notes" value={detail.plan?.notes ?? "No planning notes yet."} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Incumbent context</CardTitle>
            <CardDescription>
              Current role holder and the continuity baseline for this position.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PlanField
              label="Incumbent"
              value={detail.position.incumbent?.name ?? "No incumbent assigned"}
            />
            <PlanField
              label="Title"
              value={detail.position.incumbent?.title ?? detail.position.title}
            />
            <PlanField
              label="Department"
              value={detail.position.incumbent?.department ?? detail.position.department}
            />
            <PlanField label="Last updated" value={formatDateTime(detail.position.updatedAt)} />
          </CardContent>
        </Card>
      </section>

      {detail.viewer.canEditPosition ? (
        <SuccessionPositionForm
          auth={auth}
          mode="edit"
          positionId={detail.position.id}
          employees={formOptions.owners}
          managers={formOptions.managers}
          initialValues={{
            title: detail.position.title,
            department: detail.position.department,
            location: detail.position.location,
            incumbentEmployeeId: detail.position.incumbent?.id ?? null,
            isCritical: detail.position.isCritical,
            status: detail.position.status,
            ownerEmployeeId: detail.plan?.owner.id ?? "",
            visibilityScope: detail.plan?.visibilityScope ?? "MANAGERS_IN_SCOPE",
            reviewCadence: detail.plan?.reviewCadence ?? null,
            notes: detail.plan?.notes ?? null,
            collaboratorEmployeeIds: detail.plan?.collaborators.map((person) => person.id) ?? [],
            allowedManagerEmployeeIds: detail.plan?.allowedManagers.map((person) => person.id) ?? [],
          }}
        />
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Candidate slate</CardTitle>
              <CardDescription>
                Ranked successors with readiness, proposal source, and current performance context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detail.candidates.length === 0 ? (
                <EmptyState
                  title="No candidates yet"
                  description="Add the first successor to start tracking bench depth for this role."
                />
              ) : (
                detail.candidates.map((candidate) => (
                  <article
                    key={candidate.id}
                    data-testid={`succession-candidate-card-${candidate.id}`}
                    className="rounded-[var(--radius-lg)] border border-slate-200 bg-slate-50/55 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {candidate.candidateName}
                          </h3>
                          <StatusChip tone={getReadinessTone(candidate.readiness)}>
                            {formatReadiness(candidate.readiness)}
                          </StatusChip>
                          <StatusChip tone={candidate.proposedByRole === "MANAGER" ? "warning" : "info"}>
                            {candidate.proposedByRole === "MANAGER" ? "Manager proposal" : "HR owned"}
                          </StatusChip>
                        </div>
                        <p className="text-sm text-slate-600">
                          {candidate.candidateTitle ?? "Title not set"} • {candidate.candidateDepartment ?? "Department not set"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Proposed by {candidate.proposedByName} • Rank {candidate.sortOrder}
                        </p>
                      </div>

                      <Link href={selectedCandidateHref(candidate.id)}>
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`succession-open-candidate-${candidate.id}`}
                        >
                          Open context
                        </Button>
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <SignalStat
                        label="Scorecard"
                        value={
                          candidate.signal.scorecardOverallRating != null
                            ? `${candidate.signal.scorecardOverallRating}/5`
                            : "N/A"
                        }
                      />
                      <SignalStat
                        label="Percent"
                        value={
                          candidate.signal.scorecardPercent != null
                            ? `${Math.round(candidate.signal.scorecardPercent)}%`
                            : "N/A"
                        }
                      />
                      <SignalStat
                        label="Performance"
                        value={candidate.signal.calibrationPerformanceBucket ?? "N/A"}
                      />
                      <SignalStat
                        label="Potential"
                        value={candidate.signal.calibrationPotentialBucket ?? "N/A"}
                      />
                    </div>

                    {detail.viewer.canViewSensitiveFields ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusChip tone="warning">
                          Risk {candidate.riskOfLoss ?? "Not set"}
                        </StatusChip>
                        <StatusChip tone="info">
                          Confidence {candidate.confidence ?? "Not set"}
                        </StatusChip>
                      </div>
                    ) : null}

                    {detail.viewer.canManageCandidates ? (
                      <div className="mt-4">
                        <SuccessionCandidateAdminControls auth={auth} candidate={candidate} />
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {detail.viewer.canProposeCandidates ? (
            <SuccessionCandidateForm
              auth={auth}
              positionId={detail.position.id}
              employeeOptions={
                detail.viewer.mode === "HR_ADMIN" ? formOptions.owners : formOptions.employees
              }
              viewerMode={detail.viewer.mode}
            />
          ) : null}

          {selectedCandidate ? (
            <RightDrawer
              title={selectedCandidate.candidateName}
              subtitle={`${selectedCandidate.candidateTitle ?? "Role not set"} • ${formatReadiness(selectedCandidate.readiness)}`}
              closeHref={detailPath}
              tabs={[
                {
                  id: "signals",
                  label: "Signals",
                  content: (
                    <div className="space-y-3">
                      <DrawerField
                        label="Scorecard overall"
                        value={
                          selectedCandidate.signal.scorecardOverallRating != null
                            ? `${selectedCandidate.signal.scorecardOverallRating}/5`
                            : "Not available"
                        }
                      />
                      <DrawerField
                        label="Scorecard percent"
                        value={
                          selectedCandidate.signal.scorecardPercent != null
                            ? `${Math.round(selectedCandidate.signal.scorecardPercent)}%`
                            : "Not available"
                        }
                      />
                      <DrawerField
                        label="Final rating source"
                        value={selectedCandidate.signal.finalRatingSource ?? "Not available"}
                      />
                      <DrawerField
                        label="Calibration placement"
                        value={
                          selectedCandidate.signal.calibrationPerformanceBucket &&
                          selectedCandidate.signal.calibrationPotentialBucket
                            ? `${selectedCandidate.signal.calibrationPerformanceBucket} / ${selectedCandidate.signal.calibrationPotentialBucket}`
                            : "Not available"
                        }
                      />
                      <DrawerField
                        label="Snapshot title"
                        value={selectedCandidate.signal.snapshotTitle ?? "Not available"}
                      />
                      <DrawerField
                        label="Snapshot manager"
                        value={selectedCandidate.signal.snapshotManagerName ?? "Not available"}
                      />
                      {detail.viewer.canViewSensitiveFields ? (
                        <>
                          <DrawerField
                            label="Risk of loss"
                            value={selectedCandidate.riskOfLoss ?? "Not set"}
                          />
                          <DrawerField
                            label="Confidence"
                            value={selectedCandidate.confidence ?? "Not set"}
                          />
                        </>
                      ) : null}
                    </div>
                  ),
                },
                {
                  id: "notes",
                  label: "Notes",
                  content: (
                    <div className="space-y-4">
                      <SuccessionNoteForm
                        auth={auth}
                        candidateId={selectedCandidate.id}
                        viewerMode={detail.viewer.mode}
                      />
                      <div className="space-y-3">
                        {selectedCandidate.notes.length === 0 ? (
                          <p className="text-sm text-slate-600">No notes yet.</p>
                        ) : (
                          selectedCandidate.notes.map((note) => (
                            <div
                              key={note.id}
                              className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/70 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusChip tone="info">{note.visibility}</StatusChip>
                                <span className="text-xs text-slate-500">
                                  {note.author.name} • {formatDateTime(note.createdAt)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{note.body}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Candidate context</CardTitle>
                <CardDescription>
                  Open a candidate from the slate to review signals and notes in the drawer.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function PlanField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function SignalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function DrawerField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function formatReadiness(readiness: SuccessionReadiness): string {
  switch (readiness) {
    case SuccessionReadiness.READY_NOW:
      return "Ready now";
    case SuccessionReadiness.ONE_TO_TWO_YEARS:
      return "1-2 years";
    case SuccessionReadiness.THREE_TO_FIVE_YEARS:
      return "3-5 years";
    case SuccessionReadiness.FUTURE:
    default:
      return "Future";
  }
}

function getReadinessTone(readiness: SuccessionReadiness): "success" | "info" | "warning" {
  switch (readiness) {
    case SuccessionReadiness.READY_NOW:
      return "success";
    case SuccessionReadiness.ONE_TO_TWO_YEARS:
      return "info";
    case SuccessionReadiness.THREE_TO_FIVE_YEARS:
    case SuccessionReadiness.FUTURE:
    default:
      return "warning";
  }
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
