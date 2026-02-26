import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { createReviewCycle } from "@/server/reviews/admin-cycle-service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const cycle = await createReviewCycle(payload, context);

    return NextResponse.json(
      {
        ok: true,
        cycle,
      },
      { status: 201 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
