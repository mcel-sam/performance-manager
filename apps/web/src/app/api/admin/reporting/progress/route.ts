import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { getReportingProgress, parseProgressFilters } from "@/server/reporting/reporting-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const filters = parseProgressFilters(new URL(request.url).searchParams);
    const progress = await getReportingProgress(filters, context);

    return NextResponse.json({ ok: true, ...progress }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
