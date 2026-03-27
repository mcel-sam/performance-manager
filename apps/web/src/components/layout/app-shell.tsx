"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { getOrgThemeCssVariables, type OrgTheme } from "@/branding";
import { cn } from "@/components/ui/cn";
import { ProfileAvatar } from "@/components/ui/profile-avatar";
import {
  getActiveNavKey,
  groupNavigationItems,
  type ShellNavItem,
  type ShellNavKey,
  type ShellNavSection,
} from "@/config/navigation";

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
  activeTheme: OrgTheme;
}

type ProfileAction = "signOut" | "switchRole";
const SIDEBAR_COLLAPSE_STORAGE_KEY = "pm.shell.sidebarCollapsed";
const NAV_SECTION_EXPANSION_STORAGE_KEY = "pm.shell.expandedNavSections";

export default function AppShell({
  children,
  navItems,
  viewer,
  demoModeEnabled,
  activeTheme,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingProfileAction, setPendingProfileAction] = useState<ProfileAction | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [expandedSectionKeys, setExpandedSectionKeys] = useState<string[]>([]);
  const [openCollapsedSectionKey, setOpenCollapsedSectionKey] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/demo/login");
  const activeNavKey = useMemo(() => getActiveNavKey(pathname, navItems), [pathname, navItems]);
  const homeItem = useMemo(
    () => navItems.find((item) => item.key === "home") ?? null,
    [navItems],
  );
  const navSections = useMemo(
    () =>
      groupNavigationItems(navItems)
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.key !== "home"),
        }))
        .filter((section) => section.items.length > 0),
    [navItems],
  );
  const activeSectionKey = useMemo(
    () =>
      navSections.find((section) => section.items.some((item) => item.key === activeNavKey))?.key ?? null,
    [activeNavKey, navSections],
  );
  const hasLoadedSidebarPreference = useRef(false);
  const hasLoadedSectionPreference = useRef(false);

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
    try {
      const storedValue = window.localStorage.getItem(NAV_SECTION_EXPANSION_STORAGE_KEY);
      if (!storedValue) {
        setExpandedSectionKeys(getDefaultExpandedSectionKeys(navSections, activeNavKey));
        return;
      }

      const parsed = JSON.parse(storedValue);
      if (Array.isArray(parsed)) {
        const validKeys = navSections.map((section) => section.key);
        const nextKeys = parsed.filter(
          (sectionKey): sectionKey is string =>
            typeof sectionKey === "string" && validKeys.includes(sectionKey as typeof validKeys[number]),
        );
        setExpandedSectionKeys(
          nextKeys.length > 0 ? nextKeys : getDefaultExpandedSectionKeys(navSections, activeNavKey),
        );
        return;
      }
    } catch {
      // Fall back to the default expanded sections when storage is unavailable or malformed.
    } finally {
      hasLoadedSectionPreference.current = true;
    }

    setExpandedSectionKeys(getDefaultExpandedSectionKeys(navSections, activeNavKey));
  }, [activeNavKey, navSections]);

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
    if (!hasLoadedSectionPreference.current) {
      return;
    }

    window.localStorage.setItem(
      NAV_SECTION_EXPANSION_STORAGE_KEY,
      JSON.stringify(expandedSectionKeys),
    );
  }, [expandedSectionKeys]);

  useEffect(() => {
    const activeSectionKey = navSections.find((section) =>
      section.items.some((item) => item.key === activeNavKey),
    )?.key;

    if (!activeSectionKey) {
      return;
    }

    setExpandedSectionKeys((currentKeys) =>
      currentKeys.includes(activeSectionKey) ? currentKeys : [...currentKeys, activeSectionKey],
    );
  }, [activeNavKey, navSections]);

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

  useEffect(() => {
    if (openCollapsedSectionKey == null) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (!sidebarRef.current?.contains(event.target as Node)) {
        setOpenCollapsedSectionKey(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenCollapsedSectionKey(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openCollapsedSectionKey]);

  useEffect(() => {
    if (!isSidebarCollapsed) {
      setOpenCollapsedSectionKey(null);
    }
  }, [isSidebarCollapsed]);

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
      <div
        className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
        data-org-theme={activeTheme.id}
        style={getOrgThemeCssVariables(activeTheme)}
      >
        <main className="mx-auto w-full max-w-[1440px] p-6">{children}</main>
      </div>
    );
  }

  function toggleSection(sectionKey: string) {
    setExpandedSectionKeys((currentKeys) =>
      currentKeys.includes(sectionKey)
        ? currentKeys.filter((key) => key !== sectionKey)
        : [...currentKeys, sectionKey],
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
      data-org-theme={activeTheme.id}
      style={getOrgThemeCssVariables(activeTheme)}
    >
      <div
        data-testid="app-shell-layout"
        data-sidebar-state={isSidebarCollapsed ? "collapsed" : "expanded"}
        className="mx-auto grid min-h-screen w-full max-w-[1760px] items-start px-3 transition-[grid-template-columns] duration-300 ease-[var(--ease-standard)] motion-reduce:transition-none sm:px-4 lg:px-5"
        style={{
          gridTemplateColumns: `${isSidebarCollapsed ? 72 : 232}px minmax(0, 1fr)`,
        }}
      >
        <aside
          id="app-shell-sidebar"
          ref={sidebarRef}
          data-testid="app-shell-sidebar"
          data-collapsed={isSidebarCollapsed ? "true" : "false"}
          data-state={isSidebarCollapsed ? "collapsed" : "expanded"}
          className="sticky top-3 z-40 self-start px-1.5 pb-4 pt-4"
        >
          <div
            className={cn(
              "relative overflow-visible rounded-[24px] border border-[var(--color-shell-border)] bg-[var(--color-shell-panel)] transition-[box-shadow] duration-300 ease-[var(--ease-standard)] motion-reduce:transition-none",
              isSidebarCollapsed ? "shadow-[var(--shadow-xs)]" : "shadow-[var(--shadow-md)]",
            )}
          >
            <div
              className={cn(
                "relative border-b border-[var(--color-shell-divider)]",
                  isSidebarCollapsed ? "px-2 py-4" : "px-4 py-4.5",
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
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-accent)] text-xs font-semibold tracking-[0.12em] text-[var(--color-white)]">
                    {getBrandMonogram(activeTheme.shortName)}
                  </span>
                ) : (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                      {activeTheme.shortName}
                    </p>
                    <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
                      Workspace
                    </h1>
                    {viewer ? (
                      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{viewer.roleLabel}</p>
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
                  "absolute right-0 top-1/2 z-20 inline-flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-[var(--color-shell-border)] bg-gradient-to-b from-[var(--color-white)] to-[var(--color-surface-subtle)] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] ring-1 ring-white/80 backdrop-blur transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-primary)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] motion-reduce:transition-none",
                  isSidebarCollapsed ? "h-9 w-5" : "h-10 w-6",
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
              {homeItem ? (
                <div className={cn("pb-2", navSections.length > 0 && "mb-2 border-b border-[var(--color-shell-divider)]")}>
                  <Link
                    href={homeItem.href}
                    data-testid={homeItem.testId}
                    aria-current={activeNavKey === homeItem.key ? "page" : undefined}
                    aria-label={homeItem.label}
                    title={isSidebarCollapsed ? homeItem.label : undefined}
                    className={cn(
                      "group relative flex rounded-[var(--radius-md)] py-2 text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1 motion-reduce:transition-none",
                      isSidebarCollapsed ? "justify-center px-2" : "items-center gap-3 px-3",
                      activeNavKey === homeItem.key
                        ? "bg-[var(--color-shell-active-bg)] text-[var(--color-shell-active-fg)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-shell-hover)] hover:text-[var(--color-text-primary)]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-sm)] leading-none",
                        activeNavKey === homeItem.key
                          ? "bg-[var(--color-shell-active-chip)] text-[var(--color-shell-active-fg)]"
                          : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-neutral-200)]",
                      )}
                    >
                      <NavItemIcon navKey={homeItem.key} className="h-4 w-4" />
                    </span>

                    {isSidebarCollapsed ? (
                      <>
                        <span className="sr-only">{homeItem.label}</span>
                        <span
                          data-testid={`app-shell-sidebar-tooltip-${homeItem.key}`}
                          role="tooltip"
                          className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--color-shell-border)] bg-[var(--color-shell-tooltip-bg)] px-2 py-1 text-xs text-[var(--color-shell-tooltip-fg)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                        >
                          {homeItem.label}
                        </span>
                      </>
                    ) : (
                      <span className="truncate">{homeItem.label}</span>
                    )}
                  </Link>
                </div>
              ) : null}

              {navSections.map((section, sectionIndex) => (
                <div
                  key={section.key}
                  data-testid={`app-shell-nav-section-${section.key}`}
                  className={cn("relative", sectionIndex > 0 && (isSidebarCollapsed ? "pt-2" : "pt-3"))}
                >
                  {isSidebarCollapsed ? (
                    <>
                      {sectionIndex > 0 ? (
                        <div className="mx-3 mb-2 border-t border-[var(--color-shell-divider)]" aria-hidden="true" />
                      ) : null}

                      <button
                        type="button"
                        data-testid={`app-shell-nav-section-rail-${section.key}`}
                        aria-expanded={openCollapsedSectionKey === section.key}
                        aria-label={section.label}
                        title={section.label}
                        onClick={() =>
                          setOpenCollapsedSectionKey((currentKey) =>
                            currentKey === section.key ? null : section.key,
                          )
                        }
                        className={cn(
                          "group relative flex w-full justify-center rounded-[var(--radius-md)] px-2 py-1.5 transition-[background-color,color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1 motion-reduce:transition-none",
                          activeSectionKey === section.key || openCollapsedSectionKey === section.key
                            ? "bg-[var(--color-shell-active-bg)] text-[var(--color-shell-active-fg)] shadow-[var(--shadow-sm)]"
                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-shell-hover)] hover:text-[var(--color-text-primary)]",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
                            activeSectionKey === section.key || openCollapsedSectionKey === section.key
                              ? "bg-[var(--color-shell-active-chip)] text-[var(--color-shell-active-fg)]"
                              : "bg-transparent",
                          )}
                        >
                          <SectionNavIcon sectionKey={section.key} className="h-4 w-4" />
                        </span>
                        <span
                          role="tooltip"
                          className={cn(
                            "pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--color-shell-border)] bg-[var(--color-shell-tooltip-bg)] px-2 py-1 text-xs text-[var(--color-shell-tooltip-fg)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-150 motion-reduce:transition-none",
                            openCollapsedSectionKey === section.key
                              ? "hidden"
                              : "group-hover:opacity-100 group-focus-visible:opacity-100",
                          )}
                        >
                          {section.label}
                        </span>
                      </button>

                      {openCollapsedSectionKey === section.key ? (
                        <div
                          className="absolute left-full top-0 z-30 ml-3 w-64 rounded-[20px] border border-[var(--color-shell-border)] bg-[var(--color-shell-panel)] p-2 shadow-[var(--shadow-lg)]"
                          data-testid={`app-shell-nav-flyout-${section.key}`}
                          aria-label={`${section.label} navigation`}
                        >
                          <div className="space-y-1">
                            {section.items.map((item) => {
                              const isActive = activeNavKey === item.key;

                              return (
                                <Link
                                  key={item.key}
                                  href={item.href}
                                  data-testid={`${item.testId}-flyout`}
                                  aria-current={isActive ? "page" : undefined}
                                  onClick={() => setOpenCollapsedSectionKey(null)}
                                  className={cn(
                                    "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-[background-color,color] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] motion-reduce:transition-none",
                                    isActive
                                      ? "bg-[var(--color-shell-active-bg)] text-[var(--color-shell-active-fg)]"
                                      : "text-[var(--color-text-primary)] hover:bg-[var(--color-shell-hover)] hover:text-[var(--color-text-primary)]",
                                  )}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "inline-flex h-7 min-w-7 items-center justify-center rounded-[var(--radius-sm)] leading-none",
                                      isActive
                                        ? "bg-[var(--color-shell-active-chip)] text-[var(--color-shell-active-fg)]"
                                        : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)]",
                                    )}
                                  >
                                    <NavItemIcon navKey={item.key} className="h-3.5 w-3.5" />
                                  </span>
                                  <span className="truncate">{item.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      data-testid={`app-shell-nav-section-toggle-${section.key}`}
                      aria-expanded={expandedSectionKeys.includes(section.key)}
                      onClick={() => toggleSection(section.key)}
                      className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 pb-2 pt-1 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)] transition-colors duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] motion-reduce:transition-none"
                    >
                      <span>{section.label}</span>
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-[var(--transition-base)] ease-[var(--ease-standard)] motion-reduce:transition-none",
                          expandedSectionKeys.includes(section.key) ? "rotate-90" : "rotate-0",
                        )}
                        aria-hidden="true"
                      >
                        <path
                          d="M8 5.5L11.5 10L8 14.5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  )}

                  <div
                    className={cn(
                      "space-y-1",
                      isSidebarCollapsed && "hidden",
                      !isSidebarCollapsed &&
                        !expandedSectionKeys.includes(section.key) &&
                        "hidden",
                    )}
                  >
                    {section.items.map((item) => {
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
                            "group relative flex rounded-[var(--radius-md)] py-2 text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-1 motion-reduce:transition-none",
                            isSidebarCollapsed
                              ? "justify-center px-2"
                              : "items-center gap-3 px-3 pl-6",
                            isActive
                              ? "bg-[var(--color-shell-active-bg)] text-[var(--color-shell-active-fg)]"
                              : "text-[var(--color-text-primary)] hover:bg-[var(--color-shell-hover)] hover:text-[var(--color-text-primary)]",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "inline-flex h-7 min-w-7 items-center justify-center rounded-[var(--radius-sm)] leading-none",
                              isActive
                                ? "bg-[var(--color-shell-active-chip)] text-[var(--color-shell-active-fg)]"
                                : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-neutral-200)]",
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
                                className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--color-shell-border)] bg-[var(--color-shell-tooltip-bg)] px-2 py-1 text-xs text-[var(--color-shell-tooltip-fg)] opacity-0 shadow-[var(--shadow-sm)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
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
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <main className="relative px-5 pb-8 pt-5 sm:px-7 sm:pb-10 sm:pt-6 lg:px-8">
          <header
            className="relative z-20 mb-6 flex items-center justify-end"
            data-testid="app-shell-header"
          >
            <div className="flex items-center gap-2">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  data-testid="app-header-profile-button"
                  onClick={() => setIsProfileMenuOpen((value) => !value)}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--color-shell-border)] bg-[var(--color-shell-panel)] px-2.5 py-1.5 text-left text-sm text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] transition-[background-color,border-color,box-shadow] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-[var(--color-shell-hover)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
                >
                  <ProfileAvatar
                    name={viewer?.displayName ?? "User"}
                    imageUrl={viewer?.avatarUrl}
                    size="sm"
                  />
                  <span className="hidden max-w-[180px] sm:flex">
                    <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{viewer?.displayName ?? "User"}</span>
                  </span>
                </button>

                {isProfileMenuOpen ? (
                  <div
                    role="menu"
                    data-testid="app-header-profile-menu"
                    className="absolute right-0 top-full z-40 mt-2 min-w-[220px] space-y-1 rounded-[var(--radius-md)] border border-[var(--color-shell-border)] bg-[var(--color-shell-panel)] p-2 shadow-[var(--shadow-lg)]"
                  >
                    <div className="rounded-[var(--radius-sm)] border border-[var(--color-shell-divider)] bg-[var(--color-shell-surface-muted)] px-3 py-2">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {viewer?.orgName ?? "Organization"}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="block rounded-[var(--radius-sm)] px-3 py-2 text-sm text-[var(--color-text-muted)] transition-[background-color,color] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-[var(--color-shell-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
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
                      className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-[background-color,color] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-[var(--color-shell-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm text-[var(--color-text-muted)] transition-[background-color,color] duration-[var(--transition-base)] ease-[var(--ease-standard)] hover:bg-[var(--color-shell-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingProfileAction === "switchRole"
                          ? "Opening demo accounts..."
                          : "Return to demo account picker"}
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

function getBrandMonogram(shortName: string): string {
  const parts = shortName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "TW";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getDefaultExpandedSectionKeys(
  navSections: ShellNavSection[],
  activeNavKey: ReturnType<typeof getActiveNavKey>,
): string[] {
  const sectionKeys = new Set<string>();
  sectionKeys.add("performance");

  if (navSections.some((section) => section.key === "admin")) {
    sectionKeys.add("admin");
  }

  const activeSectionKey = navSections.find((section) =>
    section.items.some((item) => item.key === activeNavKey),
  )?.key;

  if (activeSectionKey) {
    sectionKeys.add(activeSectionKey);
  }

  return navSections
    .map((section) => section.key)
    .filter((sectionKey) => sectionKeys.has(sectionKey));
}

function SectionNavIcon({
  sectionKey,
  className,
}: {
  sectionKey: ShellNavSection["key"];
  className?: string;
}) {
  if (sectionKey === "performance") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <rect x="4" y="3.75" width="12" height="12.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7.5H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 10H11.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 12.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (sectionKey === "talent") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <rect x="4" y="4" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11.5" y="4" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="4" y="11.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11.5" y="11.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6.25" cy="6.25" r="1" fill="currentColor" />
        <circle cx="13.75" cy="6.25" r="1" fill="currentColor" />
        <circle cx="6.25" cy="13.75" r="1" fill="currentColor" />
        <circle cx="13.75" cy="13.75" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (sectionKey === "admin") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
        <path d="M5 5.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 10H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5 14.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="5.5" r="1.3" fill="currentColor" />
        <circle cx="12.25" cy="10" r="1.3" fill="currentColor" />
        <circle cx="9.25" cy="14.5" r="1.3" fill="currentColor" />
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
