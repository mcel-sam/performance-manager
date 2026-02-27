import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { finalizeCalibrationSession } from "@/server/calibration/calibration-session-service";
import { toErrorPayload } from "@/server/http/errors";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { sessionId } = await context.params;
    const result = await finalizeCalibrationSession(sessionId, requestContext);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
