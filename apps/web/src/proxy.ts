import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEMO_SESSION_COOKIE = "pm_demo_session";

function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

const demoModeEnabled =
  parseBooleanEnv(process.env.DEMO_MODE) && (process.env.NODE_ENV ?? "development") === "development";

export function proxy(request: NextRequest) {
  if (!demoModeEnabled) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const hasDemoSession = Boolean(request.cookies.get(DEMO_SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (!hasDemoSession) {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (hasDemoSession) {
    return NextResponse.next();
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
