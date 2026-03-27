import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getActiveNavKey, getRoleNavigation, isRouteInNavigation } from "@/config/navigation";

describe("getActiveNavKey", () => {
  const managerNav = getRoleNavigation(UserRole.MANAGER, {
    canAccessCalibration: true,
    includeImprovementPlans: true,
    includePackets: true,
    includeSuccession: false,
    includeTeamReviews: true,
    includeUserManagement: false,
  });

  it("maps review task and write routes to Reviews", () => {
    expect(getActiveNavKey("/performance/reviews", managerNav)).toBe("reviews");
    expect(
      getActiveNavKey("/performance/reviews/cycle_seed_draft_1/write/submission_seed_employee_manager_1", managerNav),
    ).toBe("reviews");
  });

  it("maps the goals workspace route to Goals", () => {
    expect(getActiveNavKey("/goals", managerNav)).toBe("goals");
  });

  it("maps packet routes to Packets without activating Reviews", () => {
    expect(
      getActiveNavKey("/performance/reviews/cycle_seed_draft_1/packet/emp_employee_1", managerNav),
    ).toBe("packets");
  });

  it("supports manager calibration focus routes", () => {
    expect(getActiveNavKey("/performance/calibration/calibration_session_seed_1", managerNav)).toBe(
      "calibration",
    );
  });

  it("returns null for routes not visible in role navigation", () => {
    expect(getActiveNavKey("/admin/performance/review-cycles", managerNav)).toBeNull();
    expect(isRouteInNavigation("/admin/performance/review-cycles", managerNav)).toBe(false);
    expect(getActiveNavKey("/talent/succession", managerNav)).toBeNull();
    expect(isRouteInNavigation("/talent/succession", managerNav)).toBe(false);
  });

  it("maps admin calibration routes to Admin Calibration when both calibration links exist", () => {
    const superAdminNav = getRoleNavigation(UserRole.SUPER_ADMIN, {
      canAccessCalibration: true,
      includeImprovementPlans: true,
      includePackets: false,
      includeSuccession: false,
      includeTeamReviews: true,
      includeUserManagement: true,
    });

    expect(getActiveNavKey("/admin/performance/calibration", superAdminNav)).toBe("adminCalibration");
    expect(getActiveNavKey("/performance/calibration", superAdminNav)).toBe("calibration");
  });
});
