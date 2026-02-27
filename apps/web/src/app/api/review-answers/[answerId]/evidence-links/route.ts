import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { attachEvidenceToAnswer } from "@/server/evidence/evidence-service";
import { toErrorPayload } from "@/server/http/errors";

export async function POST(
  request: Request,
  context: { params: Promise<{ answerId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { answerId } = await context.params;
    const payload = await request.json();

    const result = await attachEvidenceToAnswer(
      {
        answerId,
        evidenceItemId: payload?.evidenceItemId,
      },
      requestContext,
    );

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
