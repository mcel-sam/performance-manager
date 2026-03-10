import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { createSuccessionNote } from "@/server/succession/succession-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ candidateId: string }> },
) {
  try {
    const context = await getRequestContext(request.headers);
    const payload = await request.json();
    const { candidateId } = await params;
    const note = await createSuccessionNote(candidateId, payload, context);

    return NextResponse.json({ ok: true, note }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
