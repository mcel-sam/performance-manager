import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import {
  getSuccessionPositionDetail,
  updateSuccessionPosition,
} from "@/server/succession/succession-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ positionId: string }> },
) {
  try {
    const context = await getRequestContext(request.headers);
    const { positionId } = await params;
    const detail = await getSuccessionPositionDetail(positionId, context);

    return NextResponse.json({ ok: true, detail }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ positionId: string }> },
) {
  try {
    const context = await getRequestContext(request.headers);
    const payload = await request.json();
    const { positionId } = await params;
    const position = await updateSuccessionPosition(positionId, payload, context);

    return NextResponse.json({ ok: true, position }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
