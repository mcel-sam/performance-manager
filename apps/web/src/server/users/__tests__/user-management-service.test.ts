import { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { RequestContext } from "@/server/auth/request-context";
import {
  createOrgUser,
  listManagerCandidates,
  listOrgUsers,
  updateOrgUser,
} from "@/server/users/user-management-service";

const hrContext: RequestContext = {
  userId: "user_hr_admin_1",
  orgId: "org_demo_1",
  role: UserRole.HR_ADMIN,
};

const managerContext: RequestContext = {
  userId: "user_manager_1",
  orgId: "org_demo_1",
  role: UserRole.MANAGER,
};

const superAdminContext: RequestContext = {
  userId: "user_super_admin_1",
  orgId: "org_demo_1",
  role: UserRole.SUPER_ADMIN,
};

describe("user-management-service", () => {
  it("denies list access for non HR admin roles", async () => {
    const db = {
      user: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      orgMembership: {
        upsert: vi.fn(),
      },
      employee: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };

    await expect(listOrgUsers(managerContext, {}, db)).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });

  it("creates a user for HR admins and writes an audit event", async () => {
    const db = {
      user: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn().mockResolvedValue({
          id: "user_new_1",
          email: "new.person@example.com",
          role: UserRole.EMPLOYEE,
        }),
        update: vi.fn(),
      },
      orgMembership: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      employee: {
        findMany: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({ id: "employee_manager_1" }),
        create: vi.fn().mockResolvedValue({
          id: "employee_new_1",
          firstName: "New",
          lastName: "Person",
          department: "Operations",
          title: "Coordinator",
          managerId: "employee_manager_1",
        }),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    const user = await createOrgUser(
      {
        email: "new.person@example.com",
        role: UserRole.EMPLOYEE,
        firstName: "New",
        lastName: "Person",
        department: "Operations",
        title: "Coordinator",
        managerEmployeeId: "employee_manager_1",
      },
      hrContext,
      db,
    );

    expect(user.userId).toBe("user_new_1");
    expect(db.orgMembership.upsert).toHaveBeenCalledTimes(1);
    expect(db.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("allows super admins to use user management", async () => {
    const db = {
      user: {
        count: vi.fn().mockResolvedValue(1),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      orgMembership: {
        upsert: vi.fn(),
      },
      employee: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };

    await expect(listOrgUsers(superAdminContext, {}, db)).resolves.toEqual({
      summary: {
        totalUsers: 1,
        hrAdmins: 1,
        superAdmins: 1,
        managers: 1,
        employees: 1,
      },
      users: [],
    });
  });

  it("includes super admins as manager candidates for reporting-line assignment", async () => {
    const db = {
      user: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      orgMembership: {
        upsert: vi.fn(),
      },
      employee: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "employee_super_admin_1",
            firstName: "Lisa",
            lastName: "Letto",
            user: {
              role: UserRole.SUPER_ADMIN,
            },
          },
          {
            id: "employee_manager_1",
            firstName: "Elliot",
            lastName: "Mah",
            user: {
              role: UserRole.MANAGER,
            },
          },
        ]),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };

    const candidates = await listManagerCandidates(hrContext, db);

    expect(candidates).toEqual([
      {
        employeeId: "employee_super_admin_1",
        name: "Lisa Letto",
        role: UserRole.SUPER_ADMIN,
      },
      {
        employeeId: "employee_manager_1",
        name: "Elliot Mah",
        role: UserRole.MANAGER,
      },
    ]);
    expect(db.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orgId: hrContext.orgId,
          user: {
            role: {
              in: [UserRole.HR_ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
            },
          },
        },
      }),
    );
  });

  it("rejects updates that assign a user as their own manager", async () => {
    const db = {
      user: {
        count: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn().mockResolvedValue({
          id: "user_employee_1",
          email: "employee@example.com",
          role: UserRole.EMPLOYEE,
          employee: {
            id: "employee_1",
            firstName: "Alex",
            lastName: "Worker",
            department: "Operations",
            title: "Operator",
            managerId: null,
          },
        }),
        create: vi.fn(),
        update: vi.fn(),
      },
      orgMembership: {
        upsert: vi.fn(),
      },
      employee: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };

    await expect(
      updateOrgUser(
        "user_employee_1",
        {
          email: "employee@example.com",
          role: UserRole.EMPLOYEE,
          firstName: "Alex",
          lastName: "Worker",
          department: "Operations",
          title: "Operator",
          managerEmployeeId: "employee_1",
        },
        hrContext,
        db,
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 400,
    });
  });
});
