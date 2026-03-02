import { NextResponse } from "next/server";

import { assertDemoMode } from "@/server/demo/demo-mode";
import { toErrorPayload } from "@/server/http/errors";

export async function POST() {
  try {
    assertDemoMode();
    return NextResponse.json(
      {
        code: "DEPRECATED_ENDPOINT",
        message: "Use POST /api/demo/reset with { confirmation: \"RESET\" }.",
      },
      { status: 410 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
