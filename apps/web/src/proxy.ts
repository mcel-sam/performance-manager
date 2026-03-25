import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { appEnv } from "@/config/env";
import { DEMO_SESSION_COOKIE } from "@/server/demo/demo-mode";

function isPublicPath(pathname: string): boolean {
  return pathname === "/login";
}

async function resolveSupabaseUser(request: NextRequest): Promise<{
  response: NextResponse;
  isAuthenticated: boolean;
}> {
  let response = NextResponse.next({
    request,
  });

  if (!appEnv.supabaseConfigured) {
    return {
      response,
      isAuthenticated: false,
    };
  }

  const supabase = createServerClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({
          request,
        });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  return {
    response,
    isAuthenticated: !error && Boolean(data.user),
  };
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, isAuthenticated: hasSupabaseSession } = await resolveSupabaseUser(request);
  const hasDemoSession =
    appEnv.demoModeEnabled && Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
  const isAuthenticated = hasSupabaseSession || hasDemoSession;

  if (pathname.startsWith("/api")) {
    return response;
  }

  if (pathname === "/login") {
    if (!isAuthenticated) {
      return response;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (isPublicPath(pathname) || isAuthenticated) {
    return response;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/login";
  if (pathname !== "/") {
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
  }

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
