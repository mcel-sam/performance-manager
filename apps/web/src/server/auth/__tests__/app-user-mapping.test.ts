import { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { resolveRequestContextFromAuthIdentity } from "@/server/auth/app-user-mapping";
import { AppError } from "@/server/http/errors";

describe("resolveRequestContextFromAuthIdentity", () => {
  it("returns a linked app user when authIdentityId already matches", async () => {
    const result = await resolveRequestContextFromAuthIdentity(
      {
        authUserId: "auth-user-1",
        email: "employee@example.com",
      },
      {
        user: {
          findUnique: vi.fn().mockResolvedValue({
            id: "user_employee_1",
            authIdentityId: "auth-user-1",
            memberships: [
              {
                orgId: "org_demo_1",
                role: UserRole.EMPLOYEE,
                isActive: true,
              },
            ],
          }),
          findMany: vi.fn(),
          update: vi.fn(),
        },
      },
    );

    expect(result).toEqual({
      userId: "user_employee_1",
      orgId: "org_demo_1",
      role: UserRole.EMPLOYEE,
    });
  });

  it("links a provisioned app user by email on first sandbox login", async () => {
    const update = vi.fn().mockResolvedValue({
      id: "user_manager_1",
      authIdentityId: "auth-user-2",
      memberships: [
        {
          orgId: "org_demo_1",
          role: UserRole.MANAGER,
          isActive: true,
        },
      ],
    });

    const result = await resolveRequestContextFromAuthIdentity(
      {
        authUserId: "auth-user-2",
        email: "manager@example.com",
      },
      {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([
            {
              id: "user_manager_1",
              authIdentityId: null,
              memberships: [
                {
                  orgId: "org_demo_1",
                  role: UserRole.MANAGER,
                  isActive: true,
                },
              ],
            },
          ]),
          update,
        },
      },
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: "user_manager_1" },
      data: { authIdentityId: "auth-user-2" },
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
    expect(result).toEqual({
      userId: "user_manager_1",
      orgId: "org_demo_1",
      role: UserRole.MANAGER,
    });
  });

  it("rejects sandbox accounts that do not map to a provisioned Trellis user", async () => {
    await expect(
      resolveRequestContextFromAuthIdentity(
        {
          authUserId: "auth-user-3",
          email: "missing@example.com",
        },
        {
          user: {
            findUnique: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
          },
        },
      ),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    } satisfies Partial<AppError>);
  });

  it("rejects ambiguous email matches across multiple org users", async () => {
    await expect(
      resolveRequestContextFromAuthIdentity(
        {
          authUserId: "auth-user-4",
          email: "shared@example.com",
        },
        {
          user: {
            findUnique: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([
              {
                id: "user_a",
                authIdentityId: null,
                memberships: [
                  {
                    orgId: "org_a",
                    role: UserRole.EMPLOYEE,
                    isActive: true,
                  },
                ],
              },
              {
                id: "user_b",
                authIdentityId: null,
                memberships: [
                  {
                    orgId: "org_b",
                    role: UserRole.HR_ADMIN,
                    isActive: true,
                  },
                ],
              },
            ]),
            update: vi.fn(),
          },
        },
      ),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    } satisfies Partial<AppError>);
  });

  it("rejects provisioned users without an active organization membership", async () => {
    await expect(
      resolveRequestContextFromAuthIdentity(
        {
          authUserId: "auth-user-5",
          email: "hr@example.com",
        },
        {
          user: {
            findUnique: vi.fn().mockResolvedValue({
              id: "user_hr_1",
              authIdentityId: "auth-user-5",
              memberships: [],
            }),
            findMany: vi.fn(),
            update: vi.fn(),
          },
        },
      ),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      status: 401,
    } satisfies Partial<AppError>);
  });
});
