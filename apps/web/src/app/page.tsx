import Link from "next/link";

import { ReviewSubmissionStatus, UserRole } from "@prisma/client";

import {
  getGettingStartedContent,
  type GettingStartedIcon,
} from "@/components/home/getting-started";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { AvatarsStack } from "@/components/ui/avatars-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { StatusChip, getReviewStatusTone } from "@/components/ui/status-chip";
import { withReturnTo } from "@/lib/navigation/return-to";
import {
  getReviewRelationshipLabel,
  isVanillaReviewRelationship,
} from "@/lib/reviews/review-copy";
import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";
import {
  getHomeViewerOverview,
  getHrHomeSnapshot,
  getManagerHomeSnapshot,
  type HomeViewerOverview,
} from "@/server/home/home-dashboard-service";
import {
  listAssignedReviewTasks,
  type ReviewTaskListItem,
} from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

interface HomeTaskRow {
  href: string | null;
  eyebrow?: string | null;
  label: string;
  subtitle: string;
  meta: string[];
  visual:
    | {
        type: "avatar";
        name: string;
        imageUrl?: string | null;
      }
    | {
        type: "icon";
        icon: GettingStartedIcon | "complete";
      };
  statusLabel: string | null;
  statusTone: ReturnType<typeof getReviewStatusTone> | null;
}

interface HomeTaskSectionContent {
  layout: "default" | "caughtUp";
  title: string;
  description?: string;
  badgeLabel?: string;
  rows: HomeTaskRow[];
  disclosureLabel?: string;
  disclosureRows?: HomeDisclosureRow[];
}

interface HomeDisclosureRow {
  id: string;
  href: string | null;
  label: string;
  subtitle: string;
  meta: string;
}

interface SnapshotRow {
  label: string;
  value: string;
}

interface HomeSummaryContent {
  title: string;
  rows: SnapshotRow[];
}

interface HomePeoplePanel {
  title: string;
  description?: string;
  manager: {
    name: string;
    avatarUrl: string | null;
    title: string | null;
  } | null;
  peers: Array<{
    id: string;
    label: string;
    avatarUrl?: string | null;
    title: string | null;
  }>;
  directReports: Array<{
    id: string;
    label: string;
    avatarUrl?: string | null;
    title: string | null;
    childReports: Array<{
      id: string;
      label: string;
      avatarUrl?: string | null;
      title: string | null;
    }>;
  }>;
}

const actionableHomeTaskStatuses = new Set<ReviewSubmissionStatus>([
  ReviewSubmissionStatus.NOT_STARTED,
  ReviewSubmissionStatus.IN_PROGRESS,
  ReviewSubmissionStatus.RETURNED,
]);

export default async function HomePage() {
  const context = await getDevRequestContext();
  const gettingStarted = getGettingStartedContent(context.role);
  const tasks = (await listAssignedReviewTasks(context)).filter((task) =>
    isVanillaReviewRelationship(task.relationship),
  );
  const viewerOverview = await getHomeViewerOverview(context);
  const managerSnapshot = await getManagerHomeSnapshot(context);
  const hrSnapshot = hasHrAdminAccess(context.role) ? await getHrHomeSnapshot(context) : null;

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

  const secondaryTab = getSecondaryTab(context.role, managerSnapshot, hrSnapshot);
  const taskSection = getHomeTaskSectionContent({
    role: context.role,
    tasks,
    gettingStarted,
  });
  const summaryContent = getHomeSummaryContent({
    role: context.role,
    managerSnapshot,
    hrSnapshot,
    dueSoonReviewCount,
    draftTask,
    tasks,
  });
  const peoplePanel = getHomePeoplePanel({
    viewerOverview,
  });
  const hasPeoplePanel =
    peoplePanel.manager != null ||
    peoplePanel.peers.length > 0 ||
    peoplePanel.directReports.length > 0;

  return (
    <WorkspacePage width="wide">
      <PageHeader
        title={`Hi, ${viewerOverview?.firstName ?? getGreetingFallback(context.role)}!`}
        description={getViewerSummaryLine(viewerOverview, context.role)}
        metadata={
          <div className="flex flex-wrap items-center gap-2">
            {context.role !== UserRole.EMPLOYEE ? (
              <Badge
                variant="neutral"
                className="border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-3 py-1.5 text-[var(--color-text-primary)]"
              >
                {formatRoleLabel(context.role)}
              </Badge>
            ) : null}
            {viewerOverview?.manager ? (
              <span>
                Manager: <strong>{viewerOverview.manager.name}</strong>
              </span>
            ) : null}
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href={secondaryTab.href}>
              <Button variant="outline">{secondaryTab.label}</Button>
            </Link>
          </div>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="space-y-6">
          <HomeTaskSectionCard taskSection={taskSection} />
          {hasPeoplePanel ? <HomePeoplePanelCard peoplePanel={peoplePanel} /> : null}
        </div>
        <HomeSummaryPanel summaryContent={summaryContent} />
      </div>
    </WorkspacePage>
  );
}

function getSecondaryTab(
  role: UserRole,
  managerSnapshot: Awaited<ReturnType<typeof getManagerHomeSnapshot>> | null,
  hrSnapshot: Awaited<ReturnType<typeof getHrHomeSnapshot>> | null,
): { label: string; href: string } {
  const hasDirectReports = (managerSnapshot?.directReportCount ?? 0) > 0;

  switch (role) {
    case UserRole.MANAGER:
      return {
        label: "My team",
        href: "/performance/team-reviews",
      };
    case UserRole.HR_ADMIN:
      if (hasDirectReports) {
        return {
          label: "My team",
          href: "/performance/team-reviews",
        };
      }
      return {
        label: "Reporting",
        href: "/admin/performance/reporting",
      };
    case UserRole.SUPER_ADMIN:
      if (hasDirectReports) {
        return {
          label: "My team",
          href: "/performance/team-reviews",
        };
      }
      if ((hrSnapshot?.activeCycleCount ?? 0) > 0 || (hrSnapshot?.draftCycleCount ?? 0) > 0) {
        return {
          label: "Reporting",
          href: "/admin/performance/reporting",
        };
      }
      return {
        label: "Calibration",
        href: "/performance/calibration",
      };
    default:
      return {
        label: "My tasks",
        href: "/performance/reviews",
      };
  }
}

function getHomeTaskSectionContent(input: {
  role: UserRole;
  tasks: ReviewTaskListItem[];
  gettingStarted: ReturnType<typeof getGettingStartedContent>;
}): HomeTaskSectionContent {
  const actionableTasks = input.tasks
    .filter((task) => actionableHomeTaskStatuses.has(task.status))
    .sort((left, right) => compareHomeTasks(left, right));

  if (actionableTasks.length > 0) {
    const rows: HomeTaskRow[] = actionableTasks.slice(0, 3).map((task) => ({
      href: withReturnTo(`/performance/reviews/${task.cycleId}/write/${task.id}`, "/"),
      eyebrow: null,
      label: task.subjectName,
      subtitle: getReviewRelationshipLabel(task.relationship, "full"),
      meta: [task.cycleName, `Due ${formatShortDate(task.cycleEndDate)}`],
      visual: {
        type: "avatar",
        name: task.subjectName,
        imageUrl: task.subjectAvatarUrl,
      },
      statusLabel: formatSubmissionStatus(task.status),
      statusTone: getReviewStatusTone(task.status),
    }));

    return {
      layout: "default",
      title: getHomeTaskSectionTitle(input.role),
      badgeLabel: `${rows.length} in focus`,
      rows,
    };
  }

  const submittedCount = input.tasks.filter(
    (task) => task.status === ReviewSubmissionStatus.SUBMITTED,
  ).length;

  if (submittedCount > 0) {
    const disclosureRows: HomeDisclosureRow[] = input.tasks
      .filter((task) => task.status === ReviewSubmissionStatus.SUBMITTED)
      .slice(0, 3)
      .map((task) => ({
        id: task.id,
        href: withReturnTo(`/performance/reviews?taskId=${task.id}`, "/"),
        label: task.subjectName,
        subtitle: task.cycleName,
        meta: task.submittedAt ? `Submitted ${formatShortDate(task.submittedAt)}` : "Submitted",
      }));

    return {
      layout: "caughtUp",
      title: "You're caught up",
      disclosureLabel: `View ${submittedCount} submitted ${submittedCount === 1 ? "task" : "tasks"}`,
      disclosureRows,
      rows: [
        {
          href: null,
          label: "No reviews need attention",
          subtitle: "There are no drafts or returned items waiting on you right now.",
          meta: [],
          visual: {
            type: "icon",
            icon: "complete",
          },
          statusLabel: null,
          statusTone: null,
        },
      ],
    };
  }

  const rows: HomeTaskRow[] = input.gettingStarted.links.slice(0, 2).map((link) => ({
    href: link.href,
    eyebrow: link.metaLabel,
    label: link.label,
    subtitle: link.description,
    meta: [input.gettingStarted.title],
    visual: {
      type: "icon",
      icon: link.icon,
    },
    statusLabel: null,
    statusTone: null,
  }));

  return {
    layout: "default",
    title: "Start here",
    description: input.gettingStarted.description,
    badgeLabel: `${rows.length} suggested`,
    rows,
  };
}

function getHomeTaskSectionTitle(role: UserRole): string {
  switch (role) {
    case UserRole.EMPLOYEE:
    case UserRole.MANAGER:
    case UserRole.HR_ADMIN:
    case UserRole.SUPER_ADMIN:
      return "Review tasks";
  }
}

function getHomeSummaryContent(input: {
  role: UserRole;
  managerSnapshot: Awaited<ReturnType<typeof getManagerHomeSnapshot>> | null;
  hrSnapshot: Awaited<ReturnType<typeof getHrHomeSnapshot>> | null;
  dueSoonReviewCount: number;
  draftTask: ReviewTaskListItem | undefined;
  tasks: ReviewTaskListItem[];
}): HomeSummaryContent {
  const latestCycleName = input.tasks[0]?.cycleName ?? null;

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
      if ((input.managerSnapshot?.directReportCount ?? 0) > 0) {
        return {
          title: "HR and team snapshot",
          rows: [
            {
              label: "Direct reports",
              value: `${input.managerSnapshot?.directReportCount ?? 0}`,
            },
            {
              label: "Live cycles",
              value: `${input.hrSnapshot?.activeCycleCount ?? 0}`,
            },
            {
              label: "Open submissions",
              value: `${input.hrSnapshot?.openSubmissionCount ?? 0}`,
            },
          ],
        };
      }
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
    case UserRole.SUPER_ADMIN:
      return {
        title: "Executive snapshot",
        rows: [
          {
            label: "Direct reports",
            value: `${input.managerSnapshot?.directReportCount ?? 0}`,
          },
          {
            label: "Open submissions",
            value: `${input.hrSnapshot?.openSubmissionCount ?? 0}`,
          },
          {
            label: "Live cycles",
            value: `${input.hrSnapshot?.activeCycleCount ?? 0}`,
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
            label: "Current cycle",
            value: latestCycleName ?? "None",
          },
        ],
      };
  }
}

function getHomePeoplePanel(input: {
  viewerOverview: HomeViewerOverview | null;
}): HomePeoplePanel {
  return {
    title: "People context",
    description: input.viewerOverview?.manager
      ? "Use the reporting chain for fast context: your manager, peers, and direct reports."
      : "Use the reporting chain for fast context: your direct reports and their reports.",
    manager: input.viewerOverview?.manager
      ? {
          name: input.viewerOverview.manager.name,
          avatarUrl: input.viewerOverview.manager.avatarUrl,
          title: input.viewerOverview.manager.title,
        }
      : null,
    peers:
      input.viewerOverview?.peers.map((person) => ({
        id: person.id,
        label: person.name,
        avatarUrl: person.avatarUrl,
        title: person.title,
      })) ?? [],
    directReports:
      input.viewerOverview?.directReports.map((person) => ({
        id: person.id,
        label: person.name,
        avatarUrl: person.avatarUrl,
        title: person.title,
        childReports: person.childReports.map((child) => ({
          id: child.id,
          label: child.name,
          avatarUrl: child.avatarUrl,
          title: child.title,
        })),
      })) ?? [],
  };
}

function getViewerSummaryLine(
  viewerOverview: HomeViewerOverview | null,
  role: UserRole,
): string {
  if (!viewerOverview) {
    return `${formatRoleLabel(role)} workspace`;
  }

  const details = [viewerOverview.title, viewerOverview.department].filter(Boolean);

  return details.length > 0
    ? details.join(" • ")
    : `${formatRoleLabel(role)} workspace`;
}

function getGreetingFallback(role: UserRole): string {
  switch (role) {
    case UserRole.HR_ADMIN:
      return "Harper";
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.SUPER_ADMIN:
      return "there";
    default:
      return "there";
  }
}

function formatRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.HR_ADMIN:
      return "HR Admin";
    case UserRole.SUPER_ADMIN:
      return "Super Admin";
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.EMPLOYEE:
    default:
      return "Employee";
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

function HomeTaskRowCard({
  index,
  task,
}: {
  index: number;
  task: HomeTaskRow;
}) {
  const body = (
    <>
      {task.visual.type === "avatar" ? (
        <ProfileAvatar name={task.visual.name} imageUrl={task.visual.imageUrl} size="md" />
      ) : (
        <HomeTaskIcon icon={task.visual.icon} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {task.eyebrow ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-neutral-500)]">
              {task.eyebrow}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{task.label}</p>
          {task.statusLabel ? (
            <StatusChip tone={task.statusTone ?? "neutral"}>{task.statusLabel}</StatusChip>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]">{task.subtitle}</p>
        {task.meta.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.meta.map((metaItem) => (
              <span
                key={`${task.label}-${metaItem}`}
                className="inline-flex items-center rounded-full bg-[var(--color-shell-surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-neutral-500)]"
              >
                {metaItem}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );

  if (task.href == null) {
    return (
      <div className="flex items-center gap-3 rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3">
        {body}
      </div>
    );
  }

  return (
    <Link
      href={task.href}
      data-testid={`home-getting-started-link-${index}`}
      className="group flex items-center gap-3 rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] px-4 py-3 transition-[transform,background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-focus-border)] hover:bg-[var(--color-shell-surface-muted)] hover:shadow-[var(--shadow-sm)]"
    >
      {body}
      <span
        className="text-lg text-[var(--color-neutral-500)] transition-colors group-hover:text-[var(--brand-primary)]"
        aria-hidden="true"
      >
        ›
      </span>
    </Link>
  );
}

function HomeTaskSectionCard({
  taskSection,
}: {
  taskSection: HomeTaskSectionContent;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">
            {taskSection.title}
          </h3>
          {taskSection.description ? (
            <p className="mt-1 text-sm text-[var(--color-neutral-500)]">{taskSection.description}</p>
          ) : null}
        </div>
        {taskSection.badgeLabel ? (
          <span className="inline-flex items-center rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]">
            {taskSection.badgeLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {taskSection.rows.map((task, index) => (
          <HomeTaskRowCard key={`${task.label}-${index}`} index={index} task={task} />
        ))}
      </div>

      {taskSection.disclosureRows?.length ? (
        <details
          data-testid="home-task-disclosure"
          className="mt-4 overflow-hidden rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)]"
        >
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--color-text-muted)]">
            {taskSection.disclosureLabel}
          </summary>
          <div className="space-y-2 border-t border-[var(--color-shell-divider)] px-4 py-3">
            {taskSection.disclosureRows.map((row) => (
              <HomeDisclosureRowItem key={row.id} row={row} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function HomeSummaryPanel({
  summaryContent,
}: {
  summaryContent: HomeSummaryContent;
}) {
  return (
    <section
      data-testid="home-summary-panel"
      className="rounded-[24px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] p-4 shadow-[var(--shadow-xs)] sm:p-5"
    >
      <div className="flex items-center gap-3">
        <h3
          data-testid="home-summary-title"
          className="text-sm font-semibold uppercase tracking-[0.11em] text-[var(--color-text-muted)]"
        >
          {summaryContent.title}
        </h3>
      </div>

      <div className="mt-4 grid gap-3">
        {summaryContent.rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-neutral-500)]">
              {row.label}
            </span>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HomePeoplePanelCard({
  peoplePanel,
}: {
  peoplePanel: HomePeoplePanel;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] p-4 shadow-[var(--shadow-xs)] sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-[0.11em] text-[var(--color-text-muted)]">
        {peoplePanel.title}
      </h3>
      {peoplePanel.description ? (
        <p className="mt-1 text-sm leading-6 text-[var(--color-neutral-500)]">{peoplePanel.description}</p>
      ) : null}

      {peoplePanel.manager ? (
        <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] px-4 py-3">
          <ProfileAvatar
            name={peoplePanel.manager.name}
            imageUrl={peoplePanel.manager.avatarUrl}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-neutral-500)]">
              Manager
            </p>
            <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{peoplePanel.manager.name}</p>
            <p className="truncate text-xs text-[var(--color-neutral-500)]">
              {peoplePanel.manager.title ?? "Role not set"}
            </p>
          </div>
        </div>
      ) : null}

      {peoplePanel.peers.length > 0 || peoplePanel.directReports.length > 0 ? (
        <HomeTeamDisclosure
          peers={peoplePanel.peers}
          directReports={peoplePanel.directReports}
        />
      ) : null}
    </section>
  );
}

function HomeTeamDisclosure({
  peers,
  directReports,
}: {
  peers: HomePeoplePanel["peers"];
  directReports: HomePeoplePanel["directReports"];
}) {
  return (
    <details
      data-testid="home-team-disclosure"
      className="mt-4 overflow-hidden rounded-[18px] border border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)]"
    >
      <summary className="cursor-pointer px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-neutral-500)]">
              Reports
            </p>
            <div className="mt-2 flex flex-wrap items-stretch gap-3">
              {peers.length > 0 ? (
                <div className="min-w-[120px] rounded-[14px] bg-[var(--color-surface-default)] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-neutral-500)]">
                      Peers
                    </p>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-shell-surface-muted)] px-1.5 text-[10px] font-semibold text-[var(--color-neutral-500)]">
                      {peers.length}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <AvatarsStack items={peers} maxVisible={3} />
                  </div>
                </div>
              ) : null}

              {peers.length > 0 && directReports.length > 0 ? (
                <div className="hidden w-px self-stretch bg-[var(--color-shell-divider)] sm:block" />
              ) : null}

              {directReports.length > 0 ? (
                <div className="min-w-[140px] rounded-[14px] bg-[var(--color-surface-default)] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-neutral-500)]">
                      Direct reports
                    </p>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-shell-surface-muted)] px-1.5 text-[10px] font-semibold text-[var(--color-neutral-500)]">
                      {directReports.length}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <AvatarsStack items={directReports} maxVisible={3} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="pt-1 text-[var(--color-neutral-500)]" aria-hidden="true">
            <span className="text-sm">▸</span>
          </div>
        </div>
      </summary>

      <div className="space-y-4 border-t border-[var(--color-shell-divider)] px-4 py-3">
        {peers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-neutral-500)]">
              Peers
            </p>
            {peers.map((person) => (
              <HomePeopleListItem key={person.id} person={person} />
            ))}
          </div>
        ) : null}

        {directReports.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-neutral-500)]">
              Direct reports
            </p>
            {directReports.map((person) => (
              <HomePeopleListItem key={person.id} person={person} />
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

function HomePeopleListItem({
  person,
}: {
  person: HomePeoplePanel["peers"][number] | HomePeoplePanel["directReports"][number];
}) {
  return (
    <div className="rounded-[16px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] px-3 py-3">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <ProfileAvatar name={person.label} imageUrl={person.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[var(--color-text-primary)]">{person.label}</p>
          <p className="truncate text-xs text-[var(--color-neutral-500)]">{person.title ?? "Role not set"}</p>
        </div>
      </div>

      {"childReports" in person && person.childReports.length > 0 ? (
        <div className="mt-3 rounded-[14px] border border-[var(--color-shell-divider)] bg-[var(--color-shell-surface-muted)] px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-neutral-500)]">
              Reports
            </p>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-surface-default)] px-1.5 text-[10px] font-semibold text-[var(--color-neutral-500)]">
              {person.childReports.length}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {person.childReports.map((child) => (
              <div key={child.id} className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <ProfileAvatar name={child.label} imageUrl={child.avatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-text-primary)]">{child.label}</p>
                  <p className="truncate text-xs text-[var(--color-neutral-500)]">{child.title ?? "Role not set"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HomeDisclosureRowItem({
  row,
}: {
  row: HomeDisclosureRow;
}) {
  const body = (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{row.label}</p>
      <p className="truncate text-xs text-[var(--color-neutral-500)]">{row.subtitle}</p>
      <p className="mt-1 text-[11px] font-medium text-[var(--color-neutral-500)]">{row.meta}</p>
    </div>
  );

  if (row.href == null) {
    return <div className="rounded-[16px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] px-3 py-2">{body}</div>;
  }

  return (
    <Link
      href={row.href}
      className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--color-shell-border)] bg-[var(--color-surface-default)] px-3 py-2 transition hover:border-[var(--color-focus-border)] hover:bg-[var(--color-shell-surface-muted)]"
    >
      {body}
      <span className="text-base text-[var(--color-neutral-500)]" aria-hidden="true">
        ›
      </span>
    </Link>
  );
}

function HomeTaskIcon({
  icon,
}: {
  icon: GettingStartedIcon | "complete";
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm shadow-[var(--shadow-xs)] ${getHomeTaskIconPalette(icon)}`}
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        {renderHomeTaskIconPath(icon)}
      </svg>
    </span>
  );
}

function getHomeTaskIconPalette(icon: GettingStartedIcon | "complete"): string {
  switch (icon) {
    case "queue":
      return "border-[color-mix(in_srgb,var(--brand-primary)_18%,white)] bg-[var(--color-shell-soft-accent)] text-[var(--brand-primary)]";
    case "selfReview":
      return "border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-surface)] text-[var(--color-status-warning)]";
    case "growth":
      return "border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] text-[var(--color-text-primary)]";
    case "help":
      return "border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] text-[var(--color-text-primary)]";
    case "team":
      return "border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] text-[var(--color-text-primary)]";
    case "calibration":
      return "border-[color-mix(in_srgb,var(--brand-primary)_18%,white)] bg-[var(--color-shell-soft-accent)] text-[var(--brand-primary)]";
    case "improvementPlans":
      return "border-[var(--color-status-success-border)] bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]";
    case "reviewCycles":
      return "border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] text-[var(--color-text-primary)]";
    case "complete":
      return "border-[var(--color-status-success-border)] bg-[var(--color-status-success-surface)] text-[var(--color-status-success)]";
    default:
      return "border-[var(--color-shell-border)] bg-[var(--color-shell-surface-muted)] text-[var(--color-text-primary)]";
  }
}

function renderHomeTaskIconPath(icon: GettingStartedIcon | "complete") {
  switch (icon) {
    case "queue":
      return (
        <>
          <path d="M6 5.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 14.5H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="4.25" cy="5.5" r=".75" fill="currentColor" />
          <circle cx="4.25" cy="10" r=".75" fill="currentColor" />
          <circle cx="4.25" cy="14.5" r=".75" fill="currentColor" />
        </>
      );
    case "selfReview":
      return (
        <>
          <path
            d="M6.75 4.75H13.25C13.94 4.75 14.5 5.31 14.5 6V14C14.5 14.69 13.94 15.25 13.25 15.25H6.75C6.06 15.25 5.5 14.69 5.5 14V6C5.5 5.31 6.06 4.75 6.75 4.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M7.75 8H12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7.75 11H10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M8.25 4.75V3.75H11.75V4.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
    case "growth":
      return (
        <>
          <circle cx="10" cy="10" r="5.75" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6.5V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 3.5V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16.5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case "help":
      return (
        <>
          <circle cx="10" cy="10" r="5.75" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8.6 8.15C8.6 7.22 9.33 6.5 10.27 6.5C11.12 6.5 11.8 7.06 11.8 7.88C11.8 8.53 11.42 8.92 10.87 9.27C10.38 9.58 10 9.89 10 10.55"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="13.25" r=".75" fill="currentColor" />
        </>
      );
    case "team":
      return (
        <>
          <circle cx="7.25" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12.75" cy="8.75" r="1.75" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M4.75 14C4.75 12.76 5.95 11.75 7.5 11.75C9.05 11.75 10.25 12.76 10.25 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M11 14C11 13.1 11.84 12.35 12.95 12.35C14.06 12.35 14.9 13.1 14.9 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      );
    case "calibration":
      return (
        <>
          <path
            d="M5.25 5.25H9.25V9.25H5.25V5.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10.75 5.25H14.75V9.25H10.75V5.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M5.25 10.75H9.25V14.75H5.25V10.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10.75 10.75H14.75V14.75H10.75V10.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      );
    case "improvementPlans":
      return (
        <>
          <path
            d="M5.5 14.5H8.5L14.5 8.5L11.5 5.5L5.5 11.5V14.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10.5 6.5L13.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case "reviewCycles":
      return (
        <>
          <rect x="4.75" y="5.5" width="10.5" height="9.75" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 4.25V6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12.5 4.25V6.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M4.75 8.5H15.25" stroke="currentColor" strokeWidth="1.5" />
        </>
      );
    case "complete":
      return (
        <path
          d="M5.5 10.25L8.5 13.25L14.5 7.25"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}
