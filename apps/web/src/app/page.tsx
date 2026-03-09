import Link from "next/link";

import { ReviewRelationship, ReviewSubmissionStatus, UserRole } from "@prisma/client";

import {
  getGettingStartedContent,
  type GettingStartedLink,
} from "@/components/home/getting-started";
import { Badge } from "@/components/ui/badge";
import { getDevRequestContext } from "@/server/auth/request-context";
import {
  getHrHomeSnapshot,
  getManagerHomeSnapshot,
} from "@/server/home/home-dashboard-service";
import {
  listAssignedReviewTasks,
  type ReviewTaskListItem,
} from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

interface HomeTaskRow {
  href: string;
  label: string;
  detail: string;
}

interface SnapshotRow {
  label: string;
  value: string;
}

interface HomeSummaryContent {
  title: string;
  rows: SnapshotRow[];
}

const actionableHomeTaskStatuses = new Set<ReviewSubmissionStatus>([
  ReviewSubmissionStatus.NOT_STARTED,
  ReviewSubmissionStatus.IN_PROGRESS,
  ReviewSubmissionStatus.RETURNED,
]);

export default async function HomePage() {
  const context = await getDevRequestContext();
  const gettingStarted = getGettingStartedContent(context.role);
  const tasks = await listAssignedReviewTasks(context);
  const managerSnapshot =
    context.role === UserRole.MANAGER
      ? await getManagerHomeSnapshot(context)
      : null;
  const hrSnapshot =
    context.role === UserRole.HR_ADMIN ? await getHrHomeSnapshot(context) : null;

  const now = getCurrentTimeMs();
  const dueSoonCutoff = now + 14 * 24 * 60 * 60 * 1000;
  const dueSoonReviewCount = tasks.filter((task) => {
    if (task.status === ReviewSubmissionStatus.SUBMITTED) {
      return false;
    }

    const dueAt = new Date(task.cycleEndDate).getTime();
    return dueAt >= now && dueAt <= dueSoonCutoff;
  }).length;

  const draftTask =
    tasks.find((task) => task.status === ReviewSubmissionStatus.IN_PROGRESS) ??
    tasks.find((task) => task.status === ReviewSubmissionStatus.NOT_STARTED);

  const secondaryTab = getSecondaryTab(context.role);
  const taskRows = getHomeTaskRows(tasks, gettingStarted.links);
  const summaryContent = getHomeSummaryContent({
    role: context.role,
    managerSnapshot,
    hrSnapshot,
    dueSoonReviewCount,
    draftTask,
    tasks,
  });

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-slate-200 bg-white shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-800">
              {getRoleInitials(context.role)}
            </span>
            <div className="space-y-0.5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">
                Performance workflows by role
              </h2>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                Hi, {getGreetingName(context.role)}!
              </h1>
            </div>
          </div>

          <Badge variant="info">{formatRoleLabel(context.role)}</Badge>
        </div>

        <div className="border-b border-slate-200 px-5 sm:px-6">
          <div className="flex items-center gap-6">
            <span className="border-b-2 border-[var(--brand-primary)] py-3 text-sm font-semibold text-[var(--brand-primary)]">
              Home
            </span>
            <Link
              href={secondaryTab.href}
              className="py-3 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              {secondaryTab.label}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] sm:p-6">
          <section className="rounded-[var(--radius-lg)] border border-slate-200 bg-slate-50/55 p-4 sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-600">
              {getHomeTaskSectionTitle(context.role)}
            </h3>
            <div className="mt-3 space-y-2.5">
              {taskRows.map((task, index) => (
                <Link
                  key={`${task.href}-${index}`}
                  href={task.href}
                  data-testid={`home-getting-started-link-${index}`}
                  className="group flex items-center justify-between rounded-[var(--radius-md)] border border-slate-200 bg-white px-3 py-2.5 transition-[background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:border-slate-300 hover:bg-slate-50 hover:shadow-[var(--shadow-xs)]"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{task.label}</p>
                    <p className="text-xs text-slate-500">{task.detail}</p>
                  </div>
                  <span
                    className="text-slate-400 transition-colors group-hover:text-slate-700"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <aside
            data-testid="home-summary-panel"
            className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 sm:p-5"
          >
            <h3
              data-testid="home-summary-title"
              className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-600"
            >
              {summaryContent.title}
            </h3>

            <div className="mt-3 space-y-2.5">
              {summaryContent.rows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-600">{row.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">
                Primary action
              </p>
              <Link
                href={gettingStarted.links[0]?.href ?? "/performance/reviews"}
                className="mt-1 block text-sm font-medium text-[var(--brand-primary)] hover:text-[var(--brand-primary-strong)]"
              >
                {gettingStarted.links[0]?.label ?? "Open review tasks"}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function getRoleInitials(role: UserRole): string {
  switch (role) {
    case UserRole.HR_ADMIN:
      return "HR";
    case UserRole.MANAGER:
      return "MG";
    case UserRole.CALIBRATOR:
      return "CL";
    default:
      return "EM";
  }
}

function getGreetingName(role: UserRole): string {
  switch (role) {
    case UserRole.HR_ADMIN:
      return "HR";
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.CALIBRATOR:
      return "Calibrator";
    default:
      return "there";
  }
}

function formatRoleLabel(role: UserRole): string {
  return role.replaceAll("_", " ");
}

function getSecondaryTab(role: UserRole): { label: string; href: string } {
  switch (role) {
    case UserRole.MANAGER:
      return {
        label: "My team",
        href: "/performance/team-reviews",
      };
    case UserRole.HR_ADMIN:
      return {
        label: "Reporting",
        href: "/admin/performance/reporting",
      };
    case UserRole.CALIBRATOR:
      return {
        label: "Calibration",
        href: "/performance/calibration/calibration_session_seed_1",
      };
    default:
      return {
        label: "My tasks",
        href: "/performance/reviews",
      };
  }
}

function getHomeTaskSectionTitle(role: UserRole): string {
  switch (role) {
    case UserRole.EMPLOYEE:
    case UserRole.MANAGER:
      return "Review tasks";
    default:
      return "Tasks";
  }
}

function getHomeTaskRows(
  tasks: ReviewTaskListItem[],
  links: GettingStartedLink[],
): HomeTaskRow[] {
  const actionableTasks = tasks
    .filter((task) => actionableHomeTaskStatuses.has(task.status))
    .sort((left, right) => compareHomeTasks(left, right));

  if (actionableTasks.length > 0) {
    return actionableTasks.slice(0, 4).map((task) => ({
      href: `/performance/reviews/${task.cycleId}/write/${task.id}`,
      label: task.subjectName,
      detail: `${formatRelationshipLabel(task.relationship)} review · ${task.cycleName} · ${formatSubmissionStatus(task.status)} · due ${formatShortDate(task.cycleEndDate)}`,
    }));
  }

  return links.slice(0, 4).map((link) => ({
    href: link.href,
    label: link.label,
    detail: "Open workspace",
  }));
}

function getHomeSummaryContent(input: {
  role: UserRole;
  managerSnapshot: Awaited<ReturnType<typeof getManagerHomeSnapshot>> | null;
  hrSnapshot: Awaited<ReturnType<typeof getHrHomeSnapshot>> | null;
  dueSoonReviewCount: number;
  draftTask: ReviewTaskListItem | undefined;
  tasks: ReviewTaskListItem[];
}): HomeSummaryContent {
  const submittedCount = input.tasks.filter(
    (task) => task.status === ReviewSubmissionStatus.SUBMITTED,
  ).length;

  switch (input.role) {
    case UserRole.MANAGER:
      return {
        title: "My team",
        rows: [
          {
            label: "Direct reports",
            value: `${input.managerSnapshot?.directReportCount ?? 0}`,
          },
          {
            label: "Awaiting manager review",
            value: `${input.managerSnapshot?.awaitingManagerReviewCount ?? 0}`,
          },
          {
            label: "Self reviews not started",
            value: `${input.managerSnapshot?.selfReviewNotStartedCount ?? 0}`,
          },
        ],
      };
    case UserRole.HR_ADMIN:
      return {
        title: "Cycle overview",
        rows: [
          {
            label: "Live cycles",
            value: `${input.hrSnapshot?.activeCycleCount ?? 0}`,
          },
          {
            label: "Cycles in draft",
            value: `${input.hrSnapshot?.draftCycleCount ?? 0}`,
          },
          {
            label: "Open submissions",
            value: `${input.hrSnapshot?.openSubmissionCount ?? 0}`,
          },
        ],
      };
    case UserRole.CALIBRATOR:
      return {
        title: "Calibration snapshot",
        rows: [
          {
            label: "Assigned tasks",
            value: `${input.tasks.length}`,
          },
          {
            label: "Submitted",
            value: `${submittedCount}`,
          },
          {
            label: "Session",
            value: "Calibration 9-box",
          },
        ],
      };
    default:
      return {
        title: "At a glance",
        rows: [
          {
            label: "Due soon",
            value: `${input.dueSoonReviewCount}`,
          },
          {
            label: "Open draft",
            value: input.draftTask?.subjectName ?? "None",
          },
          {
            label: "Submitted",
            value: `${submittedCount}`,
          },
        ],
      };
  }
}

function formatRelationshipLabel(relationship: ReviewRelationship): string {
  switch (relationship) {
    case ReviewRelationship.SELF:
      return "Self";
    case ReviewRelationship.MANAGER:
      return "Manager";
    case ReviewRelationship.PEER:
      return "Peer";
    case ReviewRelationship.UPWARD:
      return "Upward";
    default:
      return relationship;
  }
}

function compareHomeTasks(left: ReviewTaskListItem, right: ReviewTaskListItem): number {
  const statusDifference =
    getHomeTaskPriority(left.status) - getHomeTaskPriority(right.status);
  if (statusDifference !== 0) {
    return statusDifference;
  }

  const dueDifference =
    new Date(left.cycleEndDate).getTime() - new Date(right.cycleEndDate).getTime();
  if (dueDifference !== 0) {
    return dueDifference;
  }

  return left.subjectName.localeCompare(right.subjectName);
}

function getHomeTaskPriority(status: ReviewSubmissionStatus): number {
  switch (status) {
    case ReviewSubmissionStatus.RETURNED:
      return 0;
    case ReviewSubmissionStatus.IN_PROGRESS:
      return 1;
    case ReviewSubmissionStatus.NOT_STARTED:
      return 2;
    default:
      return 3;
  }
}

function formatSubmissionStatus(status: ReviewSubmissionStatus): string {
  switch (status) {
    case ReviewSubmissionStatus.NOT_STARTED:
      return "Not started";
    case ReviewSubmissionStatus.IN_PROGRESS:
      return "In progress";
    case ReviewSubmissionStatus.SUBMITTED:
      return "Submitted";
    case ReviewSubmissionStatus.RETURNED:
      return "Returned";
    default:
      return status;
  }
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getCurrentTimeMs() {
  return Date.now();
}
