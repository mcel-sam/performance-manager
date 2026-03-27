import { UserRole } from "@prisma/client";

import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

import type { RequestContext } from "@/server/auth/request-context";
import type { SupabaseSessionIdentity } from "@/server/auth/supabase-server";

interface AuthUserRecord {
  id: string;
  authIdentityId: string | null;
  memberships: Array<{
    orgId: string;
    role: UserRole;
    isActive: boolean;
  }>;
}

interface AuthUserMappingDb {
  user: {
    findUnique: (args: {
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
    }) => Promise<AuthUserRecord[]>;
    update: (args: {
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
    }) => Promise<AuthUserRecord>;
  };
}

function toRequestContext(user: AuthUserRecord): RequestContext {
  const activeMemberships = user.memberships.filter((membership) => membership.isActive);

  if (activeMemberships.length === 0) {
    throw new AppError(
      "UNAUTHORIZED",
      "Authenticated account is not assigned to an active Trellis organization membership.",
      401,
    );
  }

  if (activeMemberships.length > 1) {
    throw new AppError(
      "UNAUTHORIZED",
      "Authenticated account is assigned to multiple active organization memberships.",
      401,
    );
  }

  const membership = activeMemberships[0];

  return {
    userId: user.id,
    orgId: membership.orgId,
    role: membership.role,
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
      authIdentityId: true,
      memberships: {
        where: { isActive: true },
        select: {
          orgId: true,
          role: true,
          isActive: true,
        },
      },
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
      authIdentityId: true,
      memberships: {
        where: { isActive: true },
        select: {
          orgId: true,
          role: true,
          isActive: true,
        },
      },
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
          authIdentityId: true,
          memberships: {
            where: { isActive: true },
            select: {
              orgId: true,
              role: true,
              isActive: true,
            },
          },
        },
      })
      : appUser;

  return toRequestContext(resolvedUser);
}
