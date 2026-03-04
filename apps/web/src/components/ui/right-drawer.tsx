"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/components/ui/cn";

interface RightDrawerTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface RightDrawerProps {
  title: string;
  subtitle?: string;
  tabs: RightDrawerTab[];
  actions?: ReactNode;
  defaultTabId?: string;
  closeHref?: string;
  testId?: string;
}

export function RightDrawer({
  title,
  subtitle,
  tabs,
  actions,
  defaultTabId,
  closeHref,
  testId = "right-drawer",
}: RightDrawerProps) {
  const initialTab = useMemo(() => {
    if (defaultTabId && tabs.some((tab) => tab.id === defaultTabId)) {
      return defaultTabId;
    }

    return tabs[0]?.id ?? "overview";
  }, [defaultTabId, tabs]);

  const [activeTabId, setActiveTabId] = useState(initialTab);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null;

  return (
    <aside
      className={cn(
        "rounded-[var(--radius-lg)] border border-slate-200 bg-white shadow-[var(--shadow-sm)] transition-all duration-200",
        isExpanded ? "xl:w-[420px]" : "xl:w-[332px]",
      )}
      data-testid={testId}
    >
      <div className="sticky top-0 z-10 space-y-3 rounded-t-[var(--radius-lg)] border-b border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-testid={`${testId}-expand`}
              onClick={() => setIsExpanded((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
              aria-label={isExpanded ? "Collapse drawer" : "Expand drawer"}
            >
              {isExpanded ? "−" : "+"}
            </button>
            {closeHref ? (
              <Link
                href={closeHref}
                data-testid={`${testId}-close`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
                aria-label="Close drawer"
              >
                ×
              </Link>
            ) : null}
          </div>
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}

        <Tabs
          ariaLabel="Right drawer tabs"
          tabs={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
          value={activeTabId}
          onValueChange={setActiveTabId}
          className="w-full"
        />
      </div>

      <div className="p-4">{activeTab ? activeTab.content : null}</div>
    </aside>
  );
}
