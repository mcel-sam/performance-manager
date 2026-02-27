"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/performance/reviews",
    label: "Reviews",
  },
  {
    href: "/performance/calibration/calibration_session_seed_1",
    label: "Calibration",
  },
  {
    href: "/admin/performance/calibration",
    label: "Admin Calibration",
  },
  {
    href: "/performance/improvement-plans/improvement_plan_seed_1",
    label: "Improvement Plans",
  },
  {
    href: "/admin/performance/review-cycles",
    label: "Admin Cycles",
  },
  {
    href: "/help",
    label: "Help",
  },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

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
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
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
        </aside>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
