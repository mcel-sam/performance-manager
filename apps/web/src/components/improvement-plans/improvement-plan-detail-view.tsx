"use client";

import Link from "next/link";
import {
  ImprovementPlanCheckInType,
  ImprovementPlanOutcome,
  ImprovementPlanStatus,
  ImprovementPlanTrigger,
  UserRole,
} from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { HelpHint } from "@/components/ui/help-hint";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { formatStableDate, formatStableDateTime } from "@/lib/dates/stable-format";
import { canManageImprovementPlans } from "@/lib/users/role-capabilities";
import type {
  ImprovementPlanAuditEvent,
  ImprovementPlanCheckpointScheduleItem,
  ImprovementPlanDetail,
  ImprovementPlanTimelineEntry,
} from "@/server/improvement-plans/improvement-plan-service";

interface ImprovementPlanDetailViewProps {
  planId: string;
  returnHref: string;
  auth: {
    userId: string;
    orgId: string;
    role: UserRole;
  };
  initialPlan: ImprovementPlanDetail;
}

type ActivityView = "timeline" | "audit";
type AuditLoadState = "idle" | "loading" | "loaded" | "error";

const structuredCheckpointTypes = new Set<ImprovementPlanCheckInType>([
  ImprovementPlanCheckInType.CHECKPOINT_30,
  ImprovementPlanCheckInType.CHECKPOINT_60,
  ImprovementPlanCheckInType.CHECKPOINT_90,
]);

const statusLabel: Record<ImprovementPlanStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  EXTENDED: "Extended",
  CANCELED: "Canceled",
};

const outcomeLabel: Record<ImprovementPlanOutcome, string> = {
  SUCCESSFUL: "Successful",
  UNSUCCESSFUL: "Unsuccessful",
};

const triggerSourceLabel: Record<ImprovementPlanTrigger, string> = {
  REVIEW: "Post-review",
  CALIBRATION: "Post-calibration",
  REVIEW_AND_CALIBRATION: "Post-review and calibration",
};

const checkInTypeLabel: Record<ImprovementPlanCheckInType, string> = {
  NOTE: "General update",
  CHECKPOINT_30: "30-day checkpoint",
  CHECKPOINT_60: "60-day checkpoint",
  CHECKPOINT_90: "90-day checkpoint",
  STATUS_CHANGE: "Status change",
};

const transitionOptionsByStatus: Record<
  ImprovementPlanStatus,
  ImprovementPlanStatus[]
> = {
  DRAFT: [ImprovementPlanStatus.ACTIVE],
  ACTIVE: [ImprovementPlanStatus.COMPLETED],
  COMPLETED: [ImprovementPlanStatus.EXTENDED, ImprovementPlanStatus.CANCELED],
  EXTENDED: [ImprovementPlanStatus.COMPLETED, ImprovementPlanStatus.CANCELED],
  CANCELED: [],
};

export default function ImprovementPlanDetailView({
  planId,
  returnHref,
  auth,
  initialPlan,
}: ImprovementPlanDetailViewProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [timeline, setTimeline] = useState<ImprovementPlanTimelineEntry[]>(initialPlan.timeline);
  const [activityView, setActivityView] = useState<ActivityView>("timeline");

  const [checkInNote, setCheckInNote] = useState("");
  const [checkInType, setCheckInType] = useState<ImprovementPlanCheckInType>(
    ImprovementPlanCheckInType.NOTE,
  );
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);

  const [targetStatus, setTargetStatus] = useState<ImprovementPlanStatus | "">("");
  const [transitionOutcome, setTransitionOutcome] = useState<ImprovementPlanOutcome | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [auditEvents, setAuditEvents] = useState<ImprovementPlanAuditEvent[]>([]);
  const [auditLoadState, setAuditLoadState] = useState<AuditLoadState>("idle");
  const [auditError, setAuditError] = useState<string | null>(null);

  const availableTransitions = useMemo(
    () => transitionOptionsByStatus[plan.status],
    [plan.status],
  );

  const canChangeStatus = canManageImprovementPlans(auth.role);
  const canRecordStructuredCheckpoints = canManageImprovementPlans(auth.role);
  const canAddCheckIn =
    plan.status === ImprovementPlanStatus.ACTIVE || plan.status === ImprovementPlanStatus.EXTENDED;

  const loadAuditEvents = useCallback(async () => {
    setAuditLoadState("loading");
    setAuditError(null);

    try {
      const response = await fetch(`/api/performance/improvement-plans/${planId}/audit`, {
        method: "GET",
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
      });

      const payload = (await response.json()) as {
        message?: string;
        events?: ImprovementPlanAuditEvent[];
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to load audit log");
      }

      setAuditEvents(Array.isArray(payload.events) ? payload.events : []);
      setAuditLoadState("loaded");
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : "Unable to load audit log");
      setAuditLoadState("error");
    }
  }, [auth.orgId, auth.userId, planId]);

  useEffect(() => {
    if (activityView === "audit" && auditLoadState === "idle") {
      void loadAuditEvents();
    }
  }, [activityView, auditLoadState, loadAuditEvents]);

  async function handleCreateCheckIn() {
    if (!checkInNote.trim()) {
      setCheckInMessage("Add a note before creating a check-in.");
      return;
    }

    setIsSavingCheckIn(true);
    setCheckInMessage(null);

    try {
      const response = await fetch(`/api/performance/improvement-plans/${planId}/checkins`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          note: checkInNote.trim(),
          checkInType,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        checkIn?: ImprovementPlanTimelineEntry;
      };

      if (!response.ok || !payload.checkIn) {
        throw new Error(payload.message ?? "Unable to create check-in");
      }

      const createdCheckIn = payload.checkIn;

      setTimeline((previous) => [createdCheckIn, ...previous]);
      setPlan((previous) => ({
        ...previous,
        checkInCount: previous.checkInCount + 1,
        checkpointSchedule: applyCheckpointToSchedule(previous.checkpointSchedule, createdCheckIn),
      }));
      setAuditLoadState("idle");
      setCheckInNote("");
      setCheckInType(ImprovementPlanCheckInType.NOTE);
      setCheckInMessage("Check-in added.");
    } catch (error) {
      setCheckInMessage(error instanceof Error ? error.message : "Unable to create check-in");
    } finally {
      setIsSavingCheckIn(false);
    }
  }

  async function handleStatusTransition() {
    if (!targetStatus) {
      setStatusMessage("Choose a target status.");
      return;
    }

    if (targetStatus === ImprovementPlanStatus.COMPLETED && !transitionOutcome) {
      setStatusMessage("Choose an outcome when completing a plan.");
      return;
    }

    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/performance/improvement-plans/${planId}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
        body: JSON.stringify({
          targetStatus,
          outcome: targetStatus === ImprovementPlanStatus.COMPLETED ? transitionOutcome : null,
          note: statusNote.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        status?: ImprovementPlanStatus;
        outcome?: ImprovementPlanOutcome | null;
        timelineEntry?: ImprovementPlanTimelineEntry;
      };

      if (!response.ok || !payload.status || !payload.timelineEntry) {
        throw new Error(payload.message ?? "Unable to change status");
      }

      setPlan((previous) => ({
        ...previous,
        status: payload.status as ImprovementPlanStatus,
        outcome: payload.outcome ?? null,
        checkInCount: previous.checkInCount + 1,
      }));
      setTimeline((previous) => [payload.timelineEntry as ImprovementPlanTimelineEntry, ...previous]);
      setAuditLoadState("idle");
      setTargetStatus("");
      setTransitionOutcome("");
      setStatusNote("");
      setStatusMessage("Status updated.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to change status");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-slate-900">
      <PageHeader
        eyebrow="Improvement Plan"
        title={plan.title}
        description={`${formatStableDate(plan.startDate)} - ${formatStableDate(plan.endDate)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={returnHref}>
              <Button variant="outline" size="sm">
                Back
              </Button>
            </Link>
          </div>
        }
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={plan.status === ImprovementPlanStatus.ACTIVE ? "success" : "info"}>
              {statusLabel[plan.status]}
            </Badge>
            {plan.outcome ? (
              <Badge
                variant={
                  plan.outcome === ImprovementPlanOutcome.SUCCESSFUL ? "success" : "warning"
                }
              >
                {outcomeLabel[plan.outcome]}
              </Badge>
            ) : null}
            <span>
              Subject: {plan.subjectName} | Manager: {plan.managerName}
              {plan.hrOwnerName ? ` | HR Owner: ${plan.hrOwnerName}` : ""}
            </span>
          </div>
        }
      />

      <HelpHint
        label="Visibility and audit rules"
        buttonLabel="Toggle visibility and audit guidance"
      >
        Access is limited to the subject employee, the assigned manager owner, and HR oversight.
        Check-ins and status transitions are recorded in the audit log, and standard 30/60/90-day
        checkpoints should be captured as the plan progresses.
      </HelpHint>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <SectionHeader
                title="Plan context"
                description="Keep the PIP grounded in the review or calibration decision that triggered it."
              />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">{triggerSourceLabel[plan.triggerSource]}</Badge>
                {plan.reviewCycleName ? <Badge variant="neutral">Review cycle: {plan.reviewCycleName}</Badge> : null}
                {plan.calibrationSessionName ? (
                  <Badge variant="warning">Calibration: {plan.calibrationSessionName}</Badge>
                ) : null}
              </div>
              <p className="text-sm text-slate-700">
                The manager owns day-to-day feedback, HR oversees the plan process, and the employee
                can participate through plan updates and checkpoint conversations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader
                title="Expectations"
                description="Shared outcomes and coaching focus for this plan period."
              />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{plan.expectations}</p>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Goals</h3>
                <ul className="mt-2 space-y-2">
                  {plan.goals.map((goal) => (
                    <li
                      key={goal.id}
                      className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-medium text-slate-900">{goal.title}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {goal.description ?? "No goal description provided."}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionHeader
                title="Standard checkpoints"
                description="The active vanilla PIP path tracks the standard 30 / 60 / 90-day cadence explicitly."
              />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {plan.checkpointSchedule.map((checkpoint) => (
                <div
                  key={checkpoint.type}
                  className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{checkpoint.label}</p>
                    <Badge variant={checkpoint.completedAt ? "success" : "neutral"}>
                      {checkpoint.completedAt ? "Recorded" : "Pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Target date {formatStableDate(checkpoint.targetDate)}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {checkpoint.completedAt
                      ? `Completed by ${checkpoint.completedByName ?? "an authorized participant"} on ${formatStableDate(checkpoint.completedAt)}.`
                      : "Not recorded yet."}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3">
              <SectionHeader
                title={activityView === "timeline" ? "Timeline" : "Audit Log"}
                description={
                  activityView === "timeline"
                    ? `${plan.checkInCount} check-in${plan.checkInCount === 1 ? "" : "s"} recorded for this plan.`
                    : "Immutable event history for this plan."
                }
              />
              <Tabs
                ariaLabel="Improvement plan activity tabs"
                value={activityView}
                onValueChange={(nextValue) => setActivityView(nextValue as ActivityView)}
                tabs={[
                  { value: "timeline", label: "Timeline" },
                  { value: "audit", label: "Audit Log" },
                ]}
              />
            </CardHeader>
            <CardContent className="pt-0">
              {activityView === "timeline" ? (
                timeline.length === 0 ? (
                  <EmptyState
                    title="No check-ins yet"
                    description="Add the first update to start the timeline."
                    className="p-4"
                  />
                ) : (
                  <ol className="space-y-3">
                    {timeline.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{entry.authorName}</p>
                          <p className="text-xs text-slate-500">
                            {formatStableDateTime(entry.timestamp)}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant="neutral">{checkInTypeLabel[entry.checkInType]}</Badge>
                          {entry.status ? (
                            <Badge variant="neutral">Status: {statusLabel[entry.status]}</Badge>
                          ) : null}
                          {entry.outcome ? (
                            <Badge
                              variant={
                                entry.outcome === ImprovementPlanOutcome.SUCCESSFUL
                                  ? "success"
                                  : "warning"
                              }
                            >
                              Outcome: {outcomeLabel[entry.outcome]}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{entry.note}</p>
                      </li>
                    ))}
                  </ol>
                )
              ) : auditLoadState === "loading" ? (
                <div className="space-y-3" aria-busy="true">
                  <Skeleton className="h-20 rounded-[var(--radius-md)] border border-slate-200 bg-slate-100" />
                  <Skeleton className="h-20 rounded-[var(--radius-md)] border border-slate-200 bg-slate-100" />
                </div>
              ) : auditLoadState === "error" ? (
                <Toast variant="error">
                  <div className="space-y-3">
                    <p>{auditError ?? "Unable to load audit log."}</p>
                    <Button variant="outline" size="sm" onClick={() => void loadAuditEvents()}>
                      Retry
                    </Button>
                  </div>
                </Toast>
              ) : auditEvents.length === 0 ? (
                <EmptyState
                  title="No audit events yet"
                  description="Audit history entries will appear here as this plan changes."
                  className="p-4"
                />
              ) : (
                <ol className="space-y-3">
                  {auditEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{event.actorName}</p>
                        <p className="text-xs text-slate-500">
                          {formatStableDateTime(event.timestamp)}
                        </p>
                      </div>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                        {event.action}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{event.description}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <Drawer title="Plan Actions" description="Capture check-ins and progress status transitions.">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Check-in</CardTitle>
                <CardDescription>
                  Share progress updates, blockers, and next steps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {!canAddCheckIn ? (
                  <Toast variant="info">
                    Check-ins become available when the PIP is active or extended.
                  </Toast>
                ) : (
                  <>
                    {canRecordStructuredCheckpoints ? (
                      <Select
                        value={checkInType}
                        onChange={(event) =>
                          setCheckInType(event.target.value as ImprovementPlanCheckInType)
                        }
                      >
                        <option value={ImprovementPlanCheckInType.NOTE}>General update</option>
                        <option value={ImprovementPlanCheckInType.CHECKPOINT_30}>
                          30-day checkpoint
                        </option>
                        <option value={ImprovementPlanCheckInType.CHECKPOINT_60}>
                          60-day checkpoint
                        </option>
                        <option value={ImprovementPlanCheckInType.CHECKPOINT_90}>
                          90-day checkpoint
                        </option>
                      </Select>
                    ) : null}
                    <Textarea
                      value={checkInNote}
                      onChange={(event) => setCheckInNote(event.target.value)}
                      className="min-h-28"
                      placeholder={
                        checkInType === ImprovementPlanCheckInType.NOTE
                          ? "Add a timeline update..."
                          : `Capture the ${checkInTypeLabel[checkInType].toLowerCase()} discussion, commitments, and next steps.`
                      }
                      data-testid="improvement-checkin-input"
                    />
                    <Button
                      onClick={() => void handleCreateCheckIn()}
                      disabled={isSavingCheckIn}
                      data-testid="improvement-checkin-submit"
                    >
                      {isSavingCheckIn ? "Saving..." : "Add Check-in"}
                    </Button>
                  </>
                )}
                {checkInMessage ? (
                  <Toast variant={checkInMessage.includes("Unable") ? "error" : "info"}>
                    {checkInMessage}
                  </Toast>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Status</CardTitle>
                <CardDescription>
                  Move the plan through the structured PIP status workflow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {!canChangeStatus ? (
                  <Toast variant="warning">Only managers and HR admins can change status.</Toast>
                ) : availableTransitions.length === 0 ? (
                  <Toast variant="info">No status transitions are available.</Toast>
                ) : (
                  <>
                    <Select
                      value={targetStatus}
                      onChange={(event) => {
                        const next = event.target.value as ImprovementPlanStatus | "";
                        setTargetStatus(next);
                        if (next !== ImprovementPlanStatus.COMPLETED) {
                          setTransitionOutcome("");
                        }
                      }}
                    >
                      <option value="">Select target status</option>
                      {availableTransitions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel[status]}
                        </option>
                      ))}
                    </Select>

                    {targetStatus === ImprovementPlanStatus.COMPLETED ? (
                      <Select
                        value={transitionOutcome}
                        onChange={(event) =>
                          setTransitionOutcome(event.target.value as ImprovementPlanOutcome | "")
                        }
                      >
                        <option value="">Select completion outcome</option>
                        <option value={ImprovementPlanOutcome.SUCCESSFUL}>Successful</option>
                        <option value={ImprovementPlanOutcome.UNSUCCESSFUL}>Unsuccessful</option>
                      </Select>
                    ) : null}

                    <Textarea
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      className="min-h-20"
                      placeholder="Optional transition note..."
                    />

                    <Button onClick={() => void handleStatusTransition()} disabled={isUpdatingStatus}>
                      {isUpdatingStatus ? "Updating..." : "Update Status"}
                    </Button>
                  </>
                )}
                {statusMessage ? (
                  <Toast variant={statusMessage.includes("Unable") ? "error" : "info"}>
                    {statusMessage}
                  </Toast>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </Drawer>
      </div>
    </div>
  );
}

function applyCheckpointToSchedule(
  schedule: ImprovementPlanCheckpointScheduleItem[],
  checkIn: ImprovementPlanTimelineEntry,
): ImprovementPlanCheckpointScheduleItem[] {
  if (!structuredCheckpointTypes.has(checkIn.checkInType)) {
    return schedule;
  }

  return schedule.map((checkpoint) =>
    checkpoint.type === checkIn.checkInType
      ? {
          ...checkpoint,
          completedAt: checkIn.timestamp,
          completedByName: checkIn.authorName,
        }
      : checkpoint,
  );
}
