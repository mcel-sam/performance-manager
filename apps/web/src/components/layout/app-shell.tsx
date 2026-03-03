"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/components/ui/cn";
import { getActiveNavKey, type ShellNavItem } from "@/config/navigation";

interface AppShellProps {
  children: ReactNode;
  navItems: ShellNavItem[];
  viewer: {
    role: UserRole;
    userId: string;
  } | null;
}

export default function AppShell({ children, navItems, viewer }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isPublicRoute = pathname === "/login";
  const demoLoginEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const focusLayout = useMemo(() => getFocusLayoutConfig(pathname), [pathname]);
  const activeNavKey = useMemo(() => getActiveNavKey(pathname, navItems), [pathname, navItems]);

  useEffect(() => {
    setIsSidebarCollapsed(Boolean(focusLayout));
  }, [focusLayout]);

  async function handleSwitchUser() {
    setIsSwitchingUser(true);

    try {
      await fetch("/api/demo/logout", {
        method: "POST",
      });
    } finally {
      setIsSwitchingUser(false);
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
          "mx-auto grid min-h-screen w-full max-w-[1440px] transition-[grid-template-columns] duration-200 ease-out",
          isSidebarCollapsed
            ? "md:grid-cols-[80px_minmax(0,1fr)]"
            : "md:grid-cols-[260px_minmax(0,1fr)]",
        )}
      >
        <aside
          data-testid="app-shell-sidebar"
          data-collapsed={isSidebarCollapsed ? "true" : "false"}
          className="border-r border-slate-200 bg-white transition-[width,padding] duration-200 ease-out"
        >
          <div
            className={cn(
              "border-b border-slate-100",
              isSidebarCollapsed ? "px-3 py-4" : "px-5 py-5",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {isSidebarCollapsed ? "PM" : "Performance Manager"}
            </p>
            {!isSidebarCollapsed ? <h1 className="mt-1 text-lg font-semibold text-slate-900">Workspace</h1> : null}
            {viewer && !isSidebarCollapsed ? (
              <p className="mt-2 text-xs text-slate-500">
                {viewer.role} <span className="text-slate-400">({viewer.userId})</span>
              </p>
            ) : null}
          </div>

          <nav className="space-y-1 p-3">
            {navItems.map((item) => {
              const isActive = activeNavKey === item.key;
              const collapsedLabel = item.label.charAt(0).toUpperCase();

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  data-testid={item.testId}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1",
                    isSidebarCollapsed && "text-center",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {isSidebarCollapsed ? (
                    <>
                      <span aria-hidden>{collapsedLabel}</span>
                      <span className="sr-only">{item.label}</span>
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              );
            })}
          </nav>

          {demoLoginEnabled ? (
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={() => void handleSwitchUser()}
                disabled={isSwitchingUser}
                data-testid="nav-switch-user"
                className={cn(
                  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60",
                  isSidebarCollapsed && "text-center",
                )}
                aria-label={isSwitchingUser ? "Switching user" : "Switch user"}
              >
                {isSidebarCollapsed
                  ? isSwitchingUser
                    ? "..."
                    : "↻"
                  : isSwitchingUser
                    ? "Switching..."
                    : "Switch user"}
              </button>
            </div>
          ) : null}
        </aside>

        <main className={cn("p-6", focusLayout && "md:px-8 lg:px-10")}>
          {focusLayout ? (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-slate-200 bg-white px-4 py-2 text-sm leading-6 text-slate-700 shadow-[var(--shadow-xs)] transition-shadow duration-200">
              <span>{focusLayout.label}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="focus-layout-toggle-nav"
                  onClick={() => setIsSidebarCollapsed((value) => !value)}
                  className="rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  {isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
                </button>
                <Link
                  href={focusLayout.backHref}
                  className="rounded-[var(--radius-sm)] border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
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
