import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getDevRequestContext } from "@/server/auth/request-context";

interface CalibrationLayoutProps {
  children: ReactNode;
}

const allowedCalibrationRoles = new Set<UserRole>([
  UserRole.HR_ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.MANAGER,
]);

export default async function CalibrationLayout({ children }: CalibrationLayoutProps) {
  const context = await getDevRequestContext();

  if (!allowedCalibrationRoles.has(context.role)) {
    redirect("/");
  }

  return children;
}
