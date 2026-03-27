import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";

import { prisma } from "@/server/db/prisma";
import { resolveRequestContextFromAuthIdentity } from "@/server/auth/app-user-mapping";
import { getSupabaseSessionIdentity } from "@/server/auth/supabase-server";
import { decodeDemoSession, DEMO_SESSION_COOKIE, isDemoModeEnabled } from "@/server/demo/demo-mode";
import { AppError } from "@/server/http/errors";

interface AuthDb {
  user: {
    findFirst: (args: {
      where: { id: string; orgId: string };
      select: { id: true; orgId: true; role: true };
    }) => Promise<{ id: string; orgId: string; role: UserRole } | null>;
    findUnique?: (args: {
      where: { authIdentityId: string };
      select: {
        id: true;
        authIdentityId: true;
        memberships: {
          where: { isActive: true };
          select: {
            orgId: true;
            role: true;
            isActive: true;
          };
        };
      };
    }) => Promise<{
      id: string;
      authIdentityId: string | null;
      memberships: Array<{
        orgId: string;
        role: UserRole;
        isActive: boolean;
      }>;
    } | null>;
    findMany?: (args: {
      where: { email: { equals: string; mode: "insensitive" } };
      select: {
        id: true;
        authIdentityId: true;
        memberships: {
          where: { isActive: true };
          select: {
            orgId: true;
            role: true;
            isActive: true;
          };
        };
      };
    }) => Promise<Array<{
      id: string;
      authIdentityId: string | null;
      memberships: Array<{
        orgId: string;
        role: UserRole;
        isActive: boolean;
      }>;
    }>>;
    update?: (args: {
      where: { id: string };
      data: { authIdentityId: string };
      select: {
        id: true;
        authIdentityId: true;
        memberships: {
          where: { isActive: true };
          select: {
            orgId: true;
            role: true;
            isActive: true;
          };
        };
      };
    }) => Promise<{
      id: string;
      authIdentityId: string | null;
      memberships: Array<{
        orgId: string;
        role: UserRole;
        isActive: boolean;
      }>;
    }>;
  };
}

export interface RequestContext {
  userId: string;
  orgId: string;
  role: UserRole;
}

export async function getRequestContext(
  _headers?: Headers,
  db: AuthDb = prisma,
): Promise<RequestContext> {
  const supabaseIdentity = await getSupabaseSessionIdentity();
  if (supabaseIdentity) {
    if (!db.user.findUnique || !db.user.findMany || !db.user.update) {
      throw new AppError(
        "INTERNAL_SERVER_ERROR",
        "Auth user mapping database interface is incomplete.",
        500,
      );
    }

    return resolveRequestContextFromAuthIdentity(supabaseIdentity, {
      user: {
        findUnique: db.user.findUnique,
        findMany: db.user.findMany,
        update: db.user.update,
      },
    });
  }

  return getLocalRequestContext(db);
}

export function requireRole(context: RequestContext, role: UserRole): void {
  if (context.role !== role) {
    throw new AppError("FORBIDDEN", "Insufficient permissions", 403);
  }
}

export async function getDevRequestContext(
  db: AuthDb = prisma,
): Promise<RequestContext> {
  const supabaseIdentity = await getSupabaseSessionIdentity();
  if (supabaseIdentity && db.user.findUnique && db.user.findMany && db.user.update) {
    return resolveRequestContextFromAuthIdentity(supabaseIdentity, {
      user: {
        findUnique: db.user.findUnique,
        findMany: db.user.findMany,
        update: db.user.update,
      },
    });
  }

  return getLocalRequestContext(db);
}

async function getLocalRequestContext(
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
