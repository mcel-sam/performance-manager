import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  createGoal,
  listGoals,
  parseGoalFilters,
} from "@/server/goals/goal-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const filters = parseGoalFilters(searchParams);
    const goals = await listGoals(filters, context);

    return NextResponse.json({ ok: true, goals }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const goal = await createGoal(payload, context);

    return NextResponse.json({ ok: true, goal }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
