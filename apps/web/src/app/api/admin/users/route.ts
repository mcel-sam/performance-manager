import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { createOrgUser, listOrgUsers } from "@/server/users/user-management-service";

export async function GET(request: Request) {
  try {
    const context = await getRequestContext(request.headers);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const directory = await listOrgUsers(context, { search });

    return NextResponse.json(
      {
        ok: true,
        ...directory,
      },
      { status: 200 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const user = await createOrgUser(payload, context);

    return NextResponse.json(
      {
        ok: true,
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
