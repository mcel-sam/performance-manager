import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { transitionReviewCycleStatus } from "@/server/reviews/admin-cycle-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ cycleId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { cycleId } = await context.params;
    const payload = await request.json();

    const result = await transitionReviewCycleStatus(cycleId, payload, requestContext);

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
