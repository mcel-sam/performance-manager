import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appEnv } from "@/config/env";
import { AppError } from "@/server/http/errors";

let adminClient: SupabaseClient | null = null;

export function createSupabaseAdminClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!appEnv.supabaseConfigured || serviceRoleKey.length === 0) {
    throw new AppError(
      "SUPABASE_NOT_CONFIGURED",
      "Supabase admin credentials are not configured.",
      500,
    );
  }

  adminClient ??= createClient(appEnv.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
