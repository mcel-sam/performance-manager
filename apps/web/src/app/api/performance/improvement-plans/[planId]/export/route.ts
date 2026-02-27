import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { requestImprovementPlanExport } from "@/server/improvement-plans/improvement-plan-service";

export async function GET(
  request: Request,
  context: { params: Promise<{ planId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { planId } = await context.params;
    const placeholder = await requestImprovementPlanExport(planId, requestContext);

    return NextResponse.json(
      {
        ok: false,
        code: "NOT_IMPLEMENTED",
        ...placeholder,
      },
      { status: 501 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
