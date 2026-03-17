import { UserRole } from "@prisma/client";

export type ShellNavKey =
  | "home"
  | "goals"
  | "growth"
  | "reviews"
  | "packets"
  | "teamReviews"
  | "succession"
  | "calibration"
  | "adminGoalCycles"
  | "adminCalibration"
  | "adminReporting"
  | "adminCycles"
  | "adminUsers"
  | "adminSuccession"
  | "improvementPlans"
  | "help";

export interface ShellNavItem {
  key: ShellNavKey;
  href: string;
  label: string;
  testId: string;
}

export interface RoleNavOptions {
  canAccessCalibration: boolean;
  includeImprovementPlans: boolean;
  includeTeamReviews: boolean;
  includeUserManagement: boolean;
  includeSuccession: boolean;
  includePackets: boolean;
}

const allNavItems = {
  home: { key: "home", href: "/", label: "Home", testId: "nav-link-home" },
  goals: {
    key: "goals",
    href: "/goals",
    label: "Goals",
    testId: "nav-link-goals",
  },
  growth: {
    key: "growth",
    href: "/performance/tracks",
    label: "Tracks",
    testId: "nav-link-growth",
  },
  reviews: {
    key: "reviews",
    href: "/performance/reviews",
    label: "Reviews",
    testId: "nav-link-reviews",
  },
  packets: {
    key: "packets",
    href: "/performance/reviews",
    label: "Packets",
    testId: "nav-link-packets",
  },
  teamReviews: {
    key: "teamReviews",
    href: "/performance/team-reviews",
    label: "My Team",
    testId: "nav-link-team-reviews",
  },
  succession: {
    key: "succession",
    href: "/talent/succession",
    label: "Succession",
    testId: "nav-link-succession",
  },
  calibration: {
    key: "calibration",
    href: "/performance/calibration/calibration_session_seed_1",
    label: "Calibration",
    testId: "nav-link-calibration",
  },
  adminGoalCycles: {
    key: "adminGoalCycles",
    href: "/admin/goals/cycles",
    label: "Goal Cycles",
    testId: "nav-link-admin-goal-cycles",
  },
  adminCalibration: {
    key: "adminCalibration",
    href: "/admin/performance/calibration",
    label: "Admin Calibration",
    testId: "nav-link-admin-calibration",
  },
  adminReporting: {
    key: "adminReporting",
    href: "/admin/performance/reporting",
    label: "Reporting",
    testId: "nav-link-admin-reporting",
  },
  adminCycles: {
    key: "adminCycles",
    href: "/admin/performance/review-cycles",
    label: "Admin Cycles",
    testId: "nav-link-admin-cycles",
  },
  adminUsers: {
    key: "adminUsers",
    href: "/admin/users",
    label: "User Management",
    testId: "nav-link-admin-users",
  },
  adminSuccession: {
    key: "adminSuccession",
    href: "/admin/talent/succession",
    label: "Succession",
    testId: "nav-link-admin-succession",
  },
  improvementPlans: {
    key: "improvementPlans",
    href: "/performance/improvement-plans",
    label: "Improvement Plans",
    testId: "nav-link-improvement-plans",
  },
  help: { key: "help", href: "/help", label: "Help", testId: "nav-link-help" },
} as const;

export function getRoleNavigation(
  role: UserRole,
  options: RoleNavOptions,
): ShellNavItem[] {
  switch (role) {
    case UserRole.EMPLOYEE:
      return [
        allNavItems.home,
        allNavItems.goals,
        allNavItems.growth,
        allNavItems.reviews,
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
        allNavItems.help,
      ];
    case UserRole.MANAGER:
      return [
        allNavItems.home,
        allNavItems.goals,
        allNavItems.growth,
        ...(options.includeTeamReviews ? [allNavItems.teamReviews] : []),
        ...(options.includeSuccession ? [allNavItems.succession] : []),
        allNavItems.reviews,
        ...(options.includePackets ? [allNavItems.packets] : []),
        ...(options.canAccessCalibration ? [allNavItems.calibration] : []),
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
        allNavItems.help,
      ];
    case UserRole.HR_ADMIN:
      return [
        allNavItems.home,
        allNavItems.goals,
        allNavItems.adminGoalCycles,
        ...(options.includeSuccession ? [allNavItems.adminSuccession] : []),
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
  return getActiveNavKey(pathname, navItems) !== null;
}

export function getActiveNavKey(
  pathname: string,
  navItems: ShellNavItem[],
): ShellNavKey | null {
  const normalizedPathname = normalizePath(pathname);
  const activeItem =
    navItems.find((item) => matchesPathForKey(item.key, normalizedPathname)) ??
    navItems.find((item) => isDefaultMatch(item.href, normalizedPathname));

  return activeItem?.key ?? null;
}

function normalizePath(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  const [path] = pathname.split("?");
  if (!path || path === "/") {
    return "/";
  }

  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function isDefaultMatch(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function matchesPathForKey(key: ShellNavKey, pathname: string): boolean {
  switch (key) {
    case "home":
      return pathname === "/";
    case "reviews":
      return (
        pathname === "/performance/reviews" ||
        /^\/performance\/reviews\/[^/]+\/write\/[^/]+$/.test(pathname)
      );
    case "goals":
      return pathname === "/goals";
    case "growth":
      return pathname === "/performance/tracks";
    case "packets":
      return /^\/performance\/reviews\/[^/]+\/packet\/[^/]+$/.test(pathname);
    case "teamReviews":
      return pathname === "/performance/team-reviews";
    case "succession":
      return pathname === "/talent/succession" || /^\/talent\/succession\/positions\/[^/]+$/.test(pathname);
    case "calibration":
      return /^\/performance\/calibration\/[^/]+$/.test(pathname);
    case "adminGoalCycles":
      return pathname === "/admin/goals/cycles";
    case "adminCalibration":
      return pathname === "/admin/performance/calibration" || pathname === "/admin/performance/calibration/new";
    case "adminReporting":
      return pathname === "/admin/performance/reporting";
    case "adminCycles":
      return pathname === "/admin/performance/review-cycles" || pathname === "/admin/performance/review-cycles/new";
    case "adminUsers":
      return pathname === "/admin/users" || pathname === "/admin/users/new" || /^\/admin\/users\/[^/]+$/.test(pathname);
    case "adminSuccession":
      return (
        pathname === "/admin/talent/succession" ||
        pathname === "/admin/talent/succession/positions" ||
        pathname === "/admin/talent/succession/positions/new" ||
        /^\/admin\/talent\/succession\/positions\/[^/]+$/.test(pathname)
      );
    case "improvementPlans":
      return pathname === "/performance/improvement-plans" || /^\/performance\/improvement-plans\/[^/]+$/.test(pathname);
    case "help":
      return pathname === "/help";
    default:
      return false;
  }
}
