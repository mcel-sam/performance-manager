import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  createCalibrationSession,
  listCalibrationSessions,
} from "@/server/calibration/calibration-admin-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const sessions = await listCalibrationSessions(context);

    return NextResponse.json({ ok: true, sessions }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const payload = await request.json();
    const session = await createCalibrationSession(payload, context);

    return NextResponse.json({ ok: true, session }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
