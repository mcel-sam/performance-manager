import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  deleteKeyResult,
  updateKeyResult,
} from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ goalId: string; keyResultId: string }> },
) {
  try {
    const payload = await request.json();
    const { goalId, keyResultId } = await params;
    const context = await getRequestContext(request.headers);
    const keyResult = await updateKeyResult(goalId, keyResultId, payload, context);
    return NextResponse.json({ ok: true, keyResult }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ goalId: string; keyResultId: string }> },
) {
  try {
    const { goalId, keyResultId } = await params;
    const context = await getRequestContext(request.headers);
    const result = await deleteKeyResult(goalId, keyResultId, context);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
