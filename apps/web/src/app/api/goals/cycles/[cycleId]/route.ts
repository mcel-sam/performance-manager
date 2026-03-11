import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { updateGoalCycle } from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ cycleId: string }> },
) {
  try {
    const payload = await request.json();
    const { cycleId } = await params;
    const context = await getRequestContext(request.headers);
    const cycle = await updateGoalCycle(cycleId, payload, context);
    return NextResponse.json({ ok: true, cycle }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
