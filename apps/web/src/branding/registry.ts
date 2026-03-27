import type { OrgTheme } from "@/branding/types";
import { morganTheme } from "@/branding/themes/morgan";

export const defaultOrgThemeId = "morgan";

export const orgThemeRegistry = {
  [morganTheme.id]: morganTheme,
} satisfies Record<string, OrgTheme>;

export function getOrgThemeById(themeId: string | null | undefined): OrgTheme | null {
  if (!themeId) {
    return null;
  }

  return (orgThemeRegistry as Record<string, OrgTheme>)[themeId] ?? null;
}

export function getDefaultOrgTheme(): OrgTheme {
  return orgThemeRegistry[defaultOrgThemeId];
}
