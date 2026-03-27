import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getRoleNavigation, groupNavigationItems } from "@/config/navigation";

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
      "Goals",
      "Reviews",
      "Improvement Plans",
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
      "Goals",
      "Reviews",
      "Improvement Plans",
      "Goal Cycles",
      "Reporting",
      "Review Cycles",
      "Calibration Setup",
      "User Management",
    ]);
  });

  it("returns additive super admin navigation for manager and HR workflows", () => {
    const navItems = getRoleNavigation(UserRole.SUPER_ADMIN, {
      canAccessCalibration: true,
      includeImprovementPlans: true,
      includeTeamReviews: true,
      includeUserManagement: true,
      includeSuccession: false,
      includePackets: false,
    });

    expect(navItems.map((item) => item.label)).toEqual([
      "Home",
      "Goals",
      "My Team",
      "Reviews",
      "Calibration",
      "Improvement Plans",
      "Goal Cycles",
      "Reporting",
      "Review Cycles",
      "Calibration Setup",
      "User Management",
    ]);
  });

  it("groups the visible navigation into simple functional sections", () => {
    const navItems = getRoleNavigation(UserRole.SUPER_ADMIN, {
      canAccessCalibration: true,
      includeImprovementPlans: true,
      includeTeamReviews: true,
      includeUserManagement: true,
      includeSuccession: false,
      includePackets: false,
    });

    expect(groupNavigationItems(navItems)).toEqual([
      expect.objectContaining({
        key: "performance",
        items: expect.arrayContaining([
          expect.objectContaining({ label: "Home" }),
          expect.objectContaining({ label: "Goals" }),
          expect.objectContaining({ label: "My Team" }),
          expect.objectContaining({ label: "Reviews" }),
          expect.objectContaining({ label: "Improvement Plans" }),
        ]),
      }),
      expect.objectContaining({
        key: "talent",
        items: [expect.objectContaining({ label: "Calibration" })],
      }),
      expect.objectContaining({
        key: "admin",
        items: expect.arrayContaining([
          expect.objectContaining({ label: "Goal Cycles" }),
          expect.objectContaining({ label: "Reporting" }),
          expect.objectContaining({ label: "Review Cycles" }),
          expect.objectContaining({ label: "Calibration Setup" }),
          expect.objectContaining({ label: "User Management" }),
        ]),
      }),
    ]);
  });
});
