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

export type ShellNavSectionKey = "performance" | "talent" | "admin" | "support";

export interface ShellNavItem {
  key: ShellNavKey;
  href: string;
  label: string;
  section: ShellNavSectionKey;
  testId: string;
}

export interface ShellNavSection {
  key: ShellNavSectionKey;
  label: string;
  items: ShellNavItem[];
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
  home: {
    key: "home",
    href: "/",
    label: "Home",
    section: "performance",
    testId: "nav-link-home",
  },
  goals: {
    key: "goals",
    href: "/goals",
    label: "Goals",
    section: "performance",
    testId: "nav-link-goals",
  },
  growth: {
    key: "growth",
    href: "/performance/tracks",
    label: "Tracks",
    section: "performance",
    testId: "nav-link-growth",
  },
  reviews: {
    key: "reviews",
    href: "/performance/reviews",
    label: "Reviews",
    section: "performance",
    testId: "nav-link-reviews",
  },
  packets: {
    key: "packets",
    href: "/performance/reviews",
    label: "Packets",
    section: "performance",
    testId: "nav-link-packets",
  },
  teamReviews: {
    key: "teamReviews",
    href: "/performance/team-reviews",
    label: "My Team",
    section: "performance",
    testId: "nav-link-team-reviews",
  },
  succession: {
    key: "succession",
    href: "/talent/succession",
    label: "Succession",
    section: "talent",
    testId: "nav-link-succession",
  },
  calibration: {
    key: "calibration",
    href: "/performance/calibration",
    label: "Calibration",
    section: "talent",
    testId: "nav-link-calibration",
  },
  adminGoalCycles: {
    key: "adminGoalCycles",
    href: "/admin/goals/cycles",
    label: "Goal Cycles",
    section: "admin",
    testId: "nav-link-admin-goal-cycles",
  },
  adminCalibration: {
    key: "adminCalibration",
    href: "/admin/performance/calibration",
    label: "Calibration Setup",
    section: "admin",
    testId: "nav-link-admin-calibration",
  },
  adminReporting: {
    key: "adminReporting",
    href: "/admin/performance/reporting",
    label: "Reporting",
    section: "admin",
    testId: "nav-link-admin-reporting",
  },
  adminCycles: {
    key: "adminCycles",
    href: "/admin/performance/review-cycles",
    label: "Review Cycles",
    section: "admin",
    testId: "nav-link-admin-cycles",
  },
  adminUsers: {
    key: "adminUsers",
    href: "/admin/users",
    label: "User Management",
    section: "admin",
    testId: "nav-link-admin-users",
  },
  adminSuccession: {
    key: "adminSuccession",
    href: "/admin/talent/succession",
    label: "Succession Setup",
    section: "admin",
    testId: "nav-link-admin-succession",
  },
  improvementPlans: {
    key: "improvementPlans",
    href: "/performance/improvement-plans",
    label: "Improvement Plans",
    section: "performance",
    testId: "nav-link-improvement-plans",
  },
  help: {
    key: "help",
    href: "/help",
    label: "Help",
    section: "support",
    testId: "nav-link-help",
  },
} as const;

const sectionLabels: Record<ShellNavSectionKey, string> = {
  performance: "Performance",
  talent: "Talent",
  admin: "Admin",
  support: "Support",
};

const orderedSections: ShellNavSectionKey[] = ["performance", "talent", "admin", "support"];

export function getRoleNavigation(
  role: UserRole,
  options: RoleNavOptions,
): ShellNavItem[] {
  switch (role) {
    case UserRole.EMPLOYEE:
      return [
        allNavItems.home,
        allNavItems.goals,
        allNavItems.reviews,
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
      ];
    case UserRole.MANAGER:
      return [
        allNavItems.home,
        allNavItems.goals,
        ...(options.includeTeamReviews ? [allNavItems.teamReviews] : []),
        allNavItems.reviews,
        ...(options.includePackets ? [allNavItems.packets] : []),
        ...(options.canAccessCalibration ? [allNavItems.calibration] : []),
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
      ];
    case UserRole.HR_ADMIN:
      return [
        allNavItems.home,
        allNavItems.goals,
        allNavItems.reviews,
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
        allNavItems.adminGoalCycles,
        allNavItems.adminReporting,
        allNavItems.adminCycles,
        allNavItems.adminCalibration,
        ...(options.includeUserManagement ? [allNavItems.adminUsers] : []),
      ];
    case UserRole.SUPER_ADMIN:
      return [
        allNavItems.home,
        allNavItems.goals,
        ...(options.includeTeamReviews ? [allNavItems.teamReviews] : []),
        allNavItems.reviews,
        ...(options.canAccessCalibration ? [allNavItems.calibration] : []),
        ...(options.includeImprovementPlans ? [allNavItems.improvementPlans] : []),
        allNavItems.adminGoalCycles,
        allNavItems.adminReporting,
        allNavItems.adminCycles,
        allNavItems.adminCalibration,
        ...(options.includeUserManagement ? [allNavItems.adminUsers] : []),
      ];
    default:
      return [allNavItems.home];
  }
}

export function isRouteInNavigation(pathname: string, navItems: ShellNavItem[]): boolean {
  return getActiveNavKey(pathname, navItems) !== null;
}

export function groupNavigationItems(navItems: ShellNavItem[]): ShellNavSection[] {
  return orderedSections
    .map((sectionKey) => ({
      key: sectionKey,
      label: sectionLabels[sectionKey],
      items: navItems.filter((item) => item.section === sectionKey),
    }))
    .filter((section) => section.items.length > 0);
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
      return (
        pathname === "/performance/calibration" ||
        /^\/performance\/calibration\/[^/]+$/.test(pathname)
      );
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
