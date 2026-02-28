"use client";

import {
  ImprovementPlanOutcome,
  ImprovementPlanStatus,
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
      <PageHeader
        eyebrow="Improvement Plan"
        title={plan.title}
        description={`${new Date(plan.startDate).toLocaleDateString()} - ${new Date(plan.endDate).toLocaleDateString()}`}
        action={
          <Button onClick={() => void handleExportRequest()} disabled={isExporting}>
            {isExporting ? "Requesting..." : "Export"}
          </Button>
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

      {exportMessage ? (
        <Toast variant={exportMessage.includes("Unable") ? "error" : "info"}>{exportMessage}</Toast>
      ) : null}

      <HelpHint
        label="Visibility and audit rules"
        buttonLabel="Toggle visibility and audit guidance"
      >
        Access is limited to the subject, manager chain, and HR. Check-ins and status transitions
        are recorded in the audit log.
      </HelpHint>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
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
                <Textarea
                  value={checkInNote}
                  onChange={(event) => setCheckInNote(event.target.value)}
                  className="min-h-28"
                  placeholder="Add a timeline update..."
                />
                <Button onClick={() => void handleCreateCheckIn()} disabled={isSavingCheckIn}>
                  {isSavingCheckIn ? "Saving..." : "Add Check-in"}
                </Button>
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
                  Move the plan through the defined status workflow.
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
