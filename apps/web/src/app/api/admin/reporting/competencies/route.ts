import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { getReportingCompetencies, parseCompetenciesFilters } from "@/server/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const filters = parseCompetenciesFilters(new URL(request.url).searchParams);
    const competencies = await getReportingCompetencies(filters, context);

    return NextResponse.json({ ok: true, ...competencies }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
