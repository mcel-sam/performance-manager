import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  createTrack,
  listPublishedTracks,
} from "@/server/grow/grow-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const tracks = await listPublishedTracks(context);
    return NextResponse.json({ ok: true, tracks }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const track = await createTrack(payload, context);
    return NextResponse.json({ ok: true, track }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
