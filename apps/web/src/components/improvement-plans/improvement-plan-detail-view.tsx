"use client";

import {
  ImprovementPlanOutcome,
  ImprovementPlanStatus,
  UserRole,
} from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type {
  ImprovementPlanAuditEvent,
  ImprovementPlanDetail,
  ImprovementPlanTimelineEntry,
} from "@/server/improvement-plans/improvement-plan-service";

interface ImprovementPlanDetailViewProps {
  planId: string;
  auth: {
    userId: string;
    orgId: string;
    role: UserRole;
  };
  initialPlan: ImprovementPlanDetail;
}

type ActivityView = "timeline" | "audit";
type AuditLoadState = "idle" | "loading" | "loaded" | "error";

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
  auth,
  initialPlan,
}: ImprovementPlanDetailViewProps) {
  const [plan, setPlan] = useState(initialPlan);
  const [timeline, setTimeline] = useState<ImprovementPlanTimelineEntry[]>(initialPlan.timeline);
  const [activityView, setActivityView] = useState<ActivityView>("timeline");

  const [checkInNote, setCheckInNote] = useState("");
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

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const availableTransitions = useMemo(
    () => transitionOptionsByStatus[plan.status],
    [plan.status],
  );

  const canChangeStatus = auth.role === UserRole.HR_ADMIN || auth.role === UserRole.MANAGER;

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
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        checkIn?: ImprovementPlanTimelineEntry;
      };

      if (!response.ok || !payload.checkIn) {
        throw new Error(payload.message ?? "Unable to create check-in");
      }

      setTimeline((previous) => [payload.checkIn as ImprovementPlanTimelineEntry, ...previous]);
      setPlan((previous) => ({
        ...previous,
        checkInCount: previous.checkInCount + 1,
      }));
      setAuditLoadState("idle");
      setCheckInNote("");
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

  async function handleExportRequest() {
    setIsExporting(true);
    setExportMessage(null);

    try {
      const response = await fetch(`/api/performance/improvement-plans/${planId}/export`, {
        method: "GET",
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
        },
      });

      const payload = (await response.json()) as {
        message?: string;
      };

      if (response.status === 501) {
        setExportMessage(payload.message ?? "Export is not implemented yet.");
        return;
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to process export request");
      }

      setExportMessage(payload.message ?? "Export request accepted.");
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : "Unable to process export request");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 text-slate-900">
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Improvement Plan
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{plan.title}</h1>
            <Badge variant={plan.status === ImprovementPlanStatus.ACTIVE ? "success" : "info"}>
              {statusLabel[plan.status]}
            </Badge>
            {plan.outcome ? (
              <Badge
                variant={
                  plan.outcome === ImprovementPlanOutcome.SUCCESSFUL
                    ? "success"
                    : "warning"
                }
              >
                {outcomeLabel[plan.outcome]}
              </Badge>
            ) : null}
          </div>
          <Button onClick={() => void handleExportRequest()} disabled={isExporting}>
            {isExporting ? "Requesting..." : "Export"}
          </Button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Subject: {plan.subjectName} | Manager: {plan.managerName}
          {plan.hrOwnerName ? ` | HR Owner: ${plan.hrOwnerName}` : ""}
        </p>
        {exportMessage ? <p className="mt-3 text-xs text-slate-600">{exportMessage}</p> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expectations</CardTitle>
              <CardDescription>
                Shared outcomes and coaching focus for this plan period.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">{plan.expectations}</p>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Goals</h3>
                <ul className="mt-2 space-y-2">
                  {plan.goals.map((goal) => (
                    <li key={goal.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>{activityView === "timeline" ? "Timeline" : "Audit Log"}</CardTitle>
                <div className="inline-flex rounded-md border border-slate-300 bg-slate-50 p-1">
                  <button
                    type="button"
                    className={`rounded px-3 py-1 text-xs font-medium ${
                      activityView === "timeline"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                    onClick={() => setActivityView("timeline")}
                  >
                    Timeline
                  </button>
                  <button
                    type="button"
                    className={`rounded px-3 py-1 text-xs font-medium ${
                      activityView === "audit"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                    onClick={() => setActivityView("audit")}
                  >
                    Audit Log
                  </button>
                </div>
              </div>
              <CardDescription>
                {activityView === "timeline"
                  ? `${plan.checkInCount} check-in${plan.checkInCount === 1 ? "" : "s"} recorded for this plan.`
                  : "Immutable event history for this plan."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityView === "timeline" ? (
                timeline.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    No check-ins yet. Add the first update to start the timeline.
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {timeline.map((entry) => (
                      <li key={entry.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{entry.authorName}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
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
                        <p className="mt-3 text-xs text-slate-500">Attachments: coming soon.</p>
                      </li>
                    ))}
                  </ol>
                )
              ) : auditLoadState === "loading" ? (
                <div className="space-y-3" aria-busy="true">
                  <div className="h-20 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
                  <div className="h-20 animate-pulse rounded-md border border-slate-200 bg-slate-100" />
                </div>
              ) : auditLoadState === "error" ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  <p>{auditError ?? "Unable to load audit log."}</p>
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => void loadAuditEvents()}
                  >
                    Retry
                  </Button>
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No audit events yet for this plan.
                </div>
              ) : (
                <ol className="space-y-3">
                  {auditEvents.map((event) => (
                    <li key={event.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{event.actorName}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleString()}
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

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Check-in</CardTitle>
              <CardDescription>
                Share progress updates, blockers, and next steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={checkInNote}
                onChange={(event) => setCheckInNote(event.target.value)}
                className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Add a timeline update..."
              />
              <Button onClick={() => void handleCreateCheckIn()} disabled={isSavingCheckIn}>
                {isSavingCheckIn ? "Saving..." : "Add Check-in"}
              </Button>
              {checkInMessage ? <p className="text-xs text-slate-600">{checkInMessage}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Status</CardTitle>
              <CardDescription>
                Move the plan through the defined status workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canChangeStatus ? (
                <p className="text-sm text-slate-600">Only managers and HR admins can change status.</p>
              ) : availableTransitions.length === 0 ? (
                <p className="text-sm text-slate-600">No status transitions are available.</p>
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

                  <textarea
                    value={statusNote}
                    onChange={(event) => setStatusNote(event.target.value)}
                    className="min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Optional transition note..."
                  />

                  <Button onClick={() => void handleStatusTransition()} disabled={isUpdatingStatus}>
                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                  </Button>
                </>
              )}
              {statusMessage ? <p className="text-xs text-slate-600">{statusMessage}</p> : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
