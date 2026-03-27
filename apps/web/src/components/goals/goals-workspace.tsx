"use client";

import { GoalStatus, GoalType, GoalVisibility, GoalWorkflowStatus, KeyResultType, UserRole } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GoalComposer } from "@/components/goals/goal-composer";
import { GoalCycleSelector } from "@/components/goals/goal-cycle-selector";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip } from "@/components/ui/filter-chip";
import { RightDrawer } from "@/components/ui/right-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/select";
import { StatusChip } from "@/components/ui/status-chip";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";
import { formatStableDateTime } from "@/lib/dates/stable-format";

interface GoalsWorkspaceProps {
  auth: {
    userId: string;
    orgId: string;
    role: UserRole;
  };
  cycles: Array<{
    id: string;
    name: string;
    cadence: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
  selectedCycleId: string;
  filters: {
    ownerId?: string;
    status?: GoalStatus;
    visibility?: GoalVisibility;
  };
  summary: {
    onTrack: number;
    progressing: number;
    offTrack: number;
    noUpdate: number;
    complete: number;
  };
  goals: Array<{
    id: string;
    cycleId: string;
    goalType: GoalType;
    ownerEmployeeId: string;
    ownerName: string;
    title: string;
    description: string | null;
    status: GoalStatus;
    progressPercent: number;
    workflowStatus: GoalWorkflowStatus;
    workflowNote: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    visibility: GoalVisibility;
    parentGoalId: string | null;
    updateCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
  catalog: {
    owners: Array<{
      id: string;
      name: string;
      department: string | null;
      title: string | null;
    }>;
    competencies: Array<{
      id: string;
      name: string;
      slug: string;
      dimensionKey: string | null;
    }>;
    parentGoals: Array<{
      id: string;
      cycleId: string;
      goalType: GoalType;
      ownerEmployeeId: string;
      ownerName: string;
      title: string;
      description: string | null;
      status: GoalStatus;
      progressPercent: number;
      workflowStatus: GoalWorkflowStatus;
      workflowNote: string | null;
      submittedAt: string | null;
      approvedAt: string | null;
      visibility: GoalVisibility;
      parentGoalId: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    defaultOwnerEmployeeId: string;
  };
}

interface GoalDetailResponse {
  id: string;
  goalType: GoalType;
  ownerEmployeeId: string;
  ownerName: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  workflowStatus: GoalWorkflowStatus;
  workflowNote: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  visibility: GoalVisibility;
  progressPercent: number;
  parentGoal: {
    id: string;
    title: string;
  } | null;
  children: Array<{
    id: string;
    title: string;
    status: GoalStatus;
    progressPercent: number;
    visibility: GoalVisibility;
    ownerEmployeeId: string;
  }>;
  competencies: Array<{
    id: string;
    name: string;
  }>;
  keyResults: Array<{
    id: string;
    title: string;
    type: KeyResultType;
    startValue: number | null;
    targetValue: number | null;
    currentValue: number | null;
    weight: number | null;
    sortOrder: number;
  }>;
  viewer: {
    canEditDefinition: boolean;
    canPostProgressUpdate: boolean;
    canSubmit: boolean;
    canApprove: boolean;
    canRequestChanges: boolean;
    canOverride: boolean;
  };
}

interface GoalTreeResponse {
  ancestors: Array<{
    id: string;
    title: string;
    ownerName: string;
  }>;
  children: Array<{
    id: string;
    title: string;
    status: GoalStatus;
    progressPercent: number;
    visibility: GoalVisibility;
  }>;
}

interface GoalUpdateResponse {
  id: string;
  note: string;
  progressDelta: number | null;
  snapshotProgressPercent: number | null;
  createdAt: string;
  author: string;
}

interface GoalAuditEventResponse {
  id: string;
  action: string;
  createdAt: string;
  actor: {
    email: string;
  };
  metadata: unknown;
}

export function GoalsWorkspace({
  auth,
  cycles,
  selectedCycleId,
  filters,
  summary,
  goals,
  catalog,
}: GoalsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [composerMode, setComposerMode] = useState<"create" | "edit" | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<GoalDetailResponse | null>(null);
  const [selectedGoalTree, setSelectedGoalTree] = useState<GoalTreeResponse | null>(null);
  const [selectedGoalUpdates, setSelectedGoalUpdates] = useState<GoalUpdateResponse[]>([]);
  const [selectedGoalAuditEvents, setSelectedGoalAuditEvents] = useState<GoalAuditEventResponse[]>([]);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [timelineMessage, setTimelineMessage] = useState<string | null>(null);
  const [timelineNote, setTimelineNote] = useState("");
  const [isSubmittingTimelineNote, setIsSubmittingTimelineNote] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [workflowNote, setWorkflowNote] = useState("");
  const [isSubmittingWorkflowAction, setIsSubmittingWorkflowAction] = useState(false);
  const [goalView, setGoalView] = useState<"published" | "drafts">("published");
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);

  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) ?? cycles[0];
  const hasActiveFilters = Boolean(filters.ownerId || filters.status || filters.visibility);

  useEffect(() => {
    setComposerMode(null);
    setSelectedGoalId(null);
    setSelectedGoal(null);
    setSelectedGoalTree(null);
    setSelectedGoalUpdates([]);
    setSelectedGoalAuditEvents([]);
    setDrawerError(null);
    setTimelineNote("");
    setTimelineMessage(null);
    setWorkflowNote("");
    setWorkflowMessage(null);
    setWorkspaceMessage(null);
  }, [selectedCycleId, filters.ownerId, filters.status, filters.visibility]);

  const ownerLabel =
    filters.ownerId != null
      ? catalog.owners.find((owner) => owner.id === filters.ownerId)?.name ?? filters.ownerId
      : null;
  const publishedGoals = goals.filter((goal) =>
    goal.workflowStatus === GoalWorkflowStatus.SUBMITTED ||
    goal.workflowStatus === GoalWorkflowStatus.APPROVED ||
    goal.workflowStatus === GoalWorkflowStatus.OVERRIDDEN,
  );
  const draftGoals = goals.filter((goal) =>
    goal.workflowStatus === GoalWorkflowStatus.DRAFT ||
    goal.workflowStatus === GoalWorkflowStatus.CHANGES_REQUESTED,
  );
  const visibleGoals = goalView === "published" ? publishedGoals : draftGoals;

  useEffect(() => {
    if (goalView === "published" && publishedGoals.length === 0 && draftGoals.length > 0) {
      setGoalView("drafts");
      return;
    }

    if (goalView === "drafts" && draftGoals.length === 0 && publishedGoals.length > 0) {
      setGoalView("published");
    }
  }, [draftGoals.length, goalView, publishedGoals.length]);

  async function loadGoalContext(goalId: string) {
    setSelectedGoalId(goalId);
    setDrawerError(null);
    setIsDrawerLoading(true);

    try {
      const [goalResponse, treeResponse, updatesResponse, auditResponse] = await Promise.all([
        fetch(`/api/goals/${goalId}`, { headers: authHeaders(auth) }),
        fetch(`/api/goals/${goalId}/tree`, { headers: authHeaders(auth) }),
        fetch(`/api/goals/${goalId}/updates`, { headers: authHeaders(auth) }),
        fetch(`/api/goals/${goalId}/audit`, { headers: authHeaders(auth) }),
      ]);

      const [goalPayload, treePayload, updatesPayload, auditPayload] = await Promise.all([
        goalResponse.json(),
        treeResponse.json(),
        updatesResponse.json(),
        auditResponse.json(),
      ]);

      if (!goalResponse.ok || !goalPayload.goal) {
        throw new Error(goalPayload.message ?? "Unable to load goal");
      }

      if (!treeResponse.ok || !treePayload) {
        throw new Error(treePayload.message ?? "Unable to load goal tree");
      }

      setSelectedGoal(goalPayload.goal as GoalDetailResponse);
      setSelectedGoalTree(treePayload as GoalTreeResponse);
      setSelectedGoalUpdates((updatesPayload as { updates?: GoalUpdateResponse[] }).updates ?? []);
      setSelectedGoalAuditEvents((auditPayload as { events?: GoalAuditEventResponse[] }).events ?? []);
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : "Unable to load goal context");
    } finally {
      setIsDrawerLoading(false);
    }
  }

  async function handleSaved(goalId: string, outcome: "draft" | "published" | "saved") {
    setComposerMode(null);
    setWorkspaceMessage(
      outcome === "published"
        ? "Goal published for manager review."
        : outcome === "draft"
          ? "Goal saved as a draft."
          : "Goal updated.",
    );
    if (outcome === "published") {
      setGoalView("published");
    } else if (outcome === "draft") {
      setGoalView("drafts");
    }
    await loadGoalContext(goalId);
    router.refresh();
  }

  async function handleWorkflowAction(action: "submit" | "approve" | "request_changes" | "override") {
    if (!selectedGoalId) {
      return;
    }

    setIsSubmittingWorkflowAction(true);
    setWorkflowMessage(null);

    try {
      const response = await fetch(`/api/goals/${selectedGoalId}/workflow`, {
        method: "POST",
        headers: {
          ...authHeaders(auth),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          action,
          note: workflowNote.trim().length > 0 ? workflowNote.trim() : null,
        }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to update goal workflow");
      }

      setWorkflowNote("");
      setWorkflowMessage(
        action === "submit"
          ? "Goals submitted for manager review."
          : action === "approve"
            ? "Goals approved and locked."
            : action === "request_changes"
              ? "Revision request sent back to the employee."
              : "Goal lock overridden for exceptional Super Admin edits.",
      );
      await loadGoalContext(selectedGoalId);
      router.refresh();
    } catch (error) {
      setWorkflowMessage(error instanceof Error ? error.message : "Unable to update goal workflow");
    } finally {
      setIsSubmittingWorkflowAction(false);
    }
  }

  async function handlePostTimelineUpdate() {
    if (!selectedGoalId || timelineNote.trim().length === 0 || !selectedGoal?.viewer.canPostProgressUpdate) {
      return;
    }

    setIsSubmittingTimelineNote(true);
    setTimelineMessage(null);

    try {
      const response = await fetch(`/api/goals/${selectedGoalId}/updates`, {
        method: "POST",
        headers: authHeaders(auth),
        body: JSON.stringify({
          note: timelineNote,
          keyResults: [],
        }),
      });
      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to post goal update");
      }

      setTimelineNote("");
      setTimelineMessage("Update posted.");
      await loadGoalContext(selectedGoalId);
      router.refresh();
    } catch (error) {
      setTimelineMessage(error instanceof Error ? error.message : "Unable to post goal update");
    } finally {
      setIsSubmittingTimelineNote(false);
    }
  }

  function updateQuery(key: "ownerId" | "status" | "visibility", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const serialized = params.toString();
    router.replace(serialized.length > 0 ? `/goals?${serialized}` : "/goals");
  }

  function resetFiltersHref() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ownerId");
    params.delete("status");
    params.delete("visibility");
    const serialized = params.toString();
    return serialized.length > 0 ? `/goals?${serialized}` : "/goals";
  }

  function clearFilterHref(key: "ownerId" | "status" | "visibility") {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const serialized = params.toString();
    return serialized.length > 0 ? `/goals?${serialized}` : "/goals";
  }

  const editingGoal =
    composerMode === "edit" && selectedGoal ? selectedGoal : undefined;
  const showGoalContextDrawer = !composerMode && selectedGoalId != null;

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px]",
        showGoalContextDrawer
          ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
          : "space-y-6",
      )}
    >
      <div className="space-y-6">
        <PageHeader
          title={composerMode === "create" ? "New goal" : composerMode === "edit" ? "Edit goal" : "Goals"}
          description={
            composerMode
              ? "Work on one goal at a time, then save a draft or publish it before returning to the list."
              : "Create and manage your own goals for the current cycle. Broader people-wide oversight stays outside this self-service workspace."
          }
          metadata={
            <>
              <span>{selectedCycle.name}</span>
              <span aria-hidden="true">•</span>
              <span>{selectedCycle.cadence}</span>
            </>
          }
          action={
            composerMode ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setComposerMode(null)}>
                  Back to goals
                </Button>
              </div>
            ) : null
          }
        />

        {workspaceMessage ? <Toast variant="success">{workspaceMessage}</Toast> : null}

        {!composerMode ? (
          <GoalWorkspaceSupportPanel
            selectedCycleId={selectedCycle.id}
            cycles={cycles.map((cycle) => ({ id: cycle.id, name: cycle.name }))}
            summary={summary}
            filters={filters}
            ownerLabel={ownerLabel}
            owners={catalog.owners}
            hasActiveFilters={hasActiveFilters}
            onStartCreate={() => setComposerMode("create")}
            onUpdateQuery={updateQuery}
            onResetFilters={() => router.replace(resetFiltersHref())}
            clearOwnerHref={clearFilterHref("ownerId")}
            clearStatusHref={clearFilterHref("status")}
            clearVisibilityHref={clearFilterHref("visibility")}
            clearAllHref={resetFiltersHref()}
          />
        ) : null}

        {composerMode ? (
          <GoalComposer
            auth={auth}
            cycle={{ id: selectedCycle.id, name: selectedCycle.name, cadence: selectedCycle.cadence }}
            owners={catalog.owners}
            competencies={catalog.competencies}
            parentGoals={catalog.parentGoals.map((goal) => ({
              id: goal.id,
              title: goal.title,
              ownerName: goal.ownerName,
            }))}
            defaultOwnerEmployeeId={catalog.defaultOwnerEmployeeId}
            mode={composerMode}
            initialGoal={editingGoal}
            onSaved={handleSaved}
            onCancel={() => setComposerMode(null)}
          />
        ) : goals.length === 0 ? (
          <EmptyState
            title="No goals in the current view"
            description="Create the first objective for this cycle or widen the filters."
            action={<Button onClick={() => setComposerMode("create")}>Create goal</Button>}
          />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Your goals in {selectedCycle.name}</CardTitle>
                  <CardDescription>
                    Keep draft work lightweight, then use published goals as the calmer place to track approved progress.
                  </CardDescription>
                </div>
                <Tabs
                  tabs={[
                    { value: "published", label: `Published goals (${publishedGoals.length})` },
                    { value: "drafts", label: `Draft goals (${draftGoals.length})` },
                  ]}
                  value={goalView}
                  onValueChange={(nextValue) => setGoalView(nextValue as "published" | "drafts")}
                  ariaLabel="Goals view"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleGoals.length === 0 ? (
                <EmptyState
                  title={goalView === "published" ? "No published goals yet" : "No draft goals right now"}
                  description={
                    goalView === "published"
                      ? "Submit and approve a goal to keep it in the active published list."
                      : "Start a new goal when you are ready to draft the next objective."
                  }
                  action={<Button onClick={() => setComposerMode("create")}>Create goal</Button>}
                />
              ) : (
                visibleGoals.map((goal) => (
                  <GoalListCard
                    key={goal.id}
                    goal={goal}
                    onOpen={() => void loadGoalContext(goal.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {showGoalContextDrawer ? (
        <div className="xl:sticky xl:top-4 xl:self-start">
          <RightDrawer
            title={selectedGoal?.title ?? "Goal context"}
            subtitle={
              selectedGoal
                ? `${selectedGoal.ownerName} · ${Math.round(selectedGoal.progressPercent)}% progress`
                : "Loading context…"
            }
            actions={
              <div className="flex flex-wrap gap-2">
                {selectedGoal?.viewer.canEditDefinition ? (
                  <Button size="sm" variant="outline" onClick={() => setComposerMode("edit")}>
                    Edit goal
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => setSelectedGoalId(null)}>
                  Close
                </Button>
              </div>
            }
            tabs={[
              {
                id: "overview",
                label: "Overview",
                content: drawerError ? (
                  <p className="text-sm text-rose-700">{drawerError}</p>
                ) : isDrawerLoading || !selectedGoal ? (
                  <GoalDrawerOverviewSkeleton />
                ) : (
                  <div className="space-y-5">
                    <section className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Goal type
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {humanizeGoalType(selectedGoal.goalType)}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Owner
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {selectedGoal.ownerName}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Progress status
                        </p>
                        <div className="mt-2">
                          <StatusChip tone={goalStatusTone(selectedGoal.status)}>
                            {humanizeGoalStatus(selectedGoal.status)}
                          </StatusChip>
                        </div>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Progress
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {Math.round(selectedGoal.progressPercent)}%
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Workflow
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {humanizeWorkflowStatus(selectedGoal.workflowStatus)}
                        </p>
                        {selectedGoal.workflowNote ? (
                          <p className="mt-2 text-xs text-slate-500">{selectedGoal.workflowNote}</p>
                        ) : null}
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Visibility
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {selectedGoal.visibility}
                        </p>
                      </div>
                    </section>

                    {(selectedGoal.viewer.canSubmit ||
                      selectedGoal.viewer.canApprove ||
                      selectedGoal.viewer.canRequestChanges ||
                      selectedGoal.viewer.canOverride) ? (
                      <section className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">Workflow actions</h3>
                          <p className="text-sm text-slate-500">
                            Move the goal through the vanilla employee-to-manager approval flow.
                          </p>
                        </div>
                        <Textarea
                          value={workflowNote}
                          onChange={(event) => setWorkflowNote(event.target.value)}
                          rows={3}
                          placeholder={
                            selectedGoal.viewer.canRequestChanges
                              ? "Tell the employee what needs to change before resubmission."
                              : selectedGoal.viewer.canOverride
                                ? "Capture why this approved goal needs an exceptional Super Admin override."
                                : "Optional note"
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          {selectedGoal.viewer.canSubmit ? (
                            <Button
                              size="sm"
                              onClick={() => void handleWorkflowAction("submit")}
                              disabled={isSubmittingWorkflowAction}
                            >
                              {isSubmittingWorkflowAction ? "Submitting..." : "Submit goals"}
                            </Button>
                          ) : null}
                          {selectedGoal.viewer.canApprove ? (
                            <Button
                              size="sm"
                              onClick={() => void handleWorkflowAction("approve")}
                              disabled={isSubmittingWorkflowAction}
                            >
                              {isSubmittingWorkflowAction ? "Saving..." : "Approve goals"}
                            </Button>
                          ) : null}
                          {selectedGoal.viewer.canRequestChanges ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleWorkflowAction("request_changes")}
                              disabled={isSubmittingWorkflowAction || workflowNote.trim().length === 0}
                            >
                              {isSubmittingWorkflowAction ? "Saving..." : "Request changes"}
                            </Button>
                          ) : null}
                          {selectedGoal.viewer.canOverride ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleWorkflowAction("override")}
                              disabled={isSubmittingWorkflowAction || workflowNote.trim().length === 0}
                            >
                              {isSubmittingWorkflowAction ? "Saving..." : "Override lock"}
                            </Button>
                          ) : null}
                        </div>
                        {workflowMessage ? (
                          <Toast
                            variant={workflowMessage.toLowerCase().includes("unable") ? "error" : "success"}
                          >
                            {workflowMessage}
                          </Toast>
                        ) : null}
                      </section>
                    ) : null}

                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900">Narrative</h3>
                      <p className="text-sm leading-7 text-slate-600">
                        {selectedGoal.description ?? "No description yet."}
                      </p>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900">Competencies</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedGoal.competencies.length > 0 ? (
                          selectedGoal.competencies.map((competency) => (
                            <Badge key={competency.id} variant="info">
                              {competency.name}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No competency tags yet.</p>
                        )}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Cascade context</h3>
                      <div className="space-y-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Parent chain
                        </p>
                        {selectedGoalTree?.ancestors.length ? (
                          <div className="space-y-2">
                            {selectedGoalTree.ancestors.map((ancestor) => (
                              <div key={ancestor.id} className="rounded-[var(--radius-sm)] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                {ancestor.title} · {ancestor.ownerName}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">This goal is currently top-level.</p>
                        )}
                      </div>
                      <div className="space-y-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Child goals
                        </p>
                        {selectedGoal.children.length > 0 ? (
                          <div className="space-y-2">
                            {selectedGoal.children.map((child) => (
                              <div key={child.id} className="rounded-[var(--radius-sm)] border border-slate-200 bg-white px-3 py-2">
                                <p className="text-sm font-medium text-slate-900">{child.title}</p>
                                <p className="text-xs text-slate-500">
                                  {humanizeGoalStatus(child.status)} · {Math.round(child.progressPercent)}%
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No child goals aligned yet.</p>
                        )}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900">Measures</h3>
                      <div className="space-y-2">
                        {selectedGoal.keyResults.length > 0 ? (
                          selectedGoal.keyResults.map((keyResult) => (
                            <div
                              key={keyResult.id}
                              className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">{keyResult.title}</p>
                                  <p className="text-xs text-slate-500">{keyResult.type.toLowerCase()} metric</p>
                                </div>
                                <Badge variant="neutral">
                                  {formatKrProgress(keyResult.currentValue)} / {formatKrProgress(keyResult.targetValue)}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No measures attached yet.</p>
                        )}
                      </div>
                    </section>
                  </div>
                ),
              },
              {
                id: "timeline",
                label: "Timeline",
                content: drawerError ? (
                  <p className="text-sm text-rose-700">{drawerError}</p>
                ) : isDrawerLoading || !selectedGoal ? (
                  <GoalDrawerTimelineSkeleton />
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">Post update</p>
                      {selectedGoal.viewer.canPostProgressUpdate ? (
                        <>
                          <Textarea
                            value={timelineNote}
                            onChange={(event) => setTimelineNote(event.target.value)}
                            rows={4}
                            placeholder="Capture this week's checkpoint, blockers, or shift in confidence."
                          />
                          <div className="flex flex-wrap items-center gap-3">
                            <Button
                              size="sm"
                              disabled={isSubmittingTimelineNote || timelineNote.trim().length === 0}
                              onClick={() => void handlePostTimelineUpdate()}
                            >
                              {isSubmittingTimelineNote ? "Posting..." : "Post update"}
                            </Button>
                            {timelineMessage ? (
                              <Toast
                                variant={timelineMessage.toLowerCase().includes("unable") ? "error" : "success"}
                              >
                                {timelineMessage}
                              </Toast>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Progress notes are only available to the goal owner after manager approval and during an active goal-cycle window.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {selectedGoalUpdates.length > 0 ? (
                        selectedGoalUpdates.map((update) => (
                          <div key={update.id} className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900">{update.author}</p>
                              <p className="text-xs text-slate-500">
                                {formatStableDateTime(update.createdAt)}
                              </p>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-slate-600">{update.note}</p>
                            {update.snapshotProgressPercent != null ? (
                              <p className="mt-2 text-xs text-slate-500">
                                Snapshot progress: {Math.round(update.snapshotProgressPercent)}%
                              </p>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No updates posted yet.</p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                id: "audit",
                label: "Audit",
                content: drawerError ? (
                  <p className="text-sm text-rose-700">{drawerError}</p>
                ) : isDrawerLoading ? (
                  <GoalDrawerAuditSkeleton />
                ) : (
                  <div className="space-y-3">
                    {selectedGoalAuditEvents.length > 0 ? (
                      selectedGoalAuditEvents.map((event) => (
                        <div key={event.id} className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-slate-900">
                              {event.action.replaceAll("_", " ").toLowerCase()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatStableDateTime(event.createdAt)}
                            </p>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">{event.actor.email}</p>
                          {event.metadata ? (
                            <pre className="mt-3 overflow-x-auto rounded-[var(--radius-sm)] bg-slate-50 p-2 text-[11px] text-slate-600">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No direct goal audit entries yet.</p>
                    )}
                  </div>
                ),
              },
            ]}
            defaultTabId="overview"
            testId="goals-context-drawer"
          />
        </div>
      ) : null}
    </div>
  );
}

function GoalSnapshotCell({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "info" | "error";
}) {
  return (
    <div className="rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        <StatusChip tone={tone}>{value}</StatusChip>
      </div>
    </div>
  );
}

function GoalWorkspaceSupportPanel({
  selectedCycleId,
  cycles,
  summary,
  filters,
  ownerLabel,
  owners,
  hasActiveFilters,
  onStartCreate,
  onUpdateQuery,
  onResetFilters,
  clearOwnerHref,
  clearStatusHref,
  clearVisibilityHref,
  clearAllHref,
}: {
  selectedCycleId: string;
  cycles: Array<{ id: string; name: string }>;
  summary: GoalsWorkspaceProps["summary"];
  filters: GoalsWorkspaceProps["filters"];
  ownerLabel: string | null;
  owners: GoalsWorkspaceProps["catalog"]["owners"];
  hasActiveFilters: boolean;
  onStartCreate: () => void;
  onUpdateQuery: (key: "ownerId" | "status" | "visibility", value: string) => void;
  onResetFilters: () => void;
  clearOwnerHref: string;
  clearStatusHref: string;
  clearVisibilityHref: string;
  clearAllHref: string;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-shell-divider)] pb-4">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Goal cycle</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Choose the planning window before filtering or creating a goal.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[240px]">
            <GoalCycleSelector cycles={cycles} selectedCycleId={selectedCycleId} />
          </div>
          <Button onClick={onStartCreate}>Create goal</Button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Refine view</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Optional filters for broader browsing without splitting the page into a fake sidebar.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {hasActiveFilters ? "Active" : "Optional"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Owner
              </span>
              <Select
                value={filters.ownerId ?? ""}
                onChange={(event) => onUpdateQuery("ownerId", event.target.value)}
              >
                <option value="">All visible owners</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Status
              </span>
              <Select
                value={filters.status ?? ""}
                onChange={(event) => onUpdateQuery("status", event.target.value)}
              >
                <option value="">All statuses</option>
                <option value={GoalStatus.NOT_STARTED}>Not started</option>
                <option value={GoalStatus.ON_TRACK}>On track</option>
                <option value={GoalStatus.AT_RISK}>At risk</option>
                <option value={GoalStatus.OFF_TRACK}>Off track</option>
                <option value={GoalStatus.COMPLETE}>Complete</option>
                <option value={GoalStatus.CANCELED}>Canceled</option>
              </Select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                Visibility
              </span>
              <Select
                value={filters.visibility ?? ""}
                onChange={(event) => onUpdateQuery("visibility", event.target.value)}
              >
                <option value="">All visibility</option>
                <option value={GoalVisibility.PRIVATE}>Private</option>
                <option value={GoalVisibility.TEAM}>Team</option>
                <option value={GoalVisibility.ORG}>Org</option>
              </Select>
            </label>
          </div>

          {hasActiveFilters ? (
            <div className="flex flex-wrap gap-2">
              {ownerLabel ? (
                <FilterChip clearHref={clearOwnerHref}>Owner: {ownerLabel}</FilterChip>
              ) : null}
              {filters.status ? (
                <FilterChip clearHref={clearStatusHref}>
                  Status: {humanizeGoalStatus(filters.status)}
                </FilterChip>
              ) : null}
              {filters.visibility ? (
                <FilterChip clearHref={clearVisibilityHref}>
                  Visibility: {filters.visibility}
                </FilterChip>
              ) : null}
              <FilterChip clearHref={clearAllHref}>Reset all filters</FilterChip>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onResetFilters}>
              Clear filters
            </Button>
          </div>
        </div>

        <div className="rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Cycle snapshot</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                A quick pulse on the current cycle without treating summary as a separate panel.
              </p>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              Summary
            </span>
          </div>

          <div className="mt-4 space-y-3">
          <GoalSnapshotCell title="On track" value={summary.onTrack} tone="success" />
          <GoalSnapshotCell title="Progressing" value={summary.progressing} tone="warning" />
          <GoalSnapshotCell title="Off track" value={summary.offTrack} tone="error" />
          <GoalSnapshotCell title="No update" value={summary.noUpdate} tone="neutral" />
          <GoalSnapshotCell title="Complete" value={summary.complete} tone="info" />
          </div>
        </div>
      </div>
    </section>
  );
}

function GoalListCard({
  goal,
  onOpen,
}: {
  goal: GoalsWorkspaceProps["goals"][number];
  onOpen: () => void;
}) {
  const progressPercent = Math.max(0, Math.min(goal.progressPercent, 100));

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[22px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] p-4 text-left transition-[border-color,transform,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-focus-border)] hover:shadow-[var(--shadow-sm)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              {humanizeGoalType(goal.goalType)}
            </span>
            <Badge
              variant={
                goal.visibility === GoalVisibility.ORG
                  ? "success"
                  : goal.visibility === GoalVisibility.TEAM
                    ? "info"
                    : "neutral"
              }
            >
              {goal.visibility.toLowerCase()}
            </Badge>
            <StatusChip tone={goalStatusTone(goal.status)}>
              {humanizeGoalStatus(goal.status)}
            </StatusChip>
          </div>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {goal.title}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            {goal.ownerName} · {humanizeWorkflowStatus(goal.workflowStatus)}
          </p>
        </div>
        <div className="rounded-[16px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-3 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            Progress
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">
            {Math.round(progressPercent)}%
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-[var(--color-shell-surface-muted)]">
          <div
            className="h-2 rounded-full bg-[var(--brand-primary)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
        <span>
          {goal.updateCount} {goal.updateCount === 1 ? "update" : "updates"}
        </span>
        <span>Updated {formatStableDateTime(goal.updatedAt)}</span>
      </div>
    </button>
  );
}

function GoalDrawerOverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-[var(--radius-md)] border border-violet-100 bg-gradient-to-br from-white via-violet-50/45 to-cyan-50/45 p-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-3 w-40" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`goal-drawer-overview-skeleton-${index}`}
            className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-3"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-5 w-28" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function GoalDrawerTimelineSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full rounded-[var(--radius-md)]" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`goal-drawer-timeline-skeleton-${index}`}
            className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalDrawerAuditSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`goal-drawer-audit-skeleton-${index}`}
          className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-3 h-3 w-36" />
          <Skeleton className="mt-3 h-20 w-full rounded-[var(--radius-sm)]" />
        </div>
      ))}
    </div>
  );
}

function humanizeGoalStatus(status: GoalStatus) {
  switch (status) {
    case GoalStatus.NOT_STARTED:
      return "Not started";
    case GoalStatus.ON_TRACK:
      return "On track";
    case GoalStatus.AT_RISK:
      return "At risk";
    case GoalStatus.OFF_TRACK:
      return "Off track";
    case GoalStatus.COMPLETE:
      return "Complete";
    case GoalStatus.CANCELED:
    default:
      return "Canceled";
  }
}

function humanizeGoalType(goalType: GoalType) {
  switch (goalType) {
    case GoalType.DEVELOPMENT:
      return "Development goal";
    case GoalType.PERFORMANCE:
    default:
      return "Performance goal";
  }
}

function humanizeWorkflowStatus(status: GoalWorkflowStatus) {
  switch (status) {
    case GoalWorkflowStatus.DRAFT:
      return "Draft";
    case GoalWorkflowStatus.SUBMITTED:
      return "Submitted";
    case GoalWorkflowStatus.CHANGES_REQUESTED:
      return "Changes requested";
    case GoalWorkflowStatus.APPROVED:
      return "Approved";
    case GoalWorkflowStatus.OVERRIDDEN:
    default:
      return "Overridden";
  }
}

function goalStatusTone(status: GoalStatus): "neutral" | "success" | "warning" | "info" | "error" {
  switch (status) {
    case GoalStatus.ON_TRACK:
      return "success";
    case GoalStatus.AT_RISK:
      return "warning";
    case GoalStatus.COMPLETE:
      return "info";
    case GoalStatus.OFF_TRACK:
    case GoalStatus.CANCELED:
      return "error";
    case GoalStatus.NOT_STARTED:
    default:
      return "neutral";
  }
}

function formatKrProgress(value: number | null) {
  return value == null ? "—" : value.toString();
}

function authHeaders(auth: GoalsWorkspaceProps["auth"]) {
  return {
    "x-user-id": auth.userId,
    "x-org-id": auth.orgId,
  };
}
