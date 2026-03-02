import { UserRole } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/server/db/prisma";
import { requireDemoMode } from "@/server/demo/demo-mode";
import { AppError } from "@/server/http/errors";

export const demoOrgId = "org_demo_1";

export interface DemoAccountHint {
  role: UserRole;
  email: string;
  password: string;
  label: string;
}

const demoAccountHints: DemoAccountHint[] = [
  {
    role: UserRole.HR_ADMIN,
    email: "hr-admin@example.com",
    password: "demo-hr-admin",
    label: "HR Admin",
  },
  {
    role: UserRole.CALIBRATOR,
    email: "calibrator@example.com",
    password: "demo-calibrator",
    label: "Calibrator",
  },
  {
    role: UserRole.MANAGER,
    email: "manager@example.com",
    password: "demo-manager",
    label: "Manager",
  },
  {
    role: UserRole.EMPLOYEE,
    email: "employee@example.com",
    password: "demo-employee",
    label: "Employee",
  },
];

const demoLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

interface DemoAuthDb {
  user: {
    findFirst: (args: {
      where: {
        orgId: string;
        email: string;
        role: UserRole;
      };
      select: {
        id: true;
        orgId: true;
        role: true;
      };
    }) => Promise<{ id: string; orgId: string; role: UserRole } | null>;
  };
}

export interface DemoAuthResult {
  userId: string;
  orgId: string;
  role: UserRole;
}

export function listDemoAccountHints(): DemoAccountHint[] {
  requireDemoMode();
  return demoAccountHints;
}

export async function authenticateDemoAccount(
  input: unknown,
  db: DemoAuthDb = prisma,
): Promise<DemoAuthResult> {
  requireDemoMode();

  const parsed = demoLoginSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid demo login payload", 400, parsed.error.flatten());
  }

  const match = demoAccountHints.find(
    (account) =>
      account.email.toLowerCase() === parsed.data.email.toLowerCase() &&
      account.password === parsed.data.password,
  );

  if (!match) {
    throw new AppError("UNAUTHORIZED", "Invalid demo credentials", 401);
  }

  const user = await db.user.findFirst({
    where: {
      orgId: demoOrgId,
      email: match.email,
      role: match.role,
    },
    select: {
      id: true,
      orgId: true,
      role: true,
    },
  });

  if (!user) {
    throw new AppError(
      "DEMO_DATA_MISSING",
      "Demo account does not exist yet. Run Demo Setup first.",
      409,
      { email: match.email },
    );
  }

  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  };
}
