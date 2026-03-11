import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { createCompetencyAlignmentComment } from "@/server/grow/grow-service";
import { toErrorPayload } from "@/server/http/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ competencyId: string }> },
) {
  try {
    const payload = await request.json();
    const { competencyId } = await params;
    const context = await getRequestContext(request.headers);
    const comment = await createCompetencyAlignmentComment(competencyId, payload, context);
    return NextResponse.json({ ok: true, comment }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
