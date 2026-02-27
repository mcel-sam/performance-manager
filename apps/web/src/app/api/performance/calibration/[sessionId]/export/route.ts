import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { getCalibrationExportPlaceholder } from "@/server/calibration/calibration-session-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { sessionId } = await context.params;
    const payload = await getCalibrationExportPlaceholder(sessionId, requestContext);

    return NextResponse.json({ ok: false, ...payload }, { status: 501 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
