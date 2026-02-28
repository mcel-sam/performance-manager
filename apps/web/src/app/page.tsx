import Link from "next/link";

import { ImprovementPlanStatus, ReviewSubmissionStatus } from "@prisma/client";

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
import { getDevRequestContext } from "@/server/auth/request-context";
import { listImprovementPlans } from "@/server/improvement-plans/improvement-plan-service";
import { listAssignedReviewTasks } from "@/server/reviews/participant-review-service";

const modules = [
  {
    title: "Participant Reviews",
    description: "Open assigned review tasks, draft responses, and submit with evidence context.",
    href: "/performance/reviews",
    status: "Active",
  },
  {
    title: "Admin Review Cycles",
    description: "Create cycles, generate review artifacts, and progress cycle statuses.",
    href: "/admin/performance/review-cycles",
    status: "Active",
  },
  {
    title: "Calibration",
    description: "Run a 9-box calibration session and move placements with packet context.",
    href: "/performance/calibration/calibration_session_seed_1",
    status: "Active",
  },
  {
    title: "Admin Calibration",
    description: "Create calibration sessions with cycle, cohort, axis, and participant setup.",
    href: "/admin/performance/calibration",
    status: "Active",
  },
  {
    title: "Improvement Plans",
    description: "Track coaching check-ins, timeline updates, and status transitions.",
    href: "/performance/improvement-plans",
    status: "Active",
  },
  {
    title: "Help Center",
    description: "Get role-based guidance, workflow tips, and deep links for key actions.",
    href: "/help",
    status: "Active",
  },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const context = await getDevRequestContext();
  const gettingStarted = getGettingStartedContent(context.role);
  const [tasksResult, plansResult] = await Promise.allSettled([
    listAssignedReviewTasks(context),
    listImprovementPlans(context),
  ]);
  const tasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
  const plans = plansResult.status === "fulfilled" ? plansResult.value : [];
  const now = getCurrentTimeMs();
  const dueSoonCutoff = now + 14 * 24 * 60 * 60 * 1000;
  const dueSoonReviewCount = tasks.filter((task) => {
    if (task.status === ReviewSubmissionStatus.SUBMITTED) {
      return false;
    }

    const dueAt = new Date(task.cycleEndDate).getTime();
    return dueAt >= now && dueAt <= dueSoonCutoff;
  }).length;
  const dueSoonPlanCount = plans.filter((plan) => {
    if (
      plan.status === ImprovementPlanStatus.COMPLETED ||
      plan.status === ImprovementPlanStatus.CANCELED
    ) {
      return false;
    }

    const dueAt = new Date(plan.endDate).getTime();
    return dueAt >= now && dueAt <= dueSoonCutoff;
  }).length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Milestone 4"
        title="Reviews, calibration, and improvement plans"
        description="Use this workspace to run review workflows, calibrate cohorts, and document structured improvement plans."
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

      <section className="space-y-4">
        <SectionHeader
          title="Due Soon"
          description="In-app reminders for work items closing in the next 14 days."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Review tasks</CardTitle>
              <CardDescription>Assigned submissions that are not yet submitted.</CardDescription>
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

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Plan check-ins</CardTitle>
              <CardDescription>Active plan timelines ending in the next 14 days.</CardDescription>
            </CardHeader>
            <CardFooter className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-slate-900">{dueSoonPlanCount}</p>
              <Link href="/performance/improvement-plans">
                <Button size="sm" variant="outline">
                  Open plans
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Workflow Modules"
          description="Open one of the active modules below to continue work."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {modules.map((module) => (
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
      </section>
    </div>
  );
}

function getCurrentTimeMs() {
  return Date.now();
}
