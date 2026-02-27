import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import {
  createImprovementPlan,
  listImprovementPlans,
} from "@/server/improvement-plans/improvement-plan-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const plans = await listImprovementPlans(context);

    return NextResponse.json({ ok: true, plans }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const payload = await request.json();
    const plan = await createImprovementPlan(payload, context);

    return NextResponse.json({ ok: true, plan }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
