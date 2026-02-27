import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { createImprovementPlanCheckIn } from "@/server/improvement-plans/improvement-plan-service";

export async function POST(
  request: Request,
  context: { params: Promise<{ planId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { planId } = await context.params;
    const payload = await request.json();

    const checkIn = await createImprovementPlanCheckIn(planId, payload, requestContext);

    return NextResponse.json({ ok: true, checkIn }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
