import { AppError } from "@/server/http/errors";
import { appEnv } from "@/config/env";

export const DEMO_SESSION_COOKIE = "pm_demo_session";

export function isDemoModeEnabled(): boolean {
  return appEnv.demoModeEnabled;
}

export function assertDemoMode(): void {
  if (!isDemoModeEnabled()) {
    throw new AppError("NOT_FOUND", "Demo mode is unavailable", 404);
  }
}

export function encodeDemoSession(userId: string, orgId: string): string {
  return `${encodeURIComponent(userId)}:${encodeURIComponent(orgId)}`;
}

export function decodeDemoSession(rawValue: string | undefined): { userId: string; orgId: string } | null {
  if (!rawValue) {
    return null;
  }

  const [encodedUserId, encodedOrgId] = rawValue.split(":");
  if (!encodedUserId || !encodedOrgId) {
    return null;
  }

  const userId = decodeURIComponent(encodedUserId);
  const orgId = decodeURIComponent(encodedOrgId);
  if (!userId || !orgId) {
    return null;
  }

  return { userId, orgId };
}
