import { NextResponse } from "next/server";
import { z } from "zod";

import { resolveRequestContextFromAuthIdentity } from "@/server/auth/app-user-mapping";
import { createServerSupabaseClient } from "@/server/auth/supabase-server";
import { AppError, toErrorPayload } from "@/server/http/errors";

const loginPayloadSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = loginPayloadSchema.parse(await request.json());
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      throw new AppError("UNAUTHORIZED", error.message, 401);
    }

    const authUser = data.user;
    const email = authUser?.email?.trim().toLowerCase() ?? "";

    if (!authUser || email.length === 0) {
      throw new AppError("UNAUTHORIZED", "Authenticated session is missing user data.", 401);
    }

    try {
      await resolveRequestContextFromAuthIdentity({
        authUserId: authUser.id,
        email,
      });
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
