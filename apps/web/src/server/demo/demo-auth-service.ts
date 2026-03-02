import { UserRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { demoOrgId, demoPrimaryRoleUserByRole } from "@/server/demo/demo-constants";
import { assertDemoMode } from "@/server/demo/demo-mode";
import { AppError } from "@/server/http/errors";

const demoRoleLoginSchema = z.object({
  role: z.nativeEnum(UserRole),
});

const demoRoleTiles = [
  {
    role: UserRole.HR_ADMIN,
    label: "Sign in as HR Admin",
    subtitle: "Run cycles, calibrations, and release workflows.",
    testId: "login-role-hr-admin",
  },
  {
    role: UserRole.CALIBRATOR,
    label: "Sign in as Calibrator",
    subtitle: "Facilitate placements and alignment discussions.",
    testId: "login-role-calibrator",
  },
  {
    role: UserRole.MANAGER,
    label: "Sign in as Manager",
    subtitle: "Write manager reviews, calibrate, and track plans.",
    testId: "login-role-manager",
  },
  {
    role: UserRole.EMPLOYEE,
    label: "Sign in as Employee",
    subtitle: "Complete self review tasks and submit evidence-backed input.",
    testId: "login-role-employee",
  },
] as const;

interface DemoAuthDb {
  user: {
    findFirst: (args: {
      where: {
        id?: string;
        orgId: string;
        role?: UserRole;
      };
      select: {
        id: true;
        orgId: true;
        role: true;
      };
    }) => Promise<{ id: string; orgId: string; role: UserRole } | null>;
  };
}

export interface DemoRoleTile {
  role: UserRole;
  label: string;
  subtitle: string;
  testId: string;
}

export interface DemoAuthResult {
  userId: string;
  orgId: string;
  role: UserRole;
}

export function listDemoRoleTiles(): DemoRoleTile[] {
  assertDemoMode();
  return demoRoleTiles.map((tile) => ({ ...tile }));
}

export async function authenticateDemoRole(
  input: unknown,
  db: DemoAuthDb = prisma,
): Promise<DemoAuthResult> {
  assertDemoMode();

  const parsed = demoRoleLoginSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Invalid demo role payload",
      400,
      parsed.error.flatten(),
    );
  }

  const preferredUserId = demoPrimaryRoleUserByRole[parsed.data.role];
  let user = await db.user.findFirst({
    where: {
      id: preferredUserId,
      orgId: demoOrgId,
      role: parsed.data.role,
    },
    select: {
      id: true,
      orgId: true,
      role: true,
    },
  });

  if (!user) {
    user = await db.user.findFirst({
      where: {
        orgId: demoOrgId,
        role: parsed.data.role,
      },
      select: {
        id: true,
        orgId: true,
        role: true,
      },
    });
  }

  if (!user) {
    throw new AppError(
      "DEMO_DATA_MISSING",
      "Demo accounts are not ready yet. Reset and seed demo data from /login.",
      409,
      { role: parsed.data.role },
    );
  }

  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  };
}
