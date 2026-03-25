function parseBooleanEnv(value: string | undefined, defaultValue = false): boolean {
  if (value == null) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const demoModeFlag = parseBooleanEnv(process.env.DEMO_MODE, false);
const databaseUrl = process.env.DATABASE_URL ?? "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const appEnv = {
  nodeEnv,
  demoMode: demoModeFlag,
  demoModeEnabled: demoModeFlag && nodeEnv === "development",
  nextPublicDemoMode:
    parseBooleanEnv(process.env.NEXT_PUBLIC_DEMO_MODE, false) &&
    demoModeFlag &&
    nodeEnv === "development",
  presentationMode: parseBooleanEnv(process.env.PRESENTATION_MODE, false),
  allowManagerRiskView: parseBooleanEnv(process.env.ALLOW_MANAGER_RISK_VIEW, false),
  databaseConfigured: databaseUrl.length > 0,
  supabaseUrl,
  supabaseAnonKey,
  supabaseConfigured: supabaseUrl.length > 0 && supabaseAnonKey.length > 0,
} as const;

export function isDatabaseConfigured(): boolean {
  return appEnv.databaseConfigured;
}

export function isSupabaseConfigured(): boolean {
  return appEnv.supabaseConfigured;
}

export { parseBooleanEnv };
