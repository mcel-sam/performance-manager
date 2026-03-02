import { NextResponse } from "next/server";
import { z } from "zod";

import { resetAndSeedDemo } from "@/server/demo/demo-seed-service";
import { assertDemoMode } from "@/server/demo/demo-mode";
import { toErrorPayload } from "@/server/http/errors";

const resetPayloadSchema = z.object({
  confirmation: z.literal("RESET"),
});

export async function POST(request: Request) {
  try {
    assertDemoMode();
    const payload = await request.json().catch(() => ({}));
    resetPayloadSchema.parse(payload);
    const result = await resetAndSeedDemo();

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
