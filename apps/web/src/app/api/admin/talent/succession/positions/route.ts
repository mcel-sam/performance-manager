import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import {
  createSuccessionPosition,
  listSuccessionOverview,
  parseSuccessionFilters,
} from "@/server/succession/succession-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const overview = await listSuccessionOverview(parseSuccessionFilters(searchParams), context);

    return NextResponse.json({ ok: true, positions: overview.positions, filters: overview.filters }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const payload = await request.json();
    const position = await createSuccessionPosition(payload, context);

    return NextResponse.json({ ok: true, position }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
