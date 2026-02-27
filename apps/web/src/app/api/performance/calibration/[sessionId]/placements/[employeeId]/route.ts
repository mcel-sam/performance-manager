import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { moveCalibrationPlacement } from "@/server/calibration/calibration-session-service";
import { toErrorPayload } from "@/server/http/errors";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ sessionId: string; employeeId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { sessionId, employeeId } = await context.params;
    const payload = await request.json();

    const result = await moveCalibrationPlacement(
      {
        sessionId,
        employeeId,
        performanceBucket: payload?.performanceBucket,
        potentialBucket: payload?.potentialBucket,
        justificationNote: payload?.justificationNote,
      },
      requestContext,
    );

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
