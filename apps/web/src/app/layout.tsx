import type { Metadata } from "next";

import AppShell from "@/components/layout/app-shell";
import { getRoleNavigation } from "@/config/navigation";
import { getDevRequestContext } from "@/server/auth/request-context";
import { AppError } from "@/server/http/errors";
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

  return (
    <AppShell
      navItems={navItems}
      viewer={context ? { role: context.role, userId: context.userId } : null}
    >
      {children}
    </AppShell>
  );
}
