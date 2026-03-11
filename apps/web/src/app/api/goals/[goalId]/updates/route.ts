import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  createGoalUpdate,
  listGoalUpdates,
} from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const { goalId } = await params;
    const context = await getRequestContext(request.headers);
    const updates = await listGoalUpdates(goalId, context);
    return NextResponse.json({ ok: true, updates }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const payload = await request.json();
    const { goalId } = await params;
    const context = await getRequestContext(request.headers);
    const update = await createGoalUpdate(goalId, payload, context);
    return NextResponse.json({ ok: true, update }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
