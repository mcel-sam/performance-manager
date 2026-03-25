import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { appEnv } from "@/config/env";
import { AppError } from "@/server/http/errors";

export interface SupabaseSessionIdentity {
  authUserId: string;
  email: string;
}

export async function createServerSupabaseClient() {
  if (!appEnv.supabaseConfigured) {
    throw new AppError(
      "SUPABASE_NOT_CONFIGURED",
      "Supabase sandbox auth is not configured.",
      500,
    );
  }

  const cookieStore = await cookies();

  return createServerClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components cannot write cookies. The proxy refresh path
          // owns persistence for those requests.
        }
      },
    },
  });
}

export async function getSupabaseSessionIdentity(): Promise<SupabaseSessionIdentity | null> {
  if (!appEnv.supabaseConfigured) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (error.status === 400 || error.status === 401) {
      return null;
    }

    throw new AppError("UNAUTHORIZED", error.message, 401);
  }

  const authUser = data.user;
  const email = authUser?.email?.trim().toLowerCase() ?? "";

  if (!authUser || email.length === 0) {
    return null;
  }

  return {
    authUserId: authUser.id,
    email,
  };
}
