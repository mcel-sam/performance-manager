import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { buildProgressSummaryCsv, createCsvResponse } from "@/server/reporting/reporting-export";
import { getReportingProgress, parseProgressFilters } from "@/server/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const filters = parseProgressFilters(searchParams);
    const progress = await getReportingProgress(filters, context);

    if (searchParams.get("format") === "csv") {
      const csv = buildProgressSummaryCsv(progress);
      return createCsvResponse(`reporting-progress-${filters.cycleId}.csv`, csv);
    }

    return NextResponse.json({ ok: true, ...progress }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
