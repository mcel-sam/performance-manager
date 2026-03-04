import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import { appEnv, isDatabaseConfigured } from "@/config/env";
import { getRoleNavigation } from "@/config/navigation";
import { getDevRequestContext } from "@/server/auth/request-context";
import { AppError } from "@/server/http/errors";
import { resolveShellViewer } from "@/server/layout/shell-context-service";
import { resolveRoleNavOptions } from "@/server/navigation/nav-visibility-service";

import "./globals.css";

export const metadata: Metadata = {
  title: "Performance Manager",
  description: "Performance management workflows for reviews, evidence, and calibration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RootLayoutShell>{children}</RootLayoutShell>
      </body>
    </html>
  );
}

async function RootLayoutShell({ children }: { children: React.ReactNode }) {
  // Build pipelines may run without DATABASE_URL; render shell without user nav in that case.
  if (!isDatabaseConfigured()) {
    return (
      <AppShell
        navItems={[]}
        viewer={null}
        demoModeEnabled={appEnv.nextPublicDemoMode}
      >
        {children}
      </AppShell>
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

  return (
    <AppShell
      navItems={navItems}
      viewer={viewer}
      demoModeEnabled={appEnv.nextPublicDemoMode}
    >
      {children}
    </AppShell>
  );
}
