import Link from "next/link";

import { UserRole } from "@prisma/client";

import { PageHeader } from "@/components/layout/page-header";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasHrAdminAccess, hasManagerAccess } from "@/lib/users/role-capabilities";
import { getDevRequestContext } from "@/server/auth/request-context";
import { getManagerHomeSnapshot } from "@/server/home/home-dashboard-service";

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
    label: "Goals",
    description: "Keep your goal plan visible before you complete your self review.",
    href: "/goals",
  },
  {
    label: "Improvement plans",
    description: "Review plan milestones and check-ins if you are on an active plan.",
    href: "/performance/improvement-plans",
  },
];

const managerLinks: HelpLinkItem[] = [
  {
    label: "My Team",
    description: "Open the direct-report workspace for manager reviews and packet context.",
    href: "/performance/team-reviews",
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
    label: "Review queue",
    description: "Complete your own assigned review work alongside cycle operations.",
    href: "/performance/reviews",
  },
  {
    label: "Goals",
    description: "Keep your own goals visible while you operate review cycles.",
    href: "/goals",
  },
  {
    label: "Cycle setup",
    description: "Create review cycles and configure participant mix.",
    href: "/admin/performance/review-cycles",
  },
  {
    label: "Operational reporting",
    description: "Monitor completion and operational status for active review cycles.",
    href: "/admin/performance/reporting",
  },
  {
    label: "Calibration admin",
    description: "Create and monitor calibration sessions by cycle and cohort.",
    href: "/admin/performance/calibration",
  },
];

const superAdminLinks: HelpLinkItem[] = [
  {
    label: "Calibration workspace",
    description: "Run the restricted 9-box workflow and capture downstream talent outputs.",
    href: "/performance/calibration",
  },
  {
    label: "Review queue",
    description: "Inspect review context from the main review workspace when needed.",
    href: "/performance/reviews",
  },
  {
    label: "Goals",
    description: "Keep your own goals current while you manage restricted talent decisions.",
    href: "/goals",
  },
  {
    label: "Improvement plans",
    description: "Review active performance plans that may require executive visibility.",
    href: "/performance/improvement-plans",
  },
];

export default async function HelpPage() {
  const context = await getDevRequestContext();
  const managerSnapshot = await getManagerHomeSnapshot(context);
  const hasDirectReports = managerSnapshot.directReportCount > 0;

  return (
    <WorkspacePage width="standard">
      <PageHeader
        eyebrow="Help Center"
        title="Guidance for reviews, calibration, and plans"
        description="Use these quick references to complete common workflows without external documentation."
        metadata={
          <span>
            Current role: <code>{getRoleHelpTitle(context.role)}</code>
          </span>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Getting started by role</CardTitle>
          <CardDescription>
            Open the workflows available to your current role without leaving the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-1">
          {getHelpSections(context.role, hasDirectReports).map((section) => (
            <RoleHelpSection
              key={section.title}
              role={section.role}
              activeRole={context.role}
              title={section.title}
              items={section.items}
            />
          ))}
        </CardContent>
      </Card>
    </WorkspacePage>
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

function getRoleHelpTitle(role: UserRole): string {
  switch (role) {
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.HR_ADMIN:
      return "HR Admin";
    case UserRole.SUPER_ADMIN:
      return "Super Admin";
    case UserRole.EMPLOYEE:
    default:
      return "Employee";
  }
}

function getRoleHelpItems(role: UserRole): HelpLinkItem[] {
  switch (role) {
    case UserRole.MANAGER:
      return managerLinks;
    case UserRole.HR_ADMIN:
      return hrLinks;
    case UserRole.SUPER_ADMIN:
      return superAdminLinks;
    case UserRole.EMPLOYEE:
    default:
      return employeeLinks;
  }
}

function getHelpSections(role: UserRole, hasDirectReports: boolean): Array<{
  role: UserRole;
  title: string;
  items: HelpLinkItem[];
}> {
  if (role === UserRole.SUPER_ADMIN) {
    return [
      {
        role: UserRole.SUPER_ADMIN,
        title: getRoleHelpTitle(UserRole.SUPER_ADMIN),
        items: superAdminLinks,
      },
      ...(hasManagerAccess(role)
        ? [
            {
              role: UserRole.MANAGER,
              title: getRoleHelpTitle(UserRole.MANAGER),
              items: managerLinks,
            },
          ]
        : []),
      ...(hasHrAdminAccess(role)
        ? [
            {
              role: UserRole.HR_ADMIN,
              title: getRoleHelpTitle(UserRole.HR_ADMIN),
              items: hrLinks,
            },
          ]
        : []),
    ];
  }

  if (role === UserRole.HR_ADMIN) {
    return [
      {
        role,
        title: getRoleHelpTitle(role),
        items: getRoleHelpItems(role),
      },
      ...(hasDirectReports
        ? [
            {
              role: UserRole.MANAGER,
              title: getRoleHelpTitle(UserRole.MANAGER),
              items: managerLinks,
            },
          ]
        : []),
    ];
  }

  return [
    {
      role,
      title: getRoleHelpTitle(role),
      items: getRoleHelpItems(role),
    },
  ];
}
