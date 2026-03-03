import { UserRole } from "@prisma/client";

export interface ShellNavItem {
  href: string;
  label: string;
  testId: string;
}

export interface RoleNavOptions {
  canAccessCalibration: boolean;
  includeImprovementPlans: boolean;
  includeTeamReviews: boolean;
  includeUserManagement: boolean;
  includePackets: boolean;
}

const allNavItems = {
  home: { href: "/", label: "Home", testId: "nav-link-home" },
  reviews: { href: "/performance/reviews", label: "Reviews", testId: "nav-link-reviews" },
  packets: { href: "/performance/reviews", label: "Packets", testId: "nav-link-packets" },
  teamReviews: {
    href: "/performance/team-reviews",
    label: "Team Reviews",
    testId: "nav-link-team-reviews",
  },
  calibration: {
    href: "/performance/calibration/calibration_session_seed_1",
    label: "Calibration",
    testId: "nav-link-calibration",
  },
  adminCalibration: {
    href: "/admin/performance/calibration",
    label: "Admin Calibration",
    testId: "nav-link-admin-calibration",
  },
  adminReporting: {
    href: "/admin/performance/reporting",
    label: "Reporting",
    testId: "nav-link-admin-reporting",
  },
  adminCycles: {
    href: "/admin/performance/review-cycles",
    label: "Admin Cycles",
    testId: "nav-link-admin-cycles",
  },
  adminUsers: {
    href: "/admin/users",
    label: "User Management",
    testId: "nav-link-admin-users",
  },
  improvementPlans: {
    href: "/performance/improvement-plans",
    label: "Improvement Plans",
    testId: "nav-link-improvement-plans",
  },
  help: { href: "/help", label: "Help", testId: "nav-link-help" },
} as const;

export function getRoleNavigation(
  role: UserRole,
  options: RoleNavOptions,
): ShellNavItem[] {
  switch (role) {
    case UserRole.EMPLOYEE:
      return [
        allNavItems.home,
        allNavItems.reviews,
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
        allNavItems.help,
      ];
    case UserRole.MANAGER:
      return [
        allNavItems.home,
        ...(options.includeTeamReviews ? [allNavItems.teamReviews] : []),
        allNavItems.reviews,
        ...(options.includePackets ? [allNavItems.packets] : []),
        ...(options.canAccessCalibration ? [allNavItems.calibration] : []),
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
        allNavItems.help,
      ];
    case UserRole.HR_ADMIN:
      return [
        allNavItems.home,
        allNavItems.adminReporting,
        allNavItems.adminCycles,
        allNavItems.adminCalibration,
        ...(options.includeUserManagement ? [allNavItems.adminUsers] : []),
        allNavItems.help,
      ];
    case UserRole.CALIBRATOR:
      return [
        allNavItems.home,
        ...(options.canAccessCalibration ? [allNavItems.calibration] : []),
        ...(options.includePackets ? [allNavItems.packets] : []),
        allNavItems.help,
      ];
    default:
      return [allNavItems.home, allNavItems.help];
  }
}

export function isRouteInNavigation(pathname: string, navItems: ShellNavItem[]): boolean {
  if (pathname === "/") {
    return navItems.some((item) => item.href === "/");
  }

  return navItems.some(
    (item) => item.href !== "/" && pathname.startsWith(item.href),
  );
}
