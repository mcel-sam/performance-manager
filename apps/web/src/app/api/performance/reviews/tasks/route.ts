import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { listAssignedReviewTasks } from "@/server/reviews/participant-review-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const tasks = await listAssignedReviewTasks(context);

    return NextResponse.json({ ok: true, tasks }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
