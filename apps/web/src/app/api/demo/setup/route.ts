import { NextResponse } from "next/server";
import { z } from "zod";

import { parseDemoSetupStep, runDemoSetup } from "@/server/demo/demo-setup-service";
import { requireDemoMode } from "@/server/demo/demo-mode";
import { toErrorPayload } from "@/server/http/errors";

const setupPayloadSchema = z.object({
  step: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    requireDemoMode();
    const payload = setupPayloadSchema.parse(await request.json().catch(() => ({})));
    const step = parseDemoSetupStep(payload.step ?? "all");
    const result = await runDemoSetup(step);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
