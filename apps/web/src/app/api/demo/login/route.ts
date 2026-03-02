import { NextResponse } from "next/server";

import { authenticateDemoAccount } from "@/server/demo/demo-auth-service";
import { DEMO_SESSION_COOKIE, encodeDemoSession, requireDemoMode } from "@/server/demo/demo-mode";
import { toErrorPayload } from "@/server/http/errors";

export async function POST(request: Request) {
  try {
    requireDemoMode();
    const payload = await request.json();
    const account = await authenticateDemoAccount(payload);

    const response = NextResponse.json(
      {
        ok: true,
        user: {
          userId: account.userId,
          orgId: account.orgId,
          role: account.role,
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: DEMO_SESSION_COOKIE,
      value: encodeDemoSession(account.userId, account.orgId),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: false,
    });

    return response;
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
