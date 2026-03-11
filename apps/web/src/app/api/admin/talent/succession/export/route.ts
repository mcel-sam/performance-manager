import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import {
  buildSuccessionCoverageCsv,
  buildSuccessionExportCsv,
  createSuccessionCsvResponse,
} from "@/server/succession/succession-export";
import {
  listSuccessionExportRows,
  listSuccessionOverview,
  parseSuccessionFilters,
} from "@/server/succession/succession-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const filters = parseSuccessionFilters(searchParams);
    const kind = searchParams.get("kind") ?? "positions";

    if (kind === "coverage") {
      const overview = await listSuccessionOverview(filters, context);
      return createSuccessionCsvResponse(
        "succession-coverage.csv",
        buildSuccessionCoverageCsv(overview.coverageByDepartment),
      );
    }

    const rows = await listSuccessionExportRows(filters, context);
    return createSuccessionCsvResponse("succession-positions.csv", buildSuccessionExportCsv(rows));
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
