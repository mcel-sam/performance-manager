"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UserRole } from "@prisma/client";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import { getActiveNavKey, type ShellNavItem, type ShellNavKey } from "@/config/navigation";
import { getBackLabelForHref, getReturnToParam, resolveReturnTo } from "@/lib/navigation/return-to";

interface AppShellProps {
  children: ReactNode;
  navItems: ShellNavItem[];
  viewer: {
    role: UserRole;
    userId: string;
    roleLabel: string;
    orgName: string;
    displayName: string;
    avatarUrl: string | null;
    initials: string;
  } | null;
  demoModeEnabled: boolean;
}

type ProfileAction = "signOut" | "switchRole";
const SIDEBAR_COLLAPSE_STORAGE_KEY = "pm.shell.sidebarCollapsed";

export default function AppShell({
  children,
  navItems,
  viewer,
  demoModeEnabled,
}: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pendingProfileAction, setPendingProfileAction] = useState<ProfileAction | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/demo/login");
  const focusLayout = useMemo(
    () => getFocusLayoutConfig(pathname, getReturnToParam(searchParams)),
    [pathname, searchParams],
  );
  const activeNavKey = useMemo(() => getActiveNavKey(pathname, navItems), [pathname, navItems]);
  const headerContext = useMemo(
    () => getShellHeaderContext(activeNavKey, focusLayout),
    [activeNavKey, focusLayout],
  );
  const showExpandedShellHeader = activeNavKey === "home" && focusLayout == null;
  const hasLoadedSidebarPreference = useRef(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSE_STORAGE_KEY);
      if (storedValue === "expanded") {
        setIsSidebarCollapsed(false);
      } else if (storedValue === "collapsed") {
        setIsSidebarCollapsed(true);
      }
    } finally {
      hasLoadedSidebarPreference.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSidebarPreference.current) {
      return;
    }

    window.localStorage.setItem(
      SIDEBAR_COLLAPSE_STORAGE_KEY,
      isSidebarCollapsed ? "collapsed" : "expanded",
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen]);

  async function logoutToLogin(action: ProfileAction) {
    setPendingProfileAction(action);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setPendingProfileAction(null);
      setIsProfileMenuOpen(false);
      router.push("/login");
      router.refresh();
    }
  }

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <main className="mx-auto w-full max-w-6xl p-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div
        data-testid="app-shell-layout"
        data-sidebar-state={isSidebarCollapsed ? "collapsed" : "expanded"}
        className="mx-auto grid min-h-screen w-full max-w-[1520px] items-start transition-[grid-template-columns] duration-300 ease-[var(--ease-standard)] motion-reduce:transition-none"
        style={{
          gridTemplateColumns: `${isSidebarCollapsed ? 84 : 272}px minmax(0, 1fr)`,
        }}
      >
        <aside
          id="app-shell-sidebar"
          data-testid="app-shell-sidebar"
          data-collapsed={isSidebarCollapsed ? "true" : "false"}
          data-state={isSidebarCollapsed ? "collapsed" : "expanded"}
          className="sticky top-4 z-40 self-start px-3 pb-4 pt-4"
        >
          <div
            className={cn(
              "relative overflow-visible rounded-[28px] border border-slate-200 bg-white transition-[box-shadow] duration-300 ease-[var(--ease-standard)] motion-reduce:transition-none",
              isSidebarCollapsed ? "shadow-[var(--shadow-sm)]" : "shadow-[var(--shadow-lg)]",
            )}
          >
            <div
              className={cn(
                "relative border-b border-slate-100",
                isSidebarCollapsed ? "px-2 py-4" : "px-5 py-5",
              )}
            >
              <div
                className={cn(
                  "flex",
                  isSidebarCollapsed
                    ? "flex-col items-center gap-3"
                    : "items-start gap-3",
                )}
              >
                {isSidebarCollapsed ? (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold tracking-[0.12em] text-white">
                    PM
                  </span>
                ) : (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Performance Manager
                    </p>
                    <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">
                      Workspace
                    </h1>
                    {viewer ? (
                      <p className="mt-2 text-[11px] text-slate-500">
                        {viewer.roleLabel} <span className="text-slate-400">({viewer.userId})</span>
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <button
                type="button"
                data-testid="app-shell-sidebar-toggle"
                data-state={isSidebarCollapsed ? "collapsed" : "expanded"}
                onClick={() => setIsSidebarCollapsed((value) => !value)}
                aria-controls="app-shell-sidebar"
                aria-expanded={!isSidebarCollapsed}
                aria-label={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                title={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                className={cn(
                  "absolute right-0 top-1/2 z-20 inline-flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-gradient-to-b from-white to-slate-50 text-slate-500 shadow-[var(--shadow-md)] ring-1 ring-white/80 backdrop-blur transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:border-slate-300 hover:text-slate-700 hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 motion-reduce:transition-none",
                  isSidebarCollapsed ? "h-10 w-6" : "h-11 w-7",
                )}
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path
                    d={
                      isSidebarCollapsed
                        ? "M8 5.5L11.5 10L8 14.5"
                        : "M12 5.5L8.5 10L12 14.5"
                    }
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <nav
              className={cn("space-y-1 p-3", isSidebarCollapsed && "px-2")}
              data-testid="app-shell-nav"
            >
              {navItems.map((item) => {
                const isActive = activeNavKey === item.key;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    data-testid={item.testId}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex rounded-[var(--radius-md)] py-2 text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 motion-reduce:transition-none",
                      isSidebarCollapsed ? "justify-center px-2" : "items-center gap-3 px-3",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex h-7 min-w-7 items-center justify-center rounded-[var(--radius-sm)] leading-none",
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-slate-200 text-slate-700 group-hover:bg-slate-300",
                      )}
                    >
                      <NavItemIcon navKey={item.key} className="h-3.5 w-3.5" />
                    </span>

                    {isSidebarCollapsed ? (
                      <>
                        <span className="sr-only">{item.label}</span>
                        <span
                          data-testid={`app-shell-sidebar-tooltip-${item.key}`}
                          role="tooltip"
                          className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-slate-200 bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                        >
                          {item.label}
                        </span>
                      </>
                    ) : (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className={cn("relative p-5 sm:p-7", focusLayout && "lg:px-8")}>
          <header
            className={cn(
              "relative z-20 isolate flex items-center gap-3",
              showExpandedShellHeader
                ? "mb-4 justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-[var(--shadow-sm)]"
                : "mb-1 justify-end px-0 py-0",
            )}
            data-testid="app-shell-header"
          >
            {showExpandedShellHeader ? (
              <div className="hidden min-w-0 flex-col sm:flex">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Workspace
                </span>
                <span className="truncate text-sm font-semibold text-slate-900">
                  {headerContext}
                </span>
              </div>
            ) : null}

            <div className={cn("flex items-center", showExpandedShellHeader ? "gap-2" : "gap-1.5")}>
              <button
                type="button"
                data-testid="app-header-org-pill"
                disabled
                aria-label="Current organization"
                title="Organization switching is not enabled in this build"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50/90 text-slate-700 opacity-90 shadow-[var(--shadow-xs)]",
                  showExpandedShellHeader ? "h-10 max-w-[240px] px-3.5 text-sm" : "h-9 max-w-[220px] px-3 text-[13px]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-flex items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_14%,white)] font-semibold text-[var(--brand-primary-strong)]",
                    showExpandedShellHeader ? "h-6 w-6 text-[11px]" : "h-5.5 w-5.5 text-[10px]",
                  )}
                >
                  O
                </span>
                <span className="truncate">{viewer?.orgName ?? "Organization"}</span>
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M6.5 8.5L10 12L13.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  data-testid="app-header-profile-button"
                  onClick={() => setIsProfileMenuOpen((value) => !value)}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white text-left text-slate-800 shadow-[var(--shadow-xs)] transition-[background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-slate-50 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300",
                    showExpandedShellHeader ? "h-10 px-2.5 text-sm" : "h-9 px-2 text-[13px]",
                  )}
                >
                  <ProfileAvatar
                    name={viewer?.displayName ?? "User"}
                    imageUrl={viewer?.avatarUrl}
                    size="sm"
                  />
                  <span className={cn("hidden max-w-[150px] flex-col sm:flex", !showExpandedShellHeader && "max-w-[132px]")}>
                    <span className="truncate text-xs font-semibold text-slate-900">{viewer?.displayName ?? "User"}</span>
                    <span className="truncate text-[11px] text-slate-500">{viewer?.roleLabel ?? "Member"}</span>
                  </span>
                </button>

                {isProfileMenuOpen ? (
                  <div
                    role="menu"
                    data-testid="app-header-profile-menu"
                    className="absolute right-0 top-11 z-40 min-w-[200px] space-y-1 rounded-[var(--radius-md)] border border-slate-200 bg-white p-2 shadow-[var(--shadow-lg)]"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-slate-700 transition-[background-color,color] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      data-testid="profile-menu-sign-out"
                      onClick={() => void logoutToLogin("signOut")}
                      disabled={pendingProfileAction !== null}
                      className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-slate-700 transition-[background-color,color] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingProfileAction === "signOut" ? "Signing out..." : "Sign out"}
                    </button>
                    {demoModeEnabled ? (
                      <button
                        type="button"
                        role="menuitem"
                        data-testid="profile-menu-switch-role"
                        onClick={() => void logoutToLogin("switchRole")}
                        disabled={pendingProfileAction !== null}
                        className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-slate-700 transition-[background-color,color] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingProfileAction === "switchRole" ? "Switching role..." : "Switch role"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}

interface FocusLayoutConfig {
  backHref: string;
  backLabel: string;
  label: string;
}

const focusRouteMatchers: Array<{
  pattern: RegExp;
  config: {
    backHref: string;
    backLabel: string;
    label: string;
  };
}> = [
  {
    pattern: /^\/performance\/reviews\/[^/]+\/write\/[^/]+$/,
    config: {
      backHref: "/performance/reviews",
      backLabel: "Back to Reviews",
      label: "Focus mode: review writing",
    },
  },
  {
    pattern: /^\/performance\/reviews\/[^/]+\/packet\/[^/]+$/,
    config: {
      backHref: "/performance/reviews",
      backLabel: "Back to Reviews",
      label: "Focus mode: review details",
    },
  },
  {
    pattern: /^\/performance\/calibration\/[^/]+$/,
    config: {
      backHref: "/",
      backLabel: "Back to Home",
      label: "Focus mode: calibration session",
    },
  },
];

function getFocusLayoutConfig(pathname: string, returnTo: string | null): FocusLayoutConfig | null {
  for (const matcher of focusRouteMatchers) {
    if (matcher.pattern.test(pathname)) {
      const backHref = resolveReturnTo(returnTo, matcher.config.backHref);
      return {
        ...matcher.config,
        backHref,
        backLabel: getBackLabelForHref(backHref, matcher.config.backLabel),
      };
    }
  }

  return null;
}

function getShellHeaderContext(
  activeNavKey: ShellNavKey | null,
  focusLayout: FocusLayoutConfig | null,
): string {
  if (focusLayout) {
    return focusLayout.label;
  }

  switch (activeNavKey) {
    case "goals":
      return "Goals and measures";
    case "growth":
      return "Tracks and competencies";
    case "teamReviews":
      return "Manage my team";
    case "succession":
    case "adminSuccession":
      return "Succession planning";
    case "reviews":
      return "Review tasks";
    case "packets":
      return "Review packets";
    case "calibration":
    case "adminCalibration":
      return "Calibration workspace";
    case "adminGoalCycles":
      return "Goal cycle administration";
    case "adminReporting":
      return "Performance reporting";
    case "adminCycles":
      return "Review cycles";
    case "adminUsers":
      return "People directory";
    case "improvementPlans":
      return "Improvement plans";
    case "help":
      return "Help center";
    case "home":
    default:
      return "Home";
  }
}

function NavItemIcon({
  navKey,
  className,
}: {
  navKey: ShellNavKey;
  className?: string;
}) {
  if (navKey === "home") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <path d="M3 9.25L10 3.5L17 9.25V16.25H3V9.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }

  if (navKey === "teamReviews") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <circle cx="7" cy="7" r="2.25" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="13.5" cy="8.5" r="1.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.75 15.75C3.75 13.54 5.54 11.75 7.75 11.75H8.25C10.46 11.75 12.25 13.54 12.25 15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12.5 15.5C12.64 14.03 13.89 12.88 15.38 12.88H15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (navKey === "goals") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <circle cx="10" cy="10" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="1.8" fill="currentColor" />
        <path d="M10 4V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 14V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 10H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (navKey === "growth") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <circle cx="10" cy="10" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6.5V10L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 3.5V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16.5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (navKey === "succession" || navKey === "adminSuccession") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <rect x="4" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="7.5" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 6.5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 9V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (navKey === "reviews" || navKey === "packets") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <rect x="4" y="3.5" width="12" height="13" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7.25H13M7 10.25H13M7 13.25H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (navKey === "calibration" || navKey === "adminCalibration") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <path d="M5 4.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 4.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M15 4.5V15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="12.5" r="1.8" fill="currentColor" />
        <circle cx="10" cy="8.5" r="1.8" fill="currentColor" />
        <circle cx="15" cy="6.5" r="1.8" fill="currentColor" />
      </svg>
    );
  }

  if (navKey === "adminReporting") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <path d="M4 15.5H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="5" y="10" width="2.5" height="4.5" rx="0.6" fill="currentColor" />
        <rect x="8.75" y="7.5" width="2.5" height="7" rx="0.6" fill="currentColor" />
        <rect x="12.5" y="5.25" width="2.5" height="9.25" rx="0.6" fill="currentColor" />
      </svg>
    );
  }

  if (navKey === "adminCycles") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <rect x="3.5" y="4.5" width="13" height="11.5" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 8H16.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 3.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 3.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (navKey === "adminGoalCycles") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <rect x="3.5" y="4.5" width="13" height="11.5" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 8H16.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 3.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 3.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 11L9 13L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (navKey === "adminUsers") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <circle cx="10" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5.25 15.25C5.25 12.9 7.15 11 9.5 11H10.5C12.85 11 14.75 12.9 14.75 15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (navKey === "improvementPlans") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <path d="M4.5 10L8.25 13.75L15.5 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3.5" y="3.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 7V10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="13" r="0.9" fill="currentColor" />
    </svg>
  );
}
