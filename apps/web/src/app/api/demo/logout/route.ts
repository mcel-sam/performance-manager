import { NextResponse } from "next/server";

import { DEMO_SESSION_COOKIE, assertDemoMode } from "@/server/demo/demo-mode";
import { toErrorPayload } from "@/server/http/errors";

export async function POST() {
  try {
    assertDemoMode();
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set({
      name: DEMO_SESSION_COOKIE,
      value: "",
      maxAge: 0,
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
