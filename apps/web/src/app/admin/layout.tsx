import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getDevRequestContext } from "@/server/auth/request-context";
import { canAccessAdminRoutes } from "@/server/navigation/nav-visibility-service";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const context = await getDevRequestContext();

  if (!canAccessAdminRoutes(context)) {
    redirect("/");
  }

  return children;
}
