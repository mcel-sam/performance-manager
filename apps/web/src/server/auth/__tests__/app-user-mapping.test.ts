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
            orgId: "org_demo_1",
            role: UserRole.EMPLOYEE,
            authIdentityId: "auth-user-1",
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
      orgId: "org_demo_1",
      role: UserRole.MANAGER,
      authIdentityId: "auth-user-2",
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
              orgId: "org_demo_1",
              role: UserRole.MANAGER,
              authIdentityId: null,
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
        orgId: true,
        role: true,
        authIdentityId: true,
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
                orgId: "org_a",
                role: UserRole.EMPLOYEE,
                authIdentityId: null,
              },
              {
                id: "user_b",
                orgId: "org_b",
                role: UserRole.HR_ADMIN,
                authIdentityId: null,
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
});
