import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { getImprovementPlanDetail } from "@/server/improvement-plans/improvement-plan-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ planId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { planId } = await context.params;
    const plan = await getImprovementPlanDetail(planId, requestContext);

    return NextResponse.json({ ok: true, plan }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
