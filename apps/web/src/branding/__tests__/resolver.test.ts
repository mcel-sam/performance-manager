import { describe, expect, it } from "vitest";

import { getOrgThemeCssVariables } from "@/branding/css-vars";
import { getDefaultOrgTheme } from "@/branding/registry";
import { resolveOrgTheme } from "@/branding/resolver";

describe("resolveOrgTheme", () => {
  it("returns the Morgan theme for the demo org", () => {
    expect(resolveOrgTheme("org_demo_1").id).toBe("morgan");
  });

  it("returns the Morgan theme for the sandbox org", () => {
    expect(resolveOrgTheme("org_sandbox_1").id).toBe("morgan");
  });

  it("falls back to the default theme for unknown orgs", () => {
    expect(resolveOrgTheme("org_unknown").id).toBe(getDefaultOrgTheme().id);
  });
});

describe("getOrgThemeCssVariables", () => {
  it("maps Morgan semantic tokens into theme CSS variables", () => {
    const theme = resolveOrgTheme("org_demo_1");
    const variables = getOrgThemeCssVariables(theme);

    expect(variables["--color-brand-primary"]).toBe("#E6281A");
    expect(variables["--color-brand-accent"]).toBe("#000000");
    expect(variables["--font-heading"]).toContain("var(--font-heading-loaded)");
    expect(variables["--font-body"]).toContain("var(--font-body-loaded)");
  });
});
