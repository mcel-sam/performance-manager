import { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { RequestContext } from "@/server/auth/request-context";
import {
  canAccessAdminRoutes,
  resolveRoleNavOptions,
} from "@/server/navigation/nav-visibility-service";

describe("resolveRoleNavOptions", () => {
  it("shows calibration for manager participants", async () => {
    const context: RequestContext = {
      userId: "user_manager_1",
      orgId: "org_demo_1",
      role: UserRole.MANAGER,
    };

    const options = await resolveRoleNavOptions(context, {
      calibrationSessionParticipant: {
        count: vi.fn().mockResolvedValue(1),
      },
      improvementPlan: {
        count: vi.fn().mockResolvedValue(0),
      },
    });

    expect(options.canAccessCalibration).toBe(true);
    expect(options.includeTeamReviews).toBe(true);
    expect(options.includeImprovementPlans).toBe(true);
    expect(options.includePackets).toBe(true);
  });

  it("hides calibration for managers without session participation", async () => {
    const context: RequestContext = {
      userId: "user_manager_2",
      orgId: "org_demo_1",
      role: UserRole.MANAGER,
    };

    const options = await resolveRoleNavOptions(context, {
      calibrationSessionParticipant: {
        count: vi.fn().mockResolvedValue(0),
      },
      improvementPlan: {
        count: vi.fn().mockResolvedValue(0),
      },
    });

    expect(options.canAccessCalibration).toBe(false);
    expect(options.includeTeamReviews).toBe(true);
  });

  it("hides improvement plans for employees without visible plans", async () => {
    const context: RequestContext = {
      userId: "user_employee_1",
      orgId: "org_demo_1",
      role: UserRole.EMPLOYEE,
    };

    const options = await resolveRoleNavOptions(context, {
      calibrationSessionParticipant: {
        count: vi.fn().mockResolvedValue(0),
      },
      improvementPlan: {
        count: vi.fn().mockResolvedValue(0),
      },
    });

    expect(options.includeImprovementPlans).toBe(false);
    expect(options.canAccessCalibration).toBe(false);
    expect(options.includePackets).toBe(false);
  });
});

describe("canAccessAdminRoutes", () => {
  it("returns true for HR admins and false for non-admin roles", () => {
    expect(
      canAccessAdminRoutes({
        userId: "user_hr_admin_1",
        orgId: "org_demo_1",
        role: UserRole.HR_ADMIN,
      }),
    ).toBe(true);

    expect(
      canAccessAdminRoutes({
        userId: "user_manager_1",
        orgId: "org_demo_1",
        role: UserRole.MANAGER,
      }),
    ).toBe(false);
  });
});
