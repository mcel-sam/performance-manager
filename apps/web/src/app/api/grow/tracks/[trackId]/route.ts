import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  getTrack,
  updateTrack,
} from "@/server/grow/grow-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  try {
    const { trackId } = await params;
    const context = await getRequestContext(request.headers);
    const track = await getTrack(trackId, context);
    return NextResponse.json({ ok: true, track }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  try {
    const payload = await request.json();
    const { trackId } = await params;
    const context = await getRequestContext(request.headers);
    const track = await updateTrack(trackId, payload, context);
    return NextResponse.json({ ok: true, track }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
