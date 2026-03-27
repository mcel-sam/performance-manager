import { getDefaultOrgTheme, getOrgThemeById } from "@/branding/registry";
import type { OrgTheme } from "@/branding/types";

const orgThemeByOrgId = {
  org_demo_1: "morgan",
  org_sandbox_1: "morgan",
} as const;

function getConfiguredDefaultOrgThemeId(): string | null {
  return (
    process.env.TRELLIS_DEFAULT_ORG_THEME ??
    process.env.NEXT_PUBLIC_TRELLIS_DEFAULT_ORG_THEME ??
    null
  );
}

export function resolveOrgTheme(orgId: string | null | undefined): OrgTheme {
  const mappedThemeId = orgId ? orgThemeByOrgId[orgId as keyof typeof orgThemeByOrgId] : null;

  return (
    getOrgThemeById(mappedThemeId) ??
    getOrgThemeById(getConfiguredDefaultOrgThemeId()) ??
    getDefaultOrgTheme()
  );
}
