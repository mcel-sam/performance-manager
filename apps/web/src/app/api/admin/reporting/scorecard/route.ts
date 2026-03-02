import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { getReportingScorecard, parseScorecardFilters } from "@/server/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const filters = parseScorecardFilters(new URL(request.url).searchParams);
    const scorecard = await getReportingScorecard(filters, context);

    return NextResponse.json({ ok: true, ...scorecard }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
