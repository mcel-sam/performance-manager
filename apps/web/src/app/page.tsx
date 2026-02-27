import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Milestone 2</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Packet and calibration workflows
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Use this workspace to review tasks, inspect packets, and calibrate a cohort with a
          shared 9-box view.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{module.title}</CardTitle>
                <Badge variant={module.status === "Active" ? "success" : "info"}>{module.status}</Badge>
              </div>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0" />
            <CardFooter>
              <Link href={module.href} className="w-full">
                <Button className="w-full" variant={module.status === "Active" ? "primary" : "outline"}>
                  Open
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}
