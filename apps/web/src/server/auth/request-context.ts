import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/server/db/prisma";
import { decodeDemoSession, DEMO_SESSION_COOKIE, isDemoModeEnabled } from "@/server/demo/demo-mode";
import { AppError } from "@/server/http/errors";

interface AuthDb {
  user: {
    findFirst: (args: {
      where: { id: string; orgId: string };
      select: { id: true; orgId: true; role: true };
    }) => Promise<{ id: string; orgId: string; role: UserRole } | null>;
  };
}

export interface RequestContext {
  userId: string;
  orgId: string;
  role: UserRole;
}

export async function getRequestContext(
  headers: Headers,
  db: AuthDb = prisma,
): Promise<RequestContext> {
  const userId = headers.get("x-user-id");
  const orgId = headers.get("x-org-id");

  if (!userId || !orgId) {
    throw new AppError(
      "UNAUTHORIZED",
      "x-user-id and x-org-id headers are required",
      401,
    );
  }

  const user = await db.user.findFirst({
    where: { id: userId, orgId },
    select: { id: true, orgId: true, role: true },
  });

  if (!user) {
    throw new AppError("UNAUTHORIZED", "User is not a member of this org", 401);
  }

  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  };
}

export function requireRole(context: RequestContext, role: UserRole): void {
  if (context.role !== role) {
    throw new AppError("FORBIDDEN", "Insufficient permissions", 403);
  }
}

export async function getDevRequestContext(
  db: AuthDb = prisma,
): Promise<RequestContext> {
  if (isDemoModeEnabled()) {
    const cookieStore = await cookies();
    const session = decodeDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
    if (!session) {
      throw new AppError(
        "UNAUTHORIZED",
        "Demo session is missing. Sign in from /login.",
        401,
      );
    }

    const user = await db.user.findFirst({
      where: { id: session.userId, orgId: session.orgId },
      select: { id: true, orgId: true, role: true },
    });

    if (!user) {
      throw new AppError(
        "UNAUTHORIZED",
        "Demo session is invalid. Reset demo data and sign in again from /login.",
        401,
      );
    }

    return {
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
    };
  }

  const userId = process.env.DEV_USER_ID ?? "user_employee_1";
  const orgId = process.env.DEV_ORG_ID ?? "org_demo_1";
  const user = await db.user.findFirst({
    where: { id: userId, orgId },
    select: { id: true, orgId: true, role: true },
  });

  if (!user) {
    throw new AppError(
      "UNAUTHORIZED",
      "Development user context is not configured. Run db seed and set DEV_USER_ID/DEV_ORG_ID if needed.",
      401,
    );
  }

  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  };
}
