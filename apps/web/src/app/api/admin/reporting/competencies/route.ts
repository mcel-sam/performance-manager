import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { buildCompetencyBreakdownCsv, createCsvResponse } from "@/server/reporting/reporting-export";
import { getReportingCompetencies, parseCompetenciesFilters } from "@/server/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const filters = parseCompetenciesFilters(searchParams);
    const competencies = await getReportingCompetencies(filters, context);

    if (searchParams.get("format") === "csv") {
      const csv = buildCompetencyBreakdownCsv(competencies);
      return createCsvResponse(`reporting-competencies-${filters.cycleId}.csv`, csv);
    }

    return NextResponse.json({ ok: true, ...competencies }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
