import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import {
  removeSuccessionCandidate,
  updateSuccessionCandidate,
} from "@/server/succession/succession-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    const context = await getRequestContext(request.headers);
    const payload = await request.json();
    const { candidateId } = await params;
    const candidate = await updateSuccessionCandidate(candidateId, payload, context);

    return NextResponse.json({ ok: true, candidate }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    const context = await getRequestContext(request.headers);
    const { candidateId } = await params;
    await removeSuccessionCandidate(candidateId, context);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
