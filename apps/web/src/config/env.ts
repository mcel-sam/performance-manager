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

export const appEnv = {
  nodeEnv,
  demoMode: demoModeFlag,
  demoModeEnabled: demoModeFlag && nodeEnv === "development",
  nextPublicDemoMode: parseBooleanEnv(process.env.NEXT_PUBLIC_DEMO_MODE, false),
  presentationMode: parseBooleanEnv(process.env.PRESENTATION_MODE, false),
} as const;

export { parseBooleanEnv };
