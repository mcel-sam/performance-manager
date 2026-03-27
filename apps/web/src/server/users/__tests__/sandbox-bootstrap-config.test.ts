import { UserRole } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  sandboxOrgId,
  sandboxOrgName,
  sandboxRoster,
} from "../../../../prisma/sandbox-bootstrap-config.mjs";

describe("sandbox bootstrap config", () => {
  it("matches the exact sandbox roster", () => {
    expect(sandboxOrgId).toBe("org_sandbox_1");
    expect(sandboxOrgName).toBe("MCEL Sandbox Organization");

    expect(
      sandboxRoster.map((person) => ({
        email: person.email,
        role: person.role,
      })),
    ).toEqual([
      { email: "lletto@mcel.ca", role: UserRole.SUPER_ADMIN },
      { email: "ldesjarlais@mcel.ca", role: UserRole.HR_ADMIN },
      { email: "pverboon@mcel.ca", role: UserRole.HR_ADMIN },
      { email: "tdorn@mcel.ca", role: UserRole.HR_ADMIN },
      { email: "fmartinez@mcel.ca", role: UserRole.SUPER_ADMIN },
      { email: "spasha@mcel.ca", role: UserRole.SUPER_ADMIN },
      { email: "emah@mcel.ca", role: UserRole.MANAGER },
      { email: "ttederoff@mcel.ca", role: UserRole.EMPLOYEE },
    ]);
  });

  it("preserves the requested reporting relationships independently of role", () => {
    const managerByEmail = new Map(
      sandboxRoster.map((person) => [
        person.email,
        person.managerKey
          ? sandboxRoster.find((candidate) => candidate.key === person.managerKey)?.email ?? null
          : null,
      ]),
    );

    expect(managerByEmail).toEqual(
      new Map([
        ["lletto@mcel.ca", null],
        ["ldesjarlais@mcel.ca", "lletto@mcel.ca"],
        ["pverboon@mcel.ca", "lletto@mcel.ca"],
        ["tdorn@mcel.ca", "lletto@mcel.ca"],
        ["fmartinez@mcel.ca", null],
        ["spasha@mcel.ca", "fmartinez@mcel.ca"],
        ["emah@mcel.ca", "fmartinez@mcel.ca"],
        ["ttederoff@mcel.ca", "emah@mcel.ca"],
      ]),
    );
  });
});
