import { UserRole } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

import type { RequestContext } from "@/server/auth/request-context";
import type { SupabaseSessionIdentity } from "@/server/auth/supabase-server";

interface AuthUserRecord {
  id: string;
  orgId: string;
  role: UserRole;
  authIdentityId: string | null;
}

interface AuthUserMappingDb {
  user: {
    findUnique: (args: {
      where: { authIdentityId: string };
      select: {
        id: true;
        orgId: true;
        role: true;
        authIdentityId: true;
      };
    }) => Promise<AuthUserRecord | null>;
    findMany: (args: {
      where: {
        email: {
          equals: string;
          mode: "insensitive";
        };
      };
      select: {
        id: true;
        orgId: true;
        role: true;
        authIdentityId: true;
      };
    }) => Promise<AuthUserRecord[]>;
    update: (args: {
      where: { id: string };
      data: { authIdentityId: string };
      select: {
        id: true;
        orgId: true;
        role: true;
        authIdentityId: true;
      };
    }) => Promise<AuthUserRecord>;
  };
}

function toRequestContext(user: Pick<AuthUserRecord, "id" | "orgId" | "role">): RequestContext {
  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
  };
}

export async function resolveRequestContextFromAuthIdentity(
  identity: SupabaseSessionIdentity,
  db: AuthUserMappingDb = prisma,
): Promise<RequestContext> {
  const linkedUser = await db.user.findUnique({
    where: { authIdentityId: identity.authUserId },
    select: {
      id: true,
      orgId: true,
      role: true,
      authIdentityId: true,
    },
  });

  if (linkedUser) {
    return toRequestContext(linkedUser);
  }

  const matchingUsers = await db.user.findMany({
    where: {
      email: {
        equals: identity.email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      orgId: true,
      role: true,
      authIdentityId: true,
    },
  });

  if (matchingUsers.length === 0) {
    throw new AppError(
      "UNAUTHORIZED",
      "Authenticated account is not provisioned in Trellis.",
      401,
    );
  }

  if (matchingUsers.length > 1) {
    throw new AppError(
      "UNAUTHORIZED",
      "Authenticated account is ambiguous across organizations.",
      401,
    );
  }

  const appUser = matchingUsers[0];

  if (appUser.authIdentityId && appUser.authIdentityId !== identity.authUserId) {
    throw new AppError(
      "UNAUTHORIZED",
      "Authenticated identity does not match the provisioned Trellis user.",
      401,
    );
  }

  const resolvedUser =
    appUser.authIdentityId == null
      ? await db.user.update({
          where: { id: appUser.id },
          data: { authIdentityId: identity.authUserId },
          select: {
            id: true,
            orgId: true,
            role: true,
            authIdentityId: true,
          },
        })
      : appUser;

  return toRequestContext(resolvedUser);
}
