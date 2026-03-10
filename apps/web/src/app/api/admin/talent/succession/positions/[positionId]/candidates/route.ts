import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { createSuccessionCandidate } from "@/server/succession/succession-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ positionId: string }> },
) {
  try {
    const context = await getRequestContext(request.headers);
    const payload = await request.json();
    const { positionId } = await params;
    const candidate = await createSuccessionCandidate(positionId, payload, context);

    return NextResponse.json({ ok: true, candidate }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
