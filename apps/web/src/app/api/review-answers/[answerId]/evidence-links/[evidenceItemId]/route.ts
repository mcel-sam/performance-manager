import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { detachEvidenceFromAnswer } from "@/server/evidence/evidence-service";
import { toErrorPayload } from "@/server/http/errors";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ answerId: string; evidenceItemId: string }> },
) {
  try {
    const requestContext = await getRequestContext(request.headers);
    const { answerId, evidenceItemId } = await context.params;

    const result = await detachEvidenceFromAnswer(
      {
        answerId,
        evidenceItemId,
      },
      requestContext,
    );

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
