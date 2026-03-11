import Link from "next/link";
import type { ReviewRelationship, ReviewSubmissionStatus } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterChip } from "@/components/ui/filter-chip";
import { RightDrawer } from "@/components/ui/right-drawer";
import { Select } from "@/components/ui/select";
import { getReviewStatusTone, StatusChip } from "@/components/ui/status-chip";
import { withReturnTo } from "@/lib/navigation/return-to";
import {
  getReviewRelationshipAudienceLabel,
  getReviewRelationshipHelpText,
} from "@/lib/reviews/review-copy";
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

const statusLabel = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
} as const;

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
        description="Review the submissions assigned to you, filter the queue, and continue the next task that needs attention."
      />

      <FilterBar
        method="get"
        description="Search by subject or cycle, then narrow the queue by status or who you're reviewing."
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
          Who you&apos;re reviewing
          <Select
            name="relationship"
            defaultValue={filters.relationship ?? ""}
            data-testid="reviews-filter-relationship"
          >
            <option value="">All review types</option>
            {relationshipFilterOptions.map((relationship) => (
              <option key={relationship} value={relationship}>
                {getReviewRelationshipAudienceLabel(relationship)}
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
          description="Assigned submissions appear after HR generates cycle assignments. Use the help center for next steps and visibility rules."
          icon={<span aria-hidden="true">🗂</span>}
          nextSteps={[
            "Ask HR to generate assignments for an active cycle.",
            "Review cycle status and visibility expectations in the help center.",
          ]}
          action={
            <Link
              href="/help"
              className="text-sm font-medium text-slate-700 underline underline-offset-4 transition hover:text-slate-900"
            >
              Review help center
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
          <Card aria-label="My review tasks" className="overflow-hidden">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">My review tasks</CardTitle>
              <CardDescription>
                Assigned submissions stay in one queue. Open a row for task details or launch the review directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <TableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Who you&apos;re reviewing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => {
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
                          <TableCell className="font-semibold text-slate-900">
                            {task.cycleName}
                          </TableCell>
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
                              <span className="text-xs text-slate-500">Open details</span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-700">
                              {getReviewRelationshipAudienceLabel(task.relationship)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusChip tone={getReviewStatusTone(task.status)}>
                              {statusLabel[task.status]}
                            </StatusChip>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-700">
                              {formatDate(task.cycleEndDate)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={withReturnTo(
                                `/performance/reviews/${task.cycleId}/write/${task.id}`,
                                toReviewsHref({
                                  taskId: task.id,
                                  query: filters.query,
                                  status: filters.status,
                                  relationship: filters.relationship,
                                }),
                              )}
                            >
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
              title="Task details"
              subtitle={`${selectedTask.subjectName} · ${getReviewRelationshipAudienceLabel(selectedTask.relationship)}`}
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
                          Task summary
                        </p>
                        <p className="text-xl font-semibold leading-tight text-slate-900">
                          Review for {selectedTask.subjectName}
                        </p>
                        <p className="text-xs text-slate-600">
                          {getReviewRelationshipAudienceLabel(selectedTask.relationship)} · {selectedTask.cycleName}
                        </p>
                      </div>

                      <div className="space-y-2 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 p-3">
                        <TaskDrawerDetailRow
                          label="Who you're reviewing"
                          value={getReviewRelationshipAudienceLabel(selectedTask.relationship)}
                        />
                        <TaskDrawerDetailRow
                          label="Status"
                          value={statusLabel[selectedTask.status]}
                        />
                        <TaskDrawerDetailRow
                          label="Due"
                          value={formatDate(selectedTask.cycleEndDate)}
                        />
                        <TaskDrawerDetailRow
                          label="Cycle status"
                          value={selectedTask.cycleStatus}
                        />
                      </div>

                      <Link
                        href={withReturnTo(
                          `/performance/reviews/${selectedTask.cycleId}/write/${selectedTask.id}`,
                          toReviewsHref({
                            taskId: selectedTask.id,
                            query: filters.query,
                            status: filters.status,
                            relationship: filters.relationship,
                          }),
                        )}
                      >
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
                        <p className="font-medium text-slate-900">Review context</p>
                        <p className="text-xs text-slate-600">
                          {getReviewRelationshipHelpText(selectedTask.relationship)}
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
                <CardTitle className="text-lg">Task details</CardTitle>
                <CardDescription>
                  Select a task from the queue to review its status, due date, and next action.
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
      label: `Review type: ${getReviewRelationshipAudienceLabel(filters.relationship)}`,
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

function TaskDrawerDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-slate-200 bg-white px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}
