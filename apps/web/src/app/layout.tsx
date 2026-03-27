import type { Metadata } from "next";
import { Montserrat, Roboto } from "next/font/google";
import { Suspense } from "react";

import { getOrgThemeCssVariables, resolveOrgTheme } from "@/branding";
import AppShell from "@/components/layout/app-shell";
import { appEnv, isDatabaseConfigured } from "@/config/env";
import { getRoleNavigation } from "@/config/navigation";
import { getDevRequestContext } from "@/server/auth/request-context";
import { AppError } from "@/server/http/errors";
import { resolveShellViewer } from "@/server/layout/shell-context-service";
import { resolveRoleNavOptions } from "@/server/navigation/nav-visibility-service";

import "./globals.css";

const headingFont = Roboto({
  subsets: ["latin"],
  variable: "--font-heading-loaded",
  weight: ["400", "500", "700"],
});

const bodyFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Performance Manager",
  description: "Performance management workflows for reviews, evidence, and calibration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgTheme = resolveOrgTheme(null);

  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} antialiased`}
        data-org-theme={orgTheme.id}
        style={getOrgThemeCssVariables(orgTheme)}
      >
        <RootLayoutShell>{children}</RootLayoutShell>
      </body>
    </html>
  );
}

function AppShellSuspenseFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto w-full max-w-[1760px] p-5 sm:p-7">{children}</main>
    </div>
  );
}

async function RootLayoutShell({ children }: { children: React.ReactNode }) {
  // Build pipelines may run without DATABASE_URL; render shell without user nav in that case.
  if (!isDatabaseConfigured()) {
    const orgTheme = resolveOrgTheme(null);

    return (
      <Suspense fallback={<AppShellSuspenseFallback>{children}</AppShellSuspenseFallback>}>
        <AppShell
          navItems={[]}
          viewer={null}
          demoModeEnabled={appEnv.demoModeEnabled}
          activeTheme={orgTheme}
        >
          {children}
        </AppShell>
      </Suspense>
    );
  }

  let context: Awaited<ReturnType<typeof getDevRequestContext>> | null = null;
  let navItems: ReturnType<typeof getRoleNavigation> = [];

  try {
    context = await getDevRequestContext();
    const navOptions = await resolveRoleNavOptions(context);
    navItems = getRoleNavigation(context.role, navOptions);
  } catch (error) {
    if (!(error instanceof AppError && error.code === "UNAUTHORIZED")) {
      throw error;
    }
  }

  const viewer = context ? await resolveShellViewer(context) : null;
  const orgTheme = resolveOrgTheme(context?.orgId ?? null);

  return (
    <Suspense fallback={<AppShellSuspenseFallback>{children}</AppShellSuspenseFallback>}>
      <AppShell
        navItems={navItems}
        viewer={viewer}
        demoModeEnabled={appEnv.demoModeEnabled}
        activeTheme={orgTheme}
      >
        {children}
      </AppShell>
    </Suspense>
  );
}
