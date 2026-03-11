import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { getGoalTree } from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const { goalId } = await params;
    const context = await getRequestContext(request.headers);
    const tree = await getGoalTree(goalId, context);
    return NextResponse.json({ ok: true, ...tree }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
