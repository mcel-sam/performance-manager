import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { listEvidenceForSubject } from "@/server/evidence/evidence-service";
import { toErrorPayload } from "@/server/http/errors";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);

    const types = searchParams
      .getAll("types")
      .flatMap((entry) => entry.split(","))
      .map((entry) => entry.trim())
      .filter(Boolean);

    const result = await listEvidenceForSubject(
      {
        subjectEmployeeId: searchParams.get("subjectEmployeeId"),
        types: types.length > 0 ? types : undefined,
      },
      context,
    );

    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
