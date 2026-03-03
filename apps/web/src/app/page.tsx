import Link from "next/link";

import { ReviewSubmissionStatus, UserRole } from "@prisma/client";

import { getGettingStartedContent } from "@/components/home/getting-started";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { SectionContainer } from "@/components/ui/section-container";
import { appEnv } from "@/config/env";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getHrHomeSnapshot, getManagerHomeSnapshot } from "@/server/home/home-dashboard-service";
import { listAssignedReviewTasks } from "@/server/reviews/participant-review-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const context = await getDevRequestContext();
  const gettingStarted = getGettingStartedContent(context.role);
  const tasks = await listAssignedReviewTasks(context);
  const managerSnapshot =
    context.role === UserRole.MANAGER ? await getManagerHomeSnapshot(context) : null;
  const hrSnapshot = context.role === UserRole.HR_ADMIN ? await getHrHomeSnapshot(context) : null;
  const workflowModules = getRoleWorkflowModules(context.role);
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Performance Workspace"
        title="Performance workflows by role"
        description="Track reviews, calibration decisions, and coaching plans from one role-aware workspace."
        metadata={
          <span>
            Signed in as <code>{context.role}</code> (<code>{context.userId}</code>)
          </span>
        }
      />

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{gettingStarted.title}</CardTitle>
            <Badge variant="info">{context.role}</Badge>
          </div>
          <CardDescription>{gettingStarted.description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-2">
          {gettingStarted.links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              data-testid={`home-getting-started-link-${index}`}
            >
              <Button variant="outline" size="sm">
                {link.label}
              </Button>
            </Link>
          ))}
        </CardFooter>
      </Card>

      {context.role === UserRole.EMPLOYEE ? (
        <section className="space-y-4">
          <SectionHeader
            title="My review focus"
            description="Stay on top of due tasks and continue your latest review draft."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-teal-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="brand" aria-label="Review tasks icon">
                    RT
                  </IconBadge>
                  <CardTitle className="text-base">My tasks due soon</CardTitle>
                </div>
                <CardDescription>
                  Assigned submissions due in the next 14 days.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">{dueSoonReviewCount}</p>
                <Link href="/performance/reviews">
                  <Button size="sm" variant="outline">
                    Open tasks
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-amber-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="warm" aria-label="Continue review draft icon">
                    CD
                  </IconBadge>
                  <CardTitle className="text-base">Continue draft</CardTitle>
                </div>
                <CardDescription>
                  Jump back into your current submission draft.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">
                  {draftTask ? draftTask.subjectName : "No open drafts yet"}
                </p>
                {draftTask ? (
                  <Link href={`/performance/reviews/${draftTask.cycleId}/write/${draftTask.id}`}>
                    <Button size="sm">Continue</Button>
                  </Link>
                ) : (
                  <Link href="/performance/reviews">
                    <Button size="sm" variant="outline">
                      View tasks
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          </div>
        </section>
      ) : null}

      {context.role === UserRole.MANAGER && managerSnapshot ? (
        <section className="space-y-4">
          <SectionHeader
            title="Team status snapshot"
            description="Track direct-report review progress and outstanding manager submissions."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-teal-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="brand" aria-label="Direct reports icon">
                    DR
                  </IconBadge>
                  <CardTitle className="text-base">Direct reports</CardTitle>
                </div>
                <CardDescription>
                  Team members currently mapped to your reporting line.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">
                  {managerSnapshot.directReportCount}
                </p>
                <Badge variant="info">{managerSnapshot.submittedManagerReviews} submitted</Badge>
              </CardFooter>
            </Card>

            <Card className="border-amber-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="warm" aria-label="Pending manager reviews icon">
                    MR
                  </IconBadge>
                  <CardTitle className="text-base">Reviews to complete</CardTitle>
                </div>
                <CardDescription>
                  Manager reviews still pending in active and locked cycles.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-slate-900">
                  {managerSnapshot.reviewsToComplete}
                </p>
                <Link href="/performance/reviews">
                  <Button size="sm" variant="outline">
                    Open reviews
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      ) : null}

      {context.role === UserRole.HR_ADMIN && hrSnapshot ? (
        <section className="space-y-4">
          <SectionHeader
            title="Cycle progress snapshot"
            description="Monitor active cycle throughput and jump directly into reporting."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-teal-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="brand" aria-label="Active cycles icon">
                    AC
                  </IconBadge>
                  <CardTitle className="text-base">Cycle coverage</CardTitle>
                </div>
                <CardDescription>
                  Active and draft cycle counts across the organization.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">
                  {hrSnapshot.activeCycleCount} active / {hrSnapshot.draftCycleCount} draft
                </p>
                <Link href="/admin/performance/review-cycles">
                  <Button size="sm" variant="outline">
                    Open cycles
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-amber-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="warm" aria-label="Submission progress icon">
                    SP
                  </IconBadge>
                  <CardTitle className="text-base">Submission progress</CardTitle>
                </div>
                <CardDescription>
                  Open vs submitted reviews for active and locked cycles.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">
                  {hrSnapshot.openSubmissionCount} open / {hrSnapshot.submittedSubmissionCount} submitted
                </p>
                <Link href="/admin/performance/reporting">
                  <Button size="sm" variant="outline">
                    Open reporting
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      ) : null}

      {context.role === UserRole.CALIBRATOR ? (
        <section className="space-y-4">
          <SectionHeader
            title="Calibration focus"
            description="Use calibration sessions and packet links to align final placement decisions."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-teal-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="brand" aria-label="Calibration sessions icon">
                    CS
                  </IconBadge>
                  <CardTitle className="text-base">Calibration sessions</CardTitle>
                </div>
                <CardDescription>
                  Open an assigned session and move cohort placements with packet context.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-end">
                <Link href="/performance/calibration/calibration_session_seed_1">
                  <Button size="sm" variant="outline">
                    Open calibration
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="border-amber-200">
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <IconBadge tone="warm" aria-label="Packet references icon">
                    PK
                  </IconBadge>
                  <CardTitle className="text-base">Packet references</CardTitle>
                </div>
                <CardDescription>
                  Use review tasks as packet entry points while evaluating calibration moves.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-end">
                <Link href="/performance/reviews">
                  <Button size="sm" variant="outline">
                    Open packets
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      ) : null}

      {!appEnv.presentationMode ? (
        <SectionContainer variant="brand" className="space-y-4">
          <SectionHeader
            title="Role modules"
            description="Role-relevant entry points for the workflows you can access."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowModules.map((module) => (
              <Card key={module.title}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{module.title}</CardTitle>
                    <Badge variant={module.status === "Active" ? "success" : "info"}>
                      {module.status}
                    </Badge>
                  </div>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href={module.href} className="w-full">
                    <Button
                      className="w-full"
                      variant={module.status === "Active" ? "primary" : "outline"}
                    >
                      Open
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </SectionContainer>
      ) : null}
    </div>
  );
}

function getCurrentTimeMs() {
  return Date.now();
}

function getRoleWorkflowModules(role: UserRole) {
  switch (role) {
    case UserRole.HR_ADMIN:
      return [
        {
          title: "Reporting",
          description: "Inspect cycle progress and outcome distributions for HR decisions.",
          href: "/admin/performance/reporting",
          status: "Active",
        },
        {
          title: "Admin Review Cycles",
          description: "Create cycles, generate packets, and manage status transitions.",
          href: "/admin/performance/review-cycles",
          status: "Active",
        },
        {
          title: "Admin Calibration",
          description: "Create and configure calibration sessions for targeted cohorts.",
          href: "/admin/performance/calibration",
          status: "Active",
        },
        {
          title: "Help Center",
          description: "Open role-based guidance for cycle setup and release workflows.",
          href: "/help",
          status: "Active",
        },
      ];
    case UserRole.MANAGER:
      return [
        {
          title: "Team Reviews",
          description: "Track direct-report manager reviews and outstanding actions.",
          href: "/performance/team-reviews",
          status: "Active",
        },
        {
          title: "Participant Reviews",
          description: "Open assigned manager review tasks and submit feedback.",
          href: "/performance/reviews",
          status: "Active",
        },
        {
          title: "Calibration",
          description: "Review placements and compare packet context during calibration.",
          href: "/performance/calibration/calibration_session_seed_1",
          status: "Active",
        },
        {
          title: "Improvement Plans",
          description: "Track coaching plans, check-ins, and status transitions.",
          href: "/performance/improvement-plans",
          status: "Active",
        },
      ];
    case UserRole.CALIBRATOR:
      return [
        {
          title: "Calibration",
          description: "Open calibration sessions and align placement decisions.",
          href: "/performance/calibration/calibration_session_seed_1",
          status: "Active",
        },
        {
          title: "Packets",
          description: "Use packet links while calibrating cohort members.",
          href: "/performance/reviews",
          status: "Active",
        },
        {
          title: "Help Center",
          description: "Review role guidance for calibration session workflows.",
          href: "/help",
          status: "Active",
        },
      ];
    default:
      return [
        {
          title: "Participant Reviews",
          description: "Open assigned review tasks and submit your self review.",
          href: "/performance/reviews",
          status: "Active",
        },
        {
          title: "Improvement Plans",
          description: "Track active coaching plans and document check-ins.",
          href: "/performance/improvement-plans",
          status: "Active",
        },
        {
          title: "Help Center",
          description: "Get role-specific guidance and examples for each workflow.",
          href: "/help",
          status: "Active",
        },
      ];
  }
}
