import type { UserRole } from "@prisma/client";

import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";

interface ShellContextDb {
  user: {
    findFirst: (args: {
      where: { id: string; orgId: string };
      select: {
        role: true;
        org: { select: { name: true } };
        employee: { select: { firstName: true; lastName: true } };
      };
    }) => Promise<{
      role: UserRole;
      org: { name: string };
      employee: { firstName: string; lastName: string } | null;
    } | null>;
  };
}

export interface ShellViewer {
  role: UserRole;
  userId: string;
  roleLabel: string;
  orgName: string;
  displayName: string;
  initials: string;
}

export async function resolveShellViewer(
  context: RequestContext,
  db: ShellContextDb = prisma as unknown as ShellContextDb,
): Promise<ShellViewer> {
  const userRecord = await db.user.findFirst({
    where: {
      id: context.userId,
      orgId: context.orgId,
    },
    select: {
      role: true,
      org: {
        select: {
          name: true,
        },
      },
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const displayName = userRecord?.employee
    ? `${userRecord.employee.firstName} ${userRecord.employee.lastName}`.trim()
    : context.userId;

  return {
    role: userRecord?.role ?? context.role,
    userId: context.userId,
    roleLabel: humanizeRole(userRecord?.role ?? context.role),
    orgName: userRecord?.org.name ?? "Organization",
    displayName,
    initials: toInitials(displayName),
  };
}

function humanizeRole(role: UserRole): string {
  switch (role) {
    case "HR_ADMIN":
      return "HR Admin";
    case "CALIBRATOR":
      return "Calibrator";
    case "MANAGER":
      return "Manager";
    case "EMPLOYEE":
    default:
      return "Employee";
  }
}

function toInitials(displayName: string): string {
  const parts = displayName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
