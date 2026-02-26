import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { autosaveReviewAnswer } from "@/server/reviews/participant-review-service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ cycleId: string; submissionId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { cycleId, submissionId } = await context.params;
    const payload = await request.json();

    const result = await autosaveReviewAnswer(
      {
        ...payload,
        cycleId,
        submissionId,
      },
      requestContext,
    );

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
