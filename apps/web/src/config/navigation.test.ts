import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getRoleNavigation } from "@/config/navigation";

describe("getRoleNavigation", () => {
  it("returns employee-only modules without admin links", () => {
    const navItems = getRoleNavigation(UserRole.EMPLOYEE, {
      canAccessCalibration: false,
      includeImprovementPlans: true,
      includeTeamReviews: false,
      includeUserManagement: false,
      includeSuccession: false,
      includePackets: false,
    });

    expect(navItems.map((item) => item.label)).toEqual([
      "Home",
      "Reviews",
      "Improvement Plans",
      "Help",
    ]);
    expect(navItems.some((item) => item.label.includes("Admin"))).toBe(false);
  });

  it("returns HR admin links including reporting and calibration admin", () => {
    const navItems = getRoleNavigation(UserRole.HR_ADMIN, {
      canAccessCalibration: true,
      includeImprovementPlans: true,
      includeTeamReviews: false,
      includeUserManagement: true,
      includeSuccession: true,
      includePackets: false,
    });

    expect(navItems.map((item) => item.label)).toEqual([
      "Home",
      "Succession",
      "Reporting",
      "Admin Cycles",
      "Admin Calibration",
      "User Management",
      "Help",
    ]);
  });
});
