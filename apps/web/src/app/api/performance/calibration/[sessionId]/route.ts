import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { getCalibrationSessionData } from "@/server/calibration/calibration-session-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { sessionId } = await context.params;
    const data = await getCalibrationSessionData(sessionId, requestContext);

    return NextResponse.json({ ok: true, ...data }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
