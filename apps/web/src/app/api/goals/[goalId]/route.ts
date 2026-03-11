import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  archiveGoal,
  getGoal,
  updateGoal,
} from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const { goalId } = await params;
    const context = await getRequestContext(request.headers);
    const goal = await getGoal(goalId, context);
    return NextResponse.json({ ok: true, goal }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const payload = await request.json();
    const { goalId } = await params;
    const context = await getRequestContext(request.headers);
    const goal = await updateGoal(goalId, payload, context);
    return NextResponse.json({ ok: true, goal }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ goalId: string }> },
) {
  try {
    const { goalId } = await params;
    const context = await getRequestContext(request.headers);
    const goal = await archiveGoal(goalId, context);
    return NextResponse.json({ ok: true, goal }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
