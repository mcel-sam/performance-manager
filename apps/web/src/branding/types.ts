export interface OrgTheme {
  id: string;
  orgName: string;
  legalName?: string;
  shortName: string;
  purpose?: string;
  fonts: {
    heading: string;
    body: string;
    internal?: string;
  };
  colors: {
    brandPrimary: string;
    brandAccent: string;
    textPrimary: string;
    textMuted: string;
    surface: string;
    surfaceSubtle: string;
    border: string;
    neutral700: string;
    neutral500: string;
    neutral200: string;
    white: string;
  };
}

export type OrgThemeCssVariables = Record<`--${string}`, string>;
