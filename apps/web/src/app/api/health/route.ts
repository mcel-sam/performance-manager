import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/server/health/check-db";

export async function GET() {
  const result = await checkDatabaseHealth();

  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(result, { status: 503 });
}
