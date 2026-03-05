import Link from "next/link";

import { ReviewSubmissionStatus, UserRole } from "@prisma/client";

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
  const snapshotRows = getSnapshotRows({
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
              Tasks
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

          <aside className="rounded-[var(--radius-lg)] border border-slate-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.11em] text-slate-600">
              Org chart
            </h3>

            <div className="mt-3 space-y-2.5">
              {snapshotRows.map((row) => (
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

function getHomeTaskRows(
  tasks: ReviewTaskListItem[],
  links: GettingStartedLink[],
): HomeTaskRow[] {
  if (tasks.length > 0) {
    return tasks.slice(0, 4).map((task) => ({
      href: `/performance/reviews/${task.cycleId}/write/${task.id}`,
      label: task.subjectName,
      detail: `${task.cycleName} · ${formatSubmissionStatus(task.status)} · due ${formatShortDate(task.cycleEndDate)}`,
    }));
  }

  return links.slice(0, 4).map((link) => ({
    href: link.href,
    label: link.label,
    detail: "Open workspace",
  }));
}

function getSnapshotRows(input: {
  role: UserRole;
  managerSnapshot: Awaited<ReturnType<typeof getManagerHomeSnapshot>> | null;
  hrSnapshot: Awaited<ReturnType<typeof getHrHomeSnapshot>> | null;
  dueSoonReviewCount: number;
  draftTask: ReviewTaskListItem | undefined;
  tasks: ReviewTaskListItem[];
}): SnapshotRow[] {
  const submittedCount = input.tasks.filter(
    (task) => task.status === ReviewSubmissionStatus.SUBMITTED,
  ).length;

  switch (input.role) {
    case UserRole.MANAGER:
      return [
        {
          label: "My team",
          value: `${input.managerSnapshot?.directReportCount ?? 0} reports`,
        },
        {
          label: "Pending reviews",
          value: `${input.managerSnapshot?.reviewsToComplete ?? 0}`,
        },
        {
          label: "Submitted",
          value: `${input.managerSnapshot?.submittedManagerReviews ?? 0}`,
        },
      ];
    case UserRole.HR_ADMIN:
      return [
        {
          label: "Active cycles",
          value: `${input.hrSnapshot?.activeCycleCount ?? 0}`,
        },
        {
          label: "Draft cycles",
          value: `${input.hrSnapshot?.draftCycleCount ?? 0}`,
        },
        {
          label: "Open submissions",
          value: `${input.hrSnapshot?.openSubmissionCount ?? 0}`,
        },
      ];
    case UserRole.CALIBRATOR:
      return [
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
      ];
    default:
      return [
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
      ];
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
