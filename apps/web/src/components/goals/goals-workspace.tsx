"use client";

import { GoalStatus, GoalVisibility, KeyResultType } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GoalComposer } from "@/components/goals/goal-composer";
import { GoalCycleSelector } from "@/components/goals/goal-cycle-selector";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterChip } from "@/components/ui/filter-chip";
import { RightDrawer } from "@/components/ui/right-drawer";
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
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

interface GoalsWorkspaceProps {
  auth: {
    userId: string;
    orgId: string;
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
    ownerEmployeeId: string;
    ownerName: string;
    title: string;
    description: string | null;
    status: GoalStatus;
    progressPercent: number;
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
      ownerEmployeeId: string;
      ownerName: string;
      title: string;
      description: string | null;
      status: GoalStatus;
      progressPercent: number;
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
  ownerEmployeeId: string;
  ownerName: string;
  title: string;
  description: string | null;
  status: GoalStatus;
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
  }, [selectedCycleId, filters.ownerId, filters.status, filters.visibility]);

  const ownerLabel =
    filters.ownerId != null
      ? catalog.owners.find((owner) => owner.id === filters.ownerId)?.name ?? filters.ownerId
      : null;

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

  async function handleSaved(goalId: string) {
    setComposerMode(null);
    await loadGoalContext(goalId);
    router.refresh();
  }

  async function handlePostTimelineUpdate() {
    if (!selectedGoalId || timelineNote.trim().length === 0) {
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

  return (
    <div className="mx-auto grid w-full max-w-[1500px] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Goals"
          title="Goals workspace"
          description="Plan against the active cycle, align goals upward, and keep work current through lightweight updates."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <GoalCycleSelector
                cycles={cycles.map((cycle) => ({ id: cycle.id, name: cycle.name }))}
                selectedCycleId={selectedCycle.id}
              />
              <Button onClick={() => setComposerMode("create")}>Create goal</Button>
            </div>
          }
          metadata={
            <>
              <span>{selectedCycle.name}</span>
              <span>•</span>
              <span>{new Date(selectedCycle.startDate).toLocaleDateString()} to {new Date(selectedCycle.endDate).toLocaleDateString()}</span>
              <span>•</span>
              <span>{selectedCycle.status.toLowerCase()}</span>
            </>
          }
        />

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
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <GoalSummaryCard title="On track" value={summary.onTrack} tone="success" />
          <GoalSummaryCard title="Progressing" value={summary.progressing} tone="warning" />
          <GoalSummaryCard title="Off track" value={summary.offTrack} tone="error" />
          <GoalSummaryCard title="No update" value={summary.noUpdate} tone="neutral" />
          <GoalSummaryCard title="Complete" value={summary.complete} tone="info" />
        </section>

        <FilterBar
          description="Focus the list by owner, status, or visibility while staying inside the selected cycle."
          chips={
            hasActiveFilters ? (
              <>
                {ownerLabel ? (
                  <FilterChip clearHref={clearFilterHref("ownerId")}>
                    Owner: {ownerLabel}
                  </FilterChip>
                ) : null}
                {filters.status ? (
                  <FilterChip clearHref={clearFilterHref("status")}>
                    Status: {humanizeGoalStatus(filters.status)}
                  </FilterChip>
                ) : null}
                {filters.visibility ? (
                  <FilterChip clearHref={clearFilterHref("visibility")}>
                    Visibility: {filters.visibility}
                  </FilterChip>
                ) : null}
                <FilterChip clearHref={resetFiltersHref()}>Reset all filters</FilterChip>
              </>
            ) : undefined
          }
        >
          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Owner
            </span>
            <Select
              value={filters.ownerId ?? ""}
              onChange={(event) => updateQuery("ownerId", event.target.value)}
            >
              <option value="">All visible owners</option>
              {catalog.owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Status
            </span>
            <Select
              value={filters.status ?? ""}
              onChange={(event) => updateQuery("status", event.target.value)}
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

          <label className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Visibility
            </span>
            <Select
              value={filters.visibility ?? ""}
              onChange={(event) => updateQuery("visibility", event.target.value)}
            >
              <option value="">All visibility</option>
              <option value={GoalVisibility.PRIVATE}>Private</option>
              <option value={GoalVisibility.TEAM}>Team</option>
              <option value={GoalVisibility.ORG}>Org</option>
            </Select>
          </label>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.replace(resetFiltersHref())}
            >
              Clear filters
            </Button>
          </div>
        </FilterBar>

        {goals.length === 0 ? (
          <EmptyState
            title="No goals in the current view"
            description="Create the first objective for this cycle or widen the filters."
            action={<Button onClick={() => setComposerMode("create")}>Create goal</Button>}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Goals in {selectedCycle.name}</CardTitle>
              <CardDescription>
                Click a row to open the context drawer, then use the edit flow or timeline updates without leaving the list.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Objective</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {goals.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell>
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => void loadGoalContext(goal.id)}
                          >
                            <p className="font-semibold text-slate-900">{goal.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {goal.parentGoalId ? "Aligned to a parent goal" : "Top-level objective"}
                            </p>
                          </button>
                        </TableCell>
                        <TableCell>{goal.ownerName}</TableCell>
                        <TableCell>
                          <StatusChip tone={goalStatusTone(goal.status)}>
                            {humanizeGoalStatus(goal.status)}
                          </StatusChip>
                        </TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="space-y-2">
                            <div className="h-2.5 rounded-full bg-slate-100">
                              <div
                                className="h-2.5 rounded-full bg-teal-500"
                                style={{ width: `${Math.max(0, Math.min(goal.progressPercent, 100))}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              {Math.round(goal.progressPercent)}% complete
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={goal.visibility === GoalVisibility.ORG ? "success" : goal.visibility === GoalVisibility.TEAM ? "info" : "neutral"}>
                            {goal.visibility}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void loadGoalContext(goal.id)}
                            >
                              Context
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await loadGoalContext(goal.id);
                                setComposerMode("edit");
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedGoalId ? (
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
                {selectedGoal ? (
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
                  <p className="text-sm text-slate-500">Loading goal context…</p>
                ) : (
                  <div className="space-y-5">
                    <section className="grid gap-3 sm:grid-cols-2">
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
                          Status
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
                          Visibility
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {selectedGoal.visibility}
                        </p>
                      </div>
                    </section>

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
                      <h3 className="text-sm font-semibold text-slate-900">Key results</h3>
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
                          <p className="text-sm text-slate-500">No key results attached yet.</p>
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
                  <p className="text-sm text-slate-500">Loading updates…</p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">Post update</p>
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
                    </div>

                    <div className="space-y-3">
                      {selectedGoalUpdates.length > 0 ? (
                        selectedGoalUpdates.map((update) => (
                          <div key={update.id} className="rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900">{update.author}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(update.createdAt).toLocaleString()}
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
                  <p className="text-sm text-slate-500">Loading audit history…</p>
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
                              {new Date(event.createdAt).toLocaleString()}
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

function GoalSummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "neutral" | "success" | "warning" | "info" | "error";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <StatusChip tone={tone}>{title}</StatusChip>
        <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
      </CardContent>
    </Card>
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
