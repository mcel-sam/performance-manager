import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import {
  createEmployeeTrackAssignment,
  updateEmployeeTrackAssignment,
} from "@/server/grow/grow-service";
import { toErrorPayload } from "@/server/http/errors";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const assignment = await createEmployeeTrackAssignment(payload, context);
    return NextResponse.json({ ok: true, assignment }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const assignment = await updateEmployeeTrackAssignment(payload, context);
    return NextResponse.json({ ok: true, assignment }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
