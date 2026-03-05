import Link from "next/link";
import type { ReviewRelationship, ReviewSubmissionStatus } from "@prisma/client";

import { AvatarsStack } from "@/components/ui/avatars-stack";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterChip } from "@/components/ui/filter-chip";
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
import {
  listAssignedReviewTasks,
  type ReviewTaskListItem,
} from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

type SearchParamsShape = Record<string, string | string[] | undefined>;
type StatusFilter = ReviewSubmissionStatus;
type RelationshipFilter = ReviewRelationship;

interface ReviewTaskFilters {
  taskId: string | null;
  query: string | null;
  status: StatusFilter | null;
  relationship: RelationshipFilter | null;
}

const relationshipLabel = {
  SELF: "Self",
  MANAGER: "Manager",
  PEER: "Peer",
  UPWARD: "Upward",
} as const;

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

const statusProgressValue: Record<StatusFilter, number> = {
  NOT_STARTED: 5,
  IN_PROGRESS: 45,
  SUBMITTED: 100,
  RETURNED: 35,
};

const statusFilterOptions: StatusFilter[] = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "RETURNED"];
const relationshipFilterOptions: RelationshipFilter[] = ["SELF", "MANAGER", "PEER", "UPWARD"];

export default async function PerformanceReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const context = await getDevRequestContext();
  const rawSearchParams = await searchParams;
  const filters = parseReviewTaskFilters(rawSearchParams);
  const tasks = await listAssignedReviewTasks(context);
  const filteredTasks = tasks.filter((task) => matchesTaskFilters(task, filters));
  const statusSummary = summarizeTaskStatuses(filteredTasks);
  const selectedTaskId = filters.taskId;
  const selectedTask =
    selectedTaskId != null ? filteredTasks.find((task) => task.id === selectedTaskId) ?? null : null;
  const filterChips = buildFilterChips(filters);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 text-slate-900">
      <PageHeader
        title="Performance Reviews"
        description="Track review goals, apply filters, and open task details in the side panel."
      />

      <FilterBar
        method="get"
        description="Use search + filters to quickly narrow the task queue. Select a row to load richer context in the right drawer."
        chips={
          filterChips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2" data-testid="reviews-filter-chips">
              {filterChips.map((chip) => (
                <FilterChip
                  key={chip.key}
                  data-testid={`reviews-filter-chip-${chip.key}`}
                  clearHref={chip.clearHref}
                  clearTestId={`reviews-filter-chip-clear-${chip.key}`}
                  clearLabel={`Clear ${chip.key} filter`}
                >
                  {chip.label}
                </FilterChip>
              ))}
            </div>
          ) : null
        }
      >
        <label className="col-span-2 flex flex-col gap-2 text-sm text-slate-700 xl:col-span-3">
          Search task
          <input
            name="q"
            type="search"
            defaultValue={filters.query ?? ""}
            placeholder="Search by subject or cycle"
            className="h-10 rounded-[var(--radius-md)] border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Status
          <Select name="status" defaultValue={filters.status ?? ""} data-testid="reviews-filter-status">
            <option value="">All statuses</option>
            {statusFilterOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabel[status]}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-slate-700">
          Relationship
          <Select
            name="relationship"
            defaultValue={filters.relationship ?? ""}
            data-testid="reviews-filter-relationship"
          >
            <option value="">All relationships</option>
            {relationshipFilterOptions.map((relationship) => (
              <option key={relationship} value={relationship}>
                {relationshipLabel[relationship]}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex items-end">
          <Button type="submit" className="w-full" data-testid="reviews-apply-filters">
            Apply filters
          </Button>
        </div>
      </FilterBar>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs text-slate-600 sm:px-5">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
            {filteredTasks.length} tasks
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">
            {statusSummary.returned} returned
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 font-semibold text-sky-800">
            {statusSummary.inProgress} in progress
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
            {statusSummary.submitted} submitted
          </span>
          {selectedTask ? (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-800">
              Selected: {selectedTask.subjectName}
            </span>
          ) : null}
        </CardContent>
      </Card>

      {tasks.length === 0 ? (
        <EmptyState
          aria-label="Empty review task state"
          title="No assigned review tasks"
          description="Assigned submissions appear after HR generates cycle assignments. Open Help for next steps and visibility rules."
          icon={<span aria-hidden="true">🗂</span>}
          nextSteps={[
            "Ask HR to generate assignments for an active cycle.",
            "Check Help for cycle status and visibility expectations.",
          ]}
          action={
            <Link href="/help">
              <Button variant="outline" size="sm">
                Open Help
              </Button>
            </Link>
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          aria-label="No filtered review tasks"
          title="No tasks match your current filters"
          description="Clear one or more filters to bring tasks back into view."
          icon={<span aria-hidden="true">🔎</span>}
          action={
            <Link href={toReviewsHref({})}>
              <Button variant="outline" size="sm">
                Clear filters
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card aria-label="Assigned review tasks" className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Assigned goals-style task queue</CardTitle>
              <CardDescription>
                Click a subject row to load details in the panel, then launch the full review when ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => {
                      const progressValue = statusProgressValue[task.status];
                      const priority = getTaskPriority(task.cycleEndDate);
                      const isSelected = task.id === selectedTask?.id;
                      return (
                        <TableRow
                          key={task.id}
                          data-testid={`reviews-task-row-${task.id}`}
                          className={
                            isSelected
                              ? "bg-violet-50/45 ring-1 ring-inset ring-violet-200"
                              : "transition-colors hover:bg-slate-50"
                          }
                        >
                          <TableCell>
                            <Link
                              href={toReviewsHref({
                                taskId: task.id,
                                query: filters.query,
                                status: filters.status,
                                relationship: filters.relationship,
                              })}
                              scroll={false}
                              data-testid={`reviews-open-task-${task.id}`}
                              className="inline-flex flex-col rounded-[var(--radius-sm)] px-2 py-1 text-left transition hover:bg-white"
                            >
                              <span className="text-sm font-semibold text-slate-900">{task.subjectName}</span>
                              <span className="text-xs text-slate-500">
                                {task.cycleName} • Due {formatDate(task.cycleEndDate)} •{" "}
                                {relationshipLabel[task.relationship]}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className={priorityClassName(priority)}>
                              {priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            <AvatarsStack
                              items={[
                                { id: `${task.id}-subject`, label: task.subjectName },
                                { id: `${task.id}-reviewer`, label: "You" },
                              ]}
                              maxVisible={2}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusChip tone={getReviewStatusTone(task.status)}>
                              {statusLabel[task.status]}
                            </StatusChip>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-[110px] space-y-1">
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-500"
                                  style={{ width: `${progressValue}%` }}
                                />
                              </div>
                              <p className="text-xs text-slate-600">{progressValue}%</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Link href={`/performance/reviews/${task.cycleId}/write/${task.id}`}>
                              <Button size="sm">Open Review</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableWrapper>
            </CardContent>
          </Card>

          {selectedTask ? (
            <RightDrawer
              testId="reviews-task-drawer"
              title="Objective"
              subtitle={`${selectedTask.subjectName} · ${selectedTask.cycleName}`}
              closeHref={toReviewsHref({
                query: filters.query,
                status: filters.status,
                relationship: filters.relationship,
              })}
              actions={
                <StatusChip tone={getReviewStatusTone(selectedTask.status)}>
                  {statusLabel[selectedTask.status]}
                </StatusChip>
              }
              defaultTabId="overview"
              tabs={[
                {
                  id: "overview",
                  label: "Overview",
                  content: (
                    <div className="space-y-4 text-sm text-slate-700">
                      <div className="space-y-2 rounded-[var(--radius-md)] border border-violet-200 bg-gradient-to-br from-white via-violet-50/45 to-cyan-50/45 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Review goal
                        </p>
                        <p className="text-xl font-semibold leading-tight text-slate-900">
                          Complete review for {selectedTask.subjectName}
                        </p>
                        <p className="text-xs text-slate-600">
                          {relationshipLabel[selectedTask.relationship]} review in{" "}
                          {selectedTask.cycleName}
                        </p>
                      </div>

                      <div className="space-y-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Progress</span>
                          <span>{statusProgressValue[selectedTask.status]}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
                            style={{ width: `${statusProgressValue[selectedTask.status]}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Start: 0%</span>
                          <span>Target: 100%</span>
                        </div>
                      </div>

                      <SegmentedProgress
                        segments={[
                          {
                            key: "completed",
                            label: "Completed",
                            value: selectedTask.status === "SUBMITTED" ? 1 : 0,
                            color: "#34d399",
                          },
                          {
                            key: "active",
                            label: "Active",
                            value: selectedTask.status === "IN_PROGRESS" ? 1 : 0,
                            color: "#38bdf8",
                          },
                          {
                            key: "remaining",
                            label: "Remaining",
                            value: selectedTask.status === "NOT_STARTED" || selectedTask.status === "RETURNED" ? 1 : 0,
                            color: "#e2e8f0",
                          },
                        ]}
                        className="space-y-1"
                      />

                      <div className="space-y-1 rounded-[var(--radius-md)] border border-slate-200 bg-white p-3 text-xs">
                        <p>
                          <span className="font-semibold text-slate-900">Due:</span>{" "}
                          {formatDate(selectedTask.cycleEndDate)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Cycle status:</span>{" "}
                          {selectedTask.cycleStatus}
                        </p>
                      </div>

                      <Link href={`/performance/reviews/${selectedTask.cycleId}/write/${selectedTask.id}`}>
                        <Button size="sm" className="w-full" data-testid="reviews-drawer-open-review">
                          Open Review
                        </Button>
                      </Link>
                    </div>
                  ),
                },
                {
                  id: "timeline",
                  label: "Timeline",
                  content: (
                    <ol className="space-y-2 text-sm text-slate-700">
                      {buildTaskTimeline(selectedTask).map((entry) => (
                        <li
                          key={`${entry.label}-${entry.time}`}
                          className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <p className="font-medium text-slate-900">{entry.label}</p>
                          <p className="text-xs text-slate-600">{entry.time}</p>
                        </li>
                      ))}
                    </ol>
                  ),
                },
                {
                  id: "audit",
                  label: "Audit",
                  content: (
                    <div className="space-y-2 text-sm text-slate-700">
                      <div className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="font-medium text-slate-900">Current state</p>
                        <p className="text-xs text-slate-600">
                          {statusLabel[selectedTask.status]} for {selectedTask.subjectName}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="font-medium text-slate-900">Visibility</p>
                        <p className="text-xs text-slate-600">
                          You can update only your assigned submission for this task.
                        </p>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <Card data-testid="reviews-task-drawer-empty" className="border-violet-100 bg-white/90">
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg">Task details panel</CardTitle>
                <CardDescription>
                  Pick a task row from the list to open the drawer with objective progress and timeline.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function getSingleValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseReviewTaskFilters(params: SearchParamsShape): ReviewTaskFilters {
  const taskId = getSingleValue(params.taskId);
  const rawQuery = getSingleValue(params.q);
  const query = rawQuery?.trim() ? rawQuery.trim() : null;
  const statusValue = getSingleValue(params.status);
  const relationshipValue = getSingleValue(params.relationship);

  const status =
    statusValue && statusFilterOptions.includes(statusValue as StatusFilter)
      ? (statusValue as StatusFilter)
      : null;
  const relationship =
    relationshipValue && relationshipFilterOptions.includes(relationshipValue as RelationshipFilter)
      ? (relationshipValue as RelationshipFilter)
      : null;

  return {
    taskId,
    query,
    status,
    relationship,
  };
}

function matchesTaskFilters(task: ReviewTaskListItem, filters: ReviewTaskFilters): boolean {
  if (filters.status && task.status !== filters.status) {
    return false;
  }

  if (filters.relationship && task.relationship !== filters.relationship) {
    return false;
  }

  if (filters.query) {
    const normalizedQuery = filters.query.toLowerCase();
    const haystack = `${task.subjectName} ${task.cycleName}`.toLowerCase();
    if (!haystack.includes(normalizedQuery)) {
      return false;
    }
  }

  return true;
}

function summarizeTaskStatuses(tasks: ReviewTaskListItem[]): {
  inProgress: number;
  submitted: number;
  returned: number;
} {
  return tasks.reduce(
    (summary, task) => {
      if (task.status === "IN_PROGRESS") {
        summary.inProgress += 1;
      } else if (task.status === "SUBMITTED") {
        summary.submitted += 1;
      } else if (task.status === "RETURNED") {
        summary.returned += 1;
      }

      return summary;
    },
    { inProgress: 0, submitted: 0, returned: 0 },
  );
}

function buildFilterChips(filters: ReviewTaskFilters): Array<{
  key: string;
  label: string;
  clearHref: string;
}> {
  const chips: Array<{ key: string; label: string; clearHref: string }> = [];

  if (filters.status) {
    chips.push({
      key: "status",
      label: `Status: ${statusLabel[filters.status]}`,
      clearHref: toReviewsHref({
        taskId: filters.taskId,
        query: filters.query,
        relationship: filters.relationship,
      }),
    });
  }

  if (filters.relationship) {
    chips.push({
      key: "relationship",
      label: `Relationship: ${relationshipLabel[filters.relationship]}`,
      clearHref: toReviewsHref({
        taskId: filters.taskId,
        query: filters.query,
        status: filters.status,
      }),
    });
  }

  if (filters.query) {
    chips.push({
      key: "query",
      label: `Search: ${filters.query}`,
      clearHref: toReviewsHref({
        taskId: filters.taskId,
        status: filters.status,
        relationship: filters.relationship,
      }),
    });
  }

  return chips;
}

function toReviewsHref(filters: {
  taskId?: string | null;
  status?: StatusFilter | null;
  relationship?: RelationshipFilter | null;
  query?: string | null;
}): string {
  const searchParams = new URLSearchParams();
  if (filters.taskId) {
    searchParams.set("taskId", filters.taskId);
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  if (filters.relationship) {
    searchParams.set("relationship", filters.relationship);
  }

  if (filters.query) {
    searchParams.set("q", filters.query);
  }

  const serialized = searchParams.toString();
  return serialized ? `/performance/reviews?${serialized}` : "/performance/reviews";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function getTaskPriority(cycleEndDate: string): "P1" | "P2" | "P3" {
  const dueInMs = new Date(cycleEndDate).getTime() - Date.now();
  const day = 24 * 60 * 60 * 1000;

  if (dueInMs <= day * 5) {
    return "P1";
  }

  if (dueInMs <= day * 14) {
    return "P2";
  }

  return "P3";
}

function priorityClassName(priority: "P1" | "P2" | "P3"): string {
  if (priority === "P1") {
    return "inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700";
  }

  if (priority === "P2") {
    return "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700";
  }

  return "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700";
}

function buildTaskTimeline(task: ReviewTaskListItem): Array<{ label: string; time: string }> {
  const entries: Array<{ label: string; time: string }> = [
    {
      label: "Task assigned",
      time: `Cycle due ${formatDate(task.cycleEndDate)}`,
    },
  ];

  if (task.submittedAt) {
    entries.unshift({
      label: "Submitted",
      time: formatDate(task.submittedAt),
    });
  }

  if (task.status === "IN_PROGRESS") {
    entries.unshift({
      label: "Draft in progress",
      time: "Continue writing and submit before due date.",
    });
  }

  if (task.status === "RETURNED") {
    entries.unshift({
      label: "Returned for edits",
      time: "Review feedback and resubmit.",
    });
  }

  return entries;
}
