import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { getWriteReviewData } from "@/server/reviews/participant-review-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ cycleId: string; submissionId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { cycleId, submissionId } = await context.params;
    const data = await getWriteReviewData(cycleId, submissionId, requestContext);

    return NextResponse.json({ ok: true, ...data }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
