import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  createGoalCycle,
  listGoalCycles,
} from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const cycles = await listGoalCycles(context);
    return NextResponse.json({ ok: true, cycles }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const cycle = await createGoalCycle(payload, context);
    return NextResponse.json({ ok: true, cycle }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
