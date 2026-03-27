import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { transitionGoalWorkflow } from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const payload = await request.json();
    const { goalId } = await params;
    const context = await getRequestContext(request.headers);
    const goal = await transitionGoalWorkflow(goalId, payload, context);
    return NextResponse.json({ ok: true, goal }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
