import { assertDemoMode } from "@/server/demo/demo-mode";
import { wipeAllLocalData } from "@/server/demo/seed/reset";
import { seedDemoData } from "@/server/demo/seed/seed-dataset";
import type { DemoResetResult } from "@/server/demo/seed/types";

export async function resetAndSeedDemo(): Promise<DemoResetResult> {
  assertDemoMode();

  const seededAt = new Date();
  await wipeAllLocalData();
  const summary = await seedDemoData();

  return {
    seededAt: seededAt.toISOString(),
    summary,
  };
}
