import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { buildRatingsDistributionCsv, createCsvResponse } from "@/server/reporting/reporting-export";
import { getReportingRatings, parseRatingsFilters } from "@/server/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const filters = parseRatingsFilters(searchParams);
    const ratings = await getReportingRatings(filters, context);

    if (searchParams.get("format") === "csv") {
      const csv = buildRatingsDistributionCsv(ratings);
      return createCsvResponse(`reporting-ratings-${filters.cycleId}.csv`, csv);
    }

    return NextResponse.json({ ok: true, ...ratings }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
