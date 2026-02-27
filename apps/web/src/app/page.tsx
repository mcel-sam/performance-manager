import Link from "next/link";

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
    href: "/performance/improvement-plans/improvement_plan_seed_1",
    status: "Active",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Milestone 4"
        title="Reviews, calibration, and improvement plans"
        description="Use this workspace to run review workflows, calibrate cohorts, and document structured improvement plans."
      />

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
