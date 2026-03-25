import { NextResponse } from "next/server";

import { appEnv } from "@/config/env";
import { createServerSupabaseClient } from "@/server/auth/supabase-server";
import { DEMO_SESSION_COOKIE } from "@/server/demo/demo-mode";
import { toErrorPayload } from "@/server/http/errors";

export async function POST() {
  try {
    if (appEnv.supabaseConfigured) {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });

    if (appEnv.demoModeEnabled) {
      response.cookies.set({
        name: DEMO_SESSION_COOKIE,
        value: "",
        maxAge: 0,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      });
    }

    return response;
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
