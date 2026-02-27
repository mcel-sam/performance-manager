import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { getReviewPacket } from "@/server/reviews/review-packet-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ cycleId: string; employeeId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { cycleId, employeeId } = await context.params;
    const packet = await getReviewPacket(cycleId, employeeId, requestContext);

    return NextResponse.json({ ok: true, ...packet }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
