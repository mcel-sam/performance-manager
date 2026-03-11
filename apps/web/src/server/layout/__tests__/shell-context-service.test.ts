import { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { RequestContext } from "@/server/auth/request-context";
import { resolveShellViewer } from "@/server/layout/shell-context-service";

describe("resolveShellViewer", () => {
  it("returns org and employee display details when available", async () => {
    const context: RequestContext = {
      userId: "user_manager_1",
      orgId: "org_demo_1",
      role: UserRole.MANAGER,
    };

    const viewer = await resolveShellViewer(context, {
      user: {
        findFirst: vi.fn().mockResolvedValue({
          role: UserRole.MANAGER,
          org: { name: "Ironcrest" },
          employee: {
            firstName: "Morgan",
            lastName: "Patel",
            avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
          },
        }),
      },
    });

    expect(viewer.orgName).toBe("Ironcrest");
    expect(viewer.displayName).toBe("Morgan Patel");
    expect(viewer.avatarUrl).toBe("https://randomuser.me/api/portraits/men/32.jpg");
    expect(viewer.initials).toBe("MP");
    expect(viewer.roleLabel).toBe("Manager");
  });

  it("falls back safely when employee profile is missing", async () => {
    const context: RequestContext = {
      userId: "user_hr_admin_1",
      orgId: "org_demo_1",
      role: UserRole.HR_ADMIN,
    };

    const viewer = await resolveShellViewer(context, {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    });

    expect(viewer.orgName).toBe("Organization");
    expect(viewer.displayName).toBe("user_hr_admin_1");
    expect(viewer.avatarUrl).toBeNull();
    expect(viewer.initials).toBe("US");
    expect(viewer.roleLabel).toBe("HR Admin");
  });
});
