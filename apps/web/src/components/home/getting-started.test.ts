import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getGettingStartedContent } from "@/components/home/getting-started";

describe("getGettingStartedContent", () => {
  it("returns HR admin setup links", () => {
    const content = getGettingStartedContent(UserRole.HR_ADMIN);

    expect(content.title).toContain("cycle");
    expect(content.links.some((link) => link.href === "/admin/performance/review-cycles")).toBe(
      true,
    );
  });

  it("returns manager coaching links", () => {
    const content = getGettingStartedContent(UserRole.MANAGER);

    expect(content.links.some((link) => link.href.includes("/performance/calibration"))).toBe(
      true,
    );
    expect(
      content.links.some((link) => link.href.includes("/performance/improvement-plans")),
    ).toBe(true);
  });

  it("defaults employee links for participant roles", () => {
    const content = getGettingStartedContent(UserRole.EMPLOYEE);

    expect(content.links.some((link) => link.href === "/performance/reviews")).toBe(true);
    expect(content.links.some((link) => link.href === "/help")).toBe(true);
  });
});
