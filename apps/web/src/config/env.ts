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

export const appEnv = {
  presentationMode: parseBooleanEnv(process.env.PRESENTATION_MODE, false),
} as const;

export { parseBooleanEnv };
