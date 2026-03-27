import { Prisma, UserRole } from "@prisma/client";
import { z } from "zod";

import { hasHrAdminAccess } from "@/lib/users/role-capabilities";
import type { RequestContext } from "@/server/auth/request-context";
import { prisma } from "@/server/db/prisma";
import { AppError } from "@/server/http/errors";

interface UserManagementDb {
  user: {
    count: (args: {
      where: {
        orgId: string;
        role?: UserRole;
      };
    }) => Promise<number>;
    findMany: (args: {
      where: {
        orgId: string;
        role?: {
          in: readonly UserRole[];
        };
        OR?: Array<
          | {
              email: {
                contains: string;
                mode: Prisma.QueryMode;
              };
            }
          | {
              employee: {
                firstName?: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
                lastName?: {
                  contains: string;
                  mode: Prisma.QueryMode;
                };
              };
            }
        >;
      };
      select: {
        id: true;
        email: true;
        role: true;
        employee: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            department: true;
            title: true;
            managerId: true;
            manager: {
              select: {
                id: true;
                firstName: true;
                lastName: true;
              };
            };
            _count: {
              select: {
                directReports: true;
              };
            };
          };
        };
      };
      orderBy: {
        email: "asc";
      };
    }) => Promise<
      Array<{
        id: string;
        email: string;
        role: UserRole;
        employee: {
          id: string;
          firstName: string;
          lastName: string;
          department: string | null;
          title: string | null;
          managerId: string | null;
          manager: {
            id: string;
            firstName: string;
            lastName: string;
          } | null;
          _count: {
            directReports: number;
          };
        } | null;
      }>
    >;
    findFirst: (args: {
      where: { id: string; orgId: string };
      select: {
        id: true;
        email: true;
        role: true;
        employee: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            department: true;
            title: true;
            managerId: true;
          };
        };
      };
    }) => Promise<
      | {
          id: string;
          email: string;
          role: UserRole;
          employee: {
            id: string;
            firstName: string;
            lastName: string;
            department: string | null;
            title: string | null;
            managerId: string | null;
          } | null;
        }
      | null
    >;
    create: (args: {
      data: {
        orgId: string;
        email: string;
        role: UserRole;
      };
      select: { id: true; email: true; role: true };
    }) => Promise<{ id: string; email: string; role: UserRole }>;
    update: (args: {
      where: { id: string };
      data: {
        email: string;
        role: UserRole;
      };
      select: { id: true; email: true; role: true };
    }) => Promise<{ id: string; email: string; role: UserRole }>;
  };
  orgMembership: {
    upsert: (args: {
      where: {
        orgId_userId: {
          orgId: string;
          userId: string;
        };
      };
      update: {
        role: UserRole;
        isActive: boolean;
      };
      create: {
        orgId: string;
        userId: string;
        role: UserRole;
        isActive: boolean;
      };
    }) => Promise<unknown>;
  };
  employee: {
    findMany: (args: {
      where: {
        orgId: string;
        user?: {
          role: {
            in: readonly UserRole[];
          };
        };
      };
      select: {
        id: true;
        firstName: true;
        lastName: true;
        user: {
          select: {
            role: true;
          };
        };
      };
      orderBy: {
        firstName: "asc";
      };
    }) => Promise<
      Array<{
        id: string;
        firstName: string;
        lastName: string;
        user: { role: UserRole };
      }>
    >;
    findFirst: (args: {
      where: {
        id: string;
        orgId: string;
      };
      select: {
        id: true;
      };
    }) => Promise<{ id: string } | null>;
    create: (args: {
      data: {
        orgId: string;
        userId: string;
        firstName: string;
        lastName: string;
        department?: string | null;
        title?: string | null;
        managerId?: string | null;
      };
      select: {
        id: true;
        firstName: true;
        lastName: true;
        department: true;
        title: true;
        managerId: true;
      };
    }) => Promise<{
      id: string;
      firstName: string;
      lastName: string;
      department: string | null;
      title: string | null;
      managerId: string | null;
    }>;
    update: (args: {
      where: { id: string };
      data: {
        firstName: string;
        lastName: string;
        department?: string | null;
        title?: string | null;
        managerId?: string | null;
      };
      select: {
        id: true;
        firstName: true;
        lastName: true;
        department: true;
        title: true;
        managerId: true;
      };
    }) => Promise<{
      id: string;
      firstName: string;
      lastName: string;
      department: string | null;
      title: string | null;
      managerId: string | null;
    }>;
  };
  auditEvent: {
    create: (args: {
      data: {
        orgId: string;
        actorUserId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata?: Record<string, unknown>;
      };
    }) => Promise<unknown>;
  };
}

const upsertUserSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.nativeEnum(UserRole),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  department: z.string().trim().max(120).nullable().optional(),
  title: z.string().trim().max(120).nullable().optional(),
  managerEmployeeId: z.string().trim().min(1).nullable().optional(),
});

export interface UserDirectorySummary {
  totalUsers: number;
  hrAdmins: number;
  superAdmins: number;
  managers: number;
  employees: number;
}

export interface UserDirectoryListItem {
  userId: string;
  employeeId: string | null;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  title: string | null;
  managerName: string | null;
  reportCount: number;
}

export interface UserDirectoryResult {
  summary: UserDirectorySummary;
  users: UserDirectoryListItem[];
}

export interface UserFormRecord {
  userId: string;
  employeeId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  department: string | null;
  title: string | null;
  managerEmployeeId: string | null;
}

export interface ManagerCandidate {
  employeeId: string;
  name: string;
  role: UserRole;
}

export async function listOrgUsers(
  context: RequestContext,
  options: {
    search?: string;
  } = {},
  db: UserManagementDb = prisma as unknown as UserManagementDb,
): Promise<UserDirectoryResult> {
  requireHrAdmin(context);

  const searchTerm = options.search?.trim();
  const where: Parameters<UserManagementDb["user"]["findMany"]>[0]["where"] = {
    orgId: context.orgId,
  };

  if (searchTerm) {
    where.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { employee: { firstName: { contains: searchTerm, mode: "insensitive" } } },
      { employee: { lastName: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  const [users, totalUsers, hrAdmins, superAdmins, managers, employees] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            title: true,
            managerId: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                directReports: true,
              },
            },
          },
        },
      },
      orderBy: { email: "asc" },
    }),
    db.user.count({ where: { orgId: context.orgId } }),
    db.user.count({ where: { orgId: context.orgId, role: UserRole.HR_ADMIN } }),
    db.user.count({ where: { orgId: context.orgId, role: UserRole.SUPER_ADMIN } }),
    db.user.count({ where: { orgId: context.orgId, role: UserRole.MANAGER } }),
    db.user.count({ where: { orgId: context.orgId, role: UserRole.EMPLOYEE } }),
  ]);

  return {
    summary: {
      totalUsers,
      hrAdmins,
      superAdmins,
      managers,
      employees,
    },
    users: users.map((user) => ({
      userId: user.id,
      employeeId: user.employee?.id ?? null,
      name: user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : "Unknown user",
      email: user.email,
      role: user.role,
      department: user.employee?.department ?? null,
      title: user.employee?.title ?? null,
      managerName: user.employee?.manager
        ? `${user.employee.manager.firstName} ${user.employee.manager.lastName}`
        : null,
      reportCount: user.employee?._count.directReports ?? 0,
    })),
  };
}

export async function getOrgUser(
  userId: string,
  context: RequestContext,
  db: UserManagementDb = prisma as unknown as UserManagementDb,
): Promise<UserFormRecord> {
  requireHrAdmin(context);

  const user = await db.user.findFirst({
    where: { id: userId, orgId: context.orgId },
    select: {
      id: true,
      email: true,
      role: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
          title: true,
          managerId: true,
        },
      },
    },
  });

  if (!user || !user.employee) {
    throw new AppError("NOT_FOUND", "User not found", 404);
  }

  return {
    userId: user.id,
    employeeId: user.employee.id,
    email: user.email,
    role: user.role,
    firstName: user.employee.firstName,
    lastName: user.employee.lastName,
    department: user.employee.department,
    title: user.employee.title,
    managerEmployeeId: user.employee.managerId,
  };
}

export async function listManagerCandidates(
  context: RequestContext,
  db: UserManagementDb = prisma as unknown as UserManagementDb,
): Promise<ManagerCandidate[]> {
  requireHrAdmin(context);

  const candidates = await db.employee.findMany({
    where: {
      orgId: context.orgId,
      user: {
        role: {
          in: [UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: {
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      firstName: "asc",
    },
  });

  return candidates.map((candidate) => ({
    employeeId: candidate.id,
    name: `${candidate.firstName} ${candidate.lastName}`,
    role: candidate.user.role,
  }));
}

export async function createOrgUser(
  input: unknown,
  context: RequestContext,
  db: UserManagementDb = prisma as unknown as UserManagementDb,
): Promise<UserFormRecord> {
  requireHrAdmin(context);
  const parsed = upsertUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid user payload", 400, parsed.error.flatten());
  }

  if (parsed.data.managerEmployeeId) {
    await assertManagerExists(parsed.data.managerEmployeeId, context, db);
  }

  try {
    const user = await db.user.create({
      data: {
        orgId: context.orgId,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
      },
      select: { id: true, email: true, role: true },
    });

    await db.orgMembership.upsert({
      where: {
        orgId_userId: {
          orgId: context.orgId,
          userId: user.id,
        },
      },
      update: {
        role: user.role,
        isActive: true,
      },
      create: {
        orgId: context.orgId,
        userId: user.id,
        role: user.role,
        isActive: true,
      },
    });

    const employee = await db.employee.create({
      data: {
        orgId: context.orgId,
        userId: user.id,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        department: normalizeNullableText(parsed.data.department),
        title: normalizeNullableText(parsed.data.title),
        managerId: parsed.data.managerEmployeeId ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        title: true,
        managerId: true,
      },
    });

    await db.auditEvent.create({
      data: {
        orgId: context.orgId,
        actorUserId: context.userId,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          role: user.role,
          managerEmployeeId: employee.managerId,
          department: employee.department,
          title: employee.title,
        },
      },
    });

    return {
      userId: user.id,
      employeeId: employee.id,
      email: user.email,
      role: user.role,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      title: employee.title,
      managerEmployeeId: employee.managerId,
    };
  } catch (error) {
    throw normalizePrismaError(error);
  }
}

export async function updateOrgUser(
  userId: string,
  input: unknown,
  context: RequestContext,
  db: UserManagementDb = prisma as unknown as UserManagementDb,
): Promise<UserFormRecord> {
  requireHrAdmin(context);
  const parsed = upsertUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "Invalid user payload", 400, parsed.error.flatten());
  }

  const existingUser = await getOrgUser(userId, context, db);

  const managerEmployeeId = parsed.data.managerEmployeeId ?? null;
  if (managerEmployeeId && managerEmployeeId === existingUser.employeeId) {
    throw new AppError(
      "VALIDATION_ERROR",
      "An employee cannot report to themself",
      400,
    );
  }

  if (managerEmployeeId) {
    await assertManagerExists(managerEmployeeId, context, db);
  }

  try {
    const user = await db.user.update({
      where: { id: existingUser.userId },
      data: {
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
      },
      select: { id: true, email: true, role: true },
    });

    await db.orgMembership.upsert({
      where: {
        orgId_userId: {
          orgId: context.orgId,
          userId: user.id,
        },
      },
      update: {
        role: user.role,
        isActive: true,
      },
      create: {
        orgId: context.orgId,
        userId: user.id,
        role: user.role,
        isActive: true,
      },
    });

    const employee = await db.employee.update({
      where: { id: existingUser.employeeId },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        department: normalizeNullableText(parsed.data.department),
        title: normalizeNullableText(parsed.data.title),
        managerId: managerEmployeeId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        title: true,
        managerId: true,
      },
    });

    await db.auditEvent.create({
      data: {
        orgId: context.orgId,
        actorUserId: context.userId,
        action: "USER_UPDATED",
        entityType: "User",
        entityId: user.id,
        metadata: {
          role: user.role,
          managerEmployeeId: employee.managerId,
          department: employee.department,
          title: employee.title,
        },
      },
    });

    return {
      userId: user.id,
      employeeId: employee.id,
      email: user.email,
      role: user.role,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department,
      title: employee.title,
      managerEmployeeId: employee.managerId,
    };
  } catch (error) {
    throw normalizePrismaError(error);
  }
}

function requireHrAdmin(context: RequestContext): void {
  if (!hasHrAdminAccess(context.role)) {
    throw new AppError("FORBIDDEN", "Only HR admins can manage users", 403);
  }
}

async function assertManagerExists(
  managerEmployeeId: string,
  context: RequestContext,
  db: UserManagementDb,
): Promise<void> {
  const manager = await db.employee.findFirst({
    where: {
      id: managerEmployeeId,
      orgId: context.orgId,
    },
    select: {
      id: true,
    },
  });

  if (!manager) {
    throw new AppError("NOT_FOUND", "Manager not found", 404);
  }
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizePrismaError(error: unknown): AppError {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return new AppError(
      "CONFLICT",
      "A user with that email already exists in this organization",
      409,
    );
  }

  if (error instanceof AppError) {
    return error;
  }

  return new AppError("INTERNAL_SERVER_ERROR", "Unable to update user", 500);
}
