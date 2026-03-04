"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { getActiveNavKey, type ShellNavItem, type ShellNavKey } from "@/config/navigation";

interface AppShellProps {
  children: ReactNode;
  navItems: ShellNavItem[];
  viewer: {
    role: UserRole;
    userId: string;
    roleLabel: string;
    orgName: string;
    displayName: string;
    initials: string;
  } | null;
  demoModeEnabled: boolean;
}

type ProfileAction = "signOut" | "switchRole";

const navGlyph: Record<ShellNavKey, string> = {
  home: "H",
  reviews: "R",
  packets: "P",
  teamReviews: "T",
  calibration: "C",
  adminCalibration: "AC",
  adminReporting: "RP",
  adminCycles: "CY",
  adminUsers: "U",
  improvementPlans: "IP",
  help: "?",
};

export default function AppShell({
  children,
  navItems,
  viewer,
  demoModeEnabled,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingProfileAction, setPendingProfileAction] = useState<ProfileAction | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/demo/login");
  const focusLayout = useMemo(() => getFocusLayoutConfig(pathname), [pathname]);
  const activeNavKey = useMemo(() => getActiveNavKey(pathname, navItems), [pathname, navItems]);

  useEffect(() => {
    setIsSidebarCollapsed(Boolean(focusLayout));
  }, [focusLayout]);

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
      if (demoModeEnabled) {
        await fetch("/api/demo/logout", {
          method: "POST",
        });
      }
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
        className={cn(
          "mx-auto grid min-h-screen w-full max-w-[1520px] transition-[grid-template-columns] duration-200 ease-out",
          isSidebarCollapsed
            ? "md:grid-cols-[84px_minmax(0,1fr)]"
            : "md:grid-cols-[272px_minmax(0,1fr)]",
        )}
      >
        <aside
          data-testid="app-shell-sidebar"
          data-collapsed={isSidebarCollapsed ? "true" : "false"}
          className={cn(
            "overflow-hidden border-r border-slate-200 bg-white transition-[width,padding,border-color] duration-200 ease-out",
            isSidebarCollapsed && "border-slate-100",
          )}
        >
          <div
            className={cn(
              "border-b border-slate-100",
              isSidebarCollapsed ? "px-2 py-4" : "px-5 py-5",
            )}
          >
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500", isSidebarCollapsed && "sr-only")}>
              Performance Manager
            </p>
            {!isSidebarCollapsed ? <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">Workspace</h1> : null}
            {viewer && !isSidebarCollapsed ? (
              <p className="mt-2 text-[11px] text-slate-500">
                {viewer.roleLabel} <span className="text-slate-400">({viewer.userId})</span>
              </p>
            ) : null}
          </div>

          <nav className={cn("space-y-1 p-3", isSidebarCollapsed && "px-2")}>
            {navItems.map((item) => {
              const isActive = activeNavKey === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  data-testid={item.testId}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "group relative flex rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1 motion-reduce:transition-none",
                    isSidebarCollapsed ? "justify-center px-2" : "items-center gap-3",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex h-7 min-w-7 items-center justify-center rounded-[var(--radius-sm)] text-[11px] font-semibold uppercase leading-none",
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-slate-200 text-slate-700 group-hover:bg-slate-300",
                    )}
                  >
                    {navGlyph[item.key]}
                  </span>
                  {!isSidebarCollapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
                  {isSidebarCollapsed ? (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                    >
                      {item.label}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className={cn("p-5 sm:p-7", focusLayout && "lg:px-8")}>
          <header
            className="mb-5 flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-slate-200 bg-white px-4 py-3 shadow-[var(--shadow-xs)] sm:px-5"
            data-testid="app-shell-header"
          >
            <button
              type="button"
              data-testid="focus-layout-toggle-nav"
              onClick={() => setIsSidebarCollapsed((value) => !value)}
              aria-label={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              title={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-slate-300 bg-white text-slate-700 shadow-[var(--shadow-xs)] transition-[background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-slate-100 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M3.5 5.5H16.5M3.5 10H16.5M3.5 14.5H12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <label className="min-w-[180px] flex-1">
              <span className="sr-only">Search workspace</span>
              <input
                type="search"
                data-testid="app-header-search"
                placeholder="Search people, cycles, or reviews"
                className="h-9 w-full rounded-[var(--radius-sm)] border border-slate-300 bg-slate-50 px-3 text-sm text-slate-800 placeholder:text-slate-500 transition-[background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                data-testid="app-header-org-pill"
                disabled
                aria-label="Current organization"
                title="Organization switching is not enabled in this build"
                className="inline-flex h-9 max-w-[220px] items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 opacity-90"
              >
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
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 text-left text-sm text-slate-800 shadow-[var(--shadow-xs)] transition-[background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-slate-50 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold uppercase text-white">
                    {viewer?.initials ?? "U"}
                  </span>
                  <span className="hidden max-w-[150px] flex-col sm:flex">
                    <span className="truncate text-xs font-semibold text-slate-900">{viewer?.displayName ?? "User"}</span>
                    <span className="truncate text-[11px] text-slate-500">{viewer?.roleLabel ?? "Member"}</span>
                  </span>
                </button>

                {isProfileMenuOpen ? (
                  <div
                    role="menu"
                    data-testid="app-header-profile-menu"
                    className="absolute right-0 top-11 z-30 min-w-[200px] space-y-1 rounded-[var(--radius-md)] border border-slate-200 bg-white p-2 shadow-[var(--shadow-sm)]"
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

          {focusLayout ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-2.5 text-sm leading-6 text-slate-700 shadow-[var(--shadow-xs)] transition-[box-shadow,border-color] duration-[var(--transition-base)] ease-[var(--ease-standard)]">
              <span>{focusLayout.label}</span>
              <div className="flex items-center gap-2">
                <Link
                  href={focusLayout.backHref}
                  className="rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-[background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-slate-100 hover:shadow-[var(--shadow-xs)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  {focusLayout.backLabel}
                </Link>
              </div>
            </div>
          ) : null}
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
  config: FocusLayoutConfig;
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
      label: "Focus mode: review packet",
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

function getFocusLayoutConfig(pathname: string): FocusLayoutConfig | null {
  for (const matcher of focusRouteMatchers) {
    if (matcher.pattern.test(pathname)) {
      return matcher.config;
    }
  }

  return null;
}
