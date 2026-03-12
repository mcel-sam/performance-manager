import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { buildGoalsProgressCsv, createCsvResponse } from "@/server/reporting/reporting-export";
import { getReportingGoals, parseGoalsFilters } from "@/server/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const filters = parseGoalsFilters(searchParams);
    const goals = await getReportingGoals(filters, context);

    if (searchParams.get("format") === "csv") {
      const csv = buildGoalsProgressCsv(goals);
      return createCsvResponse(`reporting-goals-${filters.cycleId}.csv`, csv);
    }

    return NextResponse.json({ ok: true, ...goals }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
