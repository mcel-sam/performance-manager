import Link from "next/link";

import { UserRole } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { appEnv } from "@/config/env";
import { getDevRequestContext } from "@/server/auth/request-context";

export const dynamic = "force-dynamic";

interface HelpLinkItem {
  label: string;
  description: string;
  href: string;
}

const employeeLinks: HelpLinkItem[] = [
  {
    label: "Review tasks",
    description: "See assigned submissions and due dates.",
    href: "/performance/reviews",
  },
  {
    label: "Write and submit",
    description: "Draft answers, attach evidence, and submit your review.",
    href: "/performance/reviews/cycle_seed_draft_1/write/submission_seed_employee_self_1",
  },
  {
    label: "View packet",
    description: "Review packet visibility after release.",
    href: "/performance/reviews/cycle_seed_draft_1/packet/emp_employee_1",
  },
];

const managerLinks: HelpLinkItem[] = [
  {
    label: "Calibration session",
    description: "Review cohort placements and move participants.",
    href: "/performance/calibration/calibration_session_seed_1",
  },
  {
    label: "Review participation",
    description: "Open your assigned reviews and complete manager feedback.",
    href: "/performance/reviews",
  },
  {
    label: "Improvement plans",
    description: "Track check-ins and status transitions for coaching plans.",
    href: "/performance/improvement-plans",
  },
];

const hrLinks: HelpLinkItem[] = [
  {
    label: "Cycle setup",
    description: "Create review cycles and configure participant mix.",
    href: "/admin/performance/review-cycles",
  },
  {
    label: "Calibration admin",
    description: "Create and monitor calibration sessions by cycle and cohort.",
    href: "/admin/performance/calibration",
  },
  {
    label: "Audit and exports",
    description: "Review plan audit logs and export placeholders.",
    href: "/performance/improvement-plans",
  },
];

export default async function HelpPage() {
  const context = await getDevRequestContext();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Help Center"
        title="Guidance for reviews, calibration, and plans"
        description="Use these quick references to complete common workflows without external documentation."
        metadata={
          <span>
            Current role: <code>{context.role}</code>
          </span>
        }
      />

      {!appEnv.presentationMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Getting started by role</CardTitle>
            <CardDescription>
              Pick a section below. Each link opens the in-app flow directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <RoleHelpSection
              role={UserRole.EMPLOYEE}
              activeRole={context.role}
              title="Employee"
              items={employeeLinks}
            />
            <RoleHelpSection
              role={UserRole.MANAGER}
              activeRole={context.role}
              title="Manager"
              items={managerLinks}
            />
            <RoleHelpSection
              role={UserRole.HR_ADMIN}
              activeRole={context.role}
              title="HR Admin"
              items={hrLinks}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Presentation mode active</CardTitle>
            <CardDescription>
              Role quick-link cards are hidden. Use the left navigation to open workflows.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

interface RoleHelpSectionProps {
  role: UserRole;
  activeRole: UserRole;
  title: string;
  items: HelpLinkItem[];
}

function RoleHelpSection({ role, activeRole, title, items }: RoleHelpSectionProps) {
  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {activeRole === role ? <Badge variant="success">Current</Badge> : null}
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label} className="rounded-[var(--radius-md)] border border-slate-200 bg-white p-3">
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <p className="mt-1 text-xs text-slate-600">{item.description}</p>
            <Link href={item.href} className="mt-3 inline-block">
              <Button size="sm" variant="outline">
                Open
              </Button>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
