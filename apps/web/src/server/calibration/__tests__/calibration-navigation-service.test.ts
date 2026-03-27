import { UserRole } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { resolveCalibrationWorkspaceHref } from "@/server/calibration/calibration-navigation-service";

describe("resolveCalibrationWorkspaceHref", () => {
  it("routes HR admins and super admins to calibration administration", async () => {
    await expect(
      resolveCalibrationWorkspaceHref(
        {
          userId: "user_hr_admin_1",
          orgId: "org_demo_1",
          role: UserRole.HR_ADMIN,
        },
        {
          calibrationSessionParticipant: {
            findFirst: vi.fn(),
          },
        },
      ),
    ).resolves.toBe("/admin/performance/calibration");

    await expect(
      resolveCalibrationWorkspaceHref(
        {
          userId: "user_super_admin_1",
          orgId: "org_demo_1",
          role: UserRole.SUPER_ADMIN,
        },
        {
          calibrationSessionParticipant: {
            findFirst: vi.fn(),
          },
        },
      ),
    ).resolves.toBe("/admin/performance/calibration");
  });

  it("routes managers to their latest assigned calibration session", async () => {
    const href = await resolveCalibrationWorkspaceHref(
      {
        userId: "user_manager_1",
        orgId: "org_demo_1",
        role: UserRole.MANAGER,
      },
      {
        calibrationSessionParticipant: {
          findFirst: vi.fn().mockResolvedValue({ sessionId: "calibration_session_seed_1" }),
        },
      },
    );

    expect(href).toBe("/performance/calibration/calibration_session_seed_1");
  });

  it("falls back home when no calibration session is available", async () => {
    const href = await resolveCalibrationWorkspaceHref(
      {
        userId: "user_manager_2",
        orgId: "org_demo_1",
        role: UserRole.MANAGER,
      },
      {
        calibrationSessionParticipant: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      },
    );

    expect(href).toBe("/");
  });
});
