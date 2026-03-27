import type { OrgTheme } from "@/branding/types";

export const morganTheme = {
  id: "morgan",
  orgName: "Morgan",
  legalName: "Morgan Construction and Environmental Ltd.",
  shortName: "Morgan",
  purpose: "We Build Trust",
  fonts: {
    heading: "Roboto, Arial, sans-serif",
    body: "Montserrat, Arial, sans-serif",
    internal: "Arial, sans-serif",
  },
  colors: {
    brandPrimary: "#E6281A",
    brandAccent: "#000000",
    textPrimary: "#000000",
    textMuted: "#4F4F4F",
    surface: "#FFFFFF",
    surfaceSubtle: "#E5E5E5",
    border: "#979797",
    neutral700: "#4F4F4F",
    neutral500: "#979797",
    neutral200: "#E5E5E5",
    white: "#FFFFFF",
  },
} as const satisfies OrgTheme;
