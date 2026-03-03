import { NextResponse } from "next/server";

import { getRequestContext } from "@/server/auth/request-context";
import { toErrorPayload } from "@/server/http/errors";
import { getOrgUser, updateOrgUser } from "@/server/users/user-management-service";

interface UserRouteProps {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: Request, { params }: UserRouteProps) {
  try {
    const context = await getRequestContext(request.headers);
    const { userId } = await params;
    const user = await getOrgUser(userId, context);

    return NextResponse.json(
      {
        ok: true,
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: Request, { params }: UserRouteProps) {
  try {
    const payload = await request.json();
    const context = await getRequestContext(request.headers);
    const { userId } = await params;
    const user = await updateOrgUser(userId, payload, context);

    return NextResponse.json(
      {
        ok: true,
        user,
      },
      { status: 200 },
    );
  } catch (error) {
    const { status, body } = toErrorPayload(error);
    return NextResponse.json(body, { status });
  }
}
