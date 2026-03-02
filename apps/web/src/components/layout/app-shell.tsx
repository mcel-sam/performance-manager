"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { cn } from "@/components/ui/cn";

interface AppShellProps {
  children: ReactNode;
}

const baseNavItems = [
  {
    href: "/",
    label: "Home",
    testId: "nav-link-home",
  },
  {
    href: "/performance/reviews",
    label: "Reviews",
    testId: "nav-link-reviews",
  },
  {
    href: "/performance/calibration/calibration_session_seed_1",
    label: "Calibration",
    testId: "nav-link-calibration",
  },
  {
    href: "/admin/performance/calibration",
    label: "Admin Calibration",
    testId: "nav-link-admin-calibration",
  },
  {
    href: "/performance/improvement-plans",
    label: "Improvement Plans",
    testId: "nav-link-improvement-plans",
  },
  {
    href: "/admin/performance/review-cycles",
    label: "Admin Cycles",
    testId: "nav-link-admin-cycles",
  },
  {
    href: "/help",
    label: "Help",
    testId: "nav-link-help",
  },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);
  const isPublicRoute = pathname === "/login";
  const demoLoginEnabled = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

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
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Performance Manager
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">Workspace</h1>
          </div>

          <nav className="space-y-1 p-3">
            {baseNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={item.testId}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  {item.label}
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
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSwitchingUser ? "Switching..." : "Switch user"}
              </button>
            </div>
          ) : null}
        </aside>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
